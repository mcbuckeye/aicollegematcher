import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Bookmark, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getSavedSchools, removeSavedSchool, type SavedSchoolEntry } from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function SavedSchoolsPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [savedSchools, setSavedSchools] = useState<SavedSchoolEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/saved' } })
      return
    }
    loadSaved()
  }, [user, token])

  async function loadSaved() {
    try {
      const data = await getSavedSchools(token!)
      setSavedSchools(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved schools')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(schoolId: number) {
    try {
      await removeSavedSchool(token!, schoolId)
      setSavedSchools(prev => prev.filter(s => s.school_id !== schoolId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove school')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <Helmet>
        <title>Saved Schools | AI College Matcher</title>
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Bookmark className="w-8 h-8 text-navy" />
            <h1 className="text-3xl font-bold text-gray-900">Saved Schools</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy"></div>
              <p className="mt-4 text-gray-600">Loading your saved schools...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          ) : savedSchools.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Bookmark className="w-12 h-12 text-text-light mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved schools yet</h2>
              <p className="text-text-light mb-6">
                Browse schools and click the bookmark icon to save them here.
              </p>
              <Link
                to="/schools"
                className="inline-block px-6 py-3 bg-gradient-to-r from-navy to-navy-light text-white font-semibold rounded-lg no-underline hover:shadow-md transition-all"
              >
                Browse Schools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSchools.map(saved => (
                <div
                  key={saved.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 relative"
                >
                  <button
                    onClick={() => handleRemove(saved.school_id)}
                    className="absolute top-4 right-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/schools/${saved.school_id}`}
                    className="block no-underline text-inherit"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{saved.school.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {saved.school.city}, {saved.school.state}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{saved.school.type}</span>
                      </div>
                      {saved.school.acceptance_rate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Acceptance:</span>
                          <span className="font-medium">{saved.school.acceptance_rate}%</span>
                        </div>
                      )}
                      {saved.school.tuition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tuition:</span>
                          <span className="font-medium">${(saved.school.tuition / 1000).toFixed(0)}k</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {saved.notes && (
                    <p className="mt-3 text-sm text-text-light italic border-t border-gray-100 pt-3">
                      {saved.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
