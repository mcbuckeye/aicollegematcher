import pytest
import json
from sqlalchemy import create_engine, Text, JSON, event, TypeDecorator
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Patch PostgreSQL-specific types BEFORE importing models
import sqlalchemy.dialects.postgresql as pg

# Replace ARRAY with a JSON-based equivalent for SQLite
class JSONEncodedList(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return None

# Monkey-patch the ARRAY and JSONB types at module level before model import
_orig_array = pg.ARRAY
pg.ARRAY = lambda *a, **kw: JSONEncodedList()
pg.JSONB = JSON

from sqlalchemy import Column, ARRAY as SA_ARRAY
import sqlalchemy
sqlalchemy.ARRAY = lambda *a, **kw: JSONEncodedList()

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    session = TestSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    session.close()


@pytest.fixture
def db():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _make_school(db, **overrides):
    from app.models import School
    defaults = {
        "scorecard_id": 100001,
        "name": "Test University",
        "city": "Test City",
        "state": "CA",
        "type": "public",
        "setting": "urban",
        "size": "large",
        "enrollment": 30000,
        "acceptance_rate": 45.0,
        "sat_range_low": 1100,
        "sat_range_high": 1350,
        "act_range_low": 24,
        "act_range_high": 31,
        "avg_gpa": 3.5,
        "tuition": 15000,
        "room_and_board": 12000,
        "avg_financial_aid": 8000,
        "graduation_rate": 85,
        "retention_rate": 90,
        "median_earnings_10yr": 65000,
        "student_faculty_ratio": 18,
        "region": "west",
        "description": "A leading public research university.",
        "avg_net_price": 19000,
        "cost_of_attendance": 27000,
        "median_debt": 22000,
        "median_debt_monthly_payment": 250.0,
    }
    defaults.update(overrides)
    school = School(**defaults)
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


@pytest.fixture
def sample_school(db):
    return _make_school(db)


@pytest.fixture
def sample_schools(db):
    return [
        _make_school(db, scorecard_id=200001, name="Elite Private College",
                     city="Boston", state="MA", type="private", size="medium",
                     enrollment=8000, acceptance_rate=12.0,
                     sat_range_low=1400, sat_range_high=1560, avg_gpa=3.95,
                     tuition=55000, room_and_board=18000, avg_financial_aid=45000,
                     graduation_rate=97, retention_rate=98, median_earnings_10yr=95000,
                     student_faculty_ratio=6, region="northeast",
                     description="An elite private institution.", avg_net_price=28000),
        _make_school(db, scorecard_id=200002, name="State Flagship University",
                     city="Austin", state="TX", type="public", size="large",
                     enrollment=50000, acceptance_rate=32.0,
                     sat_range_low=1200, sat_range_high=1450, avg_gpa=3.7,
                     tuition=12000, room_and_board=11000, avg_financial_aid=6000,
                     graduation_rate=82, retention_rate=95, median_earnings_10yr=60000,
                     student_faculty_ratio=18, region="southwest",
                     description="A top public research university.", avg_net_price=17000),
        _make_school(db, scorecard_id=200003, name="Small Liberal Arts College",
                     city="Portland", state="OR", type="private", setting="suburban",
                     size="small", enrollment=2000, acceptance_rate=55.0,
                     sat_range_low=1050, sat_range_high=1250, avg_gpa=3.4,
                     tuition=42000, room_and_board=13000, avg_financial_aid=30000,
                     graduation_rate=75, retention_rate=85, median_earnings_10yr=48000,
                     student_faculty_ratio=10, region="west",
                     description="A small liberal arts college.", avg_net_price=25000),
    ]
