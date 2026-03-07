# AI College Matcher — Full-Stack Rebuild PRD

## Overview
Convert the existing frontend-only React college matcher into a full-stack application with FastAPI backend, PostgreSQL database, and React/Vite frontend. The backend will ingest data from the US Department of Education's College Scorecard API (~2000 4-year institutions) and serve it via REST endpoints.

## Tech Stack
- **Backend:** FastAPI (Python 3.14), SQLAlchemy, asyncpg
- **Database:** PostgreSQL 
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS (existing, needs API integration)
- **No Docker** on this machine — run backend directly

## Architecture

### Backend (`/backend/`)
```
backend/
  app/
    main.py          # FastAPI app, CORS, routes
    models.py        # SQLAlchemy models
    schemas.py       # Pydantic schemas
    database.py      # DB connection
    routers/
      schools.py     # School CRUD + search + matching
      assessment.py  # Assessment submission + matching engine
    services/
      matching.py    # Matching algorithm (port from frontend)
      scorecard.py   # College Scorecard API ingestion
  scripts/
    ingest.py        # One-time data ingestion script
  requirements.txt
  alembic.ini        # DB migrations
```

### Database Schema
```sql
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  scorecard_id INTEGER UNIQUE,     -- College Scorecard ID
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  type VARCHAR(10),                -- 'public' or 'private'
  setting VARCHAR(10),             -- 'urban', 'suburban', 'rural'
  size VARCHAR(10),                -- 'small', 'medium', 'large'
  enrollment INTEGER,
  acceptance_rate FLOAT,
  sat_range_low INTEGER,
  sat_range_high INTEGER,
  act_range_low INTEGER,
  act_range_high INTEGER,
  avg_gpa FLOAT,
  tuition INTEGER,
  room_and_board INTEGER,
  avg_financial_aid INTEGER,
  graduation_rate INTEGER,
  retention_rate INTEGER,
  median_earnings_10yr INTEGER,
  student_faculty_ratio INTEGER,
  region VARCHAR(20),
  hbcu BOOLEAN DEFAULT FALSE,
  religious_affiliation BOOLEAN DEFAULT FALSE,
  features TEXT[],                 -- Array of feature tags
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schools_state ON schools(state);
CREATE INDEX idx_schools_type ON schools(type);
CREATE INDEX idx_schools_acceptance_rate ON schools(acceptance_rate);
CREATE INDEX idx_schools_name_trgm ON schools USING gin(name gin_trgm_ops);
```

### API Endpoints
```
GET  /api/schools                    # List/search schools
  ?q=harvard                         # Text search
  ?state=MA                          # Filter by state
  ?type=public                       # Filter by type
  ?min_acceptance=0&max_acceptance=50 # Acceptance rate range
  ?region=northeast                  # Filter by region
  ?limit=50&offset=0                 # Pagination

GET  /api/schools/{id}               # Get school details
GET  /api/schools/stats              # Aggregate stats (total count, avg stats)
POST /api/assessment/match           # Submit assessment, get matched schools
GET  /api/health                     # Health check
```

### Data Ingestion (`scripts/ingest.py`)
- Fetch from College Scorecard API: `https://api.data.gov/ed/collegescorecard/v1/schools.json`
- Filter: `school.degrees_awarded.predominant=3` (4-year bachelor's institutions)
- Use API key from env var `SCORECARD_API_KEY` (fall back to `DEMO_KEY`)
- Paginate through all results (100 per page, ~20 pages)
- Add 0.5s delay between requests to respect rate limits
- Transform and insert into PostgreSQL
- Should be idempotent (upsert on scorecard_id)

### Matching Engine (port from frontend)
Port the existing `matchingEngine.ts` logic to Python:
- Score schools based on assessment answers
- Weight categories: academics (30%), cost (25%), environment (20%), outcomes (15%), features (10%)
- Return top 10 matches with scores + reasons
- Support "hidden gem" identification (high value, lower acceptance rate)

### Frontend Changes
- Replace static `schools.ts` import with API calls
- Add a `/schools` browse page with search, filters, and pagination
- Add individual school detail page at `/schools/:id`
- Keep existing assessment flow but POST results to backend
- Keep existing landing page (already fixed)
- Add loading states and error handling

### Search/Browse Page (`/schools`)
- Search bar with instant search (debounced 300ms)
- Filter sidebar: state dropdown, type (public/private), region, acceptance rate range, size
- Results grid showing school cards with key stats
- Pagination
- Sort by: name, acceptance rate, tuition, earnings

## PostgreSQL Setup
Use the existing PostgreSQL on this machine. Create database `aicollegematcher`:
```bash
createdb aicollegematcher
```

## Environment Variables
```
DATABASE_URL=postgresql://kayleighbot@localhost/aicollegematcher
SCORECARD_API_KEY=DEMO_KEY
```

## Key Constraints
- No Docker on this machine — run FastAPI with uvicorn directly
- No fake data or testimonials
- All school data from College Scorecard API (real government data)
- TDD: write tests for the matching engine and API endpoints
- Frontend must be mobile responsive
- The existing landing page and assessment flow should be preserved

## Deployment
This will eventually deploy to MachomeLab via Dokploy, but for now just get it running locally:
- Backend: `uvicorn app.main:app --port 8002`  
- Frontend: `npm run dev` (proxied to backend)

## Success Criteria
1. `scripts/ingest.py` successfully loads ~1900+ schools from College Scorecard
2. `/api/schools?q=harvard` returns Harvard University with real data
3. Assessment flow produces personalized matches from the full database
4. Browse page lets users search/filter all schools
5. All tests pass
