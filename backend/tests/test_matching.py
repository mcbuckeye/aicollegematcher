"""Unit tests for the matching engine."""
from app.services.matching import (
    ParsedAnswers,
    calculate_readiness_score,
    score_academic_fit,
    score_size_fit,
    score_budget_fit,
    score_features_fit,
    score_priority_alignment,
    score_major_fit,
    compute_school_match_score,
    categorize_match,
    generate_results,
    select_top_matches,
    student_gpa_midpoint,
    student_sat_estimate,
    budget_max,
)


SAMPLE_SCHOOL = {
    "id": 1,
    "name": "Test University",
    "type": "public",
    "size": "large",
    "setting": "urban",
    "enrollment": 30000,
    "acceptance_rate": 45.0,
    "sat_range_low": 1100,
    "sat_range_high": 1350,
    "avg_gpa": 3.5,
    "tuition": 15000,
    "room_and_board": 12000,
    "avg_financial_aid": 8000,
    "graduation_rate": 85,
    "retention_rate": 90,
    "median_earnings_10yr": 65000,
    "student_faculty_ratio": 18,
    "region": "west",
    "features": ["research", "d1-sports", "urban"],
    "majors_strength": ["Computer Science", "Engineering", "Business"],
    "description": "A leading public research university.",
    "latitude": 34.0,
    "longitude": -118.0,
}


# --- Readiness Score ---

def test_readiness_score_high_achiever():
    a = ParsedAnswers({
        "grade": "senior",
        "gpa": "3.8-4.0",
        "test_scores": "sat-1400+",
        "major": "Computer Science",
        "priorities": ["academics", "outcomes", "cost", "campus", "location"],
        "biggest_worry": "I want to make sure I choose a school that is the best fit for my career goals.",
        "must_haves": ["research"],
    })
    score = calculate_readiness_score(a)
    assert score >= 85


def test_readiness_score_minimal():
    a = ParsedAnswers({})
    score = calculate_readiness_score(a)
    assert 0 <= score <= 100


def test_readiness_score_low_input():
    a = ParsedAnswers({"grade": "freshman", "gpa": "below-2.5"})
    score = calculate_readiness_score(a)
    assert score < 40


# --- Helper functions ---

def test_gpa_midpoints():
    assert student_gpa_midpoint("3.8-4.0") == 3.9
    assert student_gpa_midpoint("below-2.5") == 2.2
    assert student_gpa_midpoint(None) == 3.0


def test_sat_estimates():
    assert student_sat_estimate("sat-1400+") == 1450
    assert student_sat_estimate("act-30+") == 1400
    assert student_sat_estimate("not-yet") is None
    assert student_sat_estimate(None) is None


def test_budget_max():
    assert budget_max("under-15k") == 15000
    assert budget_max("50k+") == 80000
    assert budget_max("unsure") is None
    assert budget_max(None) is None


# --- Individual scoring functions ---

def test_academic_fit_good_match():
    score = score_academic_fit(SAMPLE_SCHOOL, "3.5-3.79", "sat-1200-1399")
    assert score >= 70


def test_academic_fit_below_range():
    score = score_academic_fit(SAMPLE_SCHOOL, "below-2.5", "sat-below-1000")
    assert score < 50


def test_academic_fit_above_range():
    score = score_academic_fit(SAMPLE_SCHOOL, "3.8-4.0", "sat-1400+")
    assert score >= 50  # overqualified but still scored


def test_size_fit_match():
    assert score_size_fit(SAMPLE_SCHOOL, "large") == 100


def test_size_fit_no_preference():
    assert score_size_fit(SAMPLE_SCHOOL, "no-preference") == 80


def test_size_fit_mismatch():
    assert score_size_fit(SAMPLE_SCHOOL, "small") < 50


def test_budget_fit_affordable():
    score = score_budget_fit(SAMPLE_SCHOOL, "15k-30k")
    assert score >= 50  # net cost = 15k-8k = 7k, fits in 15-30k


def test_budget_fit_too_expensive():
    expensive_school = {**SAMPLE_SCHOOL, "tuition": 60000, "avg_financial_aid": 5000}
    score = score_budget_fit(expensive_school, "under-15k")
    assert score < 30


