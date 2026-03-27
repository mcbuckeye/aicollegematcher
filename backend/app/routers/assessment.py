import logging
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..services.matching import generate_results

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


@router.post("/match", response_model=schemas.AssessmentResult)
def match_schools(
    assessment: schemas.AssessmentRequest,
    background_tasks: BackgroundTasks,
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
            "latitude": school.latitude,
            "longitude": school.longitude,
            "description": school.description,
            # Extended fields for richer match reasons
            "avg_net_price": school.avg_net_price,
            "cost_of_attendance": school.cost_of_attendance,
            "pell_grant_rate": school.pell_grant_rate,
            "median_debt": school.median_debt,
            "earnings_6yr_after_entry": school.earnings_6yr_after_entry,
            "earnings_8yr_after_entry": school.earnings_8yr_after_entry,
            "completion_rate_4yr_100": school.completion_rate_4yr_100,
            "first_generation_rate": school.first_generation_rate,
            "programs_offered": school.programs_offered,
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
    
    # Save lead to database
    if assessment.email:
        from ..models import Lead
        top_names = [m['school'].name for m in results['top_matches'][:3]]
        lead = Lead(
            email=assessment.email,
            zip_code=assessment.zip_code,
            grade=assessment.grade,
            gpa=assessment.gpa,
            major=assessment.major,
            biggest_worry=assessment.biggest_worry,
            readiness_score=results['readiness_score'],
            top_match_1=top_names[0] if len(top_names) > 0 else None,
            top_match_2=top_names[1] if len(top_names) > 1 else None,
            top_match_3=top_names[2] if len(top_names) > 2 else None,
            answers=assessment_dict,
        )
        try:
            db.add(lead)
            db.commit()
            logger.info(f"[LEAD] Saved: {assessment.email} (score: {results['readiness_score']})")
        except Exception as e:
            db.rollback()
            logger.error(f"[LEAD] Failed to save lead {assessment.email}: {e}")
    
    # Send assessment results email in background
    if assessment.email and results.get('top_matches'):
        try:
            from ..services.email_service import send_assessment_results_email
            matches_for_email = []
            for m in results['top_matches'][:3]:
                school = m['school']
                matches_for_email.append({
                    'school': {
                        'name': school.name,
                        'city': school.city,
                        'state': school.state,
                    },
                    'match_score': m['match_score'],
                })
            background_tasks.add_task(
                send_assessment_results_email,
                assessment.email,
                results['readiness_score'],
                matches_for_email,
            )
        except Exception as e:
            logger.warning(f"Failed to queue assessment results email: {e}")

    return results
