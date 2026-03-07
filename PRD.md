# CollegeMatch AI — Product Requirements Document
> Working name TBD. AI College Counselor for families.
> Author: Kayleigh | Date: 2026-03-07 | Status: Draft

---

## 1. Vision

**One-liner:** The AI college counselor that actually knows you.

**Problem:** Finding the right college is a $200K decision guided by $0 tools. Public school counselors have 400:1 ratios. Private consultants cost $5-20K. Existing "AI" tools are just database filters with a chatbot skin. Nobody provides the deep, opinionated, program-specific analysis that a great counselor does — at a price normal families can afford.

**Solution:** A conversational AI that gets to know a student through natural dialogue, builds a curated college list with honest program-specific analysis, and guides them through the entire application journey. Think "brilliant college counselor friend who went to MIT and has encyclopedic knowledge of every program at every school."

**Inspiration:** A real conversation where an AI analyzed robotics and ME programs across 10+ schools for a family with twins, providing honest takes on research labs, career pipelines, campus culture, costs, and application strategy — the kind of personalized depth that normally costs $10K+ from a human consultant.

---

## 2. Target User

**Primary:** Parents of high school juniors/seniors (the buyers)
**Secondary:** High school students (the users)
**Tertiary:** Independent college counselors (power users / white-label)

**Psychographic:** Families who:
- Know college matters but feel overwhelmed by choices
- Can't afford $10K+ private counselors
- Don't trust generic "top 10 lists"
- Want someone to tell them honestly: "here's where YOUR kid should apply, and here's why"

---

## 3. Core User Journey

### Step 1: Free Assessment (2 minutes)
- Land on homepage → take a quick quiz
- 8-10 questions: grade level, GPA range, intended major, location preferences, budget, priorities
- Instant result: "Your college readiness score" + top 3 school previews (blurred details)
- CTA: "Unlock your full personalized report" → signup

### Step 2: Onboarding Conversation (10-15 minutes)
- AI greets student by name, asks conversational questions:
  - "Tell me about yourself — what are you into outside of school?"
  - "What do you want to study? If you're not sure, that's totally fine."
  - "Do you see yourself at a big state school or a smaller place?"
  - "What matters more to you — being close to home or going somewhere new?"
  - "Any dream schools? Even if they're reaches, I want to know."
  - "Let's talk budget — does your family have a number in mind?"
  - "What kind of campus vibe are you looking for?"
- Natural follow-ups based on answers (not a rigid script)
- Builds a Student Profile behind the scenes

### Step 3: Match Analysis (generated in real-time)
- AI produces a curated list of 10-15 schools organized as:
  - **Best Fits** (4-5 schools) — where they'd thrive
  - **Strong Matches** (4-5 schools) — great options with specific strengths
  - **Smart Reaches** (2-3 schools) — aspirational but realistic
  - **Hidden Gems** (1-2 schools) — underrated programs they haven't considered

- For EACH school, the analysis includes:
  - Why it's a match (specific to this student)
  - Program-specific depth (department, research labs, pathways, faculty strengths)
  - Honest take (pros AND cons — not a brochure)
  - Acceptance likelihood (reach / match / safety based on their profile)
  - Cost estimate with average aid
  - Distance from home
  - Campus culture notes
  - Comparison to other schools on the list

### Step 4: Refine & Explore (ongoing)
- Student can ask follow-up questions: "Tell me more about WPI's robotics program"
- Compare schools head-to-head: "How does Lehigh compare to Stevens for ME?"
- Add/remove constraints: "Actually, I want to stay within 3 hours of home"
- Re-generate with new inputs
- Save favorites, build a short list

### Step 5: Application Strategy (paid tier)
- Personalized application calendar
- ED/EA recommendations with reasoning
- Essay brainstorming per school prompt
- Activity list review and optimization
- Progress tracking across applications

### Step 6: Decision Support (paid tier)
- Compare accepted school offers (academics, cost, aid, fit)
- Financial aid negotiation tips
- Campus visit planning with questions to ask
- Final decision framework

---

## 4. Feature Specification

