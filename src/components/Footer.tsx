import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    console.log('[Waitlist signup]', email)
    setSubmitted(true)
    setEmail('')
  }

  return (
    <footer className="bg-navy-dark text-white">
      {/* Waitlist */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
            Get Early Access
          </h2>
          <p className="text-white/70 mb-6">
            Join the waitlist and be the first to get AI-powered college matching when we launch.
          </p>
          {submitted ? (
            <p className="text-gold font-semibold">You're on the list! We'll be in touch.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                className="bg-gold hover:bg-gold-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Join Waitlist
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gold" />
            <span className="font-serif font-bold text-sm">AI College Matcher</span>
          </div>
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} AI College Matcher. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
