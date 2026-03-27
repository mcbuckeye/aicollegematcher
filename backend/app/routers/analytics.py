import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Dict, Optional
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalyticsEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class TrackEventRequest(BaseModel):
    event_type: str
    event_data: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = None


@router.post("/event")
def track_event(req: TrackEventRequest, db: Session = Depends(get_db)):
    """Record an analytics event"""
    event = AnalyticsEvent(
        event_type=req.event_type,
        event_data=req.event_data or {},
        session_id=req.session_id,
    )
    try:
        db.add(event)
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        logger.error(f"[ANALYTICS] Failed to record event: {e}")
        return {"status": "error"}


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):
    """Return event counts by type for the last 7 days"""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    rows = (
        db.query(AnalyticsEvent.event_type, func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.created_at >= since)
        .group_by(AnalyticsEvent.event_type)
        .all()
    )
    counts = {event_type: count for event_type, count in rows}
    total = sum(counts.values())
    return {"period": "last_7_days", "total": total, "by_type": counts}
