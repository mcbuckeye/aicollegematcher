import { type School, SCHOOLS } from './schools'

export interface SchoolMatch {
  school: School
  matchScore: number
  reason: string
  category: 'best-fit' | 'strong-match' | 'smart-reach' | 'hidden-gem'
}

export interface AssessmentResult {
  readinessScore: number
  percentile: number
  topMatches: SchoolMatch[]
  strengths: string[]
  areasToImprove: string[]
}

type GpaRange = '3.8-4.0' | '3.5-3.79' | '3.0-3.49' | '2.5-2.99' | 'below-2.5' | 'unknown'
type TestScore = 'sat-1400+' | 'sat-1200-1399' | 'sat-1000-1199' | 'sat-below-1000' | 'act-30+' | 'act-24-29' | 'act-below-24' | 'not-yet' | 'test-optional'
type Grade = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'gap'
type SchoolSize = 'small' | 'medium' | 'large' | 'no-preference'
type Budget = 'under-15k' | '15k-30k' | '30k-50k' | '50k+' | 'unsure'
type Priority = 'academics' | 'cost' | 'campus' | 'location' | 'outcomes'
type Feature = 'd1-sports' | 'greek-life' | 'research' | 'coop' | 'urban' | 'rural' | 'religious' | 'diversity' | 'study-abroad' | 'honors'

interface ParsedAnswers {
  grade: Grade | undefined
  gpa: GpaRange | undefined
  testScores: TestScore | undefined
  major: string | undefined
  schoolSize: SchoolSize | undefined
  distance: string | undefined
  priorities: Priority[]
  budget: Budget | undefined
  mustHaves: Feature[]
  biggestWorry: string | undefined
}

function parseAnswers(answers: Record<string, unknown>): ParsedAnswers {
  return {
    grade: answers.grade as Grade | undefined,
    gpa: answers.gpa as GpaRange | undefined,
    testScores: answers.testScores as TestScore | undefined,
    major: answers.major as string | undefined,
    schoolSize: answers.schoolSize as SchoolSize | undefined,
    distance: answers.distance as string | undefined,
    priorities: (answers.priorities as Priority[] | undefined) ?? [],
    budget: answers.budget as Budget | undefined,
    mustHaves: (answers.mustHaves as Feature[] | undefined) ?? [],
    biggestWorry: answers.biggestWorry as string | undefined,
  }
}

// --- Readiness Score ---

function calculateReadinessScore(a: ParsedAnswers): number {
  let score = 0

  // GPA: 30 points
  switch (a.gpa) {
    case '3.8-4.0': score += 30; break
    case '3.5-3.79': score += 24; break
    case '3.0-3.49': score += 16; break
    case '2.5-2.99': score += 8; break
    case 'below-2.5': score += 3; break
    default: score += 3
  }

  // Test scores: 20 points
  switch (a.testScores) {
    case 'sat-1400+': case 'act-30+': score += 20; break
    case 'sat-1200-1399': case 'act-24-29': score += 14; break
    case 'sat-1000-1199': case 'sat-below-1000': case 'act-below-24': score += 7; break
    case 'not-yet': case 'test-optional': score += 10; break
    default: score += 7
  }

  // Grade: 15 points
  switch (a.grade) {
    case 'senior': case 'gap': score += 15; break
    case 'junior': score += 12; break
    case 'sophomore': score += 8; break
    case 'freshman': score += 5; break
    default: score += 8
  }

  // Priorities clarity: 10 points
  score += a.priorities.length >= 5 ? 10 : a.priorities.length >= 3 ? 6 : 2

  // Self-awareness: 10 points
  if (a.biggestWorry && a.biggestWorry.trim().length > 20) score += 10
  else if (a.biggestWorry && a.biggestWorry.trim().length > 0) score += 5

  // Exploration: 15 points
  if (a.major && a.major.length > 0) score += 12
  if (a.mustHaves.length > 0) score += 3

  return Math.min(100, Math.max(0, score))
}

// --- Student profile helpers ---

function studentGpaMidpoint(gpa: GpaRange | undefined): number {
  switch (gpa) {
    case '3.8-4.0': return 3.9
    case '3.5-3.79': return 3.65
    case '3.0-3.49': return 3.25
    case '2.5-2.99': return 2.75
    case 'below-2.5': return 2.2
    default: return 3.0
  }
}

