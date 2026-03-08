"""
Matching engine ported from TypeScript matchingEngine.ts
Scores schools based on student assessment responses
"""
from typing import List, Dict, Any, Optional, Literal
import math
import random

import pgeocode


def _get(d: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Like dict.get but also returns default when value is None."""
    v = d.get(key, default)
    return default if v is None else v


GpaRange = Literal['3.8-4.0', '3.5-3.79', '3.0-3.49', '2.5-2.99', 'below-2.5', 'unknown']
TestScore = Literal['sat-1400+', 'sat-1200-1399', 'sat-1000-1199', 'sat-below-1000', 
                     'act-30+', 'act-24-29', 'act-below-24', 'not-yet', 'test-optional']
Grade = Literal['freshman', 'sophomore', 'junior', 'senior', 'gap']
SchoolSize = Literal['small', 'medium', 'large', 'no-preference']
Budget = Literal['under-15k', '15k-30k', '30k-50k', '50k+', 'unsure']
Priority = Literal['academics', 'cost', 'campus', 'location', 'outcomes']
Feature = Literal['d1-sports', 'greek-life', 'research', 'coop', 'urban', 'rural', 
                   'religious', 'diversity', 'study-abroad', 'honors']


class ParsedAnswers:
    def __init__(self, answers: Dict[str, Any]):
        self.grade: Optional[Grade] = answers.get('grade')
        self.gpa: Optional[GpaRange] = answers.get('gpa')
        self.test_scores: Optional[TestScore] = answers.get('test_scores') or answers.get('testScores')
        self.major: Optional[str] = answers.get('major')
        self.school_size: Optional[SchoolSize] = answers.get('school_size') or answers.get('schoolSize')
        self.distance: Optional[str] = answers.get('distance')
        self.priorities: List[Priority] = answers.get('priorities', [])
        self.budget: Optional[Budget] = answers.get('budget')
        self.must_haves: List[Feature] = answers.get('must_haves', []) or answers.get('mustHaves', [])
        self.biggest_worry: Optional[str] = answers.get('biggest_worry') or answers.get('biggestWorry')
        self.zip_code: Optional[str] = answers.get('zip_code') or answers.get('zipCode')


def calculate_readiness_score(a: ParsedAnswers) -> int:
    """Calculate student readiness score (0-100)"""
    score = 0

    # GPA: 30 points
    gpa_scores = {
        '3.8-4.0': 30,
        '3.5-3.79': 24,
        '3.0-3.49': 16,
        '2.5-2.99': 8,
        'below-2.5': 3,
    }
    score += gpa_scores.get(a.gpa, 3)

    # Test scores: 20 points
    test_scores_map = {
        'sat-1400+': 20, 'act-30+': 20,
        'sat-1200-1399': 14, 'act-24-29': 14,
        'sat-1000-1199': 7, 'sat-below-1000': 7, 'act-below-24': 7,
        'not-yet': 10, 'test-optional': 10,
    }
    score += test_scores_map.get(a.test_scores, 7)

    # Grade: 15 points
    grade_scores = {
        'senior': 15, 'gap': 15,
        'junior': 12,
        'sophomore': 8,
        'freshman': 5,
    }
    score += grade_scores.get(a.grade, 8)

    # Priorities clarity: 10 points
    if len(a.priorities) >= 5:
        score += 10
    elif len(a.priorities) >= 3:
        score += 6
    else:
        score += 2

    # Self-awareness: 10 points
    if a.biggest_worry and len(a.biggest_worry.strip()) > 20:
        score += 10
    elif a.biggest_worry and len(a.biggest_worry.strip()) > 0:
        score += 5

    # Exploration: 15 points
    if a.major and len(a.major) > 0:
        score += 12
    if len(a.must_haves) > 0:
        score += 3

    return min(100, max(0, score))


def student_gpa_midpoint(gpa: Optional[GpaRange]) -> float:
    """Convert GPA range to midpoint value"""
    gpa_map = {
        '3.8-4.0': 3.9,
        '3.5-3.79': 3.65,
        '3.0-3.49': 3.25,
        '2.5-2.99': 2.75,
        'below-2.5': 2.2,
    }
    return gpa_map.get(gpa, 3.0)


def student_sat_estimate(test_scores: Optional[TestScore]) -> Optional[int]:
    """Convert test score range to estimated SAT"""
    sat_map = {
        'sat-1400+': 1450,
        'sat-1200-1399': 1300,
        'sat-1000-1199': 1100,
        'sat-below-1000': 950,
        'act-30+': 1400,
        'act-24-29': 1250,
        'act-below-24': 1050,
    }
    return sat_map.get(test_scores)


def budget_max(budget: Optional[Budget]) -> Optional[int]:
    """Convert budget range to max value"""
    budget_map = {
        'under-15k': 15000,
        '15k-30k': 30000,
        '30k-50k': 50000,
        '50k+': 80000,
    }
    return budget_map.get(budget)


def score_academic_fit(school: Dict[str, Any], gpa: Optional[GpaRange], 
                       test_scores: Optional[TestScore]) -> float:
    """Score academic fit based on GPA and test scores"""
    student_gpa = student_gpa_midpoint(gpa)
    school_gpa = _get(school, 'avg_gpa', 3.0)
    gpa_diff = student_gpa - school_gpa

    # GPA score
    if abs(gpa_diff) <= 0.15:
        gpa_score = 100
    elif gpa_diff > 0.15:
        gpa_score = max(50, 100 - (gpa_diff - 0.15) * 80)
    else:
        gpa_score = max(10, 100 + (gpa_diff + 0.15) * 120)

    # Test score
    student_sat = student_sat_estimate(test_scores)
    test_score = 70
    if student_sat is not None:
        sat_low = _get(school, 'sat_range_low', 1000)
        sat_high = _get(school, 'sat_range_high', 1200)
        school_sat_mid = (sat_low + sat_high) / 2
        sat_diff = student_sat - school_sat_mid
        
        if abs(sat_diff) <= 50:
            test_score = 100
        elif sat_diff > 50:
            test_score = max(50, 100 - (sat_diff - 50) * 0.15)
        else:
            test_score = max(10, 100 + (sat_diff + 50) * 0.25)

    return gpa_score * 0.55 + test_score * 0.45


def score_size_fit(school: Dict[str, Any], school_size: Optional[SchoolSize]) -> float:
    """Score school size preference match"""
    if not school_size or school_size == 'no-preference':
        return 80
    
    if _get(school, 'size') == school_size:
        return 100
    
    size_order = {'small': 0, 'medium': 1, 'large': 2}
    school_size_val = size_order.get(_get(school, 'size', 'medium'), 1)
    pref_size_val = size_order.get(school_size, 1)
    diff = abs(school_size_val - pref_size_val)
    
    return 50 if diff == 1 else 20


def score_budget_fit(school: Dict[str, Any], budget: Optional[Budget]) -> float:
    """Score budget fit based on net cost"""
    max_budget = budget_max(budget)
    if max_budget is None:
        return 70
    
    tuition = _get(school, 'tuition', 0)
    fin_aid = _get(school, 'avg_financial_aid', 0)
    net_cost = tuition - fin_aid
    
    if net_cost <= max_budget:
        return 100
    
    overage = net_cost - max_budget
    if overage < 5000:
        return 75
    elif overage < 15000:
        return 50
    elif overage < 30000:
        return 25
    return 10


def score_features_fit(school: Dict[str, Any], must_haves: List[Feature]) -> float:
    """Score feature match (must-haves)"""
    if not must_haves:
        return 75
    
    school_features = _get(school, 'features', [])
    matches = sum(1 for feature in must_haves if feature in school_features)
    return round((matches / len(must_haves)) * 100)


def score_priority_alignment(school: Dict[str, Any], priorities: List[Priority]) -> float:
    """Score alignment with student priorities"""
    if not priorities:
        return 60
    
    score = 0
    total_weight = 0

    for index, priority in enumerate(priorities):
        weight = len(priorities) - index
        total_weight += weight
        dim_score = 50

        if priority == 'academics':
            grad_rate = _get(school, 'graduation_rate', 0)
            if grad_rate >= 90:
                dim_score = 100
            elif grad_rate >= 80:
                dim_score = 75
            elif grad_rate >= 70:
                dim_score = 50
            else:
                dim_score = 30
        
        elif priority == 'cost':
            tuition = _get(school, 'tuition', 0)
            fin_aid = _get(school, 'avg_financial_aid', 0)
            net_cost = tuition - fin_aid
            if net_cost < 15000:
                dim_score = 100
            elif net_cost < 25000:
                dim_score = 80
            elif net_cost < 35000:
                dim_score = 55
            elif net_cost < 45000:
                dim_score = 30
            else:
                dim_score = 15
        
        elif priority == 'campus':
            features = _get(school, 'features', [])
            if 'd1-sports' in features or 'greek-life' in features:
                dim_score = 90
            else:
                dim_score = 50
        
        elif priority == 'location':
            setting = _get(school, 'setting', '')
            if setting == 'urban':
                dim_score = 85
            elif setting == 'suburban':
                dim_score = 75
            else:
                dim_score = 55
        
        elif priority == 'outcomes':
            earnings = _get(school, 'median_earnings_10yr', 0)
            if earnings >= 75000:
                dim_score = 100
            elif earnings >= 60000:
                dim_score = 75
            elif earnings >= 50000:
                dim_score = 50
            else:
                dim_score = 30

        score += dim_score * weight

    return round(score / total_weight)


_nomi = pgeocode.Nominatim('us')


def zip_to_coords(zip_code: str) -> Optional[tuple]:
    """Convert US zip code to (latitude, longitude) using pgeocode."""
    result = _nomi.query_postal_code(zip_code)
    if result is not None and not math.isnan(result.latitude):
        return (result.latitude, result.longitude)
    return None


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in miles between two lat/lng points."""
    R = 3958.8  # Earth radius in miles
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def score_distance(school: Dict[str, Any], a: 'ParsedAnswers') -> float:
    """Score distance fit based on student zip code and distance preference."""
    if not a.zip_code:
        return 70  # neutral if no zip provided

    student_coords = zip_to_coords(a.zip_code)
    if student_coords is None:
        return 70

    school_lat = _get(school, 'latitude')
    school_lon = _get(school, 'longitude')
    if school_lat is None or school_lon is None:
        return 70

    miles = _haversine_miles(student_coords[0], student_coords[1], school_lat, school_lon)
    pref = a.distance

    if pref == 'commute':
        if miles < 50:
            return 100
        elif miles < 100:
            return 60
        else:
            return 20
    elif pref == 'nearby':
        if miles < 200:
            return 100
        elif miles < 400:
            return 70
        else:
            return 30
    elif pref == 'anywhere':
        # Slight bonus for closer schools, but always 80+
        return max(80, round(100 - miles / 100))
    elif pref == 'international':
        return 70
    else:
        # No distance preference set
        return 70


def score_major_fit(school: Dict[str, Any], major: Optional[str]) -> float:
    """Score major program strength match"""
    if not major or len(major) == 0:
        return 60

    major_lower = major.lower()
    majors_strength = _get(school, 'majors_strength', [])

    # Exact match
    for m in majors_strength:
        if m.lower() == major_lower:
            return 100

    # Partial match
    for m in majors_strength:
        m_lower = m.lower()
        if major_lower in m_lower or m_lower in major_lower:
            return 85

    # Word match
    major_words = major_lower.split()
    for m in majors_strength:
        m_lower = m.lower()
        for word in major_words:
            if len(word) > 3 and word in m_lower:
                return 70

    return 35


def is_student_below_range(school: Dict[str, Any], gpa: Optional[GpaRange], 
                           test_scores: Optional[TestScore]) -> bool:
    """Check if student is below school's typical range"""
    student_gpa = student_gpa_midpoint(gpa)
    student_sat = student_sat_estimate(test_scores)

    school_gpa = _get(school, 'avg_gpa', 3.0)
    gpa_below_range = student_gpa < school_gpa - 0.3

    sat_below_range = False
    if student_sat is not None:
        sat_low = _get(school, 'sat_range_low', 1000)
        sat_below_range = student_sat < sat_low - 50

    return gpa_below_range or sat_below_range


def compute_school_match_score(school: Dict[str, Any], a: ParsedAnswers) -> int:
    """Compute overall match score for a school"""
    academic = score_academic_fit(school, a.gpa, a.test_scores)
    size = score_size_fit(school, a.school_size)
    budget = score_budget_fit(school, a.budget)
    features = score_features_fit(school, a.must_haves)
    priority = score_priority_alignment(school, a.priorities)
    major = score_major_fit(school, a.major)
    dist = score_distance(school, a)

    weighted = (
        academic * 0.25 +
        size * 0.10 +
        budget * 0.20 +
        features * 0.10 +
        priority * 0.10 +
        major * 0.10 +
        dist * 0.15
    )

    return round(min(100, max(0, weighted)))


def categorize_match(match_score: int, school: Dict[str, Any], 
                     a: ParsedAnswers) -> Literal['best-fit', 'strong-match', 'smart-reach', 'hidden-gem']:
    """Categorize the match type"""
    below_range = is_student_below_range(school, a.gpa, a.test_scores)

    if below_range:
        return 'smart-reach'
    if match_score > 85:
        return 'best-fit'
    if match_score > 70:
        return 'strong-match'
    
    acceptance_rate = _get(school, 'acceptance_rate', 100)
    if acceptance_rate > 40:
        return 'hidden-gem'

    return 'strong-match'


def generate_reason(school: Dict[str, Any], a: ParsedAnswers) -> str:
    """Generate personalized match reason"""
    reasons = []

    # Major match
    if a.major:
        major_lower = a.major.lower()
        majors_strength = _get(school, 'majors_strength', [])
        has_major_match = any(
            major_lower in m.lower() or m.lower() in major_lower
            for m in majors_strength
        )
        if has_major_match:
            reasons.append(f"strong {a.major} program")

    # Budget fit
    max_budget = budget_max(a.budget)
    if max_budget is not None:
        tuition = _get(school, 'tuition', 0)
        fin_aid = _get(school, 'avg_financial_aid', 0)
        net_cost = tuition - fin_aid
        if net_cost <= max_budget:
            reasons.append('fits within your budget with financial aid')

    # Features
    feature_labels = {
        'd1-sports': 'Division I athletics',
        'greek-life': 'Greek life',
        'research': 'research opportunities',
        'coop': 'co-op programs',
        'urban': 'urban campus',
        'rural': 'college-town setting',
        'religious': 'faith-based community',
        'diversity': 'strong diversity',
        'study-abroad': 'study abroad options',
        'honors': 'honors program',
    }
    school_features = _get(school, 'features', [])
    matched_features = [
        feature_labels[f] for f in a.must_haves 
        if f in school_features and f in feature_labels
    ]
    if matched_features:
        reasons.append(' and '.join(matched_features[:2]))

    # Size preference
    if a.school_size and a.school_size != 'no-preference' and _get(school, 'size') == a.school_size:
        size_label = {
            'small': 'small, close-knit',
            'medium': 'mid-sized',
            'large': 'large, vibrant'
        }.get(_get(school, 'size', 'medium'), 'mid-sized')
        reasons.append(f"the {size_label} campus you prefer")

    # Top priority
    if a.priorities:
        top_priority = a.priorities[0]
        if top_priority == 'outcomes' and _get(school, 'median_earnings_10yr', 0) >= 65000:
            reasons.append('excellent career outcomes')
        elif top_priority == 'academics' and _get(school, 'graduation_rate', 0) >= 88:
            reasons.append('top-tier academic quality')
        elif top_priority == 'cost':
            tuition = _get(school, 'tuition', 0)
            fin_aid = _get(school, 'avg_financial_aid', 0)
            if (tuition - fin_aid) < 25000:
                reasons.append('great value for your investment')

    if not reasons:
        return _get(school, 'description', 'A great match for you')

    return f"Matches you with {', '.join(reasons[:3])}."


def generate_strengths(a: ParsedAnswers) -> List[str]:
    """Generate student strengths based on assessment"""
    strengths = []

    gpa_strengths = {
        '3.8-4.0': 'Exceptional academic foundation with a top-tier GPA',
        '3.5-3.79': 'Strong academic record that opens many doors',
        '3.0-3.49': 'Solid GPA with room to stand out through other strengths',
    }
    if a.gpa in gpa_strengths:
        strengths.append(gpa_strengths[a.gpa])

    test_strengths = {
        'sat-1400+': 'Outstanding standardized test performance',
        'act-30+': 'Outstanding standardized test performance',
        'sat-1200-1399': 'Competitive standardized test scores',
        'act-24-29': 'Competitive standardized test scores',
    }
    if a.test_scores in test_strengths:
        strengths.append(test_strengths[a.test_scores])

    if a.grade in ['senior', 'gap']:
        strengths.append('Well-timed in the college planning process')
    elif a.grade == 'junior':
        strengths.append('Getting an early start on college planning')

    if a.major and a.major != 'Undecided / Exploring':
        strengths.append('Clear academic direction with a chosen field of study')

    if len(a.priorities) >= 5:
        strengths.append('Strong sense of what matters most in a college experience')

    return strengths[:3]


def generate_areas_to_improve(a: ParsedAnswers) -> List[str]:
    """Generate areas to improve based on assessment"""
    areas = []

    if a.test_scores == 'not-yet':
        areas.append('Consider taking the SAT or ACT to expand your options')
    if a.gpa in ['below-2.5', '2.5-2.99']:
        areas.append('Focus on raising your GPA to strengthen your profile')
    if a.gpa == 'unknown':
        areas.append('Calculate your GPA to better target the right schools')
    if a.budget == 'unsure':
        areas.append('Have a family conversation about college budget')
    if not a.major:
        areas.append('Explore potential majors to identify schools with matching programs')
    if a.grade in ['freshman', 'sophomore']:
        areas.append('Build extracurriculars and explore interests over the next couple of years')

    return areas[:2]


def select_top_matches(scored: List[Dict[str, Any]], limit: int = 3) -> List[Dict[str, Any]]:
    """Select top matches with diversity across categories"""
    sorted_matches = sorted(scored, key=lambda x: x['match_score'], reverse=True)
    
    if len(sorted_matches) <= limit:
        return sorted_matches

    selected = [sorted_matches[0]]
    used_names = {sorted_matches[0]['school']['name']}

    category_priority = ['best-fit', 'strong-match', 'hidden-gem', 'smart-reach']
    for cat in category_priority:
        if len(selected) >= limit:
            break
        candidate = next(
            (m for m in sorted_matches if m['school']['name'] not in used_names and m['category'] == cat),
            None
        )
        if candidate:
            used_names.add(candidate['school']['name'])
            selected.append(candidate)

    # Fill remaining slots
    for m in sorted_matches:
        if len(selected) >= limit:
            break
        if m['school']['name'] not in used_names:
            used_names.add(m['school']['name'])
            selected.append(m)

    return sorted(selected, key=lambda x: x['match_score'], reverse=True)


def generate_results(answers: Dict[str, Any], schools: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Main function to generate assessment results"""
    a = ParsedAnswers(answers)
    readiness_score = calculate_readiness_score(a)

    # Add some variation to percentile
    variation = random.randint(-3, 5)
    percentile = min(98, max(10, readiness_score + variation))

    # Score all schools
    all_matches = []
    for school in schools:
        match_score = compute_school_match_score(school, a)
        category = categorize_match(match_score, school, a)
        reason = generate_reason(school, a)
        all_matches.append({
            'school': school,
            'match_score': match_score,
            'reason': reason,
            'category': category
        })

    top_matches = select_top_matches(all_matches, limit=10)
    strengths = generate_strengths(a)
    areas_to_improve = generate_areas_to_improve(a)

    return {
        'readiness_score': readiness_score,
        'percentile': percentile,
        'top_matches': top_matches,
        'strengths': strengths,
        'areas_to_improve': areas_to_improve
    }
