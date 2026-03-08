#!/usr/bin/env python3
"""
Data ingestion from College Scorecard API.
Fetches ~2000 4-year colleges and upserts into PostgreSQL.
"""
import sys, os, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine
from app.models import Base, School
from app.services.scorecard import ScorecardClient

async def main():
    print("Starting College Scorecard data ingestion...")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    client = ScorecardClient()

    total_fetched = [0]
    def progress_callback(page, total, count):
        total_fetched[0] += count
        print(f"  Page {page}: +{count} schools (total: {total_fetched[0]})")

    print("\nFetching schools from College Scorecard API...")
    raw_schools = await client.fetch_all_schools(max_pages=30, callback=progress_callback)

    if not raw_schools:
        print("ERROR: No schools fetched")
        return

    print(f"\nFetched {len(raw_schools)} raw schools. Transforming...")
    schools_data = []
    for raw in raw_schools:
        t = client.transform_school(raw)
        if t and t.get('name'):
            schools_data.append(t)

    print(f"Transformed {len(schools_data)} schools")

    # Insert/update
    db = SessionLocal()
    added = updated = 0
    try:
        for sd in schools_data:
            name = sd.get('name', '')
            scorecard_id = sd.get('scorecard_id')

            existing = None
            if scorecard_id:
                existing = db.query(School).filter(School.scorecard_id == scorecard_id).first()
            if not existing:
                existing = db.query(School).filter(School.name == name).first()

            if existing:
                for k, v in sd.items():
                    if v is not None:
                        setattr(existing, k, v)
                updated += 1
            else:
                db.add(School(**sd))
                added += 1

            if (added + updated) % 200 == 0:
                db.commit()
                print(f"  Progress: {added + updated}/{len(schools_data)}")

        db.commit()
        total = db.query(School).count()
        print(f"\n✅ Added {added}, updated {updated}. Total in DB: {total}")
        print(f"  Public: {db.query(School).filter(School.type == 'public').count()}")
        print(f"  Private: {db.query(School).filter(School.type == 'private').count()}")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

    print("=" * 60)
    print("✅ Ingestion complete!")

if __name__ == "__main__":
    asyncio.run(main())
