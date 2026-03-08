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
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SCORECARD_API_KEY", "DEMO_KEY")
    
    async def fetch_schools(
        self,
        page: int = 0,
        per_page: int = 100,
        delay: float = 6.5,  # 10 req/hr = ~6s between requests
        max_retries: int = 5
    ) -> Dict[str, Any]:
        """
        Fetch a page of schools from the College Scorecard API
        
        Args:
            page: Page number (0-indexed)
            per_page: Results per page (max 100)
            delay: Delay in seconds between requests (default 6.5s for 10 req/hr limit)
            max_retries: Maximum number of retry attempts on rate limit
        
        Returns:
            API response dict with 'results' and 'metadata'
        """
        params = {
            "api_key": self.api_key,
            "school.degrees_awarded.predominant": "3",  # 4-year bachelor's
            "page": str(page),
            "per_page": str(per_page),
            "fields": ",".join([
                "id",
                "school.name",
                "school.city",
                "school.state",
                "school.ownership",
                "school.locale",
                "latest.student.size",
                "latest.admissions.admission_rate.overall",
                "latest.admissions.sat_scores.average.overall",
                "latest.admissions.sat_scores.25th_percentile.critical_reading",
                "latest.admissions.sat_scores.75th_percentile.critical_reading",
                "latest.admissions.sat_scores.25th_percentile.math",
                "latest.admissions.sat_scores.75th_percentile.math",
                "latest.admissions.act_scores.25th_percentile.cumulative",
                "latest.admissions.act_scores.75th_percentile.cumulative",
                "latest.cost.tuition.in_state",
                "latest.cost.tuition.out_of_state",
                "latest.cost.roomboard.oncampus",
                "latest.aid.median_debt.completers.overall",
                "latest.completion.completion_rate_4yr_150nt",
                "latest.student.retention_rate_suppressed.four_year.full_time",
                "latest.earnings.10_yrs_after_entry.median",
                "latest.student.student_faculty_ratio",
                "school.minority_serving.historically_black",
                "school.religious_affiliation",
                "school.carnegie_size_setting",
            ])
        }
        
        # Retry logic with exponential backoff
        retry_count = 0
        while retry_count <= max_retries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(self.BASE_URL, params=params)
                    response.raise_for_status()
                    data = response.json()
                
                # Add delay to respect rate limits
                if delay > 0:
                    await asyncio.sleep(delay)
                
                return data
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Rate limit
                    retry_count += 1
                    if retry_count > max_retries:
                        raise
                    
                    # Exponential backoff: 30s, 60s, 120s, 240s, 480s
                    backoff = 30 * (2 ** (retry_count - 1))
                    print(f"⏳ Rate limit hit. Waiting {backoff}s before retry {retry_count}/{max_retries}...")
                    await asyncio.sleep(backoff)
                else:
                    raise
            except Exception as e:
                raise
        
        raise Exception(f"Failed after {max_retries} retries")
    
    async def fetch_all_schools(
        self,
        max_pages: Optional[int] = None,
        callback=None
    ) -> List[Dict[str, Any]]:
        """
        Fetch all schools with pagination
        
        Args:
            max_pages: Maximum number of pages to fetch (None = all)
            callback: Optional callback function called after each page: callback(page, total)
        
        Returns:
            List of all school records
        """
        all_schools = []
        page = 0
        
        while True:
            if max_pages is not None and page >= max_pages:
                break
            
            try:
                data = await self.fetch_schools(page=page)
                results = data.get("results", [])
                
                if not results:
                    break
                
                all_schools.extend(results)
                
                if callback:
                    total = data.get("metadata", {}).get("total", len(all_schools))
                    callback(page + 1, total, len(results))
                
                # Check if we've fetched all available data
                metadata = data.get("metadata", {})
                total = metadata.get("total", 0)
                per_page = metadata.get("per_page", 100)
                
                if (page + 1) * per_page >= total:
                    break
                
                page += 1
                
            except Exception as e:
                print(f"Error fetching page {page}: {e}")
                break
        
        return all_schools
    
    def transform_school(self, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform raw Scorecard API data into our schema
        
        Args:
            raw: Raw school record from API
        
        Returns:
            Transformed school dict or None if essential data is missing
        """
        try:
            school_data = raw.get("school", {})
            latest = raw.get("latest", {})
            
            name = school_data.get("name")
            if not name:
                return None
            
            # Determine school type
            ownership = school_data.get("ownership")
            school_type = "private" if ownership == 2 else "public" if ownership == 1 else None
            
            # Determine setting
            locale = school_data.get("locale")
            if locale:
                if locale >= 11 and locale <= 13:
                    setting = "urban"
                elif locale >= 21 and locale <= 23:
                    setting = "suburban"
                elif locale >= 31 and locale <= 33:
                    setting = "suburban"
                else:
                    setting = "rural"
            else:
                setting = None
            
            # Determine size based on Carnegie classification or enrollment
            carnegie = school_data.get("carnegie_size_setting")
            enrollment = latest.get("student", {}).get("size")
            
            if enrollment:
                if enrollment < 5000:
                    size = "small"
                elif enrollment < 15000:
                    size = "medium"
                else:
                    size = "large"
            else:
                size = "medium"  # default
            
            # Extract SAT scores (combine CR + Math)
            sat_scores = latest.get("admissions", {}).get("sat_scores", {})
            sat_25_cr = sat_scores.get("25th_percentile", {}).get("critical_reading")
            sat_75_cr = sat_scores.get("75th_percentile", {}).get("critical_reading")
            sat_25_math = sat_scores.get("25th_percentile", {}).get("math")
            sat_75_math = sat_scores.get("75th_percentile", {}).get("math")
            
            sat_range_low = None
            sat_range_high = None
            if sat_25_cr and sat_25_math:
                sat_range_low = int(sat_25_cr + sat_25_math)
            if sat_75_cr and sat_75_math:
                sat_range_high = int(sat_75_cr + sat_75_math)
            
            # ACT scores
            act_scores = latest.get("admissions", {}).get("act_scores", {})
            act_range_low = act_scores.get("25th_percentile", {}).get("cumulative")
            act_range_high = act_scores.get("75th_percentile", {}).get("cumulative")
            
            # Tuition (use out-of-state for private, in-state for public)
            cost = latest.get("cost", {})
            tuition_in = cost.get("tuition", {}).get("in_state")
            tuition_out = cost.get("tuition", {}).get("out_of_state")
            tuition = tuition_out if school_type == "private" else (tuition_in or tuition_out)
            
            # Determine region from state
            state = school_data.get("state")
            region = self._get_region(state)
            
            # Extract financial aid (use median debt as proxy for aid)
            median_debt = latest.get("aid", {}).get("median_debt", {}).get("completers", {}).get("overall")
            avg_financial_aid = int(tuition * 0.4) if tuition else 0  # Rough estimate: 40% average aid
            
            # Features (basic categorization)
            features = []
            if setting == "urban":
                features.append("urban")
            elif setting == "rural":
                features.append("rural")
            
            if school_data.get("minority_serving", {}).get("historically_black"):
                features.append("diversity")
            
            if school_data.get("religious_affiliation"):
                features.append("religious")
            
            # Assume research if large enrollment
            if enrollment and enrollment > 15000:
                features.append("research")
            
            return {
                "scorecard_id": raw.get("id"),
                "name": name,
                "city": school_data.get("city"),
                "state": state,
                "type": school_type,
                "setting": setting,
                "size": size,
                "enrollment": enrollment,
                "acceptance_rate": self._to_percentage(latest.get("admissions", {}).get("admission_rate", {}).get("overall")),
                "sat_range_low": sat_range_low,
                "sat_range_high": sat_range_high,
                "act_range_low": act_range_low,
                "act_range_high": act_range_high,
                "avg_gpa": 3.5,  # Default - Scorecard doesn't provide GPA
                "tuition": tuition,
                "room_and_board": cost.get("roomboard", {}).get("oncampus"),
                "avg_financial_aid": avg_financial_aid,
                "graduation_rate": self._to_percentage(latest.get("completion", {}).get("completion_rate_4yr_150nt")),
                "retention_rate": self._to_percentage(latest.get("student", {}).get("retention_rate_suppressed", {}).get("four_year", {}).get("full_time")),
                "median_earnings_10yr": latest.get("earnings", {}).get("10_yrs_after_entry", {}).get("median"),
                "student_faculty_ratio": latest.get("student", {}).get("student_faculty_ratio"),
                "region": region,
                "hbcu": bool(school_data.get("minority_serving", {}).get("historically_black")),
                "religious_affiliation": bool(school_data.get("religious_affiliation")),
                "features": features,
                "majors_strength": [],  # Would need additional API call to get program data
                "description": f"{name} is a {school_type} institution in {school_data.get('city')}, {state}.",
            }
        
        except Exception as e:
            print(f"Error transforming school {raw.get('id', 'unknown')}: {e}")
            return None
    
    def _to_percentage(self, value: Optional[float]) -> Optional[int]:
        """Convert decimal to percentage (0.5 -> 50)"""
        if value is None:
            return None
        return int(value * 100)
    
    def _get_region(self, state: Optional[str]) -> Optional[str]:
        """Map state to region"""
        if not state:
            return None
        
        regions = {
            "northeast": ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
            "southeast": ["DE", "FL", "GA", "MD", "NC", "SC", "VA", "WV", "AL", "KY", "MS", "TN", "AR", "LA", "OK", "TX"],
            "midwest": ["IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO", "NE", "ND", "SD"],
            "southwest": ["AZ", "NM", "TX", "OK"],
            "west": ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
        }
        
        for region, states in regions.items():
            if state in states:
                return region
        
        return "other"
