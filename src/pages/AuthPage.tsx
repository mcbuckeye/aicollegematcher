import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const isRegister = location.pathname === '/register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(isRegister ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleToast, setGoogleToast] = useState(false)

  const from = (location.state as any)?.from || '/assess'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (activeTab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      if (activeTab === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleClick() {
    setGoogleToast(true)
    setTimeout(() => setGoogleToast(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <Helmet>
        <title>{activeTab === 'login' ? 'Sign In' : 'Create Account'} | AI College Matcher</title>
      </Helmet>
      <Navbar />

      <main className="flex-grow flex items-center justify-center mt-16 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <GraduationCap className="w-8 h-8 text-navy" />
              <span className="font-serif font-bold text-2xl text-navy">AI College Matcher</span>
            </div>
            <p className="text-text-light text-sm">
              {activeTab === 'login' ? 'Welcome back!' : 'Create your free account'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => { setActiveTab('login'); setError(null) }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'text-navy border-b-2 border-navy bg-navy/5'
                    : 'text-text-light hover:text-navy'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(null) }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'text-navy border-b-2 border-navy bg-navy/5'
                    : 'text-text-light hover:text-navy'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              {activeTab === 'login' && (
                <div className="text-right">
                  <Link to="/login" className="text-sm text-navy hover:text-navy-light transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-navy to-navy-light hover:from-navy-light hover:to-navy text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  activeTab === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-text-light">or</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-text"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          {/* Google toast */}
          {googleToast && (
            <div className="mt-4 p-3 bg-navy text-white text-sm rounded-lg text-center animate-pulse">
              Google sign-in coming soon!
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
