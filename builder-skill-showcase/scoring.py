import dspy
from google.adk.agents import LlmAgent
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

# ADK Agent for Evaluation
evaluator_agent = LlmAgent(
    name="pitch_deck_evaluator",
    model="gemini-1.5-pro",
    instruction="Evaluate pitch decks for an AI competition using the provided rubric. Return scores and explanations in JSON: {'score': int, 'explanation': str}.",
    description="Evaluates pitch decks against predefined criteria."
)

# ADK Agent for Feedback
feedback_agent = LlmAgent(
    name="feedback_formatter",
    model="gemini-1.5-pro",
    instruction="Format LLM evaluation results into concise, user-friendly feedback.",
    description="Generates readable feedback."
)

def extract_pdf_text(supabase_path: str, supabase: Client) -> str:
    try:
        with open("/tmp/pitch_deck.pdf", "wb") as f:
            f.write(supabase.storage.from_("submissions").download(supabase_path))
        with pdfplumber.open("/tmp/pitch_deck.pdf") as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

async def pre_screen_submission(submission: dict) -> dict:
    try:
        g = Github(os.getenv("GITHUB_TOKEN"))
        repo = g.get_repo(submission["github_repo_url"].split("github.com/")[1])
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
        evaluator = dspy.Predict(RubricEvaluation)
        result = evaluator(
            challenge_description=challenge_description,
            pitch_deck_text=pitch_deck_text[:4000],
            criterion=criterion
        )
        prompt = (
            f"Evaluate the {criterion} criterion for the pitch deck: {pitch_deck_text[:4000]} "
            f"based on challenge: {challenge_description}. "
            f"Return JSON: {{'score': int, 'explanation': str}}"
        )
        agent_response = evaluator_agent.run(prompt=prompt)
        try:
            agent_result = json.loads(agent_response)
            score = float(agent_result["score"])
            explanation = agent_result["explanation"]
        except:
            score = float(result.score) if result.score else 0.0
            explanation = result.explanation if result.explanation else "Evaluation failed."

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
    feedback_prompt = "Format the following rubric scores into a concise, user-friendly summary:\n"
    for criterion, score in submission["llm_scores"].items():
        max_score = 100 * score["score"] / submission["llm_scores"][criterion]["score"]
        feedback_prompt += f"{criterion}: {score['score']:.1f}/{max_score:.1f} - {score['explanation']}\n"
    feedback = feedback_agent.run(prompt=feedback_prompt)

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