def test_budget_fit_unsure():
    assert score_budget_fit(SAMPLE_SCHOOL, "unsure") == 70


def test_features_match():
    score = score_features_fit(SAMPLE_SCHOOL, ["research", "d1-sports"])
    assert score == 100


def test_features_partial():
    score = score_features_fit(SAMPLE_SCHOOL, ["research", "greek-life"])
    assert score == 50


def test_features_none_wanted():
    assert score_features_fit(SAMPLE_SCHOOL, []) == 75


def test_priority_alignment():
    score = score_priority_alignment(SAMPLE_SCHOOL, ["academics", "outcomes"])
    assert score > 50


def test_priority_empty():
    assert score_priority_alignment(SAMPLE_SCHOOL, []) == 60


def test_major_fit_exact():
    assert score_major_fit(SAMPLE_SCHOOL, "Computer Science") == 100


def test_major_fit_partial():
    assert score_major_fit(SAMPLE_SCHOOL, "Computer Engineering") == 85


def test_major_fit_no_match():
    score = score_major_fit(SAMPLE_SCHOOL, "Dance")
    assert score < 50


def test_major_fit_none():
    assert score_major_fit(SAMPLE_SCHOOL, None) == 60


# --- Composite scoring ---

def test_compute_school_match_score():
    a = ParsedAnswers({
        "gpa": "3.5-3.79",
        "test_scores": "sat-1200-1399",
        "school_size": "large",
        "budget": "15k-30k",
        "must_haves": ["research"],
        "priorities": ["academics", "outcomes"],
        "major": "Computer Science",
    })
    score = compute_school_match_score(SAMPLE_SCHOOL, a)
    assert 0 <= score <= 100
    assert score > 60  # should be a decent match


# --- Categorization ---

def test_categorize_best_fit():
    a = ParsedAnswers({"gpa": "3.5-3.79", "test_scores": "sat-1200-1399"})
    cat = categorize_match(90, SAMPLE_SCHOOL, a)
    assert cat == "best-fit"


def test_categorize_smart_reach():
    a = ParsedAnswers({"gpa": "below-2.5", "test_scores": "sat-below-1000"})
    cat = categorize_match(50, SAMPLE_SCHOOL, a)
    assert cat == "smart-reach"


def test_categorize_hidden_gem():
    school = {**SAMPLE_SCHOOL, "acceptance_rate": 60.0}
    a = ParsedAnswers({"gpa": "3.5-3.79", "test_scores": "sat-1200-1399"})
    cat = categorize_match(65, school, a)
    assert cat == "hidden-gem"


# --- Full pipeline ---

def test_generate_results():
    schools = [SAMPLE_SCHOOL]
    answers = {
        "grade": "junior",
        "gpa": "3.5-3.79",
        "test_scores": "sat-1200-1399",
        "major": "Engineering",
        "school_size": "large",
        "priorities": ["academics", "cost"],
        "budget": "15k-30k",
        "must_haves": ["research"],
    }
    results = generate_results(answers, schools)
    assert "readiness_score" in results
    assert "percentile" in results
    assert "top_matches" in results
    assert "strengths" in results
    assert "areas_to_improve" in results
    assert len(results["top_matches"]) == 1


def test_select_top_matches_limit():
    matches = [
        {"school": {"name": f"School {i}"}, "match_score": 90 - i, "category": "strong-match"}
        for i in range(20)
    ]
    selected = select_top_matches(matches, limit=5)
    assert len(selected) == 5
    assert selected[0]["match_score"] >= selected[-1]["match_score"]


def test_select_top_matches_diversity():
    matches = [
        {"school": {"name": "A"}, "match_score": 95, "category": "best-fit"},
        {"school": {"name": "B"}, "match_score": 90, "category": "best-fit"},
        {"school": {"name": "C"}, "match_score": 85, "category": "strong-match"},
        {"school": {"name": "D"}, "match_score": 60, "category": "hidden-gem"},
        {"school": {"name": "E"}, "match_score": 55, "category": "smart-reach"},
    ]
    selected = select_top_matches(matches, limit=4)
    categories = {m["category"] for m in selected}
    # Should include diverse categories
    assert len(categories) >= 2
