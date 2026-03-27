import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  MessageSquareText,
  Microscope,
  ThumbsUp,
  Users,
  DollarSign,
  Search,
  ArrowRight,
  Check,
  Frown,
  HelpCircle,
  Sparkles,
  Shield,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-40 sm:pb-32 px-4 overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 hero-grid" />
        {/* Gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-navy/5 to-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-gradient-to-tl from-gold/5 to-navy/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-navy">AI-Powered College Counseling</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-navy">Find Your Perfect</span>
            <br />
            <span className="bg-gradient-to-r from-gold-dark via-gold to-gold-light bg-clip-text text-transparent animate-gradient">
              College Match
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-text-light max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Get the personalized college guidance that used to cost thousands —
            powered by AI that actually understands your goals, budget, and dreams.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/assess"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all no-underline shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-0.5"
            >
              Take Free Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-navy/10 text-navy font-semibold text-lg px-8 py-4 rounded-xl hover:border-navy/25 hover:bg-navy/[0.02] transition-all no-underline"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-text-light"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold" />
              2 min assessment
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-gold" />
              No signup required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-gold" />
              Instant results
            </span>
          </motion.div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-gradient-to-r from-navy-dark via-navy to-navy-dark text-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { number: '4,000+', label: 'US colleges analyzed' },
            { number: '$10K+', label: 'saved vs. private consultants' },
            { number: '2 min', label: 'to your personalized match' },
          ].map((stat, i) => (
            <motion.div
              key={stat.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-gold mb-1">{stat.number}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 sm:py-28 px-4 bg-warm-gray">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3 block">The Problem</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
              The College Search Is Broken
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              Families deserve better than generic advice and unaffordable consultants.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: HelpCircle,
                title: 'Overwhelmed by Choices',
                desc: '4,000+ colleges, endless rankings, contradicting advice. How do you even start narrowing it down?',
                color: 'bg-red-50',
                iconColor: 'text-red-400',
              },
              {
                icon: DollarSign,
                title: "Can't Afford Consultants",
                desc: 'Private college counselors charge $5,000-$20,000. Public school counselors have 400:1 ratios.',
                color: 'bg-orange-50',
                iconColor: 'text-orange-400',
              },
              {
                icon: Frown,
                title: "Generic Tools Don't Cut It",
                desc: 'Existing tools are database filters with a chatbot skin. They show 200 schools, not the 10 that actually fit.',
                color: 'bg-amber-50',
                iconColor: 'text-amber-500',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-5`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{card.title}</h3>
                <p className="text-text-light text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3 block">How It Works</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
              Your Perfect List in 3 Steps
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              Three simple steps to a college list that actually makes sense for your family.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                icon: MessageSquareText,
                title: 'Tell Us About You',
                desc: 'Answer 10 quick questions about your goals, interests, grades, and what matters most. Takes about 2 minutes.',
              },
              {
                step: '2',
                icon: Search,
                title: 'AI Analyzes 4,000+ Schools',
                desc: 'Our algorithm cross-references your profile against every US college — academics, culture, cost, outcomes, and fit.',
              },
              {
                step: '3',
                icon: GraduationCap,
                title: 'Get Your Match Report',
                desc: 'Receive a curated list of schools with honest, program-specific analysis and your college readiness score.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center relative"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-navy/10" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy/5 to-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-8 h-8 text-navy" />
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider mb-3">
                  <span className="w-5 h-5 bg-gold text-white rounded-full flex items-center justify-center text-[10px]">{item.step}</span>
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-text-light text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}
            variants={fadeUp}
            className="text-center mt-14"
          >
            <Link
              to="/assess"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold px-8 py-4 rounded-xl transition-all no-underline shadow-lg shadow-gold/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Your Free Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-4 bg-gradient-to-b from-warm-gray to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3 block">Why Us</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
              Not Your Average College Tool
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              This is the brilliant college counselor friend you always wished you had.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-6"
          >
            {[
              {
                icon: MessageSquareText,
                title: 'Smart Matching AI',
                desc: 'Our algorithm weighs academics, cost, culture, career outcomes, and your personal preferences to find schools that truly fit.',
                gradient: 'from-blue-50 to-indigo-50',
              },
              {
                icon: Microscope,
                title: 'Program-Specific Depth',
                desc: "We don't just say 'good engineering school.' We know specific labs, research groups, co-op pipelines, and faculty strengths.",
                gradient: 'from-purple-50 to-pink-50',
              },
              {
                icon: ThumbsUp,
                title: 'Honest Opinions',
                desc: "We'll tell you when a school is a reach, when a program is overrated, and when a hidden gem deserves your attention.",
                gradient: 'from-green-50 to-emerald-50',
              },
              {
                icon: TrendingUp,
                title: 'Data-Driven Insights',
                desc: 'Every recommendation is backed by real data — acceptance rates, graduation outcomes, salary data, and financial aid stats.',
                gradient: 'from-amber-50 to-orange-50',
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                custom={i}
                className={`bg-gradient-to-br ${feat.gradient} rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow flex gap-5`}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <feat.icon className="w-6 h-6 text-navy" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy mb-1">{feat.title}</h3>
                  <p className="text-text-light text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3 block">Pricing</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              Personalized college guidance shouldn't cost as much as a semester of tuition.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                period: '',
                desc: 'See what we can do',
                features: ['Assessment quiz', 'Top 3 school preview', '3 AI messages'],
                cta: 'Start Free',
                href: '/assess',
                featured: false,
              },
              {
                name: 'Match Report',
                price: '$49',
                period: 'one-time',
                desc: 'Your personalized college list',
                features: ['Everything in Free', 'Full 10-15 school report', '20 AI messages', 'PDF export'],
                cta: 'Get Report',
                href: '/assess',
                featured: false,
              },
              {
                name: 'Season Pass',
                price: '$29',
                period: '/mo',
                desc: 'Full application support',
                features: ['Everything in Report', 'Unlimited AI chat', 'Application strategy', 'Essay feedback'],
                cta: 'Start Season',
                href: '/assess',
                featured: true,
              },
              {
                name: 'Premium',
                price: '$99',
                period: '/mo',
                desc: 'The complete package',
                features: ['Everything in Season', 'Financial aid analysis', 'Parent dashboard', 'Decision support'],
                cta: 'Go Premium',
                href: '/assess',
                featured: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className={`rounded-2xl p-7 flex flex-col transition-shadow ${
                  plan.featured
                    ? 'bg-gradient-to-b from-navy to-navy-dark text-white shadow-xl shadow-navy/20 ring-2 ring-gold relative'
                    : 'bg-white border border-gray-200 hover:shadow-md'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-navy'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-bold ${plan.featured ? 'text-white' : 'text-navy'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.featured ? 'text-white/60' : 'text-text-light'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-5 ${plan.featured ? 'text-white/70' : 'text-text-light'}`}>
                  {plan.desc}
                </p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? 'text-gold' : 'text-green-500'}`} />
                      <span className={plan.featured ? 'text-white/90' : ''}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer border-0 block text-center no-underline ${
                    plan.featured
                      ? 'bg-gold hover:bg-gold-dark text-white shadow-lg shadow-gold/20'
                      : 'bg-navy/5 hover:bg-navy/10 text-navy'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-20 sm:py-28 px-4 bg-warm-gray">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-3 block">The Difference</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
              What You Won't Get Anywhere Else
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: '150+ Schools Analyzed',
                desc: 'Our database covers Ivies, flagships, HBCUs, hidden gems, military academies, and everything in between — with real stats on every one.',
              },
              {
                icon: Users,
                title: 'Personalized Matching',
                desc: "Not a filter. Our algorithm weighs your GPA, scores, budget, priorities, and personality to find the 3-10 schools that genuinely fit you.",
              },
              {
                icon: TrendingUp,
                title: 'Honest Career Data',
                desc: 'Real median earnings at 10 years, graduation rates, student-faculty ratios, and net costs after aid. No spin, just numbers.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-navy/5 to-navy/10 rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-text-light text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-gradient-to-br from-navy to-navy-dark rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                Ready to Find Your Match?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Take our free 2-minute assessment and see your personalized college readiness score instantly. No signup required.
              </p>
              <Link
                to="/assess"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all no-underline shadow-lg shadow-gold/30 hover:shadow-xl hover:-translate-y-0.5"
              >
                Take Free Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-white/40 text-sm mt-6">
                Free forever · No credit card required · Results in 2 minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
