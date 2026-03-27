import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { DollarSign, Search, Lock, BarChart3, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

interface SchoolResult {
  id: number
  name: string
}

interface AidAnalysis {
  school_name: string
  sticker_price: number | null
  estimated_grants: number | null
  estimated_net_price: number | null
  median_debt: number | null
  monthly_payment: number | null
  earnings_vs_debt_ratio: number | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

export default function FinancialAidPage() {
  const { email } = useAuth()
  const [income, setIncome] = useState('')
  const [familySize, setFamilySize] = useState('4')
  const [state, setState] = useState('')
  const [efc, setEfc] = useState('')
  const [selectedSchools, setSelectedSchools] = useState<SchoolResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SchoolResult[]>([])
  const [, setSearching] = useState(false)
  const [results, setResults] = useState<AidAnalysis[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gated, setGated] = useState(false)

  async function searchSchools(q: string) {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`${API_BASE_URL}/schools?q=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.schools.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })))
      }
    } catch { /* ignore */ }
    setSearching(false)
  }

  function addSchool(school: SchoolResult) {
    if (selectedSchools.length >= 5) return
    if (selectedSchools.find(s => s.id === school.id)) return
    setSelectedSchools([...selectedSchools, school])
    setSearchQuery('')
    setSearchResults([])
  }

  function removeSchool(id: number) {
    setSelectedSchools(selectedSchools.filter(s => s.id !== id))
  }

  async function handleAnalyze() {
    if (selectedSchools.length === 0 || !income) return
    setLoading(true)
    setError(null)
    setResults(null)
    setGated(false)

    try {
      const response = await fetch(`${API_BASE_URL}/financial-aid/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: parseInt(income),
          family_size: parseInt(familySize),
          state: state || undefined,
          efc: efc ? parseInt(efc) : undefined,
          school_ids: selectedSchools.map(s => s.id),
          email: email || undefined,
        }),
      })

      if (response.status === 403) {
        setGated(true)
        return
      }

      if (!response.ok) throw new Error(`Analysis failed: ${response.statusText}`)

      const data = await response.json()
      setResults(data.schools)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(val: number | null) {
    if (val == null) return 'N/A'
    return '$' + val.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-warm-gray flex flex-col">
      <Helmet>
        <title>Financial Aid Analysis | AI College Matcher</title>
        <meta name="description" content="Compare financial aid and estimated net costs across colleges based on your family income and profile." />
        <link rel="canonical" href="https://aicollegematcher.machomelab.com/financial-aid" />
      </Helmet>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-4">
            <DollarSign className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-navy">Premium Feature</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-3">
            Financial Aid Analysis
          </h1>
          <p className="text-text-light max-w-xl mx-auto">
            Compare estimated net costs and financial aid across up to 5 schools.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Household Income</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">$</span>
                <input
                  type="number"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  placeholder="75000"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Family Size</label>
              <select
                value={familySize}
                onChange={e => setFamilySize(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              >
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              >
                <option value="">Select state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">EFC (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">$</span>
                <input
                  type="number"
                  value={efc}
                  onChange={e => setEfc(e.target.value)}
                  placeholder="Auto"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* School search */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-navy mb-1">
              Select Schools (up to 5) {selectedSchools.length > 0 && <span className="text-text-light font-normal">— {selectedSchools.length}/5</span>}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); searchSchools(e.target.value) }}
                placeholder="Search for a school..."
                disabled={selectedSchools.length >= 5}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold disabled:opacity-50"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addSchool(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-navy/5 transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSchools.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSchools.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 bg-navy/5 text-navy text-sm px-3 py-1.5 rounded-full">
                  {s.name}
                  <button onClick={() => removeSchool(s.id)} className="p-0 border-0 bg-transparent cursor-pointer text-navy/50 hover:text-navy">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || selectedSchools.length === 0 || !income}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Analyze Financial Aid
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Gated */}
        {gated && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold/30 text-center">
            <Lock className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-bold text-navy mb-2">Premium Feature</h3>
            <p className="text-sm text-text-light mb-4">
              Financial aid analysis is available with the Premium plan.
            </p>
            <a href="/#pricing" className="inline-block bg-gradient-to-r from-gold to-gold-dark text-white font-semibold px-6 py-2.5 rounded-lg no-underline">
              View Plans
            </a>
          </div>
        )}

        {/* Results Table */}
        {results && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">Cost Comparison</h2>
              <p className="text-sm text-text-light mt-1">Estimates based on your household income of {formatCurrency(parseInt(income))}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy/[0.03]">
                    <th className="text-left px-5 py-3 font-semibold text-navy">School</th>
                    <th className="text-right px-5 py-3 font-semibold text-navy whitespace-nowrap">
                      <span className="hidden sm:inline">Sticker </span>Price
                    </th>
                    <th className="text-right px-5 py-3 font-semibold text-navy whitespace-nowrap">
                      Est. <span className="hidden sm:inline">Grants</span>
                    </th>
                    <th className="text-right px-5 py-3 font-semibold text-navy whitespace-nowrap">
                      Net <span className="hidden sm:inline">Price</span>
                    </th>
                    <th className="text-right px-5 py-3 font-semibold text-navy hidden sm:table-cell">Median Debt</th>
                    <th className="text-right px-5 py-3 font-semibold text-navy hidden md:table-cell">Mo. Payment</th>
                    <th className="text-right px-5 py-3 font-semibold text-navy hidden lg:table-cell">Earnings/Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-navy/[0.01]">
                      <td className="px-5 py-4 font-medium text-navy">{r.school_name}</td>
                      <td className="px-5 py-4 text-right text-text-light">{formatCurrency(r.sticker_price)}</td>
                      <td className="px-5 py-4 text-right text-green-600">{formatCurrency(r.estimated_grants)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-navy">{formatCurrency(r.estimated_net_price)}</td>
                      <td className="px-5 py-4 text-right text-text-light hidden sm:table-cell">{formatCurrency(r.median_debt)}</td>
                      <td className="px-5 py-4 text-right text-text-light hidden md:table-cell">{formatCurrency(r.monthly_payment)}</td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        {r.earnings_vs_debt_ratio != null ? (
                          <span className={r.earnings_vs_debt_ratio >= 2 ? 'text-green-600 font-semibold' : 'text-text-light'}>
                            {r.earnings_vs_debt_ratio.toFixed(1)}x
                          </span>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
