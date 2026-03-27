import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FileText, Send, Lock, Star, AlertCircle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const ESSAY_TYPES = [
  'Common App Personal Statement',
  'Supplemental Essay',
  'Why This College',
  'Activities Description',
] as const

type EssayType = typeof ESSAY_TYPES[number]

interface EssayFeedback {
  strengths: string[]
  areas_for_improvement: string[]
  specific_suggestions: string[]
  overall_score: number
  summary: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

export default function EssayPage() {
  const { email } = useAuth()
  const [essayText, setEssayText] = useState('')
  const [essayType, setEssayType] = useState<EssayType>('Common App Personal Statement')
  const [schoolName, setSchoolName] = useState('')
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gated, setGated] = useState(false)
  const [teaser, setTeaser] = useState<string | null>(null)

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0
  const charCount = essayText.length

  async function handleSubmit() {
    if (!essayText.trim()) return
    setLoading(true)
    setError(null)
    setFeedback(null)
    setGated(false)
    setTeaser(null)

    try {
      const response = await fetch(`${API_BASE_URL}/essay/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay_text: essayText,
          essay_type: essayType,
          school_name: schoolName || undefined,
          email: email || undefined,
          session_id: localStorage.getItem('acm_chat_session') || crypto.randomUUID(),
        }),
      })

      if (response.status === 403) {
        const data = await response.json()
        setGated(true)
        setTeaser(data.teaser || null)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to get feedback: ${response.statusText}`)
      }

      const data = await response.json()
      setFeedback(data.feedback)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-gray flex flex-col">
      <Helmet>
        <title>Essay Feedback | AI College Matcher</title>
        <meta name="description" content="Get AI-powered feedback on your college essays. Improve your Common App personal statement, supplemental essays, and more." />
        <link rel="canonical" href="https://aicollegematcher.machomelab.com/essay" />
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-4">
            <FileText className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-navy">Season Pass+ Feature</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Essay Feedback
          </h1>
          <p className="text-text-light max-w-xl mx-auto">
            Get detailed, actionable feedback on your college essays from our AI advisor.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Input */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-navy mb-2">Essay Type</label>
              <select
                value={essayType}
                onChange={e => setEssayType(e.target.value as EssayType)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              >
                {ESSAY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {essayType === 'Why This College' && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-navy mb-2">School Name</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-navy mb-2">Your Essay</label>
                <textarea
                  value={essayText}
                  onChange={e => setEssayText(e.target.value)}
                  placeholder="Paste or write your essay here..."
                  rows={14}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                />
                <div className="flex justify-between mt-2 text-xs text-text-light">
                  <span>{wordCount} words</span>
                  <span>{charCount} characters</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !essayText.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Get Feedback
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!feedback && !gated && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <FileText className="w-10 h-10 text-navy/20 mx-auto mb-3" />
                <p className="text-sm text-text-light">
                  Paste your essay and click "Get Feedback" to receive detailed analysis.
                </p>
              </div>
            )}

            {gated && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold/30">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-navy">Season Pass+ Required</h3>
                </div>
                {teaser && (
                  <p className="text-sm text-text-light mb-4 italic">"{teaser}..."</p>
                )}
                <p className="text-sm text-text-light mb-4">
                  Upgrade to Season Pass or Premium to unlock full essay feedback with detailed scoring and suggestions.
                </p>
                <a
                  href="/#pricing"
                  className="block w-full text-center bg-gradient-to-r from-gold to-gold-dark text-white font-semibold px-5 py-2.5 rounded-lg no-underline"
                >
                  View Plans
                </a>
              </div>
            )}

            {feedback && (
              <>
                {/* Score */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                  <h3 className="text-sm font-semibold text-navy mb-2">Overall Score</h3>
                  <div className="text-5xl font-bold text-navy mb-1">{feedback.overall_score}<span className="text-lg text-text-light">/10</span></div>
                  <p className="text-sm text-text-light">{feedback.summary}</p>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-bold text-navy text-sm">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-text-light flex gap-2">
                        <Star className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-navy text-sm">Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.areas_for_improvement.map((a, i) => (
                      <li key={i} className="text-sm text-text-light flex gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specific Suggestions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-navy text-sm">Specific Suggestions</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.specific_suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-text-light flex gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