function studentSatEstimate(testScores: TestScore | undefined): number | null {
  switch (testScores) {
    case 'sat-1400+': return 1450
    case 'sat-1200-1399': return 1300
    case 'sat-1000-1199': return 1100
    case 'sat-below-1000': return 950
    case 'act-30+': return 1400
    case 'act-24-29': return 1250
    case 'act-below-24': return 1050
    default: return null
  }
}

function budgetMax(budget: Budget | undefined): number | null {
  switch (budget) {
    case 'under-15k': return 15000
    case '15k-30k': return 30000
    case '30k-50k': return 50000
    case '50k+': return 80000
    default: return null
  }
}

// --- Per-school scoring ---

function scoreAcademicFit(school: School, gpa: GpaRange | undefined, testScores: TestScore | undefined): number {
  const studentGpa = studentGpaMidpoint(gpa)
  const gpaDiff = studentGpa - school.avgGPA

  let gpaScore: number
  if (Math.abs(gpaDiff) <= 0.15) {
    gpaScore = 100
  } else if (gpaDiff > 0.15) {
    gpaScore = Math.max(50, 100 - (gpaDiff - 0.15) * 80)
  } else {
    gpaScore = Math.max(10, 100 + (gpaDiff + 0.15) * 120)
  }

  const studentSat = studentSatEstimate(testScores)
  let testScore = 70
  if (studentSat !== null) {
    const schoolSatMid = (school.satRange[0] + school.satRange[1]) / 2
    const satDiff = studentSat - schoolSatMid
    if (Math.abs(satDiff) <= 50) {
      testScore = 100
    } else if (satDiff > 50) {
      testScore = Math.max(50, 100 - (satDiff - 50) * 0.15)
    } else {
      testScore = Math.max(10, 100 + (satDiff + 50) * 0.25)
    }
  }

  return gpaScore * 0.55 + testScore * 0.45
}

function scoreSizeFit(school: School, schoolSize: SchoolSize | undefined): number {
  if (!schoolSize || schoolSize === 'no-preference') return 80
  if (school.size === schoolSize) return 100
  const sizeOrder: Record<string, number> = { small: 0, medium: 1, large: 2 }
  const diff = Math.abs(sizeOrder[school.size] - sizeOrder[schoolSize])
  return diff === 1 ? 50 : 20
}

function scoreBudgetFit(school: School, budget: Budget | undefined): number {
  const max = budgetMax(budget)
  if (max === null) return 70
  const netCost = school.tuition - school.avgFinancialAid
  if (netCost <= max) return 100
  const overage = netCost - max
  if (overage < 5000) return 75
  if (overage < 15000) return 50
  if (overage < 30000) return 25
  return 10
}

function scoreFeaturesFit(school: School, mustHaves: Feature[]): number {
  if (mustHaves.length === 0) return 75
  let matches = 0
  for (const feature of mustHaves) {
    if (school.features.includes(feature)) matches++
  }
  return Math.round((matches / mustHaves.length) * 100)
}

function scorePriorityAlignment(school: School, priorities: Priority[]): number {
  if (priorities.length === 0) return 60
  let score = 0
  let totalWeight = 0

  priorities.forEach((priority, index) => {
    const weight = priorities.length - index
    totalWeight += weight
    let dimScore = 50

    switch (priority) {
      case 'academics':
        dimScore = school.graduationRate >= 90 ? 100 : school.graduationRate >= 80 ? 75 : school.graduationRate >= 70 ? 50 : 30
        break
      case 'cost': {
        const netCost = school.tuition - school.avgFinancialAid
        dimScore = netCost < 15000 ? 100 : netCost < 25000 ? 80 : netCost < 35000 ? 55 : netCost < 45000 ? 30 : 15
        break
      }
      case 'campus':
        dimScore = school.features.includes('d1-sports') || school.features.includes('greek-life') ? 90 : 50
        break
      case 'location':
        dimScore = school.setting === 'urban' ? 85 : school.setting === 'suburban' ? 75 : 55
        break
      case 'outcomes':
        dimScore = school.medianEarnings10yr >= 75000 ? 100 : school.medianEarnings10yr >= 60000 ? 75 : school.medianEarnings10yr >= 50000 ? 50 : 30
        break
    }

    score += dimScore * weight
  })

  return Math.round(score / totalWeight)
}

