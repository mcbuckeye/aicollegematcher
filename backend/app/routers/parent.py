from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import School, Subscription

router = APIRouter(prefix="/api/parent", tags=["parent"])


class ParentDashboardRequest(BaseModel):
    answers: dict
    school_ids: List[int]
    email: Optional[str] = None


class SchoolFinancialSummary(BaseModel):
    school_id: int
    school_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    sticker_price: Optional[int] = None
    estimated_net_price: Optional[int] = None
    avg_financial_aid: Optional[int] = None
    median_debt: Optional[int] = None
    monthly_payment: Optional[float] = None
    debt_to_income_ratio: Optional[float] = None
    pell_grant_rate: Optional[float] = None
    federal_loan_rate: Optional[float] = None
    graduation_rate: Optional[int] = None
    retention_rate: Optional[int] = None
    median_earnings_10yr: Optional[int] = None
    roi: Optional[float] = None
    acceptance_rate: Optional[float] = None


@router.post("/dashboard")
def get_parent_dashboard(payload: ParentDashboardRequest, db: Session = Depends(get_db)):
    # Gate: premium only
    tier = get_user_tier(payload.email, db)
    if tier != "premium":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_required",
                "required_tier": "premium",
                "message": "Parent Dashboard requires Premium tier.",
            },
        )

    if len(payload.school_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 schools")

    schools = db.query(School).filter(School.id.in_(payload.school_ids)).all()
    if not schools:
        raise HTTPException(status_code=404, detail="No schools found")

    school_summaries = []
    for school in schools:
        sticker = school.cost_of_attendance or (
            (school.tuition or 0) + (school.room_and_board or 0)
        ) or None

        net_price = school.avg_net_price
        if net_price is None and school.tuition and school.avg_financial_aid:
            net_price = school.tuition - school.avg_financial_aid

        # ROI: (median_earnings_10yr * 10) / (cost_of_attendance * 4)
        roi = None
        coa = sticker or net_price
        if school.median_earnings_10yr and coa and coa > 0:
            roi = round((school.median_earnings_10yr * 10) / (coa * 4), 2)

        # Debt-to-income ratio
        dti = None
        if school.median_debt and school.median_earnings_10yr and school.median_earnings_10yr > 0:
            dti = round(school.median_debt / school.median_earnings_10yr, 2)

        school_summaries.append(SchoolFinancialSummary(
            school_id=school.id,
            school_name=school.name,
            city=school.city,
            state=school.state,
            sticker_price=sticker,
            estimated_net_price=net_price,
            avg_financial_aid=school.avg_financial_aid,
            median_debt=school.median_debt,
            monthly_payment=school.median_debt_monthly_payment,
            debt_to_income_ratio=dti,
            pell_grant_rate=school.pell_grant_rate,
            federal_loan_rate=school.federal_loan_rate,
            graduation_rate=school.graduation_rate,
            retention_rate=school.retention_rate,
            median_earnings_10yr=school.median_earnings_10yr,
            roi=roi,
            acceptance_rate=school.acceptance_rate,
        ))

    # Build assessment summary for parents
    answers = payload.answers
    student_summary = {
        "grade": answers.get("grade", "Not specified"),
        "gpa": answers.get("gpa", "Not specified"),
        "intended_major": answers.get("major", "Undecided"),
        "budget": answers.get("budget", "Not specified"),
        "priorities": answers.get("priorities", []),
    }

    return {
        "student_summary": student_summary,
        "schools": [s.model_dump() for s in school_summaries],
    }


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"
