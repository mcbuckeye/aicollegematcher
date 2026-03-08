import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  GripVertical,
  Lock,
  ChevronDown,
  Search,
  Share2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react'
import { questions, type Question } from '../data/assessmentQuestions'
import { MAJORS } from '../data/majors'
import { submitAssessment, type AssessmentResult, type SchoolMatch } from '../services/api'
import ScoreGauge from '../components/ScoreGauge'

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export default function AssessmentPage() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [resultEmail, setResultEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const question = questions[step]
  const isLast = step === questions.length - 1
  const progress = result ? 100 : ((step + 1) / questions.length) * 100

  function setAnswer(value: unknown) {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
  }

  function canAdvance() {
    if (question.id === 'zipCode') return true  // zip code is optional
    const a = answers[question.id]
    if (!a) return false
    if (question.type === 'checkbox') return (a as string[]).length > 0
    if (question.type === 'ranking') return (a as string[]).length === question.options!.length
    if (question.type === 'text') return (a as string).trim().length > 0
    return true
  }

  async function next() {
    if (!canAdvance()) return
    if (isLast) {
      try {
        const result = await submitAssessment(answers)
        setResult(result)
      } catch (error) {
        console.error('Failed to submit assessment:', error)
        // Optionally show an error message to the user
      }
    } else {
      setDir(1)
      setStep(s => s + 1)
    }
  }

  function prev() {
    if (step > 0) {
      setDir(-1)
      setStep(s => s - 1)
    }
  }

  if (result) {
    return (
      <ResultsScreen
        result={result}
        email={resultEmail}
        setEmail={setResultEmail}
        submitted={emailSubmitted}
        setSubmitted={setEmailSubmitted}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-navy no-underline">
            <GraduationCap className="w-6 h-6" />
            <span className="font-serif font-bold text-sm hidden sm:inline">AI College Matcher</span>
          </Link>
          <span className="text-sm text-text-light">
            {step + 1} of {questions.length}
          </span>
        </div>
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-gold to-gold-dark"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={question.id}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
                {question.title}
              </h2>
              {question.subtitle && (
                <p className="text-text-light mb-8">{question.subtitle}</p>
              )}

              <QuestionInput
                question={question}
                value={answers[question.id]}
                onChange={setAnswer}
                onSubmit={next}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-2 text-text-light hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent border-0 text-base"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canAdvance()}
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-all disabled:cursor-not-allowed cursor-pointer border-0 text-base"
          >
            {isLast ? 'See Results' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------ Question Input Components ------ */

function QuestionInput({
  question,
  value,
  onChange,
  onSubmit,
}: {
  question: Question
  value: unknown
  onChange: (v: unknown) => void
  onSubmit: () => void
}) {
  switch (question.type) {
    case 'single':
      return <SingleSelect options={question.options!} value={value as string} onChange={onChange} />
    case 'searchable':
      return <SearchableSelect value={value as string} onChange={onChange} />
    case 'ranking':
      return <RankingInput options={question.options!} value={value as string[] | undefined} onChange={onChange} />
    case 'checkbox':
      return <CheckboxInput options={question.options!} value={value as string[] | undefined} onChange={onChange} />
    case 'text':
      return <TextInput value={value as string} onChange={onChange} onSubmit={onSubmit} placeholder={question.placeholder} />
    default:
      return null
  }
}

function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all cursor-pointer text-base ${
            value === opt.value
              ? 'border-navy bg-navy/5 text-navy font-medium'
              : 'border-gray-200 hover:border-navy/30 text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SearchableSelect({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (v: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return MAJORS
    const q = query.toLowerCase()
    return MAJORS.filter(m => m.toLowerCase().includes(q))
  }, [query])

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center border-2 rounded-xl px-4 py-3 transition-colors ${
          open ? 'border-navy' : 'border-gray-200'
        }`}
      >
        <Search className="w-5 h-5 text-text-light mr-3 shrink-0" />
        <input
          type="text"
          value={open ? query : value || query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search majors..."
          className="flex-1 outline-none bg-transparent text-base"
        />
        <ChevronDown className={`w-5 h-5 text-text-light transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-10 mt-2 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-text-light text-sm">No majors found</div>
            ) : (
              filtered.map(m => (
                <button
                  key={m}
                  onClick={() => { onChange(m); setQuery(m); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-navy/5 transition-colors cursor-pointer text-sm border-0 bg-transparent ${
                    value === m ? 'text-navy font-medium bg-navy/5' : 'text-text'
                  }`}
                >
                  {m}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RankingInput({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string[] | undefined
  onChange: (v: string[]) => void
}) {
  const ranked = value || []
  const unranked = options.filter(o => !ranked.includes(o.value))

  function addItem(val: string) {
    onChange([...ranked, val])
  }

  function removeItem(val: string) {
    onChange(ranked.filter(v => v !== val))
  }

  const getLabel = (val: string) => options.find(o => o.value === val)?.label || val

  return (
    <div>
      {ranked.length > 0 && (
        <div className="space-y-2 mb-4">
          {ranked.map((val, i) => (
            <div
              key={val}
              className="flex items-center gap-3 bg-navy/5 border-2 border-navy/20 rounded-xl px-4 py-3"
            >
              <GripVertical className="w-4 h-4 text-navy/40 shrink-0" />
              <span className="w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 font-medium text-navy text-sm">{getLabel(val)}</span>
              <button
                onClick={() => removeItem(val)}
                className="text-text-light hover:text-red-500 text-xs cursor-pointer bg-transparent border-0"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      {unranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-light mb-1">
            {ranked.length === 0 ? 'Tap in order of importance:' : 'Remaining:'}
          </p>
          {unranked.map(opt => (
            <button
              key={opt.value}
              onClick={() => addItem(opt.value)}
              className="w-full text-left px-5 py-3 rounded-xl border-2 border-gray-200 hover:border-navy/30 transition-all cursor-pointer text-sm bg-transparent text-text"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckboxInput({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string[] | undefined
  onChange: (v: string[]) => void
}) {
  const selected = value || []

  function toggle(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(opt => {
        const isOn = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-sm ${
              isOn
                ? 'border-navy bg-navy/5 text-navy font-medium'
                : 'border-gray-200 hover:border-navy/30 text-text'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string | undefined
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          onSubmit()
        }
      }}
      placeholder={placeholder}
      rows={4}
      className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-navy outline-none resize-none transition-colors text-base"
    />
  )
}

/* ------ Results Screen ------ */

function ResultsScreen({
  result,
  email,
  setEmail,
  submitted,
  setSubmitted,
}: {
  result: AssessmentResult
  email: string
  setEmail: (e: string) => void
  submitted: boolean
  setSubmitted: (s: boolean) => void
}) {
  function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    console.log('[Assessment email capture]', email)
    setSubmitted(true)
  }

  function shareResults() {
    const text = `I scored ${result.readiness_score}/100 on the AI College Matcher readiness assessment! Find your score:`
    const url = window.location.origin
    if (navigator.share) {
      navigator.share({ title: 'My College Readiness Score', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        alert('Link copied to clipboard!')
      }).catch(() => {})
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'best-fit': return 'Best Fit'
      case 'strong-match': return 'Strong Match'
      case 'smart-reach': return 'Smart Reach'
      case 'hidden-gem': return 'Hidden Gem'
      default: return cat
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'best-fit': return 'bg-green-100 text-green-700'
      case 'strong-match': return 'bg-blue-100 text-blue-700'
      case 'smart-reach': return 'bg-purple-100 text-purple-700'
      case 'hidden-gem': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-navy no-underline">
            <GraduationCap className="w-6 h-6" />
            <span className="font-serif font-bold text-sm">AI College Matcher</span>
          </Link>
          <button
            onClick={shareResults}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-navy transition-colors bg-transparent border-0 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm text-center mb-6 border border-gray-100"
        >
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
            Your College Readiness Score
          </h1>
          <p className="text-text-light mb-8">Based on your responses, here's where you stand.</p>
          <div className="flex justify-center mb-6">
            <ScoreGauge score={result.readiness_score} size={200} />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-sm text-text-light"
          >
            You scored higher than <span className="font-bold text-navy">{result.percentile}%</span> of students
          </motion.p>
        </motion.div>

        {/* Strengths & Areas to improve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 font-bold text-navy text-sm mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {result.strengths.map(s => (
                <li key={s} className="text-sm text-text-light flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="flex items-center gap-2 font-bold text-navy text-sm mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Areas to Strengthen
            </h3>
            <ul className="space-y-2">
              {result.areas_to_improve.map((a: string) => (
                <li key={a} className="text-sm text-text-light flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Top matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-sm mb-6 border border-gray-100"
        >
          <h2 className="font-serif text-xl font-bold text-navy mb-6">Your Top 3 Matches</h2>
          <div className="space-y-4">
            {result.top_matches.map((match: any, i: number) => (
              <SchoolCard key={match.school.name} match={match} index={i} getCategoryLabel={getCategoryLabel} getCategoryColor={getCategoryColor} />
            ))}
          </div>

          {/* Blurred teaser */}
          <div className="mt-6 relative">
            <div className="blur-sm pointer-events-none select-none">
              <div className="p-4 rounded-xl bg-warm-gray mb-3">
                <h4 className="font-bold text-navy">Detailed Program Analysis</h4>
                <p className="text-sm text-text-light">Department rankings, research opportunities, faculty strengths, co-op pipelines...</p>
              </div>
              <div className="p-4 rounded-xl bg-warm-gray">
                <h4 className="font-bold text-navy">Application Strategy</h4>
                <p className="text-sm text-text-light">ED/EA recommendations, timeline, acceptance probability by school...</p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg text-center border border-gray-100">
                <Lock className="w-6 h-6 text-navy mx-auto mb-2" />
                <p className="font-bold text-navy text-sm">Unlock Your Full Report</p>
                <p className="text-xs text-text-light">Detailed analysis of 10-15 schools</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Email capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-8 text-center text-white"
        >
          <h2 className="font-serif text-xl font-bold mb-2">Get Your Full Personalized Report</h2>
          <p className="text-white/70 text-sm mb-6">
            Enter your email and we'll send you the detailed report with 10-15 matched schools.
          </p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <p className="text-gold font-semibold">You're on the list! We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer border-0 text-base whitespace-nowrap"
              >
                Unlock Report
              </button>
            </form>
          )}
        </motion.div>

        {/* Social share + retake */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-6 mt-8"
        >
          <button
            onClick={shareResults}
            className="inline-flex items-center gap-2 text-sm text-text-light hover:text-navy transition-colors bg-transparent border-0 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </button>
          <span className="text-gray-300">|</span>
          <Link
            to="/assess"
            onClick={() => window.location.reload()}
            className="text-sm text-text-light hover:text-navy transition-colors no-underline"
          >
            Retake Assessment
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

function SchoolCard({
  match,
  index,
  getCategoryLabel,
  getCategoryColor,
}: {
  match: SchoolMatch
  index: number
  getCategoryLabel: (cat: string) => string
  getCategoryColor: (cat: string) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.15 }}
      className="p-5 rounded-xl bg-warm-gray border border-gray-100"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-navy">{match.school.name}</h3>
            <span className="text-sm font-bold text-gold whitespace-nowrap">{match.match_score}% match</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-light mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.school.city}, {match.school.state}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(match.school.enrollment || 0).toLocaleString()} students
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {Math.round((match.school.tuition || 0) / 1000)}k/yr
            </span>
          </div>
          <p className="text-sm text-text-light">{match.reason}</p>
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getCategoryColor(match.category)}`}>
            {getCategoryLabel(match.category)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
