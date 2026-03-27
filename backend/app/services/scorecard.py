"""
College Scorecard API client
Handles fetching and transforming data from the US Department of Education API
"""
import httpx
import asyncio
import os
from typing import Dict, Any, List, Optional


# Map Scorecard program keys to human-readable major names
PROGRAM_LABELS = {
    "agriculture": "Agriculture",
    "resources": "Natural Resources",
    "architecture": "Architecture",
    "ethnic_cultural_gender": "Ethnic & Cultural Studies",
    "communication": "Communications",
    "communications_technology": "Communications Technology",
    "computer": "Computer Science",
    "personal_culinary": "Culinary Arts",
    "education": "Education",
    "engineering": "Engineering",
    "engineering_technology": "Engineering Technology",
    "language": "Foreign Languages",
    "family_consumer_science": "Family & Consumer Sciences",
    "legal": "Legal Studies",
    "english": "English",
    "humanities": "Liberal Arts & Humanities",
    "library": "Library Science",
    "biological": "Biology",
    "mathematics": "Mathematics",
    "military": "Military Studies",
    "multidiscipline": "Interdisciplinary Studies",
    "parks_recreation_fitness": "Parks & Recreation",
    "philosophy_religious": "Philosophy & Religious Studies",
    "theology_religious_vocation": "Theology",
    "physical_science": "Physical Sciences",
    "science_technology": "Science & Technology",
    "psychology": "Psychology",
    "security_law_enforcement": "Criminal Justice",
    "public_administration_social_service": "Public Administration",
    "social_science": "Social Sciences",
    "construction": "Construction Trades",
    "mechanic_repair_technology": "Mechanic & Repair Technology",
    "precision_production": "Precision Production",
    "transportation": "Transportation",
    "visual_performing": "Visual & Performing Arts",
    "health": "Health Sciences",
    "business_marketing": "Business & Marketing",
    "history": "History",
}


