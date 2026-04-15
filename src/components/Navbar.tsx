import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Menu, X, MessageCircle, FileText, DollarSign, GitCompareArrows, Target, Microscope, User, LogOut, Bookmark, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const { user, logout } = useAuth()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 no-underline group">
          <GraduationCap className="w-7 h-7 text-navy group-hover:text-gold transition-colors" />
          <span className="font-serif font-bold text-lg text-navy">
            AI College Matcher
          </span>
        </Link>

        {/* Desktop */}
        {isHome && (
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-text-light hover:text-navy transition-colors no-underline">How It Works</a>
            <a href="#features" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Features</a>
            <Link to="/schools" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Browse Schools</Link>
            <Link to="/blog" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Blog</Link>
            <Link to="/majors" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <Microscope className="w-3.5 h-3.5" />
              Explore Majors
            </Link>
            <Link to="/chat" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              AI Chat
            </Link>
            <Link to="/essay" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Essays
            </Link>
            <Link to="/compare" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <GitCompareArrows className="w-3.5 h-3.5" />
              Compare
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-navy/5 transition-colors"
                >
                  <div className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-light transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-text-light truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/saved"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-navy/5 transition-colors no-underline"
                    >
                      <Bookmark className="w-4 h-4" />
                      Saved Schools
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm text-navy hover:text-navy-light font-medium transition-colors no-underline border border-navy/20 px-4 py-1.5 rounded-lg hover:bg-navy/5"
              >
                Sign In
              </Link>
            )}
          </div>
        )}

        {!isHome && (
          <div className="hidden md:flex items-center gap-4">
            <Link to="/schools" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Browse Schools</Link>
            <Link to="/blog" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Blog</Link>
            <Link to="/majors" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <Microscope className="w-3.5 h-3.5" />
              Explore Majors
            </Link>
            <Link to="/chat" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              AI Chat
            </Link>
            <Link to="/essay" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Essays
            </Link>
            <Link to="/compare" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <GitCompareArrows className="w-3.5 h-3.5" />
              Compare
            </Link>
            <Link to="/strategy" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              Strategy
            </Link>
            <Link to="/financial-aid" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Aid
            </Link>
            <Link
              to="/"
              className="text-sm text-text-light hover:text-navy transition-colors no-underline"
            >
              Home
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-navy/5 transition-colors"
                >
                  <div className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-light transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-text-light truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/saved"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-navy/5 transition-colors no-underline"
                    >
                      <Bookmark className="w-4 h-4" />
                      Saved Schools
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm text-navy hover:text-navy-light font-medium transition-colors no-underline border border-navy/20 px-4 py-1.5 rounded-lg hover:bg-navy/5"
              >
                Sign In
              </Link>
            )}
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-navy bg-transparent border-0 cursor-pointer"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {isHome && (
                <>
                  <a href="#how-it-works" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline">How It Works</a>
                  <a href="#features" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline">Features</a>
                </>
              )}
              <Link to="/schools" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline">Browse Schools</Link>
              <Link to="/blog" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline">Blog</Link>
              <Link to="/majors" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <Microscope className="w-3.5 h-3.5" />
                Explore Majors
              </Link>
              <Link to="/chat" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                AI Chat
              </Link>
              <Link to="/essay" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Essay Feedback
              </Link>
              <Link to="/compare" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <GitCompareArrows className="w-3.5 h-3.5" />
                Compare Schools
              </Link>
              <Link to="/strategy" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Strategy
              </Link>
              <Link to="/financial-aid" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Financial Aid
              </Link>

              {user ? (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-text-light mb-3">{user.email}</p>
                    <Link to="/saved" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5" />
                      Saved Schools
                    </Link>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setOpen(false) }}
                    className="text-red-600 hover:text-red-700 transition-colors text-left flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-navy font-medium hover:text-navy-light transition-colors no-underline flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              )}

              <Link
                to={isHome ? '/assess' : '/'}
                onClick={() => setOpen(false)}
                className="bg-gradient-to-r from-gold to-gold-dark text-white font-semibold text-center px-5 py-2.5 rounded-lg transition-all no-underline"
              >
                {isHome ? 'Free Assessment' : 'Back to Home'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