function scoreMajorFit(school: School, major: string | undefined): number {
  if (!major || major.length === 0) return 60

  const majorLower = major.toLowerCase()

  for (const m of school.majorsStrength) {
    if (m.toLowerCase() === majorLower) return 100
  }

  for (const m of school.majorsStrength) {
    const mLower = m.toLowerCase()
    if (mLower.includes(majorLower) || majorLower.includes(mLower)) return 85
  }

  const majorWords = majorLower.split(/\s+/)
  for (const m of school.majorsStrength) {
    const mLower = m.toLowerCase()
    for (const word of majorWords) {
      if (word.length > 3 && mLower.includes(word)) return 70
    }
  }

  return 35
}

function isStudentBelowRange(school: School, gpa: GpaRange | undefined, testScores: TestScore | undefined): boolean {
  const studentGpa = studentGpaMidpoint(gpa)
  const studentSat = studentSatEstimate(testScores)

  const gpaBelowRange = studentGpa < school.avgGPA - 0.3
  const satBelowRange = studentSat !== null && studentSat < school.satRange[0] - 50

  return gpaBelowRange || satBelowRange
}

function computeSchoolMatchScore(school: School, a: ParsedAnswers): number {
  const academic = scoreAcademicFit(school, a.gpa, a.testScores)
  const size = scoreSizeFit(school, a.schoolSize)
  const budget = scoreBudgetFit(school, a.budget)
  const features = scoreFeaturesFit(school, a.mustHaves)
  const priority = scorePriorityAlignment(school, a.priorities)
  const major = scoreMajorFit(school, a.major)

  const weighted =
    academic * 0.30 +
    size * 0.15 +
    budget * 0.20 +
    features * 0.15 +
    priority * 0.10 +
    major * 0.10

  return Math.round(Math.min(100, Math.max(0, weighted)))
}

// --- Categorization ---

function categorizeMatch(matchScore: number, school: School, a: ParsedAnswers): SchoolMatch['category'] {
  const belowRange = isStudentBelowRange(school, a.gpa, a.testScores)

  if (belowRange) return 'smart-reach'
  if (matchScore > 85) return 'best-fit'
  if (matchScore > 70) return 'strong-match'
  if (school.acceptanceRate > 40) return 'hidden-gem'

  return 'strong-match'
}

// --- Personalized reason ---

