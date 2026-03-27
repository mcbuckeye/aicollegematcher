import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, X, Lock, GraduationCap, Loader2, ThumbsUp, ThumbsDown,
  Trophy, Scale, ChevronRight
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../contexts/AuthContext'
import { listSchools, type School } from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

interface DecisionSchool {
  school_id: number
  school_name: string
  decision_score: number
  pros: string[]
  cons: string[]
  summary: string
}

interface DecisionResult {
  schools: DecisionSchool[]
  recommendation: string
  considerations: string[]
}

const PRIORITY_LABELS = [
  { key: 'academics', label: 'Academics' },
  { key: 'cost', label: 'Cost' },
  { key: 'location', label: 'Location' },
  { key: 'campus_life', label: 'Campus Life' },
  { key: 'career_outcomes', label: 'Career Outcomes' },
] as const

export default function DecisionPage() {
  const { email, tier } = useAuth()
  const canAccess = tier === 'premium'
  const [selectedSchools, setSelectedSchools] = useState<School[]>([])
  const [weights, setWeights] = useState({
    academics: 3,
    cost: 3,
    location: 3,
    campus_life: 3,
    career_outcomes: 3,
  })
  const [result, setResult] = useState<DecisionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<School[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await listSchools({ q: searchQuery, limit: 8 })
        setSearchResults(res.schools.filter(s => !selectedSchools.some(sel => sel.id === s.id)))
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, selectedSchools])

  function addSchool(school: School) {
    if (selectedSchools.length >= 5) return
    if (selectedSchools.some(s => s.id === school.id)) return
    setSelectedSchools(prev => [...prev, school])
    setSearchQuery('')
    setShowSearch(false)
  }

  function removeSchool(id: number) {
    setSelectedSchools(prev => prev.filter(s => s.id !== id))
    setResult(null)
  }

  async function handleAnalyze() {
    if (selectedSchools.length < 2) return
    setLoading(true)
    setError(null)
    setResult(null)

    const sessionId = localStorage.getItem('acm_chat_session') || crypto.randomUUID()
    const savedAnswers = localStorage.getItem('acm_assessment_answers')

    try {
      const response = await fetch(`${API_BASE_URL}/decision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_ids: selectedSchools.map(s => s.id),
          weights,
          answers: savedAnswers ? JSON.parse(savedAnswers) : null,
          email,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        if (response.status === 403) {
          setError('tier_required')
        } else {
          setError('Failed to analyze. Please try again.')
        }
        return
      }

      const data = await response.json()
      setResult(data)
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Decision Support | AI College Matcher</title>
        <meta name="description" content="Compare admitted schools with personalized pros, cons, and a decision score based on your priorities." />
      </Helmet>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Scale className="w-4 h-4" />
            Premium Feature
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Decision Support
          </h1>
          <p className="text-text-light max-w-2xl mx-auto">
            Compare your admitted schools. Rate your priorities, and we'll help you make the right choice.
          </p>
        </motion.div>

        {/* Locked state */}
        {!canAccess && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <Lock className="w-12 h-12 text-navy/30 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-navy mb-2">Premium Required</h2>
            <p className="text-text-light text-sm mb-6">Decision Support is available with Premium ($99/mo).</p>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold rounded-lg transition-all no-underline"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {canAccess && (
          <div className="space-y-6">
            {/* School selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-serif text-lg font-bold text-navy mb-4">Add Your Admitted Schools</h2>

              <div className="relative" ref={searchRef}>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-navy transition-colors">
                  <Search className="w-5 h-5 text-text-light shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search for a school..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-navy placeholder-text-light"
                    disabled={selectedSchools.length >= 5}
                  />
                </div>

                {showSearch && searchQuery && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 text-sm text-text-light text-center">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-sm text-text-light text-center">No schools found</div>
                    ) : (
                      searchResults.map(school => (
                        <button
                          key={school.id}
                          onClick={() => addSchool(school)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-gray transition-colors bg-transparent border-0 cursor-pointer text-left"
                        >
                          <GraduationCap className="w-4 h-4 text-navy shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-navy">{school.name}</p>
                            <p className="text-xs text-text-light">{school.city}, {school.state}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedSchools.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedSchools.map(school => (
                    <span
                      key={school.id}
                      className="inline-flex items-center gap-1.5 bg-navy/10 text-navy text-sm px-3 py-1.5 rounded-full"
                    >
                      {school.name}
                      <button
                        onClick={() => removeSchool(school.id)}
                        className="bg-transparent border-0 cursor-pointer p-0 text-navy/50 hover:text-navy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Priority weights */}
            {selectedSchools.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="font-serif text-lg font-bold text-navy mb-4">Rate Your Priorities</h2>
                <p className="text-sm text-text-light mb-6">How important is each factor? (1 = low, 5 = high)</p>

                <div className="space-y-5">
                  {PRIORITY_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-navy">{label}</span>
                        <span className="text-sm font-bold text-gold">{weights[key as keyof typeof weights]}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={weights[key as keyof typeof weights]}
                        onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                        className="w-full accent-gold h-2 rounded-lg appearance-none bg-gray-200 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-text-light mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || selectedSchools.length < 2}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold rounded-lg transition-all cursor-pointer border-0 text-base shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scale className="w-5 h-5" />
                        Analyze My Options
                      </>
                    )}
                  </button>
                  {error && error !== 'tier_required' && (
                    <p className="text-red-500 text-sm mt-3">{error}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Recommendation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-6 text-white"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-gold" />
                    <h3 className="font-serif text-lg font-bold">Our Recommendation</h3>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{result.recommendation}</p>
                  {result.considerations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Key Considerations</p>
                      <ul className="space-y-1.5">
                        {result.considerations.map((c, i) => (
                          <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>

                {/* School cards with scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.schools.map((school, i) => (
                    <motion.div
                      key={school.school_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-serif font-bold text-navy">{school.school_name}</h3>
                          {i === 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full mt-1">
                              <Trophy className="w-3 h-3" />
                              Top Pick
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy/10 to-navy/5 flex items-center justify-center">
                            <span className="text-lg font-bold text-navy">{Math.round(school.decision_score)}</span>
                          </div>
                          <p className="text-xs text-text-light mt-1">Score</p>
                        </div>
                      </div>

                      {school.summary && (
                        <p className="text-sm text-text-light mb-4 italic">{school.summary}</p>
                      )}

                      {/* Pros */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Pros
                        </p>
                        <ul className="space-y-1.5">
                          {school.pros.map((pro, j) => (
                            <li key={j} className="text-sm text-text-light flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons */}
                      <div>
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> Cons
                        </p>
                        <ul className="space-y-1.5">
                          {school.cons.map((con, j) => (
                            <li key={j} className="text-sm text-text-light flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
