from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/schools", tags=["schools"])


@router.get("", response_model=schemas.SchoolListResponse)
def list_schools(
    q: Optional[str] = Query(None, description="Search query"),
    state: Optional[str] = Query(None, description="Filter by state (2-letter code)"),
    type: Optional[str] = Query(None, description="Filter by type (public/private)"),
    region: Optional[str] = Query(None, description="Filter by region"),
    min_acceptance: Optional[float] = Query(None, ge=0, le=100, description="Min acceptance rate"),
    max_acceptance: Optional[float] = Query(None, ge=0, le=100, description="Max acceptance rate"),
    limit: int = Query(50, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    List and search schools with filters and pagination
    """
    query = db.query(models.School)
    
    # Text search (name + alias) with relevance ranking
    if q:
        from sqlalchemy import or_, case, literal
        query = query.filter(
            or_(
                models.School.name.ilike(f"%{q}%"),
                models.School.alias.ilike(f"%{q}%"),
            )
        )
        # Rank: exact alias match > alias word match > name starts with > substring
        search_rank = case(
            # Exact alias match (e.g. "MIT" in "MIT, M.I.T.")
            (models.School.alias.op('~*')(f'(^|,\\s*){q}(\\s*,|$)'), literal(1)),
            # Name starts with query
            (models.School.name.ilike(f"{q}%"), literal(2)),
            # Alias contains query
            (models.School.alias.ilike(f"%{q}%"), literal(3)),
            else_=literal(4),
        )
        query = query.order_by(search_rank)
    
    # Filters
    if state:
        query = query.filter(models.School.state == state.upper())
    
    if type:
        query = query.filter(models.School.type == type.lower())
    
    if region:
        query = query.filter(models.School.region == region.lower())
    
    if min_acceptance is not None:
        query = query.filter(models.School.acceptance_rate >= min_acceptance)
    
    if max_acceptance is not None:
        query = query.filter(models.School.acceptance_rate <= max_acceptance)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and fetch (search already has relevance ordering)
    if not q:
        query = query.order_by(models.School.name)
    schools = query.offset(offset).limit(limit).all()
    
    return {
        "schools": schools,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/stats", response_model=schemas.SchoolStats)
def get_stats(db: Session = Depends(get_db)):
    """
    Get aggregate statistics about schools in the database
    """
    total_count = db.query(models.School).count()
    
    avg_acceptance = db.query(func.avg(models.School.acceptance_rate)).scalar()
    avg_tuition = db.query(func.avg(models.School.tuition)).scalar()
    avg_graduation = db.query(func.avg(models.School.graduation_rate)).scalar()
    
    states_count = db.query(func.count(func.distinct(models.School.state))).scalar()
    
    return {
        "total_count": total_count,
        "avg_acceptance_rate": float(avg_acceptance) if avg_acceptance else None,
        "avg_tuition": float(avg_tuition) if avg_tuition else None,
        "avg_graduation_rate": float(avg_graduation) if avg_graduation else None,
        "states_count": states_count
    }


@router.post("/compare")
def compare_schools(
    payload: schemas.CompareRequest,
    db: Session = Depends(get_db)
):
    """Compare 2-5 schools side by side with full data"""
    if len(payload.school_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 schools required")
    if len(payload.school_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 schools")

    schools = db.query(models.School).filter(
        models.School.id.in_(payload.school_ids)
    ).all()

    if not schools:
        raise HTTPException(status_code=404, detail="No schools found")

    return {"schools": schools}


@router.get("/{school_id}", response_model=schemas.SchoolResponse)
def get_school(school_id: int, db: Session = Depends(get_db)):
    """
    Get a single school by ID
    """
    school = db.query(models.School).filter(models.School.id == school_id).first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    return school
