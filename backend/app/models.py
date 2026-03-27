from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ARRAY, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    scorecard_id = Column(Integer, unique=True, index=True)
    name = Column(String(255), nullable=False)
    city = Column(String(100))
    state = Column(String(2), index=True)
    type = Column(String(10), index=True)  # 'public' or 'private'
    setting = Column(String(10))  # 'urban', 'suburban', 'rural'
    size = Column(String(10))  # 'small', 'medium', 'large'
    enrollment = Column(Integer)
    acceptance_rate = Column(Float, index=True)
    sat_range_low = Column(Integer)
    sat_range_high = Column(Integer)
    act_range_low = Column(Integer)
    act_range_high = Column(Integer)
    avg_gpa = Column(Float)
    tuition = Column(Integer)
    room_and_board = Column(Integer)
    avg_financial_aid = Column(Integer)
    graduation_rate = Column(Integer)
    retention_rate = Column(Integer)
    median_earnings_10yr = Column(Integer)
    student_faculty_ratio = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    region = Column(String(20))
    hbcu = Column(Boolean, default=False)
    religious_affiliation = Column(Boolean, default=False)
    features = Column(ARRAY(Text))
    majors_strength = Column(ARRAY(Text))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- School info ---
    school_url = Column(String(500))
    price_calculator_url = Column(String(500))
    alias = Column(String(255))
    address = Column(String(255))
    zip_code = Column(String(10))
    men_only = Column(Boolean, default=False)
    women_only = Column(Boolean, default=False)
    online_only = Column(Boolean, default=False)
    open_admissions = Column(Boolean, default=False)
    carnegie_basic = Column(Integer)
    carnegie_size_setting = Column(Integer)
    faculty_salary = Column(Integer)
    ft_faculty_rate = Column(Float)
    tuition_revenue_per_fte = Column(Integer)
    instructional_expenditure_per_fte = Column(Integer)

    # --- Cost ---
    book_supply_cost = Column(Integer)
    avg_net_price = Column(Integer)
    other_expense_oncampus = Column(Integer)
    cost_of_attendance = Column(Integer)

    # --- Aid ---
    pell_grant_rate = Column(Float)
    federal_loan_rate = Column(Float)
    median_debt = Column(Integer)
    median_debt_monthly_payment = Column(Float)
    students_with_any_loan = Column(Float)

    # --- Student demographics ---
    demographics_men = Column(Float)
    demographics_women = Column(Float)
    avg_age_entry = Column(Float)
    first_generation_rate = Column(Float)
    median_family_income = Column(Float)
    part_time_share = Column(Float)
    grad_students = Column(Integer)
    fafsa_applications = Column(Integer)

    # --- Earnings (multi-year) ---
    earnings_6yr_after_entry = Column(Integer)
    earnings_8yr_after_entry = Column(Integer)
    earnings_1yr_after_completion = Column(Integer)
    earnings_4yr_after_completion = Column(Integer)

    # --- Completion ---
    completion_rate_4yr_100 = Column(Float)
    completion_rate_4yr_200 = Column(Float)
    transfer_rate_4yr_ft = Column(Float)
    consumer_rate = Column(Float)

    # --- Programs offered (JSONB dict of program_key -> bool) ---
    programs_offered = Column(JSONB)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_data = Column(JSONB, default={})
    session_id = Column(String(100), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    zip_code = Column(String(10))
    grade = Column(String(20))
    gpa = Column(String(20))
    major = Column(String(255))
    biggest_worry = Column(Text)
    readiness_score = Column(Integer)
    top_match_1 = Column(String(255))
    top_match_2 = Column(String(255))
    top_match_3 = Column(String(255))
    answers = Column(JSON)  # full assessment payload for reference
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    tier = Column(String(20), nullable=False, default="free")  # free/report/season/premium
    status = Column(String(20), nullable=False, default="active")  # active/canceled/expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))


class EssaySubmission(Base):
    __tablename__ = "essay_submissions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    email = Column(String(255), index=True)
    essay_type = Column(String(50), nullable=False)
    essay_text = Column(Text, nullable=False)
    feedback = Column(JSONB)
    school_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user/assistant
    content = Column(Text, nullable=False)
    email = Column(String(255), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StrategyResult(Base):
    __tablename__ = "strategy_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    email = Column(String(255), index=True)
    strategy = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DecisionResult(Base):
    __tablename__ = "decision_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    email = Column(String(255), index=True)
    decision_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