class ScorecardClient:
    BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json"

    FIELDS = [
        "id",
        # School info
        "school.name", "school.city", "school.state", "school.ownership", "school.locale",
        "school.minority_serving.historically_black", "school.religious_affiliation",
        "school.school_url", "school.price_calculator_url", "school.alias",
        "school.address", "school.zip",
        "school.men_only", "school.women_only", "school.online_only",
        "school.open_admissions_policy",
        "school.carnegie_basic", "school.carnegie_size_setting",
        "school.faculty_salary", "school.ft_faculty_rate",
        "school.tuition_revenue_per_fte", "school.instructional_expenditure_per_fte",
        # Admissions
        "latest.student.size",
        "latest.admissions.admission_rate.overall",
        "latest.admissions.sat_scores.average.overall",
        "latest.admissions.sat_scores.25th_percentile.critical_reading",
        "latest.admissions.sat_scores.75th_percentile.critical_reading",
        "latest.admissions.sat_scores.25th_percentile.math",
        "latest.admissions.sat_scores.75th_percentile.math",
        "latest.admissions.act_scores.25th_percentile.cumulative",
        "latest.admissions.act_scores.75th_percentile.cumulative",
        # Cost
        "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
        "latest.cost.roomboard.oncampus",
        "latest.cost.booksupply",
        "latest.cost.avg_net_price.overall",
        "latest.cost.otherexpense.oncampus",
        "latest.cost.attendance.academic_year",
        # Completion
        "latest.completion.completion_rate_4yr_150nt",
        "latest.completion.completion_rate_4yr_100nt",
        "latest.completion.completion_rate_4yr_200nt",
        "latest.completion.transfer_rate.4yr.full_time",
        "latest.completion.consumer_rate",
        # Retention
        "latest.student.retention_rate.four_year.full_time_pooled",
        # Earnings
        "latest.earnings.10_yrs_after_entry.median",
        "latest.earnings.6_yrs_after_entry.median",
        "latest.earnings.8_yrs_after_entry.median_earnings",
        "latest.earnings.1_yr_after_completion.median",
        "latest.earnings.4_yrs_after_completion.median",
        # Student demographics
        "latest.student.student_faculty_ratio",
        "latest.student.demographics.men",
        "latest.student.demographics.women",
        "latest.student.demographics.age_entry",
        "latest.student.demographics.first_generation",
        "latest.student.demographics.median_family_income",
        "latest.student.part_time_share",
        "latest.student.grad_students",
        "latest.student.FAFSA_applications",
        # Aid
        "latest.aid.pell_grant_rate",
        "latest.aid.federal_loan_rate",
        "latest.aid.median_debt.completers.overall",
        "latest.aid.median_debt.completers.monthly_payments",
        "latest.aid.students_with_any_loan",
        # Location
        "location.lat", "location.lon",
    ]

    # Append all bachelor's program fields
    BACHELOR_PROGRAMS = list(PROGRAM_LABELS.keys())
    FIELDS += [f"latest.academics.program.bachelors.{p}" for p in BACHELOR_PROGRAMS]

    REGIONS = {
        "northeast": {"CT","ME","MA","NH","RI","VT","NJ","NY","PA","MD","DE","DC"},
        "southeast": {"FL","GA","NC","SC","VA","WV","AL","KY","MS","TN","AR","LA"},
        "midwest":   {"IL","IN","MI","OH","WI","IA","KS","MN","MO","NE","ND","SD"},
        "southwest": {"TX","OK","NM","AZ","CO","UT","NV"},
        "west":      {"AK","CA","HI","ID","MT","OR","WA","WY"},
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SCORECARD_API_KEY", "DEMO_KEY")

    def _g(self, raw: dict, key: str, default=None):
        """Get flat dot-notation key from API response."""
        return raw.get(key, default)

    async def fetch_schools(self, page=0, per_page=100, delay=0.5, max_retries=5):
        params = {
            "api_key": self.api_key,
            "school.degrees_awarded.predominant": "3",
            "page": str(page),
            "per_page": str(per_page),
            "fields": ",".join(self.FIELDS),
        }
        for attempt in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(self.BASE_URL, params=params)
                    resp.raise_for_status()
                    if delay > 0:
                        await asyncio.sleep(delay)
                    return resp.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    backoff = 30 * (2 ** attempt)
                    print(f"  ⏳ Rate limited, waiting {backoff}s (attempt {attempt+1}/{max_retries})...")
                    await asyncio.sleep(backoff)
                else:
                    raise
        raise Exception(f"Failed after {max_retries} retries")

    async def fetch_all_schools(self, max_pages=None, callback=None) -> List[Dict]:
        all_schools = []
        page = 0
        while True:
            if max_pages and page >= max_pages:
                break
            try:
                data = await self.fetch_schools(page=page)
                results = data.get("results", [])
                if not results:
                    break
                all_schools.extend(results)
                if callback:
                    callback(page + 1, data.get("metadata", {}).get("total", 0), len(results))
                total = data.get("metadata", {}).get("total", 0)
                if (page + 1) * 100 >= total:
                    break
                page += 1
            except Exception as e:
                print(f"  Error on page {page}: {e}")
                break
        return all_schools

    def transform_school(self, raw: Dict) -> Optional[Dict]:
        """Transform flat dot-notation API response to our DB schema."""
        g = lambda k, d=None: self._g(raw, k, d)
        name = g("school.name")
        if not name:
            return None

        ownership = g("school.ownership")
        school_type = "public" if ownership == 1 else "private"

        locale = g("school.locale")
        if locale and locale <= 13:
            setting = "urban"
        elif locale and locale <= 23:
            setting = "suburban"
        else:
            setting = "rural"

        enrollment = g("latest.student.size") or 0
        size = "small" if enrollment < 3000 else ("medium" if enrollment < 15000 else "large")

        adm = g("latest.admissions.admission_rate.overall")
        acceptance_rate = round(adm * 100, 1) if adm else None

        sr25 = g("latest.admissions.sat_scores.25th_percentile.critical_reading")
        sr75 = g("latest.admissions.sat_scores.75th_percentile.critical_reading")
        sm25 = g("latest.admissions.sat_scores.25th_percentile.math")
        sm75 = g("latest.admissions.sat_scores.75th_percentile.math")
        sat_lo = int(sr25 + sm25) if sr25 and sm25 else None
        sat_hi = int(sr75 + sm75) if sr75 and sm75 else None

        act_lo = g("latest.admissions.act_scores.25th_percentile.cumulative")
        act_hi = g("latest.admissions.act_scores.75th_percentile.cumulative")

        t_in = g("latest.cost.tuition.in_state") or 0
        t_out = g("latest.cost.tuition.out_of_state") or 0
        tuition = t_out if school_type == "public" else (t_out or t_in or None)

        rb = g("latest.cost.roomboard.oncampus")

        gr = g("latest.completion.completion_rate_4yr_150nt")
        grad_rate = round(gr * 100) if gr else None

        ret = g("latest.student.retention_rate.four_year.full_time_pooled")
        retention = round(ret * 100) if ret else None

        earnings = g("latest.earnings.10_yrs_after_entry.median")
        sfr = g("latest.student.student_faculty_ratio")

        state = g("school.state", "")
        city = g("school.city", "")
        hbcu = bool(g("school.minority_serving.historically_black"))
        religious = bool(g("school.religious_affiliation"))

        region = None
        for r, states in self.REGIONS.items():
            if state in states:
                region = r
                break

        features = []
        if setting == "urban": features.append("urban")
        elif setting == "rural": features.append("rural")
        if hbcu: features.append("diversity")
        if religious: features.append("religious")
        if enrollment > 10000: features += ["d1-sports", "greek-life"]
        elif enrollment > 3000: features.append("greek-life")
        if grad_rate and grad_rate > 85 and earnings and earnings > 60000:
            features += ["research", "honors"]
        elif grad_rate and grad_rate > 75:
            features.append("honors")
        if earnings and earnings > 55000:
            features.append("study-abroad")

        # Estimate GPA from SAT if available
        sat_avg = g("latest.admissions.sat_scores.average.overall")
        if sat_avg:
            avg_gpa = round(min(4.0, max(2.0, 2.8 + (sat_avg - 900) / 700)), 2)
        else:
            avg_gpa = 3.2

        lat = g("location.lat")
        lon = g("location.lon")

        # --- Programs offered (bachelors) ---
        programs_offered = {}
        for prog_key in self.BACHELOR_PROGRAMS:
            val = g(f"latest.academics.program.bachelors.{prog_key}")
            if val and val == 1:
                programs_offered[prog_key] = True

        # Convert programs to human-readable majors_strength list
        majors_strength = [
            PROGRAM_LABELS[k] for k in programs_offered if k in PROGRAM_LABELS
        ]

        # --- Completion rates ---
        cr_100 = g("latest.completion.completion_rate_4yr_100nt")
        cr_200 = g("latest.completion.completion_rate_4yr_200nt")
        transfer_rate = g("latest.completion.transfer_rate.4yr.full_time")
        consumer_rt = g("latest.completion.consumer_rate")

        # --- Aid ---
        pell_rate = g("latest.aid.pell_grant_rate")
        fed_loan_rate = g("latest.aid.federal_loan_rate")
        med_debt = g("latest.aid.median_debt.completers.overall")
        med_debt_monthly = g("latest.aid.median_debt.completers.monthly_payments")
        students_loan = g("latest.aid.students_with_any_loan")

        # --- Demographics ---
        demo_men = g("latest.student.demographics.men")
        demo_women = g("latest.student.demographics.women")
        age_entry = g("latest.student.demographics.age_entry")
        first_gen = g("latest.student.demographics.first_generation")
        med_fam_income = g("latest.student.demographics.median_family_income")
        pt_share = g("latest.student.part_time_share")
        grad_stu = g("latest.student.grad_students")
        fafsa = g("latest.student.FAFSA_applications")

        # --- Earnings multi-year ---
        earn_6yr = g("latest.earnings.6_yrs_after_entry.median")
        earn_8yr = g("latest.earnings.8_yrs_after_entry.median_earnings")
        earn_1yr_comp = g("latest.earnings.1_yr_after_completion.median")
        earn_4yr_comp = g("latest.earnings.4_yrs_after_completion.median")

        # --- School info extras ---
        open_adm = g("school.open_admissions_policy")
        men_only_val = g("school.men_only")
        women_only_val = g("school.women_only")
        online_only_val = g("school.online_only")

        return {
            "scorecard_id": g("id"),
            "name": name,
            "city": city,
            "state": state,
            "type": school_type,
            "setting": setting,
            "size": size,
            "enrollment": enrollment,
            "acceptance_rate": acceptance_rate,
            "sat_range_low": sat_lo,
            "sat_range_high": sat_hi,
            "act_range_low": act_lo,
            "act_range_high": act_hi,
            "avg_gpa": avg_gpa,
            "tuition": tuition,
            "room_and_board": rb,
            "avg_financial_aid": int(tuition * 0.35) if tuition else 0,
            "graduation_rate": grad_rate,
            "retention_rate": retention,
            "median_earnings_10yr": earnings,
            "student_faculty_ratio": sfr,
            "region": region,
            "hbcu": hbcu,
            "religious_affiliation": religious,
            "features": list(set(features)),
            "latitude": lat,
            "longitude": lon,
            "majors_strength": majors_strength,
            "description": f"{name} is a {school_type} {size} {setting} institution in {city}, {state}.",
            # New school info fields
            "school_url": g("school.school_url"),
            "price_calculator_url": g("school.price_calculator_url"),
            "alias": g("school.alias"),
            "address": g("school.address"),
            "zip_code": g("school.zip"),
            "men_only": bool(men_only_val) if men_only_val is not None else False,
            "women_only": bool(women_only_val) if women_only_val is not None else False,
            "online_only": bool(online_only_val) if online_only_val is not None else False,
            "open_admissions": bool(open_adm) if open_adm is not None else False,
            "carnegie_basic": g("school.carnegie_basic"),
            "carnegie_size_setting": g("school.carnegie_size_setting"),
            "faculty_salary": g("school.faculty_salary"),
            "ft_faculty_rate": g("school.ft_faculty_rate"),
            "tuition_revenue_per_fte": g("school.tuition_revenue_per_fte"),
            "instructional_expenditure_per_fte": g("school.instructional_expenditure_per_fte"),
            # Cost
            "book_supply_cost": g("latest.cost.booksupply"),
            "avg_net_price": g("latest.cost.avg_net_price.overall"),
            "other_expense_oncampus": g("latest.cost.otherexpense.oncampus"),
            "cost_of_attendance": g("latest.cost.attendance.academic_year"),
            # Aid
            "pell_grant_rate": pell_rate,
            "federal_loan_rate": fed_loan_rate,
            "median_debt": int(med_debt) if med_debt else None,
            "median_debt_monthly_payment": med_debt_monthly,
            "students_with_any_loan": students_loan,
            # Demographics
            "demographics_men": demo_men,
            "demographics_women": demo_women,
            "avg_age_entry": age_entry,
            "first_generation_rate": first_gen,
            "median_family_income": med_fam_income,
            "part_time_share": pt_share,
            "grad_students": grad_stu,
            "fafsa_applications": fafsa,
            # Earnings multi-year
            "earnings_6yr_after_entry": earn_6yr,
            "earnings_8yr_after_entry": earn_8yr,
            "earnings_1yr_after_completion": earn_1yr_comp,
            "earnings_4yr_after_completion": earn_4yr_comp,
            # Completion
            "completion_rate_4yr_100": cr_100,
            "completion_rate_4yr_200": cr_200,
            "transfer_rate_4yr_ft": transfer_rate,
            "consumer_rate": consumer_rt,
            # Programs
            "programs_offered": programs_offered if programs_offered else None,
        }
