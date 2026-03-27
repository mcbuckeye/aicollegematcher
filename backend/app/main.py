from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import schools, assessment, leads, analytics, report, payments, chat, essay, financial_aid
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI College Matcher API",
    description="Backend API for AI-powered college matching",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5176",
        "http://127.0.0.1:5176"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(schools.router)
app.include_router(assessment.router)
app.include_router(leads.router)
app.include_router(analytics.router)
app.include_router(report.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(essay.router)
app.include_router(financial_aid.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI College Matcher API"}


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "AI College Matcher API",
        "docs": "/docs",
        "health": "/api/health"
    }
