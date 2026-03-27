import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import Subscription

router = APIRouter(prefix="/api/essay", tags=["essay"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

ESSAY_SYSTEM_PROMPT = """You are an expert college admissions essay reviewer with years of experience helping students
get into top universities. Analyze the following college essay and provide structured feedback.

You MUST respond with valid JSON in exactly this format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areas_for_improvement": ["area 1", "area 2", "area 3"],
  "specific_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "overall_score": 7,
  "summary": "A one-sentence overall assessment"
}

Guidelines:
- Be specific and actionable, not generic
- Reference specific parts of the essay in your feedback
- Score from 1-10 where 7 is good, 8 is strong, 9 is excellent, 10 is exceptional
- For "Why This College" essays, assess whether the student shows genuine knowledge of the school
- For personal statements, focus on voice, authenticity, and narrative arc
- For activities descriptions, focus on impact and specificity
- Give 3-5 items in each array
- Keep each item to 1-2 sentences"""


class EssayRequest(BaseModel):
    essay_text: str
    essay_type: str
    school_name: Optional[str] = None
    email: Optional[str] = None
    session_id: str


class EssayFeedbackResponse(BaseModel):
    strengths: list[str]
    areas_for_improvement: list[str]
    specific_suggestions: list[str]
    overall_score: int
    summary: str


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"


@router.post("/feedback")
def get_essay_feedback(payload: EssayRequest, db: Session = Depends(get_db)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Essay feedback service not configured")

    tier = get_user_tier(payload.email, db)

    # Gate: only season and premium
    if tier not in ("season", "premium"):
        # Generate teaser for free/report users
        teaser = payload.essay_text[:100].rsplit(" ", 1)[0] if len(payload.essay_text) > 100 else payload.essay_text
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_required",
                "required_tier": "season",
                "teaser": f"Your essay starts strong with an engaging opening. Based on our initial analysis, there are several key areas where..."
            },
        )

    # Build prompt
    user_prompt = f"Essay Type: {payload.essay_type}\n"
    if payload.school_name:
        user_prompt += f"Target School: {payload.school_name}\n"
    user_prompt += f"\n---\n\n{payload.essay_text}"

    try:
        import openai
        import json

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ESSAY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1500,
            temperature=0.7,
        )
        raw = response.choices[0].message.content

        # Parse JSON from response
        feedback = json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Essay feedback error: {str(e)}")

    # Store submission
    try:
        from ..models import EssaySubmission
        submission = EssaySubmission(
            session_id=payload.session_id,
            email=payload.email,
            essay_type=payload.essay_type,
            essay_text=payload.essay_text,
            feedback=feedback,
            school_name=payload.school_name,
        )
        db.add(submission)
        db.commit()
    except Exception:
        db.rollback()

    return {"feedback": feedback}
