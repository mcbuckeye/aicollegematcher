from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ARRAY, DateTime, JSON
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
