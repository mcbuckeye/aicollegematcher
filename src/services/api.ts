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
  // Extended fields
  school_url: string | null
  price_calculator_url: string | null
  alias: string | null
  book_supply_cost: number | null
  avg_net_price: number | null
  cost_of_attendance: number | null
  pell_grant_rate: number | null
  federal_loan_rate: number | null
  median_debt: number | null
  median_debt_monthly_payment: number | null
  students_with_any_loan: number | null
  demographics_men: number | null
  demographics_women: number | null
  avg_age_entry: number | null
  first_generation_rate: number | null
  median_family_income: number | null
  part_time_share: number | null
  grad_students: number | null
  fafsa_applications: number | null
  earnings_6yr_after_entry: number | null
  earnings_8yr_after_entry: number | null
  earnings_1yr_after_completion: number | null
  earnings_4yr_after_completion: number | null
  completion_rate_4yr_100: number | null
  completion_rate_4yr_200: number | null
  transfer_rate_4yr_ft: number | null
  consumer_rate: number | null
  programs_offered: Record<string, boolean> | null
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
    zip_code: answers.zipCode,
    priorities: answers.priorities,
    budget: answers.budget,
    must_haves: answers.mustHaves,
    biggest_worry: answers.biggestWorry,
    email: answers.email,
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

export async function downloadPdfReport(answers: Record<string, unknown>): Promise<void> {
  const snakeCaseAnswers = {
    grade: answers.grade,
    gpa: answers.gpa,
    test_scores: answers.testScores,
    major: answers.major,
    school_size: answers.schoolSize,
    distance: answers.distance,
    zip_code: answers.zipCode,
    priorities: answers.priorities,
    budget: answers.budget,
    must_haves: answers.mustHaves,
    biggest_worry: answers.biggestWorry,
    email: answers.email,
  }

  const response = await fetch(`${API_BASE_URL}/assessment/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snakeCaseAnswers),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate report: ${response.statusText}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'college_match_report.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch('http://localhost:8003/api/health')
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`)
  }

  return response.json()
}

// Payments
export async function createCheckoutSession(payload: {
  tier: string
  email?: string
  success_url?: string
  cancel_url?: string
}): Promise<{ checkout_url: string; session_id: string }> {
  const response = await fetch(`${API_BASE_URL}/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Failed to create checkout: ${response.statusText}`)
  }
  return response.json()
}

export async function getPaymentStatus(email: string): Promise<{ tier: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/payments/status?email=${encodeURIComponent(email)}`)
  if (!response.ok) {
    throw new Error(`Failed to get payment status: ${response.statusText}`)
  }
  return response.json()
}

// Chat
// Majors Explorer
export interface MajorSummary {
  name: string
  slug: string
  ai_disruption_score: number
  ai_disruption_tier: string
  ai_impact_summary: string
  career_outlook: string
  median_salary: number
  growth_rate: string
  ai_augmented_skills: string[]
  ai_resistant_aspects: string[]
  ai_threatened_aspects: string[]
  recommended_complementary_skills: string[]
  example_careers: string[]
  category: string
}

export interface MajorDetail extends MajorSummary {
  top_schools: {
    id: number
    name: string
    city: string | null
    state: string | null
    graduation_rate: number | null
    enrollment: number | null
    tuition: number | null
    type: string | null
  }[]
}

export async function getMajorsExplorer(params: {
  sort?: string
  category?: string
} = {}): Promise<{ majors: MajorSummary[]; total: number }> {
  const queryParams = new URLSearchParams()
  if (params.sort) queryParams.append('sort', params.sort)
  if (params.category) queryParams.append('category', params.category)

  const response = await fetch(`${API_BASE_URL}/majors/explorer?${queryParams}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch majors: ${response.statusText}`)
  }
  return response.json()
}

export async function getMajorDetail(slug: string): Promise<MajorDetail> {
  const response = await fetch(`${API_BASE_URL}/majors/${slug}/detail`)
  if (!response.ok) {
    throw new Error(`Failed to fetch major detail: ${response.statusText}`)
  }
  return response.json()
}

export async function sendChatMessage(payload: {
  message: string
  email?: string
  session_id: string
  context?: Record<string, unknown>
}): Promise<{ reply: string; remaining_messages: number | null; limit: number | null }> {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error: any = new Error(`Chat failed: ${response.statusText}`)
    error.status = response.status
    throw error
  }
  return response.json()
}
