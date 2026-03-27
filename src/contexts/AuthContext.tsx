import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

type Tier = 'free' | 'report' | 'season' | 'premium'

interface UserData {
  id: number
  email: string
  tier: Tier
  is_verified: boolean
}

interface AuthContextType {
  user: UserData | null
  token: string | null
  email: string | null
  tier: Tier
  isPaid: boolean
  canExportPdf: boolean
  chatLimit: number | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  setAuth: (email: string, tier: Tier) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  email: null,
  tier: 'free',
  isPaid: false,
  canExportPdf: false,
  chatLimit: 3,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setAuth: () => {},
  clearAuth: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('acm_token'))
  const [loading, setLoading] = useState(true)

  // On mount, verify stored token
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token')
        return res.json()
      })
      .then((data: UserData) => {
        setUser(data)
      })
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem('acm_token')
        localStorage.removeItem('acm_auth')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Login failed')
    }
    const data = await res.json()
    localStorage.setItem('acm_token', data.access_token)
    localStorage.setItem('acm_auth', JSON.stringify({ email: data.user.email, tier: data.user.tier }))
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Registration failed')
    }
    const data = await res.json()
    localStorage.setItem('acm_token', data.access_token)
    localStorage.setItem('acm_auth', JSON.stringify({ email: data.user.email, tier: data.user.tier }))
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('acm_token')
    localStorage.removeItem('acm_auth')
    setToken(null)
    setUser(null)
  }, [])

  // Legacy compat for existing code that uses setAuth/clearAuth
  const setAuth = useCallback((email: string, tier: Tier) => {
    localStorage.setItem('acm_auth', JSON.stringify({ email, tier }))
  }, [])

  const clearAuth = useCallback(() => {
    logout()
  }, [logout])

  const tier: Tier = (user?.tier as Tier) || 'free'
  const isPaid = tier !== 'free'
  const canExportPdf = ['report', 'season', 'premium'].includes(tier)
  const chatLimits: Record<Tier, number | null> = {
    free: 3,
    report: 20,
    season: null,
    premium: null,
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        email: user?.email || null,
        tier,
        isPaid,
        canExportPdf,
        chatLimit: chatLimits[tier],
        loading,
        login,
        register,
        logout,
        setAuth,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
