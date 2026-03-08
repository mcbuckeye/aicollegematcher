from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..services.matching import generate_results

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


@router.post("/match", response_model=schemas.AssessmentResult)
def match_schools(
    assessment: schemas.AssessmentRequest,
    db: Session = Depends(get_db)
):
    """
    Submit assessment and get personalized school matches
    """
    from ..models import School
    
    # Fetch all schools from database
    schools = db.query(School).all()
    
    # Convert SQLAlchemy models to dicts for matching engine
    school_dicts = []
    school_models_map = {}  # Map school ID to full model for later
    
    for school in schools:
        # Store full model for later response construction
        school_models_map[school.id] = school
        
        # Create simplified dict for matching engine (no timestamps needed)
        school_dict = {
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
            "description": school.description,
        }
        school_dicts.append(school_dict)
    
    # Convert assessment to dict
    assessment_dict = assessment.model_dump()
    
    # Run matching engine
    results = generate_results(assessment_dict, school_dicts)
    
    # Replace school dicts with full SQLAlchemy models (includes timestamps)
    for match in results['top_matches']:
        school_id = match['school']['id']
        match['school'] = school_models_map[school_id]
    
    return results
