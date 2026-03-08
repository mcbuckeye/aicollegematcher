#!/usr/bin/env python3
"""
Backfill latitude/longitude for existing schools from the College Scorecard API.
"""
import sys, os, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models import School
from app.services.scorecard import ScorecardClient


async def main():
    print("Backfilling lat/lng from College Scorecard API...")
    print("=" * 60)

    db = SessionLocal()
    client = ScorecardClient()

    # Get schools missing lat/lng
    schools = db.query(School).filter(
        (School.latitude.is_(None)) | (School.longitude.is_(None))
    ).all()

    if not schools:
        print("All schools already have lat/lng. Nothing to do.")
        return

    print(f"Found {len(schools)} schools missing lat/lng.")

    # Build a lookup of scorecard_id -> school
    scorecard_ids = {s.scorecard_id: s for s in schools if s.scorecard_id}

    # Fetch from Scorecard API in pages
    total_updated = 0

    def progress_callback(page, total, count):
        print(f"  Page {page}: fetched {count} records (total API records: {total})")

    raw_schools = await client.fetch_all_schools(max_pages=30, callback=progress_callback)

    for raw in raw_schools:
        sc_id = raw.get("id")
        if sc_id in scorecard_ids:
            lat = raw.get("location.lat")
            lon = raw.get("location.lon")
            if lat is not None and lon is not None:
                school = scorecard_ids[sc_id]
                school.latitude = lat
                school.longitude = lon
                total_updated += 1

    db.commit()
    db.close()
    print(f"\nUpdated {total_updated} schools with lat/lng coordinates.")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
