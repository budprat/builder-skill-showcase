
import dspy  # +++ GREEN: Added for DSPy prompt optimization
from google.adk.agents import LlmAgent  # +++ GREEN: Added for ADK agents
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

# Custom DSPy Adapter for Gemini API
class GeminiDSPyAdapter(dspy.LM):
    def __init__(self, model):
        super().__init__(model)
        self.model = GenerativeModel(model)

    def generate(self, prompt, max_tokens=200, **kwargs):
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"max_output_tokens": max_tokens}
            )
            return [{"text": response.text}]
        except Exception as e:
            print(f"Gemini API error: {e}")
            return [{"text": ""}]

# Configure DSPy
dspy.settings.configure(lm=GeminiDSPyAdapter("gemini-1.5-pro"))

# DSPy Signature for Rubric Evaluation
class RubricEvaluation(dspy.Signature):
    """Evaluate a pitch deck for a specific criterion."""
    challenge_description = dspy.InputField()
    pitch_deck_text = dspy.InputField()
    criterion = dspy.InputField()
    score = dspy.OutputField(desc="Score from 0 to 100")
    explanation = dspy.OutputField(desc="2-3 sentence explanation")

# ADK Agents
evaluator_agent = LlmAgent(
    name="pitch_deck_evaluator",
    model="gemini-1.5-pro",
    instruction="Evaluate pitch decks for an AI competition using the provided rubric. Return scores and explanations in JSON: {'score': int, 'explanation': str}.",
    description="Evaluates pitch decks against predefined criteria."
)

feedback_agent = LlmAgent(
    name="feedback_formatter",
    model="gemini-1.5-pro",
    instruction="Format LLM evaluation results into concise, user-friendly feedback with actionable improvement suggestions.",
    description="Generates readable feedback."
)

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
        
        # Parse repository URL and remove .git extension if present
        repo_url = submission["repository_url"]
        if "github.com/" in repo_url:
            repo_path = repo_url.split("github.com/")[1]
            # Remove .git extension if present
            if repo_path.endswith('.git'):
                repo_path = repo_path[:-4]
            print(f"Accessing repository: {repo_path}")
            
            repo = g.get_repo(repo_path)
            repo.get_contents("README.md")
            submission["pre_screening_score"] = 5.0
            submission["status"] = "prescreened"
            print(f"Pre-screening PASSED for submission {submission['id']}: Repository exists and has README.md")
        else:
            raise Exception(f"Invalid GitHub URL format: {repo_url}")
            
    except GithubException as e:
        submission["pre_screening_score"] = 0.0
        submission["status"] = "prescreening_failed"
        print(f"Pre-screening FAILED for submission {submission['id']}: {str(e)}")
        print(f"Failure reason: Unable to access repository or README.md not found at {submission['repository_url']}")
        
        # Check if it's a permission issue
        if e.status == 404:
            print(f"Repository might be private or doesn't exist. Check if GitHub token has access to: {submission['repository_url']}")
        
    except Exception as e:
        submission["pre_screening_score"] = 0.0
        submission["status"] = "prescreening_failed"
        print(f"Pre-screening FAILED for submission {submission['id']}: Unexpected error - {str(e)}")
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
        evaluator = dspy.Predict(RubricEvaluation)
        result = evaluator(
            challenge_description=challenge_description,
            pitch_deck_text=pitch_deck_text[:4000],
            criterion=criterion
        )
        agent_response = evaluator_agent.run(prompt=prompt)
        try:
            agent_result = json.loads(agent_response)
            score = float(agent_result["score"])
            explanation = agent_result["explanation"]
        except:
            score = float(result.score) if result.score else 50.0
            explanation = result.explanation if result.explanation else f"Evaluation failed for {criterion}."
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
    Format the following rubric scores into a concise, user-friendly summary for the participant:
    """
    for criterion, score in submission["llm_scores"].items():
        max_score = 100 * score["score"] / submission["llm_scores"][criterion]["score"]
        feedback_prompt += f"{criterion}: {score['score']:.1f}/{max_score:.1f} - {score['explanation']}\n"
    feedback_prompt += "\nProvide an encouraging summary with specific actionable feedback for improvement."
    feedback = feedback_agent.run(prompt=feedback_prompt)
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
                    html_content=f"Your score is {submission['total_score']:.2f}/100.<br>Feedback:<br>{feedback}"
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
