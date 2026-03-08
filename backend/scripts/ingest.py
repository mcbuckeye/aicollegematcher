#!/usr/bin/env python3
"""
Data ingestion script for College Scorecard API
Fetches ~2000 4-year colleges and loads into PostgreSQL
"""

import sys
import os
import asyncio

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine
from app.models import Base, School
from app.services.scorecard import ScorecardClient
from sqlalchemy.dialects.postgresql import insert

async def main():
    """Main ingestion function"""
    print("Starting College Scorecard data ingestion...")
    print("=" * 60)
    
    # Create tables if they don't exist
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Initialize client
    client = ScorecardClient()
    
    # Progress callback
    def progress_callback(page, total, count):
        print(f"Page {page}: Fetched {count} schools (total so far: {len(schools_data)})")
    
    # Fetch all schools from API
    print("\nFetching schools from College Scorecard API...")
    print("This may take a few minutes due to rate limiting...")
    
    raw_schools = await client.fetch_all_schools(max_pages=30, callback=progress_callback)
    
    if not raw_schools:
        print("ERROR: No schools fetched from API")
        return
    
    print(f"\nFetched {len(raw_schools)} raw schools from API")
    
    # Transform schools
    print("\nTransforming school data...")
    schools_data = []
    for raw in raw_schools:
        transformed = client.transform_school(raw)
        if transformed and transformed['name']:
            schools_data.append(transformed)
    
    print(f"Successfully transformed {len(schools_data)} schools")
    print("=" * 60)
    
    # Insert into database
    print("\nInserting schools into database...")
    db = SessionLocal()
    
    try:
        inserted = 0
        
        for school_data in schools_data:
            # Use upsert to handle duplicates
            stmt = insert(School).values(**school_data)
            stmt = stmt.on_conflict_do_update(
                index_elements=['scorecard_id'],
                set_=school_data
            )
            
            db.execute(stmt)
            inserted += 1
            
            if inserted % 100 == 0:
                print(f"Progress: {inserted}/{len(schools_data)} schools processed")
                db.commit()
        
        # Final commit
        db.commit()
        print(f"\n✅ Successfully inserted/updated {inserted} schools")
        
        # Print some statistics
        total = db.query(School).count()
        public = db.query(School).filter(School.type == 'public').count()
        private = db.query(School).filter(School.type == 'private').count()
        
        print("\nDatabase Statistics:")
        print(f"  Total schools: {total}")
        print(f"  Public: {public}")
        print(f"  Private: {private}")
        
        # Show some examples
        print("\nSample schools:")
        samples = db.query(School).order_by(School.name).limit(5).all()
        for school in samples:
            print(f"  - {school.name} ({school.city}, {school.state}) - {school.type}")
        
    except Exception as e:
        print(f"\n❌ Error during insertion: {e}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("✅ Ingestion complete!")

if __name__ == "__main__":
    asyncio.run(main())
