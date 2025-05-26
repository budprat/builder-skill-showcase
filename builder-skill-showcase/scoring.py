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

# Use the same Supabase configuration as the frontend
SUPABASE_URL = "https://udjwjoymlofdocclufxv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkandqb3ltbG9mZG9jY2x1Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDkwMzYsImV4cCI6MjA2MTUyNTAzNn0.mN9DM5QJGysbPOplOBSS7WH1qhPk4Y67JMd2gafzEog"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure Gemini API
configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize Gemini model
gemini_model = GenerativeModel("gemini-1.5-pro")

def extract_pdf_text(supabase_path: str, supabase: Client) -> str:
    try:
        # The frontend uses 'user-files' bucket for file uploads
        bucket_name = "user-files"
        
        print(f"Attempting to download file from bucket '{bucket_name}' with path: {supabase_path}")
        
        # Try to download the file directly
        try:
            file_data = supabase.storage.from_(bucket_name).download(supabase_path)
            print(f"Successfully downloaded file, size: {len(file_data)} bytes")
        except Exception as download_error:
            print(f"Download failed from {bucket_name}: {download_error}")
            
            # If the path starts with a URL, extract just the file path
            if supabase_path.startswith("http"):
                # Extract the file path from the URL
                # Example: https://udjwjoymlofdocclufxv.supabase.co/storage/v1/object/public/user-files/filename.pdf
                url_parts = supabase_path.split("/storage/v1/object/public/")
                if len(url_parts) > 1:
                    # Extract bucket and file path
                    path_parts = url_parts[1].split("/", 1)
                    if len(path_parts) > 1:
                        actual_bucket = path_parts[0]
                        actual_path = path_parts[1]
                        print(f"Extracted bucket: {actual_bucket}, path: {actual_path}")
                        try:
                            file_data = supabase.storage.from_(actual_bucket).download(actual_path)
                        except Exception as second_download_error:
                            print(f"Second download attempt failed: {second_download_error}")
                            # Check if file exists in storage
                            try:
                                files = supabase.storage.from_(actual_bucket).list()
                                print(f"Available files in bucket: {[f['name'] for f in files]}")
                            except Exception as list_error:
                                print(f"Could not list files in bucket: {list_error}")
                            return "PDF file not found in storage. Please ensure the file was uploaded correctly."
                    else:
                        raise Exception(f"Could not parse file path from URL: {supabase_path}")
                else:
                    raise Exception(f"Invalid storage URL format: {supabase_path}")
            else:
                # Check if file exists when using direct path
                try:
                    files = supabase.storage.from_(bucket_name).list()
                    print(f"Available files in bucket: {[f['name'] for f in files]}")
                except Exception as list_error:
                    print(f"Could not list files in bucket: {list_error}")
                return f"PDF file not found at path: {supabase_path}. Please check the file upload."
        
        # Save and extract PDF
        temp_file_path = "/tmp/pitch_deck.pdf"
        with open(temp_file_path, "wb") as f:
            f.write(file_data)
        
        print(f"Saved PDF to {temp_file_path}")
        
        # Extract text from PDF
        with pdfplumber.open(temp_file_path) as pdf:
            text_content = "\n".join(page.extract_text() or "" for page in pdf.pages)
            print(f"Extracted {len(text_content)} characters from PDF")
            return text_content
            
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
        {"feedback": feedback, "status": "notified"}
    ).eq("submission_id", submission["id"]).execute()

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
        {"status": submission["status"]}
    ).eq("id", submission["id"]).execute()

async def poll_submissions():
    while True:
        submissions = supabase.table("submissions").select("*").eq("status", "submitted").execute().data
        for submission in submissions:
            await process_submission(submission, supabase)
        await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(poll_submissions())
