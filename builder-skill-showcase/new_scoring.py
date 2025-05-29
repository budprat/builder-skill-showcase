import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import all required libraries
import pdfplumber
from supabase import create_client, Client
import json
import uuid
import asyncio
import time
from github import Github, GithubException
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.generativeai import configure, GenerativeModel

# Supabase configuration
SUPABASE_URL = "https://udjwjoymlofdocclufxv.supabase.co"
# Use service role key from environment variable for backend operations
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkandqb3ltbG9mZG9jY2x1Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDkwMzYsImV4cCI6MjA2MTUyNTAzNn0.mN9DM5QJGysbPOplOBSS7WH1qhPk4Y67JMd2gafzEog"
# Use service role key if available, otherwise fall back to anon key
SUPABASE_KEY = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_ANON_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure Gemini API
configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Enhanced Agent classes with structured prompting
class EvaluatorAgent:
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-pro")
        self.instruction = """You are an expert AI competition judge evaluating pitch decks. 
        Evaluate the given criterion and return ONLY a valid JSON response with:
        - "score": an integer from 0 to 100
        - "explanation": a 2-3 sentence explanation

        Be fair but critical. Consider:
        - Innovation (0-100): How novel and creative is the approach?
        - Technical (0-100): How technically sound and feasible is the implementation?
        - UX (0-100): How user-friendly and well-designed is the experience?
        - Business (0-100): How viable is the business model and market fit?
        - Demo (0-100): How well does the demo showcase the product?
        """

    def run(self, prompt):
        try:
            full_prompt = f"{self.instruction}\n\n{prompt}"
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": 0.3,  # Lower temperature for more consistent scoring
                    "max_output_tokens": 200
                }
            )
            return response.text
        except Exception as e:
            print(f"EvaluatorAgent error: {e}")
            return '{"score": 50, "explanation": "Unable to evaluate due to an error."}'

class FeedbackAgent:
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-pro")
        self.instruction = """You are a helpful AI competition feedback provider.
        Format the evaluation results into encouraging, constructive feedback.

        Guidelines:
        - Start with positive aspects
        - Provide specific, actionable improvements
        - Be encouraging and supportive
        - Keep it concise but comprehensive
        - End with motivating words
        """

    def run(self, prompt):
        try:
            full_prompt = f"{self.instruction}\n\n{prompt}"
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 500
                }
            )
            return response.text
        except Exception as e:
            print(f"FeedbackAgent error: {e}")
            return "Thank you for your submission. Your project shows promise and we encourage you to continue developing it!"

# Create agent instances
evaluator_agent = EvaluatorAgent()
feedback_agent = FeedbackAgent()

def extract_pdf_text(supabase_path: str, supabase: Client) -> str:
    try:
        # The frontend uses 'user-files' bucket for file uploads
        bucket_name = "user-files"
        print(f"Attempting to download file from bucket '{bucket_name}' with path: {supabase_path}")
        # The user-files bucket should already exist from frontend uploads
        print(f"Attempting to access bucket '{bucket_name}'")
        # Parse the file path from URL if needed
        actual_bucket = bucket_name
        actual_path = supabase_path
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
                else:
                    raise Exception(f"Could not parse file path from URL: {supabase_path}")
            else:
                raise Exception(f"Invalid storage URL format: {supabase_path}")
        # Try to download the file
        try:
            file_data = supabase.storage.from_(actual_bucket).download(actual_path)
            print(f"Successfully downloaded file, size: {len(file_data)} bytes")
        except Exception as download_error:
            print(f"Download failed from {actual_bucket}: {download_error}")
            # List available files for debugging
            try:
                files = supabase.storage.from_(actual_bucket).list()
                print(f"Available files in bucket: {[f.get('name', f) for f in files]}")
                user_folder = actual_path.split('/')[0]
                user_files = supabase.storage.from_(actual_bucket).list(user_folder)
                print(f"Available files in user folder {user_folder}: {[f.get('name', f) for f in user_files]}")
            except Exception as list_error:
                print(f"Could not list files in bucket: {list_error}")
            return f"PDF file not found at path: {actual_path}. Please ensure the file was uploaded correctly."
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
        print(f"Pre-screening PASSED for submission {submission['id']}: Repository exists and has README.md")
    except GithubException as e:
        submission["pre_screening_score"] = 0.0
        submission["status"] = "prescreening_failed"
        print(f"Pre-screening FAILED for submission {submission['id']}: {str(e)}")
        print(f"Failure reason: Unable to access repository or README.md not found at {submission['repository_url']}")
    except Exception as e:
        submission["pre_screening_score"] = 0.0
        submission["status"] = "prescreening_failed"
        print(f"Pre-screening FAILED for submission {submission['id']}: Unexpected error - {str(e)}")
    return submission

