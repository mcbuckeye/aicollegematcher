from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Lead
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/leads", tags=["leads"])


class LeadResponse(BaseModel):
    id: int
    email: str
    zip_code: Optional[str] = None
    grade: Optional[str] = None
    gpa: Optional[str] = None
    major: Optional[str] = None
    biggest_worry: Optional[str] = None
    readiness_score: Optional[int] = None
    top_match_1: Optional[str] = None
    top_match_2: Optional[str] = None
    top_match_3: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadsListResponse(BaseModel):
    leads: List[LeadResponse]
    total: int


@router.get("", response_model=LeadsListResponse)
def list_leads(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all captured leads, newest first"""
    total = db.query(Lead).count()
    leads = (
        db.query(Lead)
        .order_by(desc(Lead.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {"leads": leads, "total": total}


@router.get("/export")
def export_leads_csv(db: Session = Depends(get_db)):
    """Export all leads as CSV"""
    from fastapi.responses import StreamingResponse
    import csv
    import io

    leads = db.query(Lead).order_by(desc(Lead.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "email", "zip_code", "grade", "gpa", "major",
        "biggest_worry", "readiness_score",
        "top_match_1", "top_match_2", "top_match_3", "created_at"
    ])
    for lead in leads:
        writer.writerow([
            lead.id, lead.email, lead.zip_code, lead.grade, lead.gpa,
            lead.major, lead.biggest_worry, lead.readiness_score,
            lead.top_match_1, lead.top_match_2, lead.top_match_3,
            lead.created_at.isoformat() if lead.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )
