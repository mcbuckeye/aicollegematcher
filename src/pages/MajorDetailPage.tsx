import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Briefcase,
  MapPin,
  Users,
  Zap,
  Shield,
  BookOpen,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMajorDetail, type MajorDetail } from '../services/api'

const fadeUp = {
  hidden: { opacity: 0.15, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

function DisruptionCircle({ score }: { score: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s <= 25) return '#22c55e'
    if (s <= 50) return '#eab308'
    if (s <= 70) return '#f97316'
    return '#ef4444'
  }

  const getLabel = (s: number) => {
    if (s <= 25) return 'Low Risk'
    if (s <= 50) return 'Moderate'
    if (s <= 70) return 'High Risk'
    return 'Very High'
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#f3f4f6" strokeWidth="12"
        />
        <motion.circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-navy">{score}</div>
        <div className="text-xs text-text-light">{getLabel(score)}</div>
      </div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-navy" />
      </div>
      <h2 className="text-2xl font-bold text-navy">{title}</h2>
    </div>
  )
}

export default function MajorDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [major, setMajor] = useState<MajorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(false)
    getMajorDetail(slug)
      .then(setMajor)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 text-center text-text-light">Loading...</div>
      </div>
    )
  }

  if (error || !major) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Major Not Found</h1>
          <Link to="/majors" className="text-gold hover:text-gold-dark no-underline">
            &larr; Back to Major Explorer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>{major.name} - AI Disruption Analysis | AI College Matcher</title>
        <meta name="description" content={`How AI impacts ${major.name}: disruption score ${major.ai_disruption_score}/100. ${major.ai_impact_summary.slice(0, 120)}`} />
        <link rel="canonical" href={`https://aicollegematcher.machomelab.com/majors/${slug}`} />
      </Helmet>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Back link */}
        <Link
          to="/majors"
          className="inline-flex items-center gap-2 text-sm text-text-light hover:text-navy no-underline mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Major Explorer
        </Link>

        {/* Hero card */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp}
          className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <DisruptionCircle score={major.ai_disruption_score} />
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-bold text-gold uppercase tracking-widest mb-2 block">
                {major.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
                {major.name}
              </h1>
              <p className="text-text-light leading-relaxed">{major.ai_impact_summary}</p>
              <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 text-sm bg-navy/5 text-navy px-3 py-1 rounded-full">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${major.median_salary.toLocaleString()} median
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm bg-navy/5 text-navy px-3 py-1 rounded-full">
                  {major.growth_rate.startsWith('-')
                    ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    : <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  }
                  {major.growth_rate} growth
                </span>
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${
                  major.career_outlook === 'strong' ? 'bg-green-100 text-green-700' :
                  major.career_outlook === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  major.career_outlook === 'uncertain' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <Briefcase className="w-3.5 h-3.5" />
                  {major.career_outlook.charAt(0).toUpperCase() + major.career_outlook.slice(1)} outlook
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What AI Can and Cannot Replace */}
        <motion.div
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <SectionHeader title={`What AI Can and Cannot Replace`} icon={Shield} />
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-green-700 mb-3">
                <CheckCircle2 className="w-4 h-4" />
                AI-Resistant Aspects
              </h3>
              <ul className="space-y-2">
                {major.ai_resistant_aspects.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-3">
                <XCircle className="w-4 h-4" />
                AI-Threatened Aspects
              </h3>
              <ul className="space-y-2">
                {major.ai_threatened_aspects.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Skills to Stay Ahead */}
        <motion.div
          initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <SectionHeader title="Skills to Stay Ahead" icon={Zap} />
          <div className="flex flex-wrap gap-2">
            {major.recommended_complementary_skills.map(skill => (
              <span
                key={skill}
                className="bg-gradient-to-r from-navy/5 to-navy/10 text-navy text-sm font-medium px-4 py-2 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* AI-Enhanced Opportunities */}
        <motion.div
          initial="hidden" animate="visible" custom={3} variants={fadeUp}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <SectionHeader title="AI-Enhanced Opportunities" icon={Sparkles} />
          <p className="text-sm text-text-light mb-4">
            These skills in {major.name} become <strong>more</strong> valuable when combined with AI:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {major.ai_augmented_skills.map(skill => (
              <div key={skill} className="flex items-center gap-3 bg-gold/5 rounded-xl p-3">
                <Sparkles className="w-4 h-4 text-gold shrink-0" />
                <span className="text-sm text-navy font-medium">{skill}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Career Paths */}
        <motion.div
          initial="hidden" animate="visible" custom={4} variants={fadeUp}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <SectionHeader title="Career Paths" icon={Briefcase} />
          <div className="grid sm:grid-cols-2 gap-3">
            {major.example_careers.map(career => (
              <div key={career} className="flex items-center gap-3 bg-warm-gray rounded-xl p-4">
                <GraduationCap className="w-5 h-5 text-navy shrink-0" />
                <span className="text-sm font-medium text-navy">{career}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-text-light">
              <DollarSign className="w-4 h-4 text-gold" />
              Median salary: <span className="font-bold text-navy">${major.median_salary.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-text-light">
              {major.growth_rate.startsWith('-')
                ? <TrendingDown className="w-4 h-4 text-red-400" />
                : <TrendingUp className="w-4 h-4 text-green-500" />
              }
              Projected growth: <span className="font-bold text-navy">{major.growth_rate}</span>
            </div>
          </div>
        </motion.div>

        {/* Top Schools */}
        {major.top_schools && major.top_schools.length > 0 && (
          <motion.div
            initial="hidden" animate="visible" custom={5} variants={fadeUp}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6"
          >
            <SectionHeader title={`Top Schools for ${major.name}`} icon={BookOpen} />
            <div className="grid sm:grid-cols-2 gap-4">
              {major.top_schools.map(school => (
                <Link
                  key={school.id}
                  to={`/schools/${school.id}`}
                  className="block p-4 rounded-xl bg-warm-gray border border-gray-100 hover:shadow-md hover:border-navy/20 transition-all no-underline text-inherit"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-navy text-sm">{school.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-text-light mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {school.city}, {school.state}
                        </span>
                        {school.graduation_rate && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {Math.round(school.graduation_rate * 100)}% grad rate
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-light mt-1">
                        {school.enrollment && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {school.enrollment.toLocaleString()} students
                          </span>
                        )}
                        {school.tuition && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${(school.tuition / 1000).toFixed(0)}k/yr
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial="hidden" animate="visible" custom={6} variants={fadeUp}
          className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-8 sm:p-10 text-center text-white"
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
            Find Schools That Match Your Major
          </h2>
          <p className="text-white/70 mb-6">
            Take our free assessment to get personalized school recommendations for {major.name}.
          </p>
          <Link
            to="/assess"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all no-underline shadow-lg shadow-gold/30 hover:shadow-xl hover:-translate-y-0.5"
          >
            Take Free Assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
