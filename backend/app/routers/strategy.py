import os
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import School, Subscription, StrategyResult

router = APIRouter(prefix="/api/strategy", tags=["strategy"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

STRATEGY_SYSTEM_PROMPT = """You are an expert college admissions strategist with decades of experience helping students
get into their dream schools. Given a student's profile and their top matched schools, generate a comprehensive
application strategy.

You MUST respond with valid JSON in exactly this format:
{
  "timeline": [
    {"month": "April 2026", "actions": ["action 1", "action 2"]},
    {"month": "May 2026", "actions": ["action 1", "action 2"]}
  ],
  "school_tiers": {
    "reach": [{"name": "School Name", "reason": "Why this is a reach"}],
    "match": [{"name": "School Name", "reason": "Why this is a match"}],
    "safety": [{"name": "School Name", "reason": "Why this is a safety"}]
  },
  "test_prep": {
    "recommendation": "SAT or ACT recommendation",
    "target_score": "Target score range",
    "tips": ["tip 1", "tip 2", "tip 3"]
  },
  "extracurricular_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "essay_strategy": {
    "key_themes": ["theme 1", "theme 2", "theme 3"],
    "common_pitfalls": ["pitfall 1", "pitfall 2", "pitfall 3"],
    "tips": ["tip 1", "tip 2", "tip 3"]
  }
}

Guidelines:
- Timeline should span from the current month through January of the next year (application deadlines)
- Include 2-3 reach schools, 3-4 match schools, and 2-3 safety schools from their matches
- Test prep recommendations should be specific to their current score level
- Extracurricular tips should align with their intended major
- Essay strategy should be personalized to their strengths and interests
- Be specific and actionable, not generic
- Keep each action item to 1-2 sentences"""


class StrategyRequest(BaseModel):
    answers: dict
    top_matches: List[dict]  # [{school_name, school_id, match_score, category}]
    email: Optional[str] = None
    session_id: str


@router.post("/generate")
def generate_strategy(payload: StrategyRequest, db: Session = Depends(get_db)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Strategy service not configured")

    # Gate: season and premium only
    tier = get_user_tier(payload.email, db)
    if tier not in ("season", "premium"):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_required",
                "required_tier": "season",
                "message": "Application Strategy requires Season Pass or Premium.",
            },
        )

    # Build user profile for the prompt
    answers = payload.answers
    matches_text = "\n".join(
        f"- {m.get('school_name', 'Unknown')} (Match: {m.get('match_score', 'N/A')}%, Category: {m.get('category', 'N/A')})"
        for m in payload.top_matches
    )

    user_prompt = f"""Student Profile:
- Grade: {answers.get('grade', 'Not specified')}
- GPA: {answers.get('gpa', 'Not specified')}
- Test Scores: {answers.get('test_scores', 'Not specified')}
- Intended Major: {answers.get('major', 'Undecided')}
- School Size Preference: {answers.get('school_size', 'Not specified')}
- Distance Preference: {answers.get('distance', 'Not specified')}
- Budget: {answers.get('budget', 'Not specified')}
- Priorities: {', '.join(answers.get('priorities', []))}
- Must-Haves: {', '.join(answers.get('must_haves', []))}
- Biggest Worry: {answers.get('biggest_worry', 'Not specified')}

Top Matched Schools:
{matches_text}

Generate a comprehensive, personalized application strategy for this student."""

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": STRATEGY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=3000,
            temperature=0.7,
        )
        raw = response.choices[0].message.content
        strategy = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse strategy response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy generation error: {str(e)}")

    # Store result
    try:
        result = StrategyResult(
            session_id=payload.session_id,
            email=payload.email,
            strategy=strategy,
        )
        db.add(result)
        db.commit()
    except Exception:
        db.rollback()

    return {"strategy": strategy}


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"
