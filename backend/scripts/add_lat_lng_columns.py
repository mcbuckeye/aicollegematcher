#!/usr/bin/env python3
"""
Migration script: add latitude and longitude columns to the schools table.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import engine
from sqlalchemy import text


def main():
    print("Adding latitude and longitude columns to schools table...")
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'schools' AND column_name IN ('latitude', 'longitude')"
        ))
        existing = {row[0] for row in result}

        if 'latitude' not in existing:
            conn.execute(text("ALTER TABLE schools ADD COLUMN latitude DOUBLE PRECISION"))
            print("  Added 'latitude' column")
        else:
            print("  'latitude' column already exists")

        if 'longitude' not in existing:
            conn.execute(text("ALTER TABLE schools ADD COLUMN longitude DOUBLE PRECISION"))
            print("  Added 'longitude' column")
        else:
            print("  'longitude' column already exists")

        conn.commit()
    print("Done.")


if __name__ == "__main__":
    main()
