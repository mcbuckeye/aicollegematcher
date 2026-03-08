from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime


class SchoolBase(BaseModel):
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    type: Optional[Literal['public', 'private']] = None
    setting: Optional[Literal['urban', 'suburban', 'rural']] = None
    size: Optional[Literal['small', 'medium', 'large']] = None
    enrollment: Optional[int] = None
    acceptance_rate: Optional[float] = None
    sat_range_low: Optional[int] = None
    sat_range_high: Optional[int] = None
    act_range_low: Optional[int] = None
    act_range_high: Optional[int] = None
    avg_gpa: Optional[float] = None
    tuition: Optional[int] = None
    room_and_board: Optional[int] = None
    avg_financial_aid: Optional[int] = None
    graduation_rate: Optional[int] = None
    retention_rate: Optional[int] = None
    median_earnings_10yr: Optional[int] = None
    student_faculty_ratio: Optional[int] = None
    region: Optional[str] = None
    hbcu: Optional[bool] = False
    religious_affiliation: Optional[bool] = False
    features: List[str] = []
    majors_strength: List[str] = []
    description: Optional[str] = None


class SchoolCreate(SchoolBase):
    scorecard_id: int


class SchoolResponse(SchoolBase):
    id: int
    scorecard_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SchoolMatch(BaseModel):
    school: SchoolResponse
    match_score: int
    reason: str
    category: Literal['best-fit', 'strong-match', 'smart-reach', 'hidden-gem']


class AssessmentRequest(BaseModel):
    grade: Optional[str] = None
    gpa: Optional[str] = None
    test_scores: Optional[str] = None
    major: Optional[str] = None
    school_size: Optional[str] = None
    distance: Optional[str] = None
    zip_code: Optional[str] = None
    priorities: List[str] = []
    budget: Optional[str] = None
    must_haves: List[str] = []
    biggest_worry: Optional[str] = None
    email: Optional[str] = None


class AssessmentResult(BaseModel):
    readiness_score: int
    percentile: int
    top_matches: List[SchoolMatch]
    strengths: List[str]
    areas_to_improve: List[str]


class SchoolListResponse(BaseModel):
    schools: List[SchoolResponse]
    total: int
    limit: int
    offset: int


class SchoolStats(BaseModel):
    total_count: int
    avg_acceptance_rate: Optional[float] = None
    avg_tuition: Optional[float] = None
    avg_graduation_rate: Optional[float] = None
    states_count: int
