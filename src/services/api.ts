/**
 * API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

export interface School {
  id: number
  scorecard_id: number
  name: string
  city: string | null
  state: string | null
  type: 'public' | 'private' | null
  setting: 'urban' | 'suburban' | 'rural' | null
  size: 'small' | 'medium' | 'large' | null
  enrollment: number | null
  acceptance_rate: number | null
  sat_range_low: number | null
  sat_range_high: number | null
  act_range_low: number | null
  act_range_high: number | null
  avg_gpa: number | null
  tuition: number | null
  room_and_board: number | null
  avg_financial_aid: number | null
  graduation_rate: number | null
  retention_rate: number | null
  median_earnings_10yr: number | null
  student_faculty_ratio: number | null
  region: string | null
  hbcu: boolean
  religious_affiliation: boolean
  features: string[]
  majors_strength: string[]
  description: string | null
  created_at: string
  updated_at: string | null
}

export interface SchoolMatch {
  school: School
  match_score: number
  reason: string
  category: 'best-fit' | 'strong-match' | 'smart-reach' | 'hidden-gem'
}

export interface AssessmentResult {
  readiness_score: number
  percentile: number
  top_matches: SchoolMatch[]
  strengths: string[]
  areas_to_improve: string[]
}

export interface SchoolListResponse {
  schools: School[]
  total: number
  limit: number
  offset: number
}

export interface SchoolStats {
  total_count: number
  avg_acceptance_rate: number | null
  avg_tuition: number | null
  avg_graduation_rate: number | null
  states_count: number
}

export async function listSchools(params: {
  q?: string
  state?: string
  type?: string
  region?: string
  min_acceptance?: number
  max_acceptance?: number
  limit?: number
  offset?: number
}): Promise<SchoolListResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString())
    }
  })
  
  const response = await fetch(`${API_BASE_URL}/schools?${queryParams}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch schools: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getSchool(id: number): Promise<School> {
  const response = await fetch(`${API_BASE_URL}/schools/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch school: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getSchoolStats(): Promise<SchoolStats> {
  const response = await fetch(`${API_BASE_URL}/schools/stats`)
  if (!response.ok) {
    throw new Error(`Failed to fetch school stats: ${response.statusText}`)
  }
  
  return response.json()
}

export async function submitAssessment(answers: Record<string, unknown>): Promise<AssessmentResult> {
  // Transform keys to snake_case for backend
  const snakeCaseAnswers = {
    grade: answers.grade,
    gpa: answers.gpa,
    test_scores: answers.testScores,
    major: answers.major,
    school_size: answers.schoolSize,
    distance: answers.distance,
    priorities: answers.priorities,
    budget: answers.budget,
    must_haves: answers.mustHaves,
    biggest_worry: answers.biggestWorry,
  }
  
  const response = await fetch(`${API_BASE_URL}/assessment/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snakeCaseAnswers),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to submit assessment: ${response.statusText}`)
  }
  
  return response.json()
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch('http://localhost:8003/api/health')
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`)
  }
  
  return response.json()
}
