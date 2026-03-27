from pydantic import BaseModel, validator
from typing import Any, Dict, List, Optional, Literal
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
    features: Optional[List[str]] = []
    majors_strength: Optional[List[str]] = []

    @validator('features', 'majors_strength', pre=True, always=True)
    def default_empty_list(cls, v):
        return v if v is not None else []
    description: Optional[str] = None

    # School info
    school_url: Optional[str] = None
    price_calculator_url: Optional[str] = None
    alias: Optional[str] = None
    address: Optional[str] = None
    zip_code: Optional[str] = None
    men_only: Optional[bool] = False
    women_only: Optional[bool] = False
    online_only: Optional[bool] = False
    open_admissions: Optional[bool] = False
    carnegie_basic: Optional[int] = None
    carnegie_size_setting: Optional[int] = None
    faculty_salary: Optional[int] = None
    ft_faculty_rate: Optional[float] = None
    tuition_revenue_per_fte: Optional[int] = None
    instructional_expenditure_per_fte: Optional[int] = None

    # Cost
    book_supply_cost: Optional[int] = None
    avg_net_price: Optional[int] = None
    other_expense_oncampus: Optional[int] = None
    cost_of_attendance: Optional[int] = None

    # Aid
    pell_grant_rate: Optional[float] = None
    federal_loan_rate: Optional[float] = None
    median_debt: Optional[int] = None
    median_debt_monthly_payment: Optional[float] = None
    students_with_any_loan: Optional[float] = None

    # Student demographics
    demographics_men: Optional[float] = None
    demographics_women: Optional[float] = None
    avg_age_entry: Optional[float] = None
    first_generation_rate: Optional[float] = None
    median_family_income: Optional[float] = None
    part_time_share: Optional[float] = None
    grad_students: Optional[int] = None
    fafsa_applications: Optional[int] = None

    # Earnings (multi-year)
    earnings_6yr_after_entry: Optional[int] = None
    earnings_8yr_after_entry: Optional[int] = None
    earnings_1yr_after_completion: Optional[int] = None
    earnings_4yr_after_completion: Optional[int] = None

    # Completion
    completion_rate_4yr_100: Optional[float] = None
    completion_rate_4yr_200: Optional[float] = None
    transfer_rate_4yr_ft: Optional[float] = None
    consumer_rate: Optional[float] = None

    # Programs
    programs_offered: Optional[Dict[str, Any]] = None


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