function generateReason(school: School, a: ParsedAnswers): string {
  const reasons: string[] = []

  if (a.major) {
    const majorLower = a.major.toLowerCase()
    const hasMajorMatch = school.majorsStrength.some(
      m => m.toLowerCase().includes(majorLower) || majorLower.includes(m.toLowerCase())
    )
    if (hasMajorMatch) {
      reasons.push(`strong ${a.major} program`)
    }
  }

  const max = budgetMax(a.budget)
  if (max !== null) {
    const netCost = school.tuition - school.avgFinancialAid
    if (netCost <= max) {
      reasons.push('fits within your budget with financial aid')
    }
  }

  const featureLabels: Record<string, string> = {
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
  const matchedFeatures: string[] = []
  for (const f of a.mustHaves) {
    if (school.features.includes(f) && featureLabels[f]) {
      matchedFeatures.push(featureLabels[f])
    }
  }
  if (matchedFeatures.length > 0) {
    reasons.push(matchedFeatures.slice(0, 2).join(' and '))
  }

  if (a.schoolSize && a.schoolSize !== 'no-preference' && school.size === a.schoolSize) {
    const sizeLabel = school.size === 'small' ? 'small, close-knit' : school.size === 'medium' ? 'mid-sized' : 'large, vibrant'
    reasons.push(`the ${sizeLabel} campus you prefer`)
  }

  if (a.priorities.length > 0) {
    const topPriority = a.priorities[0]
    if (topPriority === 'outcomes' && school.medianEarnings10yr >= 65000) {
      reasons.push('excellent career outcomes')
    } else if (topPriority === 'academics' && school.graduationRate >= 88) {
      reasons.push('top-tier academic quality')
    } else if (topPriority === 'cost' && (school.tuition - school.avgFinancialAid) < 25000) {
      reasons.push('great value for your investment')
    }
  }

  if (reasons.length === 0) {
    return school.description
  }

  return `Matches you with ${reasons.slice(0, 3).join(', ')}.`
}

// --- Strengths & areas to improve ---

function generateStrengths(a: ParsedAnswers): string[] {
  const strengths: string[] = []

  switch (a.gpa) {
    case '3.8-4.0': strengths.push('Exceptional academic foundation with a top-tier GPA'); break
    case '3.5-3.79': strengths.push('Strong academic record that opens many doors'); break
    case '3.0-3.49': strengths.push('Solid GPA with room to stand out through other strengths'); break
  }

  switch (a.testScores) {
    case 'sat-1400+': case 'act-30+': strengths.push('Outstanding standardized test performance'); break
    case 'sat-1200-1399': case 'act-24-29': strengths.push('Competitive standardized test scores'); break
  }

  if (a.grade === 'senior' || a.grade === 'gap') {
    strengths.push('Well-timed in the college planning process')
  } else if (a.grade === 'junior') {
    strengths.push('Getting an early start on college planning')
  }

  if (a.major && a.major !== 'Undecided / Exploring') {
    strengths.push('Clear academic direction with a chosen field of study')
  }

  if (a.priorities.length >= 5) {
    strengths.push('Strong sense of what matters most in a college experience')
  }

  return strengths.slice(0, 3)
}

function generateAreasToImprove(a: ParsedAnswers): string[] {
  const areas: string[] = []

  if (a.testScores === 'not-yet') areas.push('Consider taking the SAT or ACT to expand your options')
  if (a.gpa === 'below-2.5' || a.gpa === '2.5-2.99') areas.push('Focus on raising your GPA to strengthen your profile')
  if (a.gpa === 'unknown') areas.push('Calculate your GPA to better target the right schools')
  if (a.budget === 'unsure') areas.push('Have a family conversation about college budget')
  if (!a.major) areas.push('Explore potential majors to identify schools with matching programs')
  if (a.grade === 'freshman' || a.grade === 'sophomore') areas.push('Build extracurriculars and explore interests over the next couple of years')

  return areas.slice(0, 2)
}

// --- Select top matches with diversity ---

function selectTopMatches(scored: SchoolMatch[]): SchoolMatch[] {
  const sorted = [...scored].sort((a, b) => b.matchScore - a.matchScore)
  if (sorted.length <= 3) return sorted

  const selected: SchoolMatch[] = [sorted[0]]
  const usedNames = new Set([sorted[0].school.name])

  const categoryPriority: SchoolMatch['category'][] = ['best-fit', 'strong-match', 'hidden-gem', 'smart-reach']
  for (const cat of categoryPriority) {
    if (selected.length >= 3) break
    const candidate = sorted.find(m => !usedNames.has(m.school.name) && m.category === cat)
    if (candidate) {
      usedNames.add(candidate.school.name)
      selected.push(candidate)
    }
  }

  for (const m of sorted) {
    if (selected.length >= 3) break
    if (!usedNames.has(m.school.name)) {
      usedNames.add(m.school.name)
      selected.push(m)
    }
  }

  return selected.sort((a, b) => b.matchScore - a.matchScore)
}

// --- Main export ---

export function generateResults(answers: Record<string, unknown>): AssessmentResult {
  const a = parseAnswers(answers)
  const readinessScore = calculateReadinessScore(a)

  const variation = Math.floor(Math.random() * 9) - 3
  const percentile = Math.min(98, Math.max(10, readinessScore + variation))

  const allMatches: SchoolMatch[] = SCHOOLS.map(school => {
    const matchScore = computeSchoolMatchScore(school, a)
    const category = categorizeMatch(matchScore, school, a)
    const reason = generateReason(school, a)
    return { school, matchScore, reason, category }
  })

  const topMatches = selectTopMatches(allMatches)
  const strengths = generateStrengths(a)
  const areasToImprove = generateAreasToImprove(a)

  return { readinessScore, percentile, topMatches, strengths, areasToImprove }
}