async def evaluate_rubric(submission: dict, supabase: Client) -> dict:
    pitch_deck_text = extract_pdf_text(submission["pitch_deck_url"], supabase)

    # Check if PDF extraction failed
    if pitch_deck_text.startswith("PDF file not found") or pitch_deck_text.startswith("Error extracting PDF"):
        print(f"PDF extraction failed for submission {submission['id']}")
        # Set default scores
        submission["llm_scores"] = {
            "Innovation": {"score": 0.0, "explanation": "Unable to evaluate - PDF extraction failed"},
            "Technical": {"score": 0.0, "explanation": "Unable to evaluate - PDF extraction failed"},
            "UX": {"score": 0.0, "explanation": "Unable to evaluate - PDF extraction failed"},
            "Business": {"score": 0.0, "explanation": "Unable to evaluate - PDF extraction failed"},
            "Demo": {"score": 0.0, "explanation": "Unable to evaluate - PDF extraction failed"}
        }
        submission["status"] = "evaluation_failed"
        return submission

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

        Pitch Deck Content:
        {pitch_deck_text[:4000]}

        Criterion to evaluate: {criterion}

        Return ONLY a JSON response in this exact format (no other text):
        {{"score": <integer from 0 to 100>, "explanation": "<2-3 sentence explanation>"}}
        """

        # Use the evaluator agent
        agent_response = evaluator_agent.run(prompt)

        try:
            # Clean the response to extract JSON
            agent_response = agent_response.strip()
            # Find JSON in the response
            json_start = agent_response.find('{')
            json_end = agent_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = agent_response[json_start:json_end]
                agent_result = json.loads(json_str)
                score = float(agent_result.get("score", 50))
                explanation = agent_result.get("explanation", f"Evaluation completed for {criterion}.")
            else:
                raise ValueError("No JSON found in response")
        except Exception as e:
            print(f"Error parsing agent response for {criterion}: {e}")
            print(f"Agent response was: {agent_response}")
            score = 50.0
            explanation = f"Evaluation completed for {criterion}."

        llm_scores[criterion] = {
            "score": score * weight,
            "explanation": explanation
        }
        print(f"Evaluated {criterion} for submission {submission['id']}: Score={score}, Weight={weight}")

    submission["llm_scores"] = llm_scores
    submission["status"] = "evaluated"
    print(f"Rubric evaluation completed for submission {submission['id']}")
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

    try:
        supabase.table("scores").insert(score_entry).execute()
        print(f"Inserted score entry for submission {submission['id']}")
    except Exception as e:
        print(f"Error inserting score entry: {e}")

    submission["total_score"] = total_score
    submission["status"] = "scored"
    print(f"Score aggregation completed for submission {submission['id']}")
    return submission

async def generate_feedback_and_notify(submission: dict, supabase: Client) -> dict:
    print(f"Generating feedback for submission {submission['id']}")

    feedback_prompt = """
    Format the following rubric scores into a concise, user-friendly summary for the participant.

    Scores breakdown:
    """

    for criterion, score_data in submission["llm_scores"].items():
        weight = {"Innovation": 0.2, "Technical": 0.3, "UX": 0.2, "Business": 0.2, "Demo": 0.1}[criterion]
        max_score = 100 * weight  # Maximum possible weighted score
        feedback_prompt += f"\n{criterion}: {score_data['score']:.1f}/{max_score:.1f} - {score_data['explanation']}"

    feedback_prompt += f"""

    Total Score: {submission['total_score']:.1f}/100

    Provide an encouraging summary with specific actionable feedback for improvement.
    """

    # Use the feedback agent
    feedback = feedback_agent.run(feedback_prompt)

    print(f"Generated feedback for submission {submission['id']}")

    try:
        supabase.table("scores").update(
            {"feedback": feedback, "status": "review"}
        ).eq("submission_id", submission["id"]).execute()
        print(f"Updated score record with feedback for submission {submission['id']}")
    except Exception as e:
        print(f"Error updating score record: {e}")

    try:
        # Get user email using participant_id from submission
        user = supabase.table("profiles").select("id").eq("id", submission["participant_id"]).single().execute().data
        if user:
            # Get the auth user's email from auth.users table
            auth_user = supabase.auth.admin.get_user_by_id(submission["participant_id"])
            user_email = auth_user.user.email if auth_user and auth_user.user else None
            if user_email:
                message = Mail(
                    from_email="no-reply@elitebuilders.com",
                    to_emails=user_email,
                    subject="Provisional Score Available",
                    html_content=f"Your score is {submission['total_score']:.2f}/100.<br><br>Feedback:<br>{feedback.replace(chr(10), '<br>')}"
                )
                sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
                #sg.send(message)
                print(f"Email notification prepared for submission {submission['id']} to {user_email}")
            else:
                print(f"Could not get email for user {submission['participant_id']}")
        else:
            print(f"User profile not found for participant_id {submission['participant_id']}")
    except Exception as e:
        print(f"Notification error: {e}")
        print(f"Failed to send notification for submission {submission['id']} to participant {submission['participant_id']}")

    submission["status"] = "reviewed"
    print(f"Set submission {submission['id']} status to 'reviewed'")
    return submission

async def process_submission(submission: dict, supabase: Client):
    print(f"Processing submission {submission['id']} with initial status: {submission['status']}")
    submission = await pre_screen_submission(submission)
    print(f"Pre-screening completed for submission {submission['id']}, status: {submission['status']}")

    if submission["status"] == "prescreened":
        submission = await evaluate_rubric(submission, supabase)
        print(f"Rubric evaluation completed for submission {submission['id']}, status: {submission['status']}")
        submission = await aggregate_score(submission, supabase)
        print(f"Score aggregation completed for submission {submission['id']}, status: {submission['status']}")
        submission = await generate_feedback_and_notify(submission, supabase)
        print(f"Feedback generation completed for submission {submission['id']}, status: {submission['status']}")

    try:
        supabase.table("submissions").update(
            {"status": submission["status"]}
        ).eq("id", submission["id"]).execute()
        print(f"Successfully updated submission {submission['id']} status to '{submission['status']}' in database")
    except Exception as e:
        print(f"Error updating submission {submission['id']} status: {e}")
        try:
            supabase.table("submissions").update(
                {"status": "reviewed"}
            ).eq("id", submission["id"]).execute()
            print(f"Fallback: Set submission {submission['id']} status to 'reviewed'")
        except Exception as fallback_error:
            print(f"Fallback failed for submission {submission['id']}: {fallback_error}")

async def poll_submissions():
    print("Starting submission polling service...")
    while True:
        try:
            submissions = supabase.table("submissions").select("*").eq("status", "submitted").execute().data
            print(f"Found {len(submissions)} submissions with 'submitted' status")
            for submission in submissions:
                print(f"Processing submission ID: {submission['id']}")
                await process_submission(submission, supabase)
                print(f"Completed processing submission ID: {submission['id']}")
        except Exception as e:
            print(f"Error in polling loop: {e}")
        print("Waiting 10 seconds before next poll...")
        await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(poll_submissions())