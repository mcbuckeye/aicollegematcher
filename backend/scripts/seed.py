#!/usr/bin/env python3
"""
Seed script with sample schools for development/demo
Loads a small set of well-known schools so the app can run immediately
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine
from app.models import Base, School
from sqlalchemy.dialects.postgresql import insert

SAMPLE_SCHOOLS = [
    {
        "scorecard_id": 166027,
        "name": "Harvard University",
        "city": "Cambridge",
        "state": "MA",
        "type": "private",
        "setting": "urban",
        "size": "medium",
        "enrollment": 23731,
        "acceptance_rate": 3.4,
        "sat_range_low": 1460,
        "sat_range_high": 1580,
        "act_range_low": 33,
        "act_range_high": 35,
        "avg_gpa": 3.9,
        "tuition": 54269,
        "room_and_board": 18389,
        "avg_financial_aid": 50000,
        "graduation_rate": 98,
        "retention_rate": 98,
        "median_earnings_10yr": 95114,
        "student_faculty_ratio": 6,
        "region": "northeast",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "urban", "honors"],
        "majors_strength": ["Economics", "Political Science", "Computer Science", "Biology", "Psychology"],
        "description": "Harvard University is a private Ivy League research university in Cambridge, Massachusetts."
    },
    {
        "scorecard_id": 190415,
        "name": "Massachusetts Institute of Technology",
        "city": "Cambridge",
        "state": "MA",
        "type": "private",
        "setting": "urban",
        "size": "medium",
        "enrollment": 11934,
        "acceptance_rate": 3.9,
        "sat_range_low": 1510,
        "sat_range_high": 1570,
        "act_range_low": 34,
        "act_range_high": 36,
        "avg_gpa": 3.95,
        "tuition": 57590,
        "room_and_board": 18730,
        "avg_financial_aid": 48000,
        "graduation_rate": 96,
        "retention_rate": 99,
        "median_earnings_10yr": 111222,
        "student_faculty_ratio": 3,
        "region": "northeast",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "urban", "coop"],
        "majors_strength": ["Computer Science", "Engineering", "Physics", "Mathematics", "Economics"],
        "description": "MIT is a private research university known for scientific and technological research."
    },
    {
        "scorecard_id": 243744,
        "name": "University of California-Berkeley",
        "city": "Berkeley",
        "state": "CA",
        "type": "public",
        "setting": "urban",
        "size": "large",
        "enrollment": 45057,
        "acceptance_rate": 11.6,
        "sat_range_low": 1330,
        "sat_range_high": 1530,
        "act_range_low": 31,
        "act_range_high": 35,
        "avg_gpa": 3.89,
        "tuition": 14312,
        "room_and_board": 19304,
        "avg_financial_aid": 18000,
        "graduation_rate": 93,
        "retention_rate": 97,
        "median_earnings_10yr": 76519,
        "student_faculty_ratio": 20,
        "region": "west",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "urban", "d1-sports"],
        "majors_strength": ["Computer Science", "Engineering", "Business", "Biology", "Political Science"],
        "description": "UC Berkeley is a public research university and the flagship campus of the University of California system."
    },
    {
        "scorecard_id": 110635,
        "name": "University of Michigan-Ann Arbor",
        "city": "Ann Arbor",
        "state": "MI",
        "type": "public",
        "setting": "suburban",
        "size": "large",
        "enrollment": 47907,
        "acceptance_rate": 18.0,
        "sat_range_low": 1340,
        "sat_range_high": 1530,
        "act_range_low": 31,
        "act_range_high": 34,
        "avg_gpa": 3.88,
        "tuition": 17786,
        "room_and_board": 13626,
        "avg_financial_aid": 17000,
        "graduation_rate": 93,
        "retention_rate": 97,
        "median_earnings_10yr": 72117,
        "student_faculty_ratio": 15,
        "region": "midwest",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "d1-sports", "greek-life"],
        "majors_strength": ["Engineering", "Business", "Computer Science", "Psychology", "Economics"],
        "description": "The University of Michigan is a public research university in Ann Arbor, Michigan."
    },
    {
        "scorecard_id": 215293,
        "name": "Ohio State University-Main Campus",
        "city": "Columbus",
        "state": "OH",
        "type": "public",
        "setting": "urban",
        "size": "large",
        "enrollment": 61170,
        "acceptance_rate": 52.7,
        "sat_range_low": 1240,
        "sat_range_high": 1450,
        "act_range_low": 27,
        "act_range_high": 32,
        "avg_gpa": 3.76,
        "tuition": 12859,
        "room_and_board": 13788,
        "avg_financial_aid": 12000,
        "graduation_rate": 88,
        "retention_rate": 94,
        "median_earnings_10yr": 60122,
        "student_faculty_ratio": 19,
        "region": "midwest",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "d1-sports", "greek-life", "honors"],
        "majors_strength": ["Business", "Engineering", "Psychology", "Biology", "Finance"],
        "description": "The Ohio State University is a large public research university in Columbus, Ohio."
    },
    {
        "scorecard_id": 181464,
        "name": "Amherst College",
        "city": "Amherst",
        "state": "MA",
        "type": "private",
        "setting": "suburban",
        "size": "small",
        "enrollment": 1971,
        "acceptance_rate": 7.8,
        "sat_range_low": 1420,
        "sat_range_high": 1560,
        "act_range_low": 32,
        "act_range_high": 35,
        "avg_gpa": 3.87,
        "tuition": 64608,
        "room_and_board": 17630,
        "avg_financial_aid": 58000,
        "graduation_rate": 96,
        "retention_rate": 98,
        "median_earnings_10yr": 71116,
        "student_faculty_ratio": 7,
        "region": "northeast",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["study-abroad", "diversity"],
        "majors_strength": ["Economics", "Political Science", "English", "Psychology", "Mathematics"],
        "description": "Amherst College is a private liberal arts college in Amherst, Massachusetts."
    },
    {
        "scorecard_id": 130794,
        "name": "University of Florida",
        "city": "Gainesville",
        "state": "FL",
        "type": "public",
        "setting": "suburban",
        "size": "large",
        "enrollment": 56878,
        "acceptance_rate": 23.3,
        "sat_range_low": 1320,
        "sat_range_high": 1480,
        "act_range_low": 29,
        "act_range_high": 33,
        "avg_gpa": 4.4,
        "tuition": 6381,
        "room_and_board": 10960,
        "avg_financial_aid": 8000,
        "graduation_rate": 91,
        "retention_rate": 97,
        "median_earnings_10yr": 56833,
        "student_faculty_ratio": 16,
        "region": "southeast",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "d1-sports", "greek-life", "honors"],
        "majors_strength": ["Business", "Engineering", "Biology", "Psychology", "Health Sciences"],
        "description": "The University of Florida is a public research university in Gainesville, Florida."
    },
    {
        "scorecard_id": 228778,
        "name": "University of Texas at Austin",
        "city": "Austin",
        "state": "TX",
        "type": "public",
        "setting": "urban",
        "size": "large",
        "enrollment": 52384,
        "acceptance_rate": 29.1,
        "sat_range_low": 1240,
        "sat_range_high": 1480,
        "act_range_low": 27,
        "act_range_high": 34,
        "avg_gpa": 3.71,
        "tuition": 11698,
        "room_and_board": 12872,
        "avg_financial_aid": 11000,
        "graduation_rate": 88,
        "retention_rate": 96,
        "median_earnings_10yr": 60518,
        "student_faculty_ratio": 18,
        "region": "southwest",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "urban", "d1-sports", "greek-life"],
        "majors_strength": ["Business", "Engineering", "Computer Science", "Biology", "Communications"],
        "description": "The University of Texas at Austin is a public research university in Austin, Texas."
    },
    {
        "scorecard_id": 139959,
        "name": "Emory University",
        "city": "Atlanta",
        "state": "GA",
        "type": "private",
        "setting": "urban",
        "size": "medium",
        "enrollment": 15120,
        "acceptance_rate": 11.4,
        "sat_range_low": 1400,
        "sat_range_high": 1540,
        "act_range_low": 32,
        "act_range_high": 35,
        "avg_gpa": 3.84,
        "tuition": 57948,
        "room_and_board": 15882,
        "avg_financial_aid": 48000,
        "graduation_rate": 91,
        "retention_rate": 96,
        "median_earnings_10yr": 68711,
        "student_faculty_ratio": 9,
        "region": "southeast",
        "hbcu": False,
        "religious_affiliation": False,
        "features": ["research", "urban", "study-abroad"],
        "majors_strength": ["Business", "Biology", "Nursing", "Economics", "Psychology"],
        "description": "Emory University is a private research university in Atlanta, Georgia."
    },
    {
        "scorecard_id": 100751,
        "name": "Howard University",
        "city": "Washington",
        "state": "DC",
        "type": "private",
        "setting": "urban",
        "size": "medium",
        "enrollment": 10002,
        "acceptance_rate": 35.5,
        "sat_range_low": 1100,
        "sat_range_high": 1290,
        "act_range_low": 22,
        "act_range_high": 28,
        "avg_gpa": 3.5,
        "tuition": 30780,
        "room_and_board": 14760,
        "avg_financial_aid": 27000,
        "graduation_rate": 72,
        "retention_rate": 86,
        "median_earnings_10yr": 52429,
        "student_faculty_ratio": 10,
        "region": "southeast",
        "hbcu": True,
        "religious_affiliation": False,
        "features": ["diversity", "urban", "honors"],
        "majors_strength": ["Business", "Biology", "Communications", "Political Science", "Engineering"],
        "description": "Howard University is a private historically black research university in Washington, D.C."
    },
]

def main():
    """Seed database with sample schools"""
    print("Seeding database with sample schools...")
    print("=" * 60)
    
    # Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Insert schools
    print(f"\nInserting {len(SAMPLE_SCHOOLS)} sample schools...")
    db = SessionLocal()
    
    try:
        for school_data in SAMPLE_SCHOOLS:
            stmt = insert(School).values(**school_data)
            stmt = stmt.on_conflict_do_update(
                index_elements=['scorecard_id'],
                set_=school_data
            )
            db.execute(stmt)
        
        db.commit()
        print(f"✅ Successfully seeded {len(SAMPLE_SCHOOLS)} schools")
        
        # Show what was added
        print("\nSeeded schools:")
        for school_data in SAMPLE_SCHOOLS:
            print(f"  - {school_data['name']} ({school_data['city']}, {school_data['state']})")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("✅ Seeding complete! Backend is ready to use.")
    print("\nNOTE: To load full College Scorecard data, run:")
    print("  python scripts/ingest.py")
    print("  (Requires valid API key and takes ~10+ minutes)")

if __name__ == "__main__":
    main()
