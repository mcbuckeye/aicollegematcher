from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SavedSchool, School, User
from ..schemas import SaveSchoolRequest, SavedSchoolResponse
from .auth import require_auth

router = APIRouter(prefix="/api/user/saved-schools", tags=["saved-schools"])


@router.get("", response_model=list[SavedSchoolResponse])
def list_saved_schools(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedSchool)
        .filter(SavedSchool.user_id == user.id)
        .order_by(SavedSchool.created_at.desc())
        .all()
    )
    return saved


@router.post("", response_model=SavedSchoolResponse)
def save_school(
    req: SaveSchoolRequest,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    # Check school exists
    school = db.query(School).filter(School.id == req.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Check not already saved
    existing = (
        db.query(SavedSchool)
        .filter(SavedSchool.user_id == user.id, SavedSchool.school_id == req.school_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="School already saved")

    saved = SavedSchool(user_id=user.id, school_id=req.school_id, notes=req.notes)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


@router.delete("/{school_id}")
def remove_saved_school(
    school_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedSchool)
        .filter(SavedSchool.user_id == user.id, SavedSchool.school_id == school_id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Saved school not found")

    db.delete(saved)
    db.commit()
    return {"message": "School removed from saved list"}