### 4.1 — Conversational AI Engine (P0)

**Architecture:**
- LLM-powered conversation with structured data enrichment
- System prompt includes school database context, scoring models, and persona
- Retrieval-augmented generation: queries school database for factual data, LLM synthesizes analysis
- Session persistence: conversation history saved, student profile updated continuously
- Guardrails: factual claims backed by data sources, opinions clearly labeled as opinions

**Persona:**
- Knowledgeable, honest, slightly opinionated
- Uses analogies and comparisons students understand
- Not sycophantic — will say "this school might not be the best fit because..."
- Adapts tone to student's communication style

### 4.2 — School Database (P0)

**Data per school (~4,000 US colleges):**
- Basic: name, location, type, size, setting (urban/suburban/rural)
- Academics: majors offered, department rankings, student-faculty ratio, research output
- Admissions: acceptance rate, SAT/ACT ranges, GPA ranges, ED/EA policies
- Cost: tuition, room/board, average aid, average net price by income bracket
- Outcomes: graduation rate, retention rate, median earnings 10yr post-grad
- Culture: Greek life %, D1 sports, diversity stats, campus safety
- Programs: specific department details, research labs, special pathways, minors/certificates

**Sources:** IPEDS, College Scorecard, Common Data Sets, US News (where available), school websites (scraped for program details)

**Update frequency:** Annual refresh of stats, continuous enrichment of program details

### 4.3 — Student Profile Engine (P0)

**Profile fields (built through conversation):**
- Demographics: name, grade, location, high school type
- Academics: GPA (weighted/unweighted), test scores, AP/IB courses, class rank
- Interests: intended major(s), extracurriculars, passions, career aspirations
- Preferences: school size, location, distance from home, campus culture, climate
- Constraints: budget, need-based aid eligibility, legacy connections, special circumstances
- Family: siblings (applying same year?), parent preferences, first-gen status

