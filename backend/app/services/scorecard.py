"""
College Scorecard API client
Handles fetching and transforming data from the US Department of Education API
"""
import httpx
import asyncio
import os
from typing import Dict, Any, List, Optional


class ScorecardClient:
    BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json"

    FIELDS = [
        "id",
        "school.name", "school.city", "school.state", "school.ownership", "school.locale",
        "school.minority_serving.historically_black", "school.religious_affiliation",
        "latest.student.size",
        "latest.admissions.admission_rate.overall",
        "latest.admissions.sat_scores.average.overall",
        "latest.admissions.sat_scores.25th_percentile.critical_reading",
        "latest.admissions.sat_scores.75th_percentile.critical_reading",
        "latest.admissions.sat_scores.25th_percentile.math",
        "latest.admissions.sat_scores.75th_percentile.math",
        "latest.admissions.act_scores.25th_percentile.cumulative",
        "latest.admissions.act_scores.75th_percentile.cumulative",
        "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
        "latest.cost.roomboard.oncampus",
        "latest.completion.completion_rate_4yr_150nt",
        "latest.student.retention_rate.four_year.full_time_pooled",
        "latest.earnings.10_yrs_after_entry.median",
        "latest.student.student_faculty_ratio",
    ]

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
            "majors_strength": [],
            "description": f"{name} is a {school_type} {size} {setting} institution in {city}, {state}.",
        }
