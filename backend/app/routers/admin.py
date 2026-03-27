import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import func, distinct

from ..database import SessionLocal
from ..models import User, Lead, AnalyticsEvent, SavedSchool, ChatMessage

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_KEY = os.getenv("ADMIN_KEY", "f3af1e56522c3088ced37cef2077ab9c")


def verify_admin(x_admin_key: str = Header(...)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")


@router.get("/stats")
def admin_stats(x_admin_key: str = Header(...)):
    verify_admin(x_admin_key)
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)

        # Total users
        total_users = db.query(func.count(User.id)).scalar() or 0

        # Users by tier
        tier_rows = db.query(User.tier, func.count(User.id)).group_by(User.tier).all()
        users_by_tier = {tier: count for tier, count in tier_rows}

        # Total leads
        total_leads = db.query(func.count(Lead.id)).scalar() or 0

        # Leads last 7 days
        leads_last_7 = db.query(func.count(Lead.id)).filter(
            Lead.created_at >= seven_days_ago
        ).scalar() or 0

        # Total assessments (same as leads)
        total_assessments = total_leads

        # Avg readiness score
        avg_score = db.query(func.avg(Lead.readiness_score)).scalar()
        avg_readiness_score = round(float(avg_score), 1) if avg_score else 0

        # Top majors
        major_rows = db.query(Lead.major, func.count(Lead.id).label("cnt")).filter(
            Lead.major.isnot(None), Lead.major != ""
        ).group_by(Lead.major).order_by(func.count(Lead.id).desc()).limit(10).all()
        top_majors = [{"major": m, "count": c} for m, c in major_rows]

        # Top matched schools
        from sqlalchemy import union_all, literal_column
        match_q1 = db.query(Lead.top_match_1.label("school")).filter(Lead.top_match_1.isnot(None))
        match_q2 = db.query(Lead.top_match_2.label("school")).filter(Lead.top_match_2.isnot(None))
        match_q3 = db.query(Lead.top_match_3.label("school")).filter(Lead.top_match_3.isnot(None))
        all_matches = match_q1.union_all(match_q2).union_all(match_q3).subquery()
        school_rows = db.query(
            all_matches.c.school, func.count().label("cnt")
        ).group_by(all_matches.c.school).order_by(func.count().desc()).limit(10).all()
        top_schools_matched = [{"school": s, "count": c} for s, c in school_rows]

        # Analytics events (last 7 days by type)
        event_rows = db.query(
            AnalyticsEvent.event_type, func.count(AnalyticsEvent.id)
        ).filter(
            AnalyticsEvent.created_at >= seven_days_ago
        ).group_by(AnalyticsEvent.event_type).order_by(func.count(AnalyticsEvent.id).desc()).all()
        analytics_events = [{"event_type": t, "count": c} for t, c in event_rows]

        # Saved schools count
        saved_schools_count = db.query(func.count(SavedSchool.id)).scalar() or 0

        # Chat messages count
        chat_messages_count = db.query(func.count(ChatMessage.id)).scalar() or 0

        # Recent leads (last 20)
        recent = db.query(Lead).order_by(Lead.created_at.desc()).limit(20).all()
        recent_leads = []
        for lead in recent:
            email = lead.email or ""
            if "@" in email:
                local, domain = email.split("@", 1)
                masked = local[0] + "***@" + domain if local else "***@" + domain
            else:
                masked = "***"
            recent_leads.append({
                "email": masked,
                "score": lead.readiness_score,
                "top_match": lead.top_match_1,
                "date": lead.created_at.isoformat() if lead.created_at else None,
            })

        return {
            "total_users": total_users,
            "users_by_tier": users_by_tier,
            "total_leads": total_leads,
            "leads_last_7_days": leads_last_7,
            "total_assessments": total_assessments,
            "avg_readiness_score": avg_readiness_score,
            "top_majors": top_majors,
            "top_schools_matched": top_schools_matched,
            "analytics_events": analytics_events,
            "saved_schools_count": saved_schools_count,
            "chat_messages_count": chat_messages_count,
            "recent_leads": recent_leads,
        }
    finally:
        db.close()
