import pdfplumber
import os
from supabase import create_client, Client
import json
import uuid
import asyncio
import time
from github import Github, GithubException
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv
from google.generativeai import configure, GenerativeModel

# Load environment variables
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Configure Gemini API
configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize Gemini model
gemini_model = GenerativeModel("gemini-1.5-pro")

def extract_pdf_text(supabase_path: str, supabase: Client) -> str:
    try:
        # First check if the bucket exists and create it if it doesn't
        try:
            bucket_info = supabase.storage.get_bucket("submissions")
            print(f"Bucket exists: {bucket_info}")
        except Exception as bucket_error:
            print(f"Storage bucket error: {bucket_error}")
            # Try to create the bucket with correct syntax
            try:
                result = supabase.storage.create_bucket("submissions")
                print(f"Created 'submissions' bucket: {result}")
            except Exception as create_error:
                print(f"Failed to create bucket: {create_error}")
                # If bucket creation fails, try without creating bucket (bucket might exist but get_bucket failed)
                print("Attempting to download file anyway...")
        
        # Download and extract PDF
        file_data = supabase.storage.from_("submissions").download(supabase_path)
        with open("/tmp/pitch_deck.pdf", "wb") as f:
            f.write(file_data)
        with pdfplumber.open("/tmp/pitch_deck.pdf") as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return f"Error extracting PDF: {str(e)}"

async def pre_screen_submission(submission: dict) -> dict:
    try:
        g = Github(os.getenv("GITHUB_TOKEN"))
        repo = g.get_repo(submission["repository_url"].split("github.com/")[1])
        repo.get_contents("README.md")
        submission["pre_screening_score"] = 5.0
        submission["status"] = "prescreened"
    except GithubException:
        submission["pre_screening_score"] = 0.0
        submission["status"] = "prescreening_failed"
    return submission

async def evaluate_rubric(submission: dict, supabase: Client) -> dict:
    pitch_deck_text = extract_pdf_text(submission["pitch_deck_url"], supabase)
    challenge = supabase.table("challenges").select("description").eq("id", submission["challenge_id"]).single().execute().data
    challenge_description = challenge.get("description", "Build an AI-powered app...")

    rubric = {
        "Innovation": 0.2,
        "Technical": 0.3,
        "UX": 0.2,
        "Business": 0.2,
        "Demo": 0.1
    }
    llm_scores = {}

    for criterion, weight in rubric.items():
        prompt = f"""
        Evaluate the {criterion} criterion for this pitch deck based on the challenge description.
        
        Challenge: {challenge_description}
        
        Pitch Deck Content: {pitch_deck_text[:4000]}
        
        Please evaluate the {criterion} aspect and return ONLY a JSON response in this exact format:
        {{"score": <integer from 0 to 100>, "explanation": "<2-3 sentence explanation>"}}
        """
        
        try:
            response = gemini_model.generate_content(
                prompt,
                generation_config={"max_output_tokens": 300}
            )
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Try to find JSON in the response
            if "{" in response_text and "}" in response_text:
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                json_str = response_text[start:end]
                result = json.loads(json_str)
                score = float(result["score"])
                explanation = result["explanation"]
            else:
                # Fallback if JSON parsing fails
                score = 50.0  # Default score
                explanation = f"Evaluation completed for {criterion} criterion."
                
        except Exception as e:
            print(f"Gemini API error for {criterion}: {e}")
            score = 50.0  # Default score
            explanation = f"Error evaluating {criterion} criterion."

        llm_scores[criterion] = {
            "score": score * weight,
            "explanation": explanation
        }

    submission["llm_scores"] = llm_scores
    submission["status"] = "evaluated"
    return submission

async def aggregate_score(submission: dict, supabase: Client) -> dict:
    total_llm_score = sum(score["score"] for score in submission["llm_scores"].values())
    total_score = (submission["pre_screening_score"] * 0.05) + (total_llm_score * 0.95)

    score_entry = {
        "id": str(uuid.uuid4()),
        "submission_id": submission["id"],
        "pre_screening_score": submission["pre_screening_score"],
        "llm_scores": submission["llm_scores"],
        "total_score": str(total_score),  # Store as string per schema
        "feedback": "",
        "status": "provisional",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    supabase.table("scores").insert(score_entry).execute()

    submission["total_score"] = total_score
    submission["status"] = "scored"
    return submission

async def generate_feedback_and_notify(submission: dict, supabase: Client) -> dict:
    feedback_prompt = """
    Format the following rubric scores into a concise, user-friendly summary for the participant:
    
    """
    for criterion, score in submission["llm_scores"].items():
        feedback_prompt += f"{criterion}: {score['score']:.1f}/20.0 - {score['explanation']}\n"
    
    feedback_prompt += "\nPlease provide an encouraging summary with specific actionable feedback for improvement."
    
    try:
        response = gemini_model.generate_content(
            feedback_prompt,
            generation_config={"max_output_tokens": 500}
        )
        feedback = response.text
    except Exception as e:
        print(f"Feedback generation error: {e}")
        feedback = "Thank you for your submission. Detailed feedback will be available soon."

    supabase.table("scores").update(
        {"feedback": feedback, "status": "notified"},
        {"submission_id": submission["id"]}
    ).execute()

    try:
        user = supabase.table("users").select("email").eq("id", submission["user_id"]).single().execute().data
        message = Mail(
            from_email="no-reply@elitebuilders.com",
            to_emails=user["email"],
            subject="Provisional Score Available",
            html_content=f"Your score is {submission['total_score']:.2f}/100.<br>Feedback:<br>{feedback}"
        )
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        sg.send(message)
    except Exception as e:
        print(f"Notification error: {e}")

    submission["status"] = "notified"
    return submission

async def process_submission(submission: dict, supabase: Client):
    submission = await pre_screen_submission(submission)
    if submission["status"] == "prescreened":
        submission = await evaluate_rubric(submission, supabase)
        submission = await aggregate_score(submission, supabase)
        submission = await generate_feedback_and_notify(submission, supabase)

    supabase.table("submissions").update(
        {"status": submission["status"]},
        {"id": submission["id"]}
    ).execute()

async def poll_submissions():
    while True:
        submissions = supabase.table("submissions").select("*").eq("status", "submitted").execute().data
        for submission in submissions:
            await process_submission(submission, supabase)
        await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(poll_submissions())
