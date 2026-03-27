import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Users,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Download,
  RefreshCw,
  Lock,
  BookOpen,
  MessageCircle,
  Heart,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

interface AdminStats {
  total_users: number
  users_by_tier: Record<string, number>
  total_leads: number
  leads_last_7_days: number
  total_assessments: number
  avg_readiness_score: number
  top_majors: { major: string; count: number }[]
  top_schools_matched: { school: string; count: number }[]
  analytics_events: { event_type: string; count: number }[]
  saved_schools_count: number
  chat_messages_count: number
  recent_leads: { email: string; score: number; top_match: string; date: string }[]
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-400',
  report: 'bg-blue-500',
  season: 'bg-purple-500',
  premium: 'bg-gold',
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('acm_admin_key') || '')
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem('acm_admin_key'))
  const [keyInput, setKeyInput] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async (key: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'X-Admin-Key': key },
      })
      if (!res.ok) {
        if (res.status === 403) {
          setAuthenticated(false)
          sessionStorage.removeItem('acm_admin_key')
          setError('Invalid admin key')
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Failed to fetch stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated && adminKey) {
      fetchStats(adminKey)
      const interval = setInterval(() => fetchStats(adminKey), 60000)
      return () => clearInterval(interval)
    }
  }, [authenticated, adminKey, fetchStats])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!keyInput.trim()) return
    sessionStorage.setItem('acm_admin_key', keyInput.trim())
    setAdminKey(keyInput.trim())
    setAuthenticated(true)
  }

  async function exportLeads() {
    try {
      const res = await fetch(`${API_BASE}/leads/export`, {
        headers: { 'X-Admin-Key': adminKey },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-warm-gray flex items-center justify-center">
        <Helmet><title>Admin | AI College Matcher</title></Helmet>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <Lock className="w-10 h-10 text-navy mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-sm text-text-light mt-1">Enter the admin key to continue</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Admin key"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-navy outline-none transition-colors mb-3"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full bg-navy text-white font-semibold py-3 rounded-lg cursor-pointer border-0 hover:bg-navy-dark transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tierTotal = stats ? Object.values(stats.users_by_tier).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet><title>Admin Dashboard | AI College Matcher</title></Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-navy" />
            <h1 className="font-serif font-bold text-navy text-lg">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(adminKey)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-text-light hover:text-navy bg-transparent border border-gray-200 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportLeads}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-navy text-white font-semibold rounded-lg cursor-pointer border-0 hover:bg-navy-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Leads CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!stats && loading && (
          <div className="text-center py-20 text-text-light">Loading stats...</div>
        )}

        {stats && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Users className="w-5 h-5 text-blue-500" />} label="Total Users" value={stats.total_users} />
              <StatCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Total Leads" value={stats.total_leads} sub={`+${stats.leads_last_7_days} last 7d`} />
              <StatCard icon={<BarChart3 className="w-5 h-5 text-purple-500" />} label="Assessments" value={stats.total_assessments} />
              <StatCard icon={<GraduationCap className="w-5 h-5 text-gold" />} label="Avg Readiness" value={stats.avg_readiness_score} sub="/100" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard icon={<Heart className="w-5 h-5 text-red-400" />} label="Saved Schools" value={stats.saved_schools_count} />
              <StatCard icon={<MessageCircle className="w-5 h-5 text-indigo-500" />} label="Chat Messages" value={stats.chat_messages_count} />
              <StatCard icon={<BookOpen className="w-5 h-5 text-teal-500" />} label="Leads (7d)" value={stats.leads_last_7_days} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Users by tier */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-navy text-sm mb-4">Users by Tier</h2>
                {tierTotal > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.users_by_tier).map(([tier, count]) => (
                      <div key={tier}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="capitalize text-text">{tier}</span>
                          <span className="text-text-light">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${TIER_COLORS[tier] || 'bg-gray-400'}`}
                            style={{ width: `${(count / tierTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light">No users yet</p>
                )}
              </div>

              {/* Top Majors */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-navy text-sm mb-4">Top Majors</h2>
                {stats.top_majors.length > 0 ? (
                  <div className="space-y-2">
                    {stats.top_majors.map((m, i) => (
                      <div key={m.major} className="flex items-center justify-between text-sm">
                        <span className="text-text truncate">
                          <span className="text-text-light mr-2">{i + 1}.</span>
                          {m.major}
                        </span>
                        <span className="text-text-light font-medium ml-2 shrink-0">{m.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light">No data yet</p>
                )}
              </div>

              {/* Top Matched Schools */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-navy text-sm mb-4">Top Matched Schools</h2>
                {stats.top_schools_matched.length > 0 ? (
                  <div className="space-y-2">
                    {stats.top_schools_matched.map((s, i) => (
                      <div key={s.school} className="flex items-center justify-between text-sm">
                        <span className="text-text truncate">
                          <span className="text-text-light mr-2">{i + 1}.</span>
                          {s.school}
                        </span>
                        <span className="text-text-light font-medium ml-2 shrink-0">{s.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light">No data yet</p>
                )}
              </div>
            </div>

            {/* Analytics Events */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <h2 className="font-bold text-navy text-sm mb-4">Analytics Events (Last 7 Days)</h2>
              {stats.analytics_events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-text-light font-medium">Event Type</th>
                        <th className="text-right py-2 text-text-light font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.analytics_events.map(e => (
                        <tr key={e.event_type} className="border-b border-gray-50">
                          <td className="py-2 text-text">{e.event_type}</td>
                          <td className="py-2 text-right text-text-light font-medium">{e.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-light">No events in the last 7 days</p>
              )}
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-navy text-sm mb-4">Recent Leads</h2>
              {stats.recent_leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-text-light font-medium">Email</th>
                        <th className="text-center py-2 text-text-light font-medium">Score</th>
                        <th className="text-left py-2 text-text-light font-medium">Top Match</th>
                        <th className="text-right py-2 text-text-light font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_leads.map((lead, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-text font-mono text-xs">{lead.email}</td>
                          <td className="py-2 text-center">
                            <span className="inline-block bg-navy/10 text-navy font-bold text-xs px-2 py-0.5 rounded-full">
                              {lead.score}
                            </span>
                          </td>
                          <td className="py-2 text-text">{lead.top_match || '—'}</td>
                          <td className="py-2 text-right text-text-light text-xs">
                            {lead.date ? new Date(lead.date).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-light">No leads yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-text-light font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-navy">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {sub && <span className="text-xs text-text-light">{sub}</span>}
      </div>
    </div>
  )
}
