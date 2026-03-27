import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Target, BookOpen, Users, FileText, ChevronDown, ChevronUp,
  Loader2, Lock, GraduationCap, Sparkles, CheckCircle2
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

interface TimelineItem {
  month: string
  actions: string[]
}

interface SchoolTier {
  name: string
  reason: string
}

interface Strategy {
  timeline: TimelineItem[]
  school_tiers: {
    reach: SchoolTier[]
    match: SchoolTier[]
    safety: SchoolTier[]
  }
  test_prep: {
    recommendation: string
    target_score: string
    tips: string[]
  }
  extracurricular_tips: string[]
  essay_strategy: {
    key_themes: string[]
    common_pitfalls: string[]
    tips: string[]
  }
}

const PROGRESS_MESSAGES = [
  'Analyzing your profile...',
  'Evaluating school fit...',
  'Building your timeline...',
  'Crafting essay strategy...',
  'Finalizing recommendations...',
]

export default function StrategyPage() {
  const { email, tier } = useAuth()
  const canAccess = tier === 'season' || tier === 'premium'
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressIdx, setProgressIdx] = useState(0)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    timeline: true,
    tiers: true,
    test_prep: false,
    extracurriculars: false,
    essays: false,
  })

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setProgressIdx(0)

    const interval = setInterval(() => {
      setProgressIdx(prev => Math.min(prev + 1, PROGRESS_MESSAGES.length - 1))
    }, 2500)

    try {
      // Try to get assessment data from localStorage or use defaults
      const savedAssessment = localStorage.getItem('acm_assessment_answers')
      const savedMatches = localStorage.getItem('acm_assessment_matches')

      const answers = savedAssessment ? JSON.parse(savedAssessment) : {}
      const matches = savedMatches ? JSON.parse(savedMatches) : []

      const sessionId = localStorage.getItem('acm_chat_session') || crypto.randomUUID()

      const response = await fetch(`${API_BASE_URL}/strategy/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          top_matches: matches.map((m: any) => ({
            school_name: m.school?.name || m.school_name,
            school_id: m.school?.id || m.school_id,
            match_score: m.match_score,
            category: m.category,
          })),
          email,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status === 403) {
          setError('tier_required')
        } else {
          setError(data?.detail || 'Failed to generate strategy')
        }
        return
      }

      const data = await response.json()
      setStrategy(data.strategy)
      setOpenSections({ timeline: true, tiers: true, test_prep: true, extracurriculars: true, essays: true })
    } catch {
      setError('Failed to connect to server')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const tierColors = {
    reach: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
    match: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    safety: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Application Strategy | AI College Matcher</title>
        <meta name="description" content="Get a personalized college application strategy with timeline, school tiers, test prep, and essay guidance." />
      </Helmet>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Season Pass Feature
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Your Application Strategy
          </h1>
          <p className="text-text-light max-w-2xl mx-auto">
            Get a personalized roadmap for your college application journey — from timeline to essay strategy.
          </p>
        </motion.div>

        {/* Generate button or locked state */}
        {!strategy && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100 text-center mb-8"
          >
            {canAccess ? (
              <>
                <Target className="w-12 h-12 text-gold mx-auto mb-4" />
                <h2 className="font-serif text-xl font-bold text-navy mb-2">Ready to Build Your Strategy?</h2>
                <p className="text-text-light text-sm mb-6 max-w-md mx-auto">
                  We'll use your assessment results and matched schools to create a comprehensive application plan.
                </p>
                {error && error !== 'tier_required' && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold rounded-lg transition-all cursor-pointer border-0 text-base shadow-sm hover:shadow-md"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate My Strategy
                </button>
              </>
            ) : (
              <>
                <Lock className="w-12 h-12 text-navy/30 mx-auto mb-4" />
                <h2 className="font-serif text-xl font-bold text-navy mb-2">Season Pass Required</h2>
                <p className="text-text-light text-sm mb-6 max-w-md mx-auto">
                  Application Strategy is available with Season Pass ($29/mo) or Premium ($99/mo).
                </p>
                <Link
                  to="/#pricing"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold rounded-lg transition-all no-underline text-base"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade Now
                </Link>
              </>
            )}
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center mb-8"
          >
            <Loader2 className="w-10 h-10 text-gold mx-auto mb-4 animate-spin" />
            <AnimatePresence mode="wait">
              <motion.p
                key={progressIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-navy font-semibold text-lg"
              >
                {PROGRESS_MESSAGES[progressIdx]}
              </motion.p>
            </AnimatePresence>
            <div className="mt-4 w-64 mx-auto bg-gray-100 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-gold to-gold-dark h-2 rounded-full"
                initial={{ width: '10%' }}
                animate={{ width: `${Math.min(20 + progressIdx * 20, 90)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Strategy Results */}
        {strategy && (
          <div className="space-y-6">
            {/* Timeline */}
            <CollapsibleSection
              title="Application Timeline"
              icon={<Calendar className="w-5 h-5 text-gold" />}
              isOpen={openSections.timeline}
              onToggle={() => toggleSection('timeline')}
            >
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold via-navy to-green-500" />

                {strategy.timeline.map((item, i) => (
                  <motion.div
                    key={item.month}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative mb-8 last:mb-0"
                  >
                    {/* Dot */}
                    <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-white border-2 border-gold" />

                    <div className="bg-warm-gray rounded-xl p-4">
                      <h4 className="font-bold text-navy text-sm mb-2">{item.month}</h4>
                      <ul className="space-y-1.5">
                        {item.actions.map((action, j) => (
                          <li key={j} className="text-sm text-text-light flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CollapsibleSection>

            {/* School Tiers */}
            <CollapsibleSection
              title="School Tier Breakdown"
              icon={<GraduationCap className="w-5 h-5 text-gold" />}
              isOpen={openSections.tiers}
              onToggle={() => toggleSection('tiers')}
            >
              <div className="space-y-4">
                {(['reach', 'match', 'safety'] as const).map(tierKey => {
                  const schools = strategy.school_tiers[tierKey]
                  const colors = tierColors[tierKey]
                  return (
                    <div key={tierKey}>
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${colors.badge} mb-3 capitalize`}>
                        {tierKey} ({schools.length})
                      </span>
                      <div className="grid gap-3">
                        {schools.map((school, i) => (
                          <div key={i} className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
                            <h4 className={`font-bold ${colors.text} text-sm`}>{school.name}</h4>
                            <p className="text-sm text-text-light mt-1">{school.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>

            {/* Test Prep */}
            <CollapsibleSection
              title="Test Prep Strategy"
              icon={<BookOpen className="w-5 h-5 text-gold" />}
              isOpen={openSections.test_prep}
              onToggle={() => toggleSection('test_prep')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-warm-gray rounded-xl p-4">
                    <p className="text-xs text-text-light uppercase tracking-wide mb-1">Recommendation</p>
                    <p className="font-bold text-navy text-sm">{strategy.test_prep.recommendation}</p>
                  </div>
                  <div className="bg-warm-gray rounded-xl p-4">
                    <p className="text-xs text-text-light uppercase tracking-wide mb-1">Target Score</p>
                    <p className="font-bold text-navy text-sm">{strategy.test_prep.target_score}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {strategy.test_prep.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-text-light flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>

            {/* Extracurricular Tips */}
            <CollapsibleSection
              title="Extracurricular Recommendations"
              icon={<Users className="w-5 h-5 text-gold" />}
              isOpen={openSections.extracurriculars}
              onToggle={() => toggleSection('extracurriculars')}
            >
              <ul className="space-y-3">
                {strategy.extracurricular_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-text-light flex items-start gap-3 bg-warm-gray rounded-xl p-4">
                    <span className="w-6 h-6 bg-gold/10 text-gold rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            {/* Essay Strategy */}
            <CollapsibleSection
              title="Essay Strategy"
              icon={<FileText className="w-5 h-5 text-gold" />}
              isOpen={openSections.essays}
              onToggle={() => toggleSection('essays')}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-navy text-sm mb-3">Key Themes to Develop</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.essay_strategy.key_themes.map((theme, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm mb-3">Common Pitfalls to Avoid</h4>
                  <ul className="space-y-2">
                    {strategy.essay_strategy.common_pitfalls.map((pitfall, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2 bg-red-50 rounded-lg p-3">
                        <span className="shrink-0">⚠</span>
                        {pitfall}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm mb-3">Tips</h4>
                  <ul className="space-y-2">
                    {strategy.essay_strategy.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-text-light flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleSection>

            {/* Regenerate */}
            <div className="text-center pt-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-sm text-text-light hover:text-navy transition-colors bg-transparent border-0 cursor-pointer"
              >
                Regenerate Strategy
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 bg-transparent border-0 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-serif text-lg font-bold text-navy">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-light" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-light" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
