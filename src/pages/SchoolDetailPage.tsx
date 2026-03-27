import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  BookOpen,
  Award,
  BarChart3,
  Heart,
  Building2,
} from 'lucide-react'
import { getSchool, type School } from '../services/api'
import { trackEvent } from '../services/analytics'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  return '$' + value.toLocaleString()
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  // If value is between 0 and 1, it's a decimal rate
  if (value > 0 && value <= 1) return (value * 100).toFixed(1) + '%'
  return value.toFixed(1) + '%'
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  return value.toLocaleString()
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  if (value === 'N/A') return null
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="w-5 h-5 text-navy" />}
        <span className="text-sm text-text-light">{label}</span>
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
    </div>
  )
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-navy" />
      </div>
      <h2 className="text-2xl font-bold text-navy">{title}</h2>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  if (value === 'N/A') return null
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
      <span className="text-text-light">{label}</span>
      <span className="font-semibold text-text">{value}</span>
    </div>
  )
}

const PROGRAM_LABELS: Record<string, string> = {
  agriculture: 'Agriculture',
  architecture: 'Architecture',
  ethnic_cultural_gender: 'Ethnic, Cultural & Gender Studies',
  communication: 'Communication',
  computer: 'Computer Science',
  education: 'Education',
  engineering: 'Engineering',
  engineering_technology: 'Engineering Technology',
  language: 'Language & Linguistics',
  family_consumer_science: 'Family & Consumer Science',
  legal: 'Legal Studies',
  english: 'English',
  humanities: 'Humanities',
  library: 'Library Science',
  biological: 'Biological Sciences',
  mathematics: 'Mathematics & Statistics',
  military: 'Military Technologies',
  multidiscipline: 'Multidisciplinary Studies',
  parks_recreation_fitness: 'Parks, Recreation & Fitness',
  philosophy_religious: 'Philosophy & Religious Studies',
  theology_religious_vocation: 'Theology & Religious Vocations',
  physical_science: 'Physical Sciences',
  science_technology: 'Science & Technology',
  psychology: 'Psychology',
  security_law_enforcement: 'Security & Law Enforcement',
  public_administration_social_service: 'Public Administration & Social Service',
  social_science: 'Social Sciences',
  construction: 'Construction',
  mechanic_repair_technology: 'Mechanic & Repair Technology',
  precision_production: 'Precision Production',
  transportation: 'Transportation',
  visual_performing: 'Visual & Performing Arts',
  health: 'Health Professions',
  business_marketing: 'Business & Marketing',
  history: 'History',
  resources: 'Natural Resources & Conservation',
  personal_culinary: 'Personal & Culinary Services',
}

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSchool(Number(id))
      .then((data) => {
        setSchool(data)
        trackEvent('school_view', { school_id: Number(id), school_name: data.name })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center mt-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy"></div>
            <p className="mt-4 text-text-light">Loading school details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center mt-16">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'School not found'}</p>
            <button
              onClick={() => navigate('/schools')}
              className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
            >
              Back to Schools
            </button>
          </div>
        </main>
      </div>
    )
  }

  const programs = school.programs_offered
    ? Object.entries(school.programs_offered)
        .filter(([, v]) => !!v)
        .map(([k]) => PROGRAM_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        .sort()
    : []

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      <main className="flex-grow mt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-navy-dark to-navy text-white">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{school.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/80">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {school.city}, {school.state}
                  </span>
                  <span className="capitalize px-3 py-0.5 bg-white/15 rounded-full text-sm">
                    {school.type}
                  </span>
                  {school.setting && (
                    <span className="capitalize px-3 py-0.5 bg-white/15 rounded-full text-sm">
                      {school.setting}
                    </span>
                  )}
                  {school.hbcu && (
                    <span className="px-3 py-0.5 bg-gold/30 rounded-full text-sm">HBCU</span>
                  )}
                  {school.religious_affiliation && (
                    <span className="px-3 py-0.5 bg-white/15 rounded-full text-sm">Religious Affiliation</span>
                  )}
                </div>
              </div>

              {school.school_url && (
                <a
                  href={school.school_url.startsWith('http') ? school.school_url : `https://${school.school_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light text-navy-dark font-semibold rounded-lg transition-colors text-sm no-underline"
                >
                  Visit Website <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Acceptance Rate" value={formatPercent(school.acceptance_rate)} icon={Award} />
            <StatCard
              label="Graduation Rate (6yr)"
              value={formatPercent(school.graduation_rate)}
              icon={GraduationCap}
            />
            <StatCard label="Student Body" value={formatNumber(school.enrollment)} icon={Users} />
            <StatCard
              label="Student-Faculty Ratio"
              value={school.student_faculty_ratio ? `${school.student_faculty_ratio}:1` : 'N/A'}
              icon={BookOpen}
            />
          </div>

          {/* Academics */}
          {(programs.length > 0 || (school.majors_strength && school.majors_strength.length > 0)) && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <SectionHeader title="Academics" icon={BookOpen} />

              {school.majors_strength && school.majors_strength.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">
                    Strong Programs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {school.majors_strength.map((major) => (
                      <span
                        key={major}
                        className="px-3 py-1.5 bg-navy/5 text-navy text-sm rounded-full font-medium"
                      >
                        {major}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {programs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">
                    Programs Offered ({programs.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {programs.map((program) => (
                      <div
                        key={program}
                        className="flex items-center gap-2 text-sm text-text py-1.5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        {program}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Score Ranges */}
              {(school.sat_range_low || school.act_range_low) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">
                    Test Score Ranges
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {school.sat_range_low && school.sat_range_high && (
                      <div className="bg-warm-gray rounded-lg p-4">
                        <span className="text-sm text-text-light">SAT Range</span>
                        <p className="text-lg font-bold text-navy">
                          {school.sat_range_low} - {school.sat_range_high}
                        </p>
                      </div>
                    )}
                    {school.act_range_low && school.act_range_high && (
                      <div className="bg-warm-gray rounded-lg p-4">
                        <span className="text-sm text-text-light">ACT Range</span>
                        <p className="text-lg font-bold text-navy">
                          {school.act_range_low} - {school.act_range_high}
                        </p>
                      </div>
                    )}
                    {school.avg_gpa && (
                      <div className="bg-warm-gray rounded-lg p-4">
                        <span className="text-sm text-text-light">Average GPA</span>
                        <p className="text-lg font-bold text-navy">{school.avg_gpa.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Cost & Financial Aid - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <SectionHeader title="Cost" icon={DollarSign} />
              {school.type === 'public' && (
                <p className="text-xs text-text-light mb-4 -mt-4 ml-13">
                  * Tuition shown is in-state. Out-of-state rates may be higher.
                </p>
              )}
              <div className="space-y-0">
                <DataRow label="Tuition" value={formatCurrency(school.tuition)} />
                <DataRow label="Room & Board" value={formatCurrency(school.room_and_board)} />
                <DataRow label="Books & Supplies" value={formatCurrency(school.book_supply_cost)} />
                <DataRow label="Cost of Attendance" value={formatCurrency(school.cost_of_attendance)} />
                <DataRow label="Average Net Price" value={formatCurrency(school.avg_net_price)} />
                <DataRow label="Median Debt at Graduation" value={formatCurrency(school.median_debt)} />
                <DataRow
                  label="Monthly Loan Payment"
                  value={school.median_debt_monthly_payment ? formatCurrency(Math.round(school.median_debt_monthly_payment)) : 'N/A'}
                />
              </div>
            </section>

            {/* Financial Aid */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <SectionHeader title="Financial Aid" icon={Heart} />
              <div className="space-y-0">
                <DataRow label="Average Financial Aid" value={formatCurrency(school.avg_financial_aid)} />
                <DataRow label="Pell Grant Rate" value={formatPercent(school.pell_grant_rate)} />
                <DataRow label="Federal Loan Rate" value={formatPercent(school.federal_loan_rate)} />
                <DataRow label="Students with Any Loan" value={formatPercent(school.students_with_any_loan)} />
                <DataRow label="FAFSA Applications" value={formatNumber(school.fafsa_applications)} />
              </div>
            </section>
          </div>

          {/* Outcomes */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <SectionHeader title="Outcomes & Earnings" icon={TrendingUp} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
              <div>
                <h3 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">
                  Earnings After Entry
                </h3>
                <DataRow label="6 Years After Entry" value={formatCurrency(school.earnings_6yr_after_entry)} />
                <DataRow label="8 Years After Entry" value={formatCurrency(school.earnings_8yr_after_entry)} />
                <DataRow label="10 Years After Entry" value={formatCurrency(school.median_earnings_10yr)} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">
                  Earnings After Completion
                </h3>
                <DataRow label="1 Year After Completion" value={formatCurrency(school.earnings_1yr_after_completion)} />
                <DataRow label="4 Years After Completion" value={formatCurrency(school.earnings_4yr_after_completion)} />
              </div>
            </div>
          </section>

          {/* Completion & Retention */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <SectionHeader title="Completion & Retention" icon={BarChart3} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {school.completion_rate_4yr_100 != null && (
                <div className="bg-warm-gray rounded-xl p-4 text-center">
                  <span className="text-sm text-text-light block mb-1">4-Year Completion</span>
                  <span className="text-2xl font-bold text-navy">{formatPercent(school.completion_rate_4yr_100)}</span>
                </div>
              )}
              {school.completion_rate_4yr_200 != null && (
                <div className="bg-warm-gray rounded-xl p-4 text-center">
                  <span className="text-sm text-text-light block mb-1">8-Year Completion</span>
                  <span className="text-2xl font-bold text-navy">{formatPercent(school.completion_rate_4yr_200)}</span>
                </div>
              )}
              {school.retention_rate != null && (
                <div className="bg-warm-gray rounded-xl p-4 text-center">
                  <span className="text-sm text-text-light block mb-1">Retention Rate</span>
                  <span className="text-2xl font-bold text-navy">{formatPercent(school.retention_rate)}</span>
                </div>
              )}
              {school.transfer_rate_4yr_ft != null && (
                <div className="bg-warm-gray rounded-xl p-4 text-center">
                  <span className="text-sm text-text-light block mb-1">Transfer Rate</span>
                  <span className="text-2xl font-bold text-navy">{formatPercent(school.transfer_rate_4yr_ft)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Student Demographics */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <SectionHeader title="Student Demographics" icon={Users} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
              <div>
                <DataRow label="Men" value={formatPercent(school.demographics_men)} />
                <DataRow label="Women" value={formatPercent(school.demographics_women)} />
                <DataRow label="First Generation" value={formatPercent(school.first_generation_rate)} />
                <DataRow label="Part-Time Students" value={formatPercent(school.part_time_share)} />
              </div>
              <div>
                <DataRow
                  label="Average Age at Entry"
                  value={school.avg_age_entry ? school.avg_age_entry.toFixed(1) : 'N/A'}
                />
                <DataRow
                  label="Median Family Income"
                  value={school.median_family_income ? formatCurrency(Math.round(school.median_family_income)) : 'N/A'}
                />
                <DataRow label="Graduate Students" value={formatNumber(school.grad_students)} />
              </div>
            </div>
          </section>

          {/* Campus Features */}
          {school.features && school.features.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <SectionHeader title="Campus Features" icon={Building2} />
              <div className="flex flex-wrap gap-3">
                {school.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-4 py-2 bg-gradient-to-r from-navy/5 to-gold/5 border border-navy/10 text-text rounded-full text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
