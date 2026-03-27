def test_assessment_match(client, sample_schools):
    payload = {
        "grade": "junior",
        "gpa": "3.5-3.79",
        "test_scores": "sat-1200-1399",
        "major": "Computer Science",
        "school_size": "large",
        "distance": "anywhere",
        "priorities": ["academics", "outcomes", "cost"],
        "budget": "30k-50k",
        "must_haves": ["research"],
        "biggest_worry": "I'm worried about finding the right fit academically and socially.",
    }
    response = client.post("/api/assessment/match", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "readiness_score" in data
    assert 0 <= data["readiness_score"] <= 100
    assert "percentile" in data
    assert "top_matches" in data
    assert "strengths" in data
    assert "areas_to_improve" in data
    assert len(data["top_matches"]) > 0

    for match in data["top_matches"]:
        assert "school" in match
        assert "match_score" in match
        assert 0 <= match["match_score"] <= 100
        assert "reason" in match
        assert match["category"] in ["best-fit", "strong-match", "smart-reach", "hidden-gem"]


def test_assessment_minimal_input(client, sample_schools):
    payload = {
        "grade": "senior",
        "gpa": "3.0-3.49",
    }
    response = client.post("/api/assessment/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "readiness_score" in data
    assert len(data["top_matches"]) > 0


def test_assessment_with_email(client, sample_schools):
    payload = {
        "grade": "junior",
        "gpa": "3.8-4.0",
        "test_scores": "sat-1400+",
        "major": "Physics",
        "email": "test@example.com",
        "priorities": ["academics"],
        "must_haves": [],
    }
    response = client.post("/api/assessment/match", json=payload)
    assert response.status_code == 200
