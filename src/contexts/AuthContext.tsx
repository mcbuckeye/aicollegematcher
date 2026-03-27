import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8002/api'
)

type Tier = 'free' | 'report' | 'season' | 'premium'

interface AuthState {
  email: string | null
  tier: Tier
}

interface AuthContextType extends AuthState {
  setAuth: (email: string, tier: Tier) => void
  clearAuth: () => void
  isPaid: boolean
  canExportPdf: boolean
  chatLimit: number | null
}

const AuthContext = createContext<AuthContextType>({
  email: null,
  tier: 'free',
  setAuth: () => {},
  clearAuth: () => {},
  isPaid: false,
  canExportPdf: false,
  chatLimit: 3,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('acm_auth')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return { email: null, tier: 'free' as Tier }
      }
    }
    return { email: null, tier: 'free' as Tier }
  })

  useEffect(() => {
    if (auth.email) {
      fetch(`${API_BASE_URL}/payments/status?email=${encodeURIComponent(auth.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.tier && data.tier !== auth.tier) {
            const updated = { email: auth.email, tier: data.tier as Tier }
            setAuthState(updated)
            localStorage.setItem('acm_auth', JSON.stringify(updated))
          }
        })
        .catch(() => {})
    }
  }, [auth.email])

  function setAuth(email: string, tier: Tier) {
    const state = { email, tier }
    setAuthState(state)
    localStorage.setItem('acm_auth', JSON.stringify(state))
  }

  function clearAuth() {
    setAuthState({ email: null, tier: 'free' })
    localStorage.removeItem('acm_auth')
  }

  const isPaid = auth.tier !== 'free'
  const canExportPdf = ['report', 'season', 'premium'].includes(auth.tier)
  const chatLimits: Record<Tier, number | null> = {
    free: 3,
    report: 20,
    season: null,
    premium: null,
  }

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        setAuth,
        clearAuth,
        isPaid,
        canExportPdf,
        chatLimit: chatLimits[auth.tier],
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
