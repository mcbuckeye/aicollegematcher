from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import School, Subscription

router = APIRouter(prefix="/api/financial-aid", tags=["financial-aid"])

# Income bracket thresholds (from College Scorecard data)
INCOME_BRACKETS = [
    (0, 30000),
    (30001, 48000),
    (48001, 75000),
    (75001, 110000),
    (110001, float("inf")),
]


class FinancialAidRequest(BaseModel):
    income: int
    family_size: int = 4
    state: Optional[str] = None
    efc: Optional[int] = None
    school_ids: List[int]
    email: Optional[str] = None


class SchoolAidResult(BaseModel):
    school_name: str
    sticker_price: Optional[int] = None
    estimated_grants: Optional[int] = None
    estimated_net_price: Optional[int] = None
    median_debt: Optional[int] = None
    monthly_payment: Optional[int] = None
    earnings_vs_debt_ratio: Optional[float] = None


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"


def get_income_bracket(income: int) -> int:
    """Return 0-4 index for the income bracket."""
    for i, (low, high) in enumerate(INCOME_BRACKETS):
        if low <= income <= high:
            return i
    return 4  # highest bracket


def estimate_net_price(school: School, income: int) -> Optional[int]:
    """Estimate net price based on income bracket.
    Uses avg_net_price as fallback, with adjustments based on income."""
    base_net = school.avg_net_price
    if base_net is None:
        # Fallback: tuition minus avg aid
        if school.tuition and school.avg_financial_aid:
            base_net = school.tuition - school.avg_financial_aid
        else:
            return None

    bracket = get_income_bracket(income)

    # Adjust based on income bracket (lower income = more aid)
    adjustments = {
        0: 0.50,   # $0-30k: ~50% of base net price
        1: 0.65,   # $30k-48k: ~65%
        2: 0.80,   # $48k-75k: ~80%
        3: 1.00,   # $75k-110k: ~100% (baseline)
        4: 1.20,   # $110k+: ~120%
    }
    factor = adjustments.get(bracket, 1.0)
    return round(base_net * factor)


@router.post("/analyze")
def analyze_financial_aid(payload: FinancialAidRequest, db: Session = Depends(get_db)):
    tier = get_user_tier(payload.email, db)

    if tier != "premium":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_required",
                "required_tier": "premium",
                "message": "Financial aid analysis requires Premium tier.",
            },
        )

    if len(payload.school_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 schools per analysis")

    schools = db.query(School).filter(School.id.in_(payload.school_ids)).all()
    if not schools:
        raise HTTPException(status_code=404, detail="No schools found")

    results = []
    for school in schools:
        sticker = school.cost_of_attendance or (
            (school.tuition or 0) + (school.room_and_board or 0)
        ) or None

        est_net = estimate_net_price(school, payload.income)
        est_grants = (sticker - est_net) if (sticker and est_net) else None

        monthly = school.median_debt_monthly_payment
        debt = school.median_debt
        earnings = school.median_earnings_10yr

        earnings_ratio = None
        if earnings and debt and debt > 0:
            earnings_ratio = round(earnings / debt, 1)

        results.append(SchoolAidResult(
            school_name=school.name,
            sticker_price=sticker,
            estimated_grants=est_grants,
            estimated_net_price=est_net,
            median_debt=debt,
            monthly_payment=round(monthly) if monthly else None,
            earnings_vs_debt_ratio=earnings_ratio,
        ))

    return {"schools": results}
