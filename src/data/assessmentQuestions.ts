export type QuestionType =
  | 'single'
  | 'range'
  | 'searchable'
  | 'ranking'
  | 'checkbox'
  | 'text'

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  id: string
  title: string
  subtitle?: string
  type: QuestionType
  options?: QuestionOption[]
  placeholder?: string
}

export const questions: Question[] = [
  {
    id: 'grade',
    title: 'What grade are you in?',
    subtitle: 'Or select your current status',
    type: 'single',
    options: [
      { value: 'freshman', label: 'High School Freshman' },
      { value: 'sophomore', label: 'High School Sophomore' },
      { value: 'junior', label: 'High School Junior' },
      { value: 'senior', label: 'High School Senior' },
      { value: 'gap', label: 'Gap Year / Transfer' },
    ],
  },
  {
    id: 'gpa',
    title: "What's your approximate GPA?",
    subtitle: 'Select the range that best fits',
    type: 'single',
    options: [
      { value: '3.8-4.0', label: '3.8 - 4.0' },
      { value: '3.5-3.79', label: '3.5 - 3.79' },
      { value: '3.0-3.49', label: '3.0 - 3.49' },
      { value: '2.5-2.99', label: '2.5 - 2.99' },
      { value: 'below-2.5', label: 'Below 2.5' },
      { value: 'unknown', label: "I'm not sure" },
    ],
  },
  {
    id: 'testScores',
    title: 'Have you taken the SAT or ACT?',
    subtitle: 'Select your score range or testing status',
    type: 'single',
    options: [
      { value: 'sat-1400+', label: 'SAT 1400+' },
      { value: 'sat-1200-1399', label: 'SAT 1200 - 1399' },
      { value: 'sat-1000-1199', label: 'SAT 1000 - 1199' },
      { value: 'sat-below-1000', label: 'SAT Below 1000' },
      { value: 'act-30+', label: 'ACT 30+' },
      { value: 'act-24-29', label: 'ACT 24 - 29' },
      { value: 'act-below-24', label: 'ACT Below 24' },
      { value: 'not-yet', label: "Haven't taken it yet" },
      { value: 'test-optional', label: 'Planning to go test-optional' },
    ],
  },
  {
    id: 'major',
    title: 'What do you want to study?',
    subtitle: "It's okay if you're not sure yet",
    type: 'searchable',
  },
  {
    id: 'schoolSize',
    title: 'What school size appeals to you?',
    subtitle: 'Think about the kind of environment you want',
    type: 'single',
    options: [
      { value: 'small', label: 'Small (under 5,000 students)' },
      { value: 'medium', label: 'Medium (5,000 - 15,000)' },
      { value: 'large', label: 'Large (15,000+)' },
      { value: 'no-preference', label: 'No preference' },
    ],
  },
  {
    id: 'distance',
    title: 'How far from home are you willing to go?',
    subtitle: 'Distance can shape your whole experience',
    type: 'single',
    options: [
      { value: 'commute', label: 'Commuting distance' },
      { value: 'nearby', label: '1 - 3 hours away' },
      { value: 'anywhere', label: 'Anywhere in the US' },
      { value: 'international', label: 'Open to international' },
    ],
  },
  {
    id: 'zipCode',
    title: 'What is your zip code?',
    subtitle: 'Used to calculate distances to schools',
    type: 'text',
    placeholder: '12345',
  },
  {
    id: 'priorities',
    title: 'What matters most to you?',
    subtitle: 'Drag to rank from most to least important',
    type: 'ranking',
    options: [
      { value: 'academics', label: 'Academic reputation' },
      { value: 'cost', label: 'Affordability' },
      { value: 'campus', label: 'Campus life' },
      { value: 'location', label: 'Location' },
      { value: 'outcomes', label: 'Career outcomes' },
    ],
  },
  {
    id: 'budget',
    title: "What's your family's college budget?",
    subtitle: 'Per year, including financial aid expectations',
    type: 'single',
    options: [
      { value: 'under-15k', label: 'Under $15,000/year' },
      { value: '15k-30k', label: '$15,000 - $30,000/year' },
      { value: '30k-50k', label: '$30,000 - $50,000/year' },
      { value: '50k+', label: '$50,000+/year' },
      { value: 'unsure', label: "Not sure yet" },
    ],
  },
  {
    id: 'mustHaves',
    title: 'Any must-haves?',
    subtitle: 'Select all that apply',
    type: 'checkbox',
    options: [
      { value: 'd1-sports', label: 'Division I Sports' },
      { value: 'greek-life', label: 'Greek Life' },
      { value: 'research', label: 'Research Opportunities' },
      { value: 'coop', label: 'Co-op / Internship Programs' },
      { value: 'urban', label: 'Urban Campus' },
      { value: 'rural', label: 'Rural / College Town' },
      { value: 'religious', label: 'Religious Affiliation' },
      { value: 'diversity', label: 'Strong Diversity' },
      { value: 'study-abroad', label: 'Study Abroad Programs' },
      { value: 'honors', label: 'Honors Program' },
    ],
  },
  {
    id: 'biggestWorry',
    title: "What's your biggest worry about college?",
    subtitle: 'Be honest — there are no wrong answers',
    type: 'text',
    placeholder: 'e.g., "I\'m worried about affording it" or "I\'m not sure I\'ll get into the schools I want"',
  },
  {
    id: 'email',
    title: "What's your email address?",
    subtitle: "We'll send your detailed results and personalized college recommendations",
    type: 'text',
    placeholder: 'you@example.com',
  },
]
