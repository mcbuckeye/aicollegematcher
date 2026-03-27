"""Major Explorer API endpoints with AI disruption analysis."""

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from ..database import SessionLocal
from ..data.majors_ai_data import MAJORS_AI_DATA, get_major_slug, get_major_by_slug

router = APIRouter(prefix="/api/majors", tags=["majors"])


@router.get("/explorer")
def get_majors_explorer(
    sort: str = Query("ai_score", enum=["ai_score", "salary", "growth"]),
    category: str | None = Query(None),
):
    """Return all majors with AI disruption data, with optional sort and category filter."""
    results = []
    for name, data in MAJORS_AI_DATA.items():
        if category and data["category"].lower().replace(" & ", "-").replace(" ", "-") != category.lower():
            continue
        results.append({
            "name": name,
            "slug": get_major_slug(name),
            **data,
        })

    if sort == "ai_score":
        results.sort(key=lambda x: x["ai_disruption_score"], reverse=True)
    elif sort == "salary":
        results.sort(key=lambda x: x["median_salary"], reverse=True)
    elif sort == "growth":
        # Parse growth rate string to number for sorting
        def parse_growth(g: str) -> float:
            return float(g.replace("%", "").replace("+", ""))
        results.sort(key=lambda x: parse_growth(x["growth_rate"]), reverse=True)

    return {"majors": results, "total": len(results)}


@router.get("/{major_slug}/detail")
def get_major_detail(major_slug: str):
    """Return full detail for a single major including top schools."""
    result = get_major_by_slug(major_slug)
    if not result:
        raise HTTPException(status_code=404, detail="Major not found")

    name, data = result

    # Map major names to programs_offered JSONB keys
    MAJOR_TO_PROGRAM_KEY = {
        "computer science": "computer", "computer engineering": "computer",
        "engineering": "engineering", "mechanical engineering": "engineering",
        "civil engineering": "engineering", "chemical engineering": "engineering",
        "electrical engineering": "engineering", "aerospace engineering": "engineering",
        "biomedical engineering": "engineering", "industrial engineering": "engineering",
        "biology": "biological", "biochemistry": "biological", "animal science": "biological",
        "nursing": "health", "public health": "health", "pre-medicine": "health",
        "kinesiology": "health", "nutrition": "health",
        "business administration": "business_marketing", "marketing": "business_marketing",
        "finance": "business_marketing", "accounting": "business_marketing",
        "economics": "business_marketing", "entrepreneurship": "business_marketing",
        "psychology": "psychology",
        "education": "education", "special education": "education",
        "english": "english", "creative writing": "english",
        "history": "history",
        "mathematics": "mathematics", "statistics": "mathematics",
        "physics": "physical_science", "chemistry": "physical_science",
        "environmental science": "physical_science",
        "political science": "social_science", "sociology": "social_science",
        "anthropology": "social_science", "international relations": "social_science",
        "criminal justice": "security_law_enforcement", "pre-law": "security_law_enforcement",
        "communications": "communication", "journalism": "communication",
        "public relations": "communication",
        "graphic design": "visual_performing", "film": "visual_performing",
        "music": "visual_performing", "theater": "visual_performing",
        "art history": "visual_performing", "fine arts": "visual_performing",
        "photography": "visual_performing",
        "architecture": "architecture",
        "foreign languages": "language", "linguistics": "language",
        "philosophy": "philosophy_religious", "religious studies": "philosophy_religious",
        "agriculture": "agriculture", "natural resources": "resources",
        "social work": "public_administration_social_service",
    }
    
    program_key = MAJOR_TO_PROGRAM_KEY.get(name.lower())
    
    # Query top schools that offer programs in this area
    top_schools = []
    try:
        db = SessionLocal()
        if program_key:
            query = text("""
                SELECT id, name, city, state, graduation_rate, enrollment, tuition, type
                FROM schools
                WHERE programs_offered ? :pkey
                  AND graduation_rate IS NOT NULL
                ORDER BY graduation_rate DESC
                LIMIT 10
            """)
            rows = db.execute(query, {"pkey": program_key}).fetchall()
        else:
            query = text("""
                SELECT id, name, city, state, graduation_rate, enrollment, tuition, type
                FROM schools
                WHERE graduation_rate IS NOT NULL
                ORDER BY graduation_rate DESC
                LIMIT 10
            """)
            rows = db.execute(query).fetchall()
        for row in rows:
            top_schools.append({
                "id": row[0],
                "name": row[1],
                "city": row[2],
                "state": row[3],
                "graduation_rate": row[4],
                "enrollment": row[5],
                "tuition": row[6],
                "type": row[7],
            })
        db.close()
    except Exception:
        # If DB isn't available, return empty list
        pass

    return {
        "name": name,
        "slug": get_major_slug(name),
        **data,
        "top_schools": top_schools,
    }
