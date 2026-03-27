import os
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from ..database import get_db
from ..models import School, Subscription, DecisionResult

router = APIRouter(prefix="/api/decision", tags=["decision"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

DECISION_SYSTEM_PROMPT = """You are an expert college admissions counselor helping a student decide between schools
they've been admitted to. Given the student's priorities and school data, generate specific pros and cons
for each school relative to what matters most to this student.

You MUST respond with valid JSON in exactly this format:
{
  "schools": [
    {
      "school_name": "School Name",
      "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],
      "cons": ["specific con 1", "specific con 2"],
      "summary": "One-sentence summary of fit"
    }
  ],
  "recommendation": "Your top recommendation and why, in 2-3 sentences",
  "considerations": ["Key factor 1 to weigh", "Key factor 2 to weigh", "Key factor 3 to weigh"]
}

Guidelines:
- Be specific to each school's actual data, not generic
- Pros/cons should reflect the student's stated priorities
- Reference actual numbers (tuition, earnings, acceptance rate) when relevant
- Give 3-5 pros and 2-3 cons per school
- The recommendation should be nuanced and acknowledge trade-offs
- Keep each item to 1-2 sentences"""


class PriorityWeights(BaseModel):
    academics: int  # 1-5
    cost: int
    location: int
    campus_life: int
    career_outcomes: int


class DecisionRequest(BaseModel):
    school_ids: List[int]
    weights: PriorityWeights
    answers: Optional[dict] = None
    email: Optional[str] = None
    session_id: str


@router.post("/analyze")
def analyze_decision(payload: DecisionRequest, db: Session = Depends(get_db)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Decision service not configured")

    # Gate: premium only
    tier = get_user_tier(payload.email, db)
    if tier != "premium":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_required",
                "required_tier": "premium",
                "message": "Decision Support requires Premium tier.",
            },
        )

    if len(payload.school_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 schools required")
    if len(payload.school_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 schools")

    schools = db.query(School).filter(School.id.in_(payload.school_ids)).all()
    if not schools:
        raise HTTPException(status_code=404, detail="No schools found")

    # Calculate weighted decision scores from data
    weights = payload.weights
    total_weight = weights.academics + weights.cost + weights.location + weights.campus_life + weights.career_outcomes
    if total_weight == 0:
        total_weight = 1

    scored_schools = []
    for school in schools:
        score = 0.0

        # Academics (graduation rate + retention as proxy)
        acad = 0
        if school.graduation_rate:
            acad += school.graduation_rate
        if school.retention_rate:
            acad += school.retention_rate
        acad_score = min(acad / 2, 100) if acad else 50
        score += (weights.academics / total_weight) * acad_score

        # Cost (lower is better - invert)
        net_price = school.avg_net_price or school.tuition or 50000
        cost_score = max(0, 100 - (net_price / 800))  # $80k = 0, $0 = 100
        score += (weights.cost / total_weight) * cost_score

        # Location (use setting diversity as proxy)
        loc_score = 60  # baseline
        if school.setting == "urban":
            loc_score = 75
        elif school.setting == "suburban":
            loc_score = 70
        score += (weights.location / total_weight) * loc_score

        # Campus life (student-faculty ratio as proxy, lower is better)
        sfr = school.student_faculty_ratio or 15
        campus_score = max(0, 100 - (sfr * 3))
        score += (weights.campus_life / total_weight) * campus_score

        # Career outcomes (median earnings)
        earnings = school.median_earnings_10yr or 50000
        career_score = min(100, earnings / 1000)
        score += (weights.career_outcomes / total_weight) * career_score

        scored_schools.append({
            "school": school,
            "decision_score": round(score, 1),
        })

    scored_schools.sort(key=lambda x: x["decision_score"], reverse=True)

    # Build GPT prompt with school data
    schools_text = ""
    for item in scored_schools:
        s = item["school"]
        schools_text += f"""
{s.name} (Decision Score: {item['decision_score']}/100):
- Location: {s.city}, {s.state} ({s.setting or 'unknown'} setting)
- Tuition: ${s.tuition or 'N/A':,} | Net Price: ${s.avg_net_price or 'N/A':,}
- Graduation Rate: {s.graduation_rate or 'N/A'}% | Retention: {s.retention_rate or 'N/A'}%
- Student-Faculty Ratio: {s.student_faculty_ratio or 'N/A'}:1
- Median Earnings (10yr): ${s.median_earnings_10yr or 'N/A':,}
- Median Debt: ${s.median_debt or 'N/A':,}
- Enrollment: {s.enrollment or 'N/A':,}
- Features: {', '.join(s.features or [])}
- Strong Majors: {', '.join((s.majors_strength or [])[:5])}
"""

    priority_text = f"""Student Priorities (1-5 importance):
- Academics: {weights.academics}/5
- Cost: {weights.cost}/5
- Location: {weights.location}/5
- Campus Life: {weights.campus_life}/5
- Career Outcomes: {weights.career_outcomes}/5"""

    user_prompt = f"""{priority_text}

Schools to compare:
{schools_text}

Generate specific pros and cons for each school based on this student's priorities."""

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": DECISION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=3000,
            temperature=0.7,
        )
        raw = response.choices[0].message.content
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse decision analysis")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision analysis error: {str(e)}")

    # Merge scores into response
    result_schools = []
    for item in scored_schools:
        s = item["school"]
        # Find GPT analysis for this school
        gpt_school = next(
            (gs for gs in analysis.get("schools", []) if gs["school_name"] == s.name),
            {"pros": [], "cons": [], "summary": ""},
        )
        result_schools.append({
            "school_id": s.id,
            "school_name": s.name,
            "decision_score": item["decision_score"],
            "pros": gpt_school.get("pros", []),
            "cons": gpt_school.get("cons", []),
            "summary": gpt_school.get("summary", ""),
        })

    result_data = {
        "schools": result_schools,
        "recommendation": analysis.get("recommendation", ""),
        "considerations": analysis.get("considerations", []),
    }

    # Store result
    try:
        dr = DecisionResult(
            session_id=payload.session_id,
            email=payload.email,
            decision_data=result_data,
        )
        db.add(dr)
        db.commit()
    except Exception:
        db.rollback()

    return result_data


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"
