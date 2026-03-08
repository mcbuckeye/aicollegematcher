#!/bin/bash
set -e

echo "Waiting for database..."
python -c "
import time, os
from sqlalchemy import create_engine, text
url = os.environ.get('DATABASE_URL', '')
for i in range(30):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        print('Database ready!')
        break
    except Exception as e:
        print(f'Waiting for DB... ({i+1}/30)')
        time.sleep(2)
else:
    print('Database connection failed after 60s')
    exit(1)
"

echo "Creating tables..."
python -c "
from app.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
print('Tables created.')
"

echo "Seeding database..."
python scripts/seed_comprehensive.py || echo "Seed script failed, continuing..."

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
