# AI College Matcher - Full-Stack Application

A full-stack college matching application that helps students find their perfect college fit using AI-powered assessment and real data from the US Department of Education's College Scorecard API.

## 🎯 Features

- **Personalized Assessment**: 10-question assessment analyzing academic readiness, preferences, and goals
- **AI-Powered Matching**: Sophisticated matching algorithm scoring schools across 6 dimensions
- **Real College Data**: ~2000 4-year institutions from College Scorecard API
- **Browse & Search**: Comprehensive school directory with filters (state, type, region, acceptance rate)
- **Responsive Design**: Mobile-first UI built with React + Tailwind CSS
- **RESTful API**: FastAPI backend with PostgreSQL database

## 🏗️ Architecture

### Backend (`/backend/`)
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy with asyncpg
- **API**: RESTful endpoints for schools and assessment

### Frontend (`/`)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Animation**: Framer Motion

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- PostgreSQL 16+
- Node.js 25+

### Backend Setup

```bash
cd backend

# Create virtual environment
python3.13 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SCORECARD_API_KEY

# Create database (if not exists)
createdb aicollegematcher

# Run data ingestion (optional - takes ~3 hours with DEMO_KEY due to rate limits)
python scripts/ingest.py

# Start backend server
uvicorn app.main:app --port 8003 --reload
```

Backend will be available at: http://localhost:8003

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be available at: http://localhost:5176 (or next available port)

## 📡 API Endpoints

### Schools
- `GET /api/schools` - List/search schools with filters
  - Query params: `q`, `state`, `type`, `region`, `min_acceptance`, `max_acceptance`, `limit`, `offset`
- `GET /api/schools/{id}` - Get single school by ID
- `GET /api/schools/stats` - Get aggregate statistics

### Assessment
- `POST /api/assessment/match` - Submit assessment and get personalized matches
  - Request body: Assessment answers
  - Response: Readiness score, top 10 matches, strengths, areas to improve

### Health
- `GET /api/health` - Health check

API documentation available at: http://localhost:8003/docs

## 🎓 Matching Engine

The matching algorithm evaluates students across 6 weighted dimensions:

1. **Academic Fit (30%)** - GPA and test score alignment
2. **Cost Fit (20%)** - Budget vs. net cost (tuition - financial aid)
3. **Size Fit (15%)** - School size preference
4. **Features Fit (15%)** - Must-have features (research, sports, etc.)
5. **Priority Alignment (10%)** - Top 5 priorities
6. **Major Fit (10%)** - Program strength in chosen field

Match categories:
- **Best Fit**: High match score, student within range
- **Strong Match**: Good match score
- **Smart Reach**: Below typical stats but still good match
- **Hidden Gem**: Solid match with >40% acceptance rate

## 📊 Database Schema

```sql
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  scorecard_id INTEGER UNIQUE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  type VARCHAR(10),              -- 'public' | 'private'
  setting VARCHAR(10),            -- 'urban' | 'suburban' | 'rural'
  size VARCHAR(10),               -- 'small' | 'medium' | 'large'
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
  features TEXT[],
  majors_strength TEXT[],
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🗂️ Project Structure

```
/tmp/aicollegematcher-fullstack/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection
│   │   ├── routers/
│   │   │   ├── schools.py       # School CRUD endpoints
│   │   │   └── assessment.py    # Matching endpoint
│   │   └── services/
│   │       ├── matching.py      # Matching algorithm
│   │       └── scorecard.py     # College Scorecard API client
│   ├── scripts/
│   │   └── ingest.py            # Data ingestion script
│   ├── requirements.txt
│   └── .env
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── AssessmentPage.tsx
│   │   └── SchoolsPage.tsx      # Browse schools
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ScoreGauge.tsx
│   ├── services/
│   │   └── api.ts               # API client
│   └── data/
│       ├── assessmentQuestions.ts
│       └── majors.ts
├── package.json
└── README.md
```

## 🔑 Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://user@localhost/aicollegematcher
SCORECARD_API_KEY=DEMO_KEY
```

### Frontend (`.env.local`)
```
VITE_API_URL=http://localhost:8003/api
```

## 📝 Data Ingestion

The ingestion script fetches real data from the College Scorecard API:

```bash
cd backend
source venv/bin/activate
python scripts/ingest.py
```

**Note**: Using `DEMO_KEY` has a 10 requests/hour limit. Fetching ~2000 schools takes approximately 3 hours. For faster ingestion, sign up for a free API key at https://api.data.gov/signup/

The script includes:
- Rate limit handling with exponential backoff
- Progress tracking
- Idempotent upsert (safe to re-run)
- Data transformation and validation

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:8003/api/health

# Get school stats
curl http://localhost:8003/api/schools/stats

# Search schools
curl "http://localhost:8003/api/schools?q=harvard&limit=5"

# Submit assessment
curl -X POST http://localhost:8003/api/assessment/match \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "senior",
    "gpa": "3.8-4.0",
    "test_scores": "sat-1400+",
    "major": "Computer Science",
    "school_size": "medium",
    "priorities": ["academics", "outcomes"],
    "budget": "50k+",
    "must_haves": ["research"]
  }'
```

## 🚀 Current Status

✅ **Completed:**
- FastAPI backend with PostgreSQL integration
- SQLAlchemy models and Pydantic schemas
- Matching engine ported from TypeScript to Python
- College Scorecard API client with rate limiting
- Data ingestion script
- RESTful API endpoints (schools, assessment, health)
- React frontend with Tailwind CSS
- Assessment flow with API integration
- Browse schools page with search and filters
- CORS configuration
- API client service

🏃 **Running:**
- Backend: http://localhost:8003
- Frontend: http://localhost:5176
- Database: 10 schools loaded (sample data)

📋 **Next Steps:**
- Run full data ingestion with proper API key for ~2000 schools
- Add individual school detail page (`/schools/:id`)
- Add tests for matching engine and API endpoints
- Deploy to MachomeLab via Dokploy

## 📦 Deployment

For production deployment to MachomeLab:

1. Set up proper environment variables
2. Configure PostgreSQL on production
3. Run data ingestion on production database
4. Use Dokploy to containerize and deploy both frontend and backend
5. Set up Traefik for routing and SSL

## 🤝 Contributing

This project was built as a subagent task for Steve. For questions or modifications, contact the main agent.

## 📄 License

Private project - all rights reserved.
