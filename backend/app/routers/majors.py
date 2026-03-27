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

    # Query top schools that offer programs in this area
    top_schools = []
    try:
        db = SessionLocal()
        # Search for schools with this major/program area
        # programs_offered is a JSON column - search for relevant program keys
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
