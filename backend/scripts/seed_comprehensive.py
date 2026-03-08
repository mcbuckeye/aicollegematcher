#!/usr/bin/env python3
"""Seed database from bundled JSON data (154 curated schools)."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine
from app.models import Base, School

JSON_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'seed_schools.json')

def main():
    print("Loading seed data...")
    with open(JSON_FILE) as f:
        schools_data = json.load(f)
    print(f"Found {len(schools_data)} schools")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    added = updated = 0

    for s in schools_data:
        name = s.get('name', '')
        if not name:
            continue

        existing = db.query(School).filter(School.name == name).first()
        sat_range = s.get('satRange', [1000, 1200])
        act_range = s.get('actRange', [22, 28])

        data = {
            'name': name,
            'city': s.get('city', ''),
            'state': s.get('state_code', '')[:2],
            'type': s.get('type', 'private'),
            'setting': s.get('setting', 'suburban'),
            'size': s.get('size', 'medium'),
            'enrollment': s.get('enrollment', 5000),
            'acceptance_rate': s.get('acceptanceRate', 50.0),
            'sat_range_low': sat_range[0] if isinstance(sat_range, list) and len(sat_range) >= 2 else 1000,
            'sat_range_high': sat_range[1] if isinstance(sat_range, list) and len(sat_range) >= 2 else 1200,
            'act_range_low': act_range[0] if isinstance(act_range, list) and len(act_range) >= 2 else 22,
            'act_range_high': act_range[1] if isinstance(act_range, list) and len(act_range) >= 2 else 28,
            'avg_gpa': s.get('avgGPA', 3.5),
            'tuition': s.get('tuition', 30000),
            'room_and_board': s.get('roomAndBoard', 13000),
            'avg_financial_aid': s.get('avgFinancialAid', 15000),
            'graduation_rate': s.get('graduationRate', 70),
            'retention_rate': s.get('retentionRate', 80),
            'median_earnings_10yr': s.get('medianEarnings10yr', 55000),
            'student_faculty_ratio': s.get('studentFacultyRatio', 15),
            'region': s.get('region', 'northeast'),
            'hbcu': s.get('hbcu', False),
            'religious_affiliation': 'religious' in s.get('features', []),
            'features': s.get('features', []),
            'majors_strength': s.get('majorsStrength', []),
            'description': s.get('description', f'{name} is a university.'),
        }

        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            updated += 1
        else:
            db.add(School(**data))
            added += 1

    db.commit()
    total = db.query(School).count()
    print(f"Done! Added {added}, updated {updated}. Total: {total}")
    db.close()

if __name__ == '__main__':
    main()
