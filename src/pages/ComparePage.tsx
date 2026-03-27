import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, X, Plus, Lock, GraduationCap
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../contexts/AuthContext'
import { listSchools, type School } from '../services/api'

const MAX_FREE = 3
const MAX_SCHOOLS = 5

type CompareRow = {
  label: string
  key: string
  format: (val: any, school?: any) => string
  category: string
  higherIsBetter?: boolean
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'Acceptance Rate', key: 'acceptance_rate', format: v => v != null ? `${(v * 100).toFixed(1)}%` : '—', category: 'Admissions', higherIsBetter: false },
  { label: 'Graduation Rate (6yr)', key: 'graduation_rate', format: v => v != null ? `${v}%` : '—', category: 'Academics', higherIsBetter: true },
  { label: 'Retention Rate', key: 'retention_rate', format: v => v != null ? `${v}%` : '—', category: 'Academics', higherIsBetter: true },
  { label: 'SAT Range', key: 'sat_range', format: (_: any, s: any) => s?.sat_range_low && s?.sat_range_high ? `${s.sat_range_low}–${s.sat_range_high}` : '—', category: 'Admissions' },
  { label: 'ACT Range', key: 'act_range', format: (_: any, s: any) => s?.act_range_low && s?.act_range_high ? `${s.act_range_low}–${s.act_range_high}` : '—', category: 'Admissions' },
  { label: 'Tuition', key: 'tuition', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Cost', higherIsBetter: false },
  { label: 'Room & Board', key: 'room_and_board', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Cost', higherIsBetter: false },
  { label: 'Total COA', key: 'cost_of_attendance', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Cost', higherIsBetter: false },
  { label: 'Net Price', key: 'avg_net_price', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Cost', higherIsBetter: false },
  { label: 'Median Debt', key: 'median_debt', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Cost', higherIsBetter: false },
  { label: 'Student Body', key: 'enrollment', format: v => v != null ? v.toLocaleString() : '—', category: 'Campus' },
  { label: 'Student:Faculty', key: 'student_faculty_ratio', format: v => v != null ? `${v}:1` : '—', category: 'Campus', higherIsBetter: false },
  { label: 'Earnings (10yr)', key: 'median_earnings_10yr', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Outcomes', higherIsBetter: true },
  { label: 'Earnings (6yr)', key: 'earnings_6yr_after_entry', format: v => v != null ? `$${v.toLocaleString()}` : '—', category: 'Outcomes', higherIsBetter: true },
  { label: 'Setting', key: 'setting', format: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—', category: 'Campus' },
  { label: 'Region', key: 'region', format: v => v || '—', category: 'Campus' },
  { label: 'Type', key: 'type', format: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—', category: 'Campus' },
]

export default function ComparePage() {
  const { tier } = useAuth()
  const isPaid = tier !== 'free'
  const maxAllowed = isPaid ? MAX_SCHOOLS : MAX_FREE
  const [selectedSchools, setSelectedSchools] = useState<School[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<School[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Load matches from assessment
  const savedMatches = localStorage.getItem('acm_assessment_matches')
  const assessmentMatches: any[] = savedMatches ? JSON.parse(savedMatches) : []

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
    if (selectedSchools.length >= maxAllowed) return
    if (selectedSchools.some(s => s.id === school.id)) return
    setSelectedSchools(prev => [...prev, school])
    setSearchQuery('')
    setShowSearch(false)
  }

  function removeSchool(id: number) {
    setSelectedSchools(prev => prev.filter(s => s.id !== id))
  }

  function addFromMatches(match: any) {
    if (match.school && !selectedSchools.some(s => s.id === match.school.id)) {
      addSchool(match.school)
    }
  }

  function getCellColor(row: CompareRow, value: any, allValues: any[]) {
    if (row.higherIsBetter === undefined || value == null) return ''
    const numericVals = allValues.filter(v => v != null).map(Number)
    if (numericVals.length < 2) return ''
    const numVal = Number(value)
    const max = Math.max(...numericVals)
    const min = Math.min(...numericVals)
    if (max === min) return ''
    if (row.higherIsBetter) {
      if (numVal === max) return 'bg-green-50 text-green-700 font-semibold'
      if (numVal === min) return 'bg-red-50 text-red-700'
    } else {
      if (numVal === min) return 'bg-green-50 text-green-700 font-semibold'
      if (numVal === max) return 'bg-red-50 text-red-700'
    }
    return ''
  }

  // Group rows by category
  const categories = [...new Set(COMPARE_ROWS.map(r => r.category))]

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Compare Schools | AI College Matcher</title>
        <meta name="description" content="Compare colleges side by side — acceptance rates, costs, outcomes, and more." />
      </Helmet>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Compare Schools
          </h1>
          <p className="text-text-light max-w-2xl mx-auto">
            Compare up to {maxAllowed} schools side by side.
            {!isPaid && ' Upgrade for up to 5 schools.'}
          </p>
        </motion.div>

        {/* Search + Add */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-navy transition-colors">
              <Search className="w-5 h-5 text-text-light shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search for a school to compare..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-navy placeholder-text-light"
                disabled={selectedSchools.length >= maxAllowed}
              />
              {selectedSchools.length >= maxAllowed && (
                <span className="text-xs text-text-light">Max reached</span>
              )}
            </div>

            {/* Autocomplete dropdown */}
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

          {/* Quick add from matches */}
          {assessmentMatches.length > 0 && selectedSchools.length < maxAllowed && (
            <div className="mt-4">
              <p className="text-xs text-text-light mb-2">Quick add from your matches:</p>
              <div className="flex flex-wrap gap-2">
                {assessmentMatches.slice(0, 5).map((match: any, i: number) => {
                  const name = match.school?.name || match.school_name
                  const isAdded = selectedSchools.some(s => s.name === name)
                  if (isAdded) return null
                  return (
                    <button
                      key={i}
                      onClick={() => addFromMatches(match)}
                      className="inline-flex items-center gap-1 text-xs bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full transition-colors border-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected schools chips */}
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

          {/* Free tier limit notice */}
          {!isPaid && selectedSchools.length >= MAX_FREE && (
            <div className="mt-4 flex items-center gap-2 text-sm text-text-light bg-warm-gray rounded-lg p-3">
              <Lock className="w-4 h-4" />
              <span>Free users can compare up to 3 schools.</span>
              <Link to="/#pricing" className="text-gold font-semibold no-underline hover:underline ml-1">Upgrade</Link>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedSchools.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                {/* Sticky header with school names */}
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="sticky left-0 bg-white z-10 p-4 text-left text-sm font-semibold text-navy w-40 min-w-[160px]">
                      Metric
                    </th>
                    {selectedSchools.map(school => (
                      <th key={school.id} className="p-4 text-center min-w-[160px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-navy" />
                          </div>
                          <span className="text-sm font-bold text-navy leading-tight">{school.name}</span>
                          <span className="text-xs text-text-light">{school.city}, {school.state}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <>
                      <tr key={`cat-${category}`}>
                        <td
                          colSpan={selectedSchools.length + 1}
                          className="bg-warm-gray px-4 py-2 text-xs font-bold text-navy uppercase tracking-wider"
                        >
                          {category}
                        </td>
                      </tr>
                      {COMPARE_ROWS.filter(r => r.category === category).map(row => {
                        const allValues = selectedSchools.map(s => {
                          if (row.key === 'sat_range' || row.key === 'act_range') return null
                          return (s as any)[row.key]
                        })
                        return (
                          <tr key={row.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="sticky left-0 bg-white z-10 p-4 text-sm text-text-light font-medium">
                              {row.label}
                            </td>
                            {selectedSchools.map(school => {
                              const val = (school as any)[row.key]
                              const cellColor = getCellColor(row, val, allValues)
                              return (
                                <td key={school.id} className={`p-4 text-sm text-center ${cellColor}`}>
                                  {row.format(val, school)}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </>
                  ))}

                  {/* Programs offered row */}
                  <tr>
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="bg-warm-gray px-4 py-2 text-xs font-bold text-navy uppercase tracking-wider"
                    >
                      Programs
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="sticky left-0 bg-white z-10 p-4 text-sm text-text-light font-medium">
                      Strong Majors
                    </td>
                    {selectedSchools.map(school => (
                      <td key={school.id} className="p-4 text-sm text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(school.majors_strength || []).slice(0, 5).map(m => (
                            <span key={m} className="bg-navy/5 text-navy text-xs px-2 py-0.5 rounded-full">
                              {m}
                            </span>
                          ))}
                          {(!school.majors_strength || school.majors_strength.length === 0) && '—'}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {selectedSchools.length < 2 && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <Search className="w-10 h-10 text-navy/20 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold text-navy mb-2">
              {selectedSchools.length === 0 ? 'Add schools to compare' : 'Add at least one more school'}
            </h3>
            <p className="text-sm text-text-light">
              Search for schools above to start your side-by-side comparison.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

