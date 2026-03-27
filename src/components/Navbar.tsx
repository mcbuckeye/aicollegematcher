import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Menu, X, MessageCircle, FileText, DollarSign } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
            <Link to="/chat" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              AI Chat
            </Link>
            <Link to="/essay" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Essays
            </Link>
            <Link
              to="/assess"
              className="bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all no-underline shadow-sm hover:shadow-md"
            >
              Free Assessment
            </Link>
          </div>
        )}

        {!isHome && (
          <div className="hidden md:flex items-center gap-4">
            <Link to="/schools" className="text-sm text-text-light hover:text-navy transition-colors no-underline">Browse Schools</Link>
            <Link to="/chat" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              AI Chat
            </Link>
            <Link to="/essay" className="text-sm text-text-light hover:text-navy transition-colors no-underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Essays
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
              <Link to="/chat" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                AI Chat
              </Link>
              <Link to="/essay" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Essay Feedback
              </Link>
              <Link to="/financial-aid" onClick={() => setOpen(false)} className="text-text-light hover:text-navy transition-colors no-underline flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Financial Aid
              </Link>
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