**Matching algorithm:**
- Weighted scoring across dimensions (academics, fit, preferences, constraints)
- Acceptance probability model (based on Common Data Set ranges)
- "Hidden gem" detection (schools that match well but student hasn't considered)
- Anti-pattern detection ("you said you want small classes but you're looking at 40,000-student schools")

### 4.4 — Match Report Generator (P0)

**Output:** Beautiful PDF and web report containing:
- Student profile summary
- Curated school list with full analysis per school
- Comparison matrix (table view)
- Application strategy overview
- Next steps / timeline
- Sources and methodology note

**Design:** Professional, clean, branded. Parents should feel comfortable sharing this with grandparents, guidance counselors, etc.

### 4.5 — Free Assessment Tool (P0 — Lead Gen)

**10-question quick quiz (no signup):**
1. What grade are you in?
2. What's your approximate GPA? (range selector)
3. Have you taken the SAT/ACT? (score range or not yet)
4. What do you want to study? (searchable major list + "not sure")
5. What school size appeals to you? (small/medium/large/no preference)
6. How far from home? (commuting/1-3hrs/anywhere/international)
7. What matters most? (rank: academics, cost, campus life, location, career outcomes)
8. What's your family's college budget? (ranges)
9. Any must-haves? (checkboxes: D1 sports, Greek life, research, co-op, urban, religious)
10. What's your biggest worry about college? (open text)

**Output:**
- College Readiness Score (0-100)
- Top 3 school matches (preview — names + one-line why, details blurred)
- "See your full personalized report" → signup CTA
- Email capture for the detailed version

---

## 5. Technical Architecture

### Stack
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (profiles, sessions, school data)
- **AI:** Claude/GPT via API (configurable) with structured prompts
- **Vector DB:** pgvector or Pinecone (school program detail embeddings for RAG)
- **Auth:** JWT
- **PDF:** WeasyPrint
- **Hosting:** Dokploy on MachomeLab (MVP), cloud for scale

### Data Pipeline
```
IPEDS API → ETL → PostgreSQL (school_stats)
College Scorecard API → ETL → PostgreSQL (outcomes)
School websites → Scraper → PostgreSQL (program_details)
All → Embedding pipeline → Vector DB (for RAG retrieval)
```

### API Structure
```
/api/v1/
├── auth/ (register, login, refresh)
├── assessment/ (public, no auth — free tool)
├── chat/ (conversational AI endpoint, streaming)
├── profile/ (student profile CRUD)
├── schools/ (search, detail, compare)
├── matches/ (generated match lists)
├── reports/ (generate PDF, list, download)
└── billing/ (Stripe integration)
```

### Conversation Flow
```
User message → 
  Backend receives →
  Retrieves student profile context →
  Queries school DB for relevant data (RAG) →
  Builds system prompt with context + data →
  Sends to LLM →
  Parses response for profile updates →
  Updates student profile →
  Streams response to frontend
```

---

## 6. Design Principles

1. **Conversation first.** The chat IS the product. Everything else supports it.
2. **Honest > nice.** The AI should say "this is a reach" and "this school has weak career placement" — parents are paying for honesty.
3. **Data-backed opinions.** Every recommendation has a reason. Every reason has data behind it.
4. **Parent + student.** Parents buy it, students use it. Both need to feel served.
5. **Not a search engine.** We don't show 500 schools. We show 10-15 with deep analysis.
6. **Mobile-first.** Students live on their phones.

---

## 7. Pricing

| | Free | Match Report | Season Pass | Premium |
|---|------|-------------|-------------|---------|
| **Price** | $0 | $49 one-time | $29/mo | $99/mo |
| **Assessment quiz** | ✅ | ✅ | ✅ | ✅ |
| **Top 3 school preview** | ✅ | ✅ | ✅ | ✅ |
| **AI conversation** | 3 messages | 20 messages | Unlimited | Unlimited |
| **Full match report (10-15 schools)** | ❌ | ✅ | ✅ | ✅ |
| **PDF export** | ❌ | ✅ | ✅ | ✅ |
| **Application strategy** | ❌ | ❌ | ✅ | ✅ |
| **Essay feedback** | ❌ | ❌ | ✅ | ✅ |
| **Financial aid analysis** | ❌ | ❌ | ❌ | ✅ |
| **Parent dashboard** | ❌ | ❌ | ❌ | ✅ |
| **Decision support** | ❌ | ❌ | ❌ | ✅ |

---

## 8. Build Plan

### Phase 1: Landing Page + Free Assessment (Week 1)
- Marketing page with value prop
- Free 10-question assessment with school preview
- Email capture + waitlist

### Phase 2: School Database + Matching Engine (Weeks 2-3)
- IPEDS + College Scorecard data ingestion pipeline
- School database with 4,000+ colleges
- Basic matching algorithm
- School detail pages

### Phase 3: Conversational AI + Student Profiles (Weeks 3-4)
- Chat interface (streaming)
- Student profile engine (built through conversation)
- RAG pipeline for school-specific knowledge
- Session persistence

### Phase 4: Match Reports (Week 5)
- Match report generation (web + PDF)
- School comparison views
- Shareable report links

### Phase 5: Billing + Launch (Week 6)
- Stripe integration
- User guide
- Polish, mobile optimization
- Launch

### Phase 6: Application Support (Weeks 7-8, post-launch)
- Application timeline
- Essay brainstorming/feedback
- Activity list optimization
- Financial aid comparison

---

## 9. Open Questions

1. **Name?** CollegeMatch AI? CampusCompass? Something else?
2. **LLM provider?** Claude (better at nuance) vs GPT (faster, cheaper) — or configurable?
3. **School data depth:** How deep do we go on program-specific info for MVP vs. iterate?
4. **International schools?** US-only for V1?
5. **White-label for counselors?** Good revenue but adds complexity
6. **Legal review:** Any liability concerns around admissions advice?

---

## 10. Why This Wins

The existing market is split between:
- **Expensive humans** ($5-20K) who provide great personalized advice
- **Cheap tools** ($0-free) that provide generic database lookups

Nobody occupies the middle: **$29-99/mo for genuinely personalized, AI-powered college counseling with program-specific depth.**

That's the gap. That's the product.
