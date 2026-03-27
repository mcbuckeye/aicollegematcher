import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Send, GraduationCap, MessageCircle, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { sendChatMessage } from '../services/api'
import Navbar from '../components/Navbar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function getSessionId(): string {
  let id = localStorage.getItem('acm_chat_session')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('acm_chat_session', id)
  }
  return id
}

export default function ChatPage() {
  const { email, tier, chatLimit } = useAuth()
  const [searchParams] = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(chatLimit)
  const [limitReached, setLimitReached] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(getSessionId())

  // Parse match context from URL params
  const matchContext = useRef<Record<string, unknown> | undefined>(
    (() => {
      const ctx = searchParams.get('context')
      if (ctx) {
        try {
          return JSON.parse(decodeURIComponent(ctx))
        } catch {
          return undefined
        }
      }
      return undefined
    })()
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading || limitReached) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const context = messages.length === 0 ? (matchContext.current as Record<string, unknown>) : undefined
      const res = await sendChatMessage({
        message: text,
        email: email || undefined,
        session_id: sessionId.current,
        context,
      })

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
      if (res.remaining_messages !== null && res.remaining_messages !== undefined) {
        setRemaining(res.remaining_messages)
      }
    } catch (err: any) {
      if (err?.status === 429) {
        setLimitReached(true)
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "You've reached your message limit for this tier. Upgrade your plan to continue chatting!",
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const tierLabel = tier === 'free' ? 'Free' : tier === 'report' ? 'Match Report' : tier === 'season' ? 'Season Pass' : 'Premium'

  return (
    <div className="min-h-screen bg-warm-gray flex flex-col">
      <Helmet>
        <title>AI College Advisor Chat | AI College Matcher</title>
        <meta name="description" content="Chat with our AI college advisor for personalized guidance on college selection, applications, and more." />
        <link rel="canonical" href="https://aicollegematcher.machomelab.com/chat" />
      </Helmet>
      <Navbar />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-20 pb-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 mb-3">
            <MessageCircle className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-navy">AI College Advisor</span>
          </div>
          {chatLimit !== null && (
            <p className="text-xs text-text-light">
              {remaining !== null ? (
                <>
                  <span className="font-semibold text-navy">{remaining}</span> of{' '}
                  <span className="font-semibold">{chatLimit}</span> {tierLabel} messages remaining
                </>
              ) : (
                <>{chatLimit} messages available ({tierLabel} plan)</>
              )}
            </p>
          )}
          {chatLimit === null && (
            <p className="text-xs text-text-light">Unlimited messages ({tierLabel} plan)</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-navy/20 mx-auto mb-4" />
              <h2 className="font-serif text-xl font-bold text-navy mb-2">
                Chat with your AI College Advisor
              </h2>
              <p className="text-sm text-text-light max-w-md mx-auto mb-6">
                Ask about colleges, admissions strategies, essay tips, financial aid, or anything else about your college journey.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'What colleges are best for engineering?',
                  'How do I write a strong personal essay?',
                  'Explain financial aid options',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                    }}
                    className="text-xs bg-white border border-gray-200 rounded-full px-4 py-2 text-text-light hover:border-navy/30 hover:text-navy transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-navy text-white rounded-br-md'
                    : 'bg-white text-navy border border-gray-100 shadow-sm rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Limit reached CTA */}
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-navy to-navy-dark rounded-xl p-4 mb-4 text-center"
          >
            <Lock className="w-5 h-5 text-gold mx-auto mb-2" />
            <p className="text-white font-semibold text-sm mb-1">Message limit reached</p>
            <p className="text-white/70 text-xs mb-3">Upgrade to continue chatting with your AI advisor</p>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-1 bg-gold hover:bg-gold-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors no-underline"
            >
              View Plans <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* Input */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={limitReached ? 'Upgrade to continue chatting...' : 'Ask about colleges, admissions, essays...'}
            disabled={limitReached}
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-navy/30 focus:outline-none transition-colors text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || limitReached}
            className="bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white p-3 rounded-xl transition-all cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
