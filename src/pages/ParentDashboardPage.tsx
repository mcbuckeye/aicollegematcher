import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Lock, DollarSign, TrendingUp, Shield, GraduationCap, Calendar,
  Loader2, BarChart3, AlertCircle, Printer
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

interface SchoolSummary {
  school_id: number
  school_name: string
  city: string | null
  state: string | null
  sticker_price: number | null
  estimated_net_price: number | null
  avg_financial_aid: number | null
  median_debt: number | null
  monthly_payment: number | null
  debt_to_income_ratio: number | null
  pell_grant_rate: number | null
  federal_loan_rate: number | null
  graduation_rate: number | null
  retention_rate: number | null
  median_earnings_10yr: number | null
  roi: number | null
  acceptance_rate: number | null
}

interface ParentData {
  student_summary: {
    grade: string
    gpa: string
    intended_major: string
    budget: string
    priorities: string[]
  }
  schools: SchoolSummary[]
}

export default function ParentDashboardPage() {
  const { email, tier } = useAuth()
  const canAccess = tier === 'premium'
  const [data, setData] = useState<ParentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canAccess) return

    const savedMatches = localStorage.getItem('acm_assessment_matches')
    const savedAnswers = localStorage.getItem('acm_assessment_answers')
    if (!savedMatches || !savedAnswers) return

    const matches = JSON.parse(savedMatches)
    const answers = JSON.parse(savedAnswers)
    const schoolIds = matches.slice(0, 5).map((m: any) => m.school?.id || m.school_id).filter(Boolean)

    if (schoolIds.length === 0) return

    setLoading(true)
    fetch(`${API_BASE_URL}/parent/dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, school_ids: schoolIds, email }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Failed to load parent dashboard'))
      .finally(() => setLoading(false))
  }, [canAccess, email])

  function fmtDollars(v: number | null) {
    return v != null ? `$${v.toLocaleString()}` : '—'
  }

  function fmtPercent(v: number | null) {
    if (v == null) return '—'
    return v < 1 ? `${(v * 100).toFixed(0)}%` : `${v}%`
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Parent Dashboard | AI College Matcher</title>
        <meta name="description" content="A parent-friendly view of your student's college matches with cost analysis, ROI, and financial aid data." />
      </Helmet>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Shield className="w-4 h-4" />
            Premium Feature
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Parent Dashboard
          </h1>
          <p className="text-text-light max-w-2xl mx-auto">
            A clear, parent-focused summary of your student's college options with costs, outcomes, and financial aid data.
          </p>
          {canAccess && data && (
            <button
              onClick={() => window.print()}
              className="mt-4 inline-flex items-center gap-2 text-sm text-text-light hover:text-navy transition-colors bg-transparent border-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print This Page
            </button>
          )}
        </motion.div>

        {/* Locked state */}
        {!canAccess && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <Lock className="w-12 h-12 text-navy/30 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-bold text-navy mb-2">Premium Required</h2>
            <p className="text-text-light text-sm mb-6 max-w-md mx-auto">
              The Parent Dashboard is available with Premium ($99/mo).
            </p>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold rounded-lg transition-all no-underline"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <Loader2 className="w-8 h-8 text-gold mx-auto mb-3 animate-spin" />
            <p className="text-navy font-semibold">Loading dashboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-2xl p-6 text-red-700 text-center text-sm">{error}</div>
        )}

        {/* Dashboard content */}
        {data && !loading && (
          <div className="space-y-8 print:space-y-4">
            {/* Student summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="font-serif text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gold" />
                Student Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-warm-gray rounded-xl p-3">
                  <p className="text-xs text-text-light">Grade</p>
                  <p className="font-bold text-navy text-sm">{data.student_summary.grade}</p>
                </div>
                <div className="bg-warm-gray rounded-xl p-3">
                  <p className="text-xs text-text-light">GPA</p>
                  <p className="font-bold text-navy text-sm">{data.student_summary.gpa}</p>
                </div>
                <div className="bg-warm-gray rounded-xl p-3">
                  <p className="text-xs text-text-light">Intended Major</p>
                  <p className="font-bold text-navy text-sm">{data.student_summary.intended_major}</p>
                </div>
                <div className="bg-warm-gray rounded-xl p-3">
                  <p className="text-xs text-text-light">Budget</p>
                  <p className="font-bold text-navy text-sm">{data.student_summary.budget}</p>
                </div>
              </div>
            </motion.div>

            {/* Cost Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="font-serif text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Cost Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-text-light py-2 pr-4">School</th>
                      <th className="text-right text-xs text-text-light py-2 px-3">Sticker Price</th>
                      <th className="text-right text-xs text-text-light py-2 px-3">Est. Net Price</th>
                      <th className="text-right text-xs text-text-light py-2 px-3">Avg. Aid</th>
                      <th className="text-right text-xs text-text-light py-2 pl-3">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schools.map(school => {
                      const savings = school.sticker_price && school.estimated_net_price
                        ? school.sticker_price - school.estimated_net_price
                        : null
                      return (
                        <tr key={school.school_id} className="border-b border-gray-50">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-navy text-sm">{school.school_name}</p>
                            <p className="text-xs text-text-light">{school.city}, {school.state}</p>
                          </td>
                          <td className="text-right text-sm py-3 px-3">{fmtDollars(school.sticker_price)}</td>
                          <td className="text-right text-sm py-3 px-3 font-semibold text-navy">{fmtDollars(school.estimated_net_price)}</td>
                          <td className="text-right text-sm py-3 px-3 text-green-600">{fmtDollars(school.avg_financial_aid)}</td>
                          <td className="text-right text-sm py-3 pl-3 text-green-600 font-semibold">
                            {savings != null ? fmtDollars(savings) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Visual bar chart */}
              <div className="mt-6 space-y-3">
                <p className="text-xs text-text-light font-semibold uppercase tracking-wide">Sticker vs. Net Price</p>
                {data.schools.map(school => {
                  const maxPrice = Math.max(...data.schools.map(s => s.sticker_price || 0))
                  const stickerWidth = school.sticker_price ? (school.sticker_price / maxPrice) * 100 : 0
                  const netWidth = school.estimated_net_price ? (school.estimated_net_price / maxPrice) * 100 : 0
                  return (
                    <div key={school.school_id} className="space-y-1">
                      <p className="text-xs text-navy font-medium">{school.school_name}</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-red-200 rounded" style={{ width: `${stickerWidth}%`, minWidth: '4px' }} />
                          <span className="text-xs text-text-light whitespace-nowrap">{fmtDollars(school.sticker_price)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-green-300 rounded" style={{ width: `${netWidth}%`, minWidth: '4px' }} />
                          <span className="text-xs text-text-light whitespace-nowrap">{fmtDollars(school.estimated_net_price)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs text-text-light"><span className="w-3 h-3 bg-red-200 rounded inline-block" /> Sticker Price</span>
                  <span className="flex items-center gap-1 text-xs text-text-light"><span className="w-3 h-3 bg-green-300 rounded inline-block" /> Net Price</span>
                </div>
              </div>
            </motion.div>

            {/* ROI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="font-serif text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                ROI Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.schools.map(school => (
                  <div key={school.school_id} className="bg-warm-gray rounded-xl p-4">
                    <h4 className="font-bold text-navy text-sm mb-3">{school.school_name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">10yr Earnings</span>
                        <span className="font-semibold text-navy">{fmtDollars(school.median_earnings_10yr)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">4yr Cost</span>
                        <span className="font-semibold text-navy">
                          {school.sticker_price ? fmtDollars(school.sticker_price * 4) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">ROI Ratio</span>
                        <span className={`font-bold ${school.roi && school.roi > 1 ? 'text-green-600' : 'text-red-500'}`}>
                          {school.roi ? `${school.roi}x` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">Median Debt</span>
                        <span className="font-semibold text-navy">{fmtDollars(school.median_debt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">Monthly Payment</span>
                        <span className="font-semibold text-navy">
                          {school.monthly_payment ? `$${Math.round(school.monthly_payment)}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">Debt/Income</span>
                        <span className={`font-bold ${school.debt_to_income_ratio && school.debt_to_income_ratio < 0.5 ? 'text-green-600' : 'text-amber-600'}`}>
                          {school.debt_to_income_ratio ? `${(school.debt_to_income_ratio * 100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Financial Aid Likelihood */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="font-serif text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Financial Aid Likelihood
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-text-light py-2 pr-4">School</th>
                      <th className="text-right text-xs text-text-light py-2 px-3">Pell Grant Rate</th>
                      <th className="text-right text-xs text-text-light py-2 px-3">Fed. Loan Rate</th>
                      <th className="text-right text-xs text-text-light py-2 pl-3">Graduation Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schools.map(school => (
                      <tr key={school.school_id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 text-sm font-semibold text-navy">{school.school_name}</td>
                        <td className="text-right text-sm py-3 px-3">{fmtPercent(school.pell_grant_rate)}</td>
                        <td className="text-right text-sm py-3 px-3">{fmtPercent(school.federal_loan_rate)}</td>
                        <td className="text-right text-sm py-3 pl-3">{fmtPercent(school.graduation_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* What Parents Should Know */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="font-serif text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gold" />
                What Parents Should Know
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-warm-gray rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-navy" />
                    <h4 className="font-bold text-navy text-sm">Key Deadlines</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-text-light">
                    <li>FAFSA opens October 1</li>
                    <li>CSS Profile: varies by school</li>
                    <li>Early Decision: Nov 1-15</li>
                    <li>Early Action: Nov 1-15</li>
                    <li>Regular Decision: Jan 1-15</li>
                    <li>Scholarship deadlines: varies</li>
                  </ul>
                </div>
                <div className="bg-warm-gray rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-navy" />
                    <h4 className="font-bold text-navy text-sm">Financial Aid Tips</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-text-light">
                    <li>File FAFSA as early as possible</li>
                    <li>Compare net prices, not sticker prices</li>
                    <li>Appeal aid offers if needed</li>
                    <li>Look for merit-based scholarships</li>
                    <li>Consider work-study options</li>
                    <li>Review 529 plan withdrawal rules</li>
                  </ul>
                </div>
                <div className="bg-warm-gray rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-navy" />
                    <h4 className="font-bold text-navy text-sm">Campus Visit Questions</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-text-light">
                    <li>What % of students get aid?</li>
                    <li>Average class size for freshmen?</li>
                    <li>Internship/co-op placement rate?</li>
                    <li>Campus safety measures?</li>
                    <li>Support services available?</li>
                    <li>Guaranteed housing for freshmen?</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* No data state */}
        {canAccess && !loading && !data && !error && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <GraduationCap className="w-10 h-10 text-navy/20 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold text-navy mb-2">No Assessment Data</h3>
            <p className="text-sm text-text-light mb-4">
              Take the assessment first to generate your parent dashboard.
            </p>
            <Link
              to="/assess"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold rounded-lg transition-all no-underline text-sm"
            >
              Take Assessment
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
