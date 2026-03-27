import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Filter,
  ArrowUpDown,
  Briefcase,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMajorsExplorer, type MajorSummary } from '../services/api'

const fadeUp = {
  hidden: { opacity: 0.15, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'stem', label: 'STEM' },
  { value: 'business', label: 'Business' },
  { value: 'arts-humanities', label: 'Arts & Humanities' },
  { value: 'health-medicine', label: 'Health & Medicine' },
  { value: 'social-sciences', label: 'Social Sciences' },
  { value: 'education', label: 'Education' },
  { value: 'trade-applied', label: 'Trade & Applied' },
]

const SORT_OPTIONS = [
  { value: 'ai_score', label: 'AI Disruption Score' },
  { value: 'salary', label: 'Median Salary' },
  { value: 'growth', label: 'Growth Rate' },
]

function DisruptionGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const getColor = (s: number) => {
    if (s <= 25) return { bg: 'bg-green-100', fill: 'bg-green-500', text: 'text-green-700' }
    if (s <= 50) return { bg: 'bg-yellow-100', fill: 'bg-yellow-500', text: 'text-yellow-700' }
    if (s <= 70) return { bg: 'bg-orange-100', fill: 'bg-orange-500', text: 'text-orange-700' }
    return { bg: 'bg-red-100', fill: 'bg-red-500', text: 'text-red-700' }
  }
  const colors = getColor(score)
  const w = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${colors.bg} rounded-full ${w} overflow-hidden`}>
        <div
          className={`${colors.fill} ${w} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${colors.text} tabular-nums min-w-[2.5rem] text-right`}>{score}</span>
    </div>
  )
}

function getTierBadge(tier: string) {
  switch (tier) {
    case 'low': return { label: 'Low Risk', cls: 'bg-green-100 text-green-700' }
    case 'moderate': return { label: 'Moderate', cls: 'bg-yellow-100 text-yellow-700' }
    case 'high': return { label: 'High Risk', cls: 'bg-orange-100 text-orange-700' }
    case 'very-high': return { label: 'Very High', cls: 'bg-red-100 text-red-700' }
    default: return { label: tier, cls: 'bg-gray-100 text-gray-700' }
  }
}

function getOutlookBadge(outlook: string) {
  switch (outlook) {
    case 'strong': return { label: 'Strong Outlook', cls: 'bg-green-100 text-green-700' }
    case 'moderate': return { label: 'Moderate Outlook', cls: 'bg-yellow-100 text-yellow-700' }
    case 'uncertain': return { label: 'Uncertain', cls: 'bg-orange-100 text-orange-700' }
    case 'declining': return { label: 'Declining', cls: 'bg-red-100 text-red-700' }
    default: return { label: outlook, cls: 'bg-gray-100 text-gray-700' }
  }
}

export default function MajorExplorerPage() {
  const [majors, setMajors] = useState<MajorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('ai_score')

  useEffect(() => {
    setLoading(true)
    getMajorsExplorer({ sort, category: category || undefined })
      .then(data => setMajors(data.majors))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sort, category])

  const filtered = useMemo(() => {
    if (!search) return majors
    const q = search.toLowerCase()
    return majors.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.example_careers.some(c => c.toLowerCase().includes(q))
    )
  }, [majors, search])

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Explore Majors &amp; AI Disruption Index | AI College Matcher</title>
        <meta name="description" content="Explore 60+ college majors with AI disruption scores, salary data, growth rates, and career outlooks. Make future-proof career choices." />
        <link rel="canonical" href="https://aicollegematcher.machomelab.com/majors" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-navy/5 to-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-gradient-to-tl from-gold/5 to-navy/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-navy">AI Disruption Index</span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            <span className="text-navy">Explore Majors in the</span>
            <br />
            <span className="bg-gradient-to-r from-gold-dark via-gold to-gold-light bg-clip-text text-transparent animate-gradient">
              Age of AI
            </span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg sm:text-xl text-text-light max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Understand how AI is reshaping every career field. Make informed decisions
            about your major with real data on salaries, growth, and AI impact.
          </motion.p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
              <input
                type="text"
                placeholder="Search majors or careers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light" />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-text-light mb-6">
            {loading ? 'Loading...' : `${filtered.length} majors`}
          </p>

          {!loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((major, i) => {
                const tier = getTierBadge(major.ai_disruption_tier)
                const outlook = getOutlookBadge(major.career_outlook)
                return (
                  <motion.div
                    key={major.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.05 }}
                    custom={i % 6}
                    variants={fadeUp}
                  >
                    <Link
                      to={`/majors/${major.slug}`}
                      className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-navy/20 transition-all no-underline text-inherit group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-navy group-hover:text-gold transition-colors">{major.name}</h3>
                          <span className="text-xs text-text-light">{major.category}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${tier.cls}`}>
                          {tier.label}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-text-light mb-1">
                          <span>AI Disruption Score</span>
                        </div>
                        <DisruptionGauge score={major.ai_disruption_score} />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center mb-3">
                        <div>
                          <DollarSign className="w-3.5 h-3.5 text-text-light mx-auto mb-0.5" />
                          <p className="text-sm font-bold text-navy">${(major.median_salary / 1000).toFixed(0)}k</p>
                          <p className="text-[10px] text-text-light">Median</p>
                        </div>
                        <div>
                          {major.growth_rate.startsWith('-')
                            ? <TrendingDown className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
                            : <TrendingUp className="w-3.5 h-3.5 text-green-500 mx-auto mb-0.5" />
                          }
                          <p className="text-sm font-bold text-navy">{major.growth_rate}</p>
                          <p className="text-[10px] text-text-light">Growth</p>
                        </div>
                        <div>
                          <Briefcase className="w-3.5 h-3.5 text-text-light mx-auto mb-0.5" />
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${outlook.cls}`}>
                            {outlook.label.replace(' Outlook', '')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {major.example_careers.slice(0, 2).map(c => (
                            <span key={c} className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                        <ArrowRight className="w-4 h-4 text-text-light group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={fadeUp}
            className="bg-gradient-to-br from-navy to-navy-dark rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                Find Schools That Match Your Major
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Take our free assessment to get personalized school recommendations based on your chosen field of study.
              </p>
              <Link
                to="/assess"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all no-underline shadow-lg shadow-gold/30 hover:shadow-xl hover:-translate-y-0.5"
              >
                Take Free Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
