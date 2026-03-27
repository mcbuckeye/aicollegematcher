import io
import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..services.matching import generate_results
from ..services.pdf_report import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessment", tags=["report"])


@router.post("/report")
def generate_report(
    assessment: schemas.AssessmentRequest,
    db: Session = Depends(get_db),
):
    """Generate a PDF match report from assessment answers"""
    from ..models import School

    schools = db.query(School).all()

    school_dicts = []
    school_models_map = {}
    for school in schools:
        school_models_map[school.id] = school
        school_dicts.append({
            "id": school.id,
            "scorecard_id": school.scorecard_id,
            "name": school.name,
            "city": school.city,
            "state": school.state,
            "type": school.type,
            "setting": school.setting,
            "size": school.size,
            "enrollment": school.enrollment,
            "acceptance_rate": school.acceptance_rate,
            "sat_range_low": school.sat_range_low,
            "sat_range_high": school.sat_range_high,
            "act_range_low": school.act_range_low,
            "act_range_high": school.act_range_high,
            "avg_gpa": school.avg_gpa,
            "tuition": school.tuition,
            "room_and_board": school.room_and_board,
            "avg_financial_aid": school.avg_financial_aid,
            "graduation_rate": school.graduation_rate,
            "retention_rate": school.retention_rate,
            "median_earnings_10yr": school.median_earnings_10yr,
            "student_faculty_ratio": school.student_faculty_ratio,
            "region": school.region,
            "hbcu": school.hbcu,
            "religious_affiliation": school.religious_affiliation,
            "features": school.features or [],
            "majors_strength": school.majors_strength or [],
            "latitude": school.latitude,
            "longitude": school.longitude,
            "description": school.description,
        })

    assessment_dict = assessment.model_dump()
    results = generate_results(assessment_dict, school_dicts)

    # Enrich matches with full school data for PDF
    for match in results["top_matches"]:
        sid = match["school"]["id"]
        model = school_models_map[sid]
        match["school"]["tuition"] = model.tuition
        match["school"]["graduation_rate"] = model.graduation_rate
        match["school"]["median_earnings_10yr"] = model.median_earnings_10yr
        match["school"]["acceptance_rate"] = model.acceptance_rate

    pdf_buffer = generate_pdf_report(assessment_dict, results)

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=college_match_report.pdf"},
    )
