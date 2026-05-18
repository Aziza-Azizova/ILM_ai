# Ilm AI — 4-Week Build Plan

**Deadline:** 2026-06-14  
**Stack:** NestJS · PostgreSQL + pgvector · React.js · MUI  
**AI:** Anthropic Claude (claude-sonnet-4-6) · OpenAI text-embedding-3-small  
**Payments:** Stripe  
**File storage:** Local disk (MVP) → migrate to S3 post-launch

---

## Architecture Overview

```
┌─────────────────┐     REST API      ┌──────────────────────┐
│  React + MUI    │ ◄────────────►   │   NestJS Backend     │
│  (frontend/)    │                   │   (backend/)         │
└─────────────────┘                   └──────┬───────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                   ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
                   │ PostgreSQL  │  │ Claude API   │  │ OpenAI API   │
                   │ + pgvector  │  │ (LLM + chat) │  │ (embeddings) │
                   └─────────────┘  └──────────────┘  └──────────────┘
                          │
                   ┌──────▼──────────┐
                   │  Local storage  │
                   │  (uploads/)     │
                   └─────────────────┘

External: Stripe webhooks · Telegram Bot API
```

---

## Week 1 — Foundation (2026-05-17 to 2026-05-24)

Goal: Auth working, file upload pipeline running, basic RAG chat answering questions from uploaded docs.

### Day 1–2: Project Setup & Database
- [ ] Initialize NestJS project (`backend/`)
- [ ] Initialize React project (`frontend/`)
- [ ] Set up Docker Compose (postgres + pgvector + backend + frontend)
- [ ] Design and run database migrations (see schema below)
- [ ] Configure `.env` files and environment variable structure

### Day 3: Authentication
- [ ] JWT auth module in NestJS (register, login, refresh token)
- [ ] Google OAuth strategy (Passport.js)
- [ ] Auth guard applied to all protected routes
- [ ] Frontend: login page, register page, token storage (httpOnly cookie or localStorage)

### Day 4: File Upload & Processing Pipeline
- [ ] File upload endpoint (PDF, DOCX, TXT, plain text paste)
- [ ] Text extraction service (pdf-parse for PDF, mammoth for DOCX)
- [ ] Chunking service (split text into ~500-token chunks with overlap)
- [ ] Embedding service (OpenAI text-embedding-3-small API call)
- [ ] Store chunks + embeddings in pgvector (`document_chunks` table)
- [ ] Frontend: file upload UI with drag-and-drop

### Day 5–6: RAG Chat
- [ ] Semantic search endpoint: embed query → cosine similarity search on pgvector
- [ ] Chat endpoint: retrieve top-k chunks → build Claude prompt with sources → stream response
- [ ] System prompt: warm/Socratic personality, grounded-only answers, cite source sections
- [ ] Language detection: respond in Uzbek/Russian/English based on user input
- [ ] Save chat history to DB per session
- [ ] Frontend: chat interface with message bubbles and source citations

### Day 6 (also): Uzbek Language Quality Test
- [ ] Write a system prompt variant explicitly instructing Claude to respond in the user's language
- [ ] Upload a short Uzbek-language text (e.g. a paragraph from an Uzbek article or textbook)
- [ ] Ask 5 questions in Uzbek and evaluate: fluency, correctness, whether it stays in Uzbek
- [ ] Ask the same 5 questions in Russian and English to compare
- [ ] If Uzbek quality is poor, adjust system prompt (add explicit language instruction, few-shot examples in Uzbek, or instruct Claude to transliterate if needed)
- [ ] Document the winning system prompt in `backend/src/ai/prompts/companion.prompt.ts` with a comment explaining what was tested

### Day 7: Topics/Collections + Profile
- [ ] Topic CRUD (user-named collections, attach materials to topics)
- [ ] Profile page: basic stats (sessions, topics, uploads)
- [ ] Goal setting: text goal + target date stored on user profile

---

## Week 2 — Core Features (2026-05-25 to 2026-05-31)

Goal: Quiz mode live, learning plan agent generating plans, Telegram bot sending reminders.

### Day 8–9: Quiz & Practice Mode
- [ ] Quiz generation endpoint: select topic + difficulty → Claude generates questions from chunks
- [ ] Question types: multiple choice, short answer, open-ended explanation
- [ ] Answer evaluation endpoint: Claude evaluates response + cites source section
- [ ] Save quiz session (questions, answers, scores) to DB
- [ ] Frontend: quiz UI (question display, answer input, feedback panel)
- [ ] Difficulty levels: gentle / solid / expert

### Day 10–11: Learning Plan Agent
- [ ] Implement agent tools as NestJS services:
  - `getKnowledgeGaps(userId)` — aggregate quiz history
  - `listTopics(userId)` — list user's materials
  - `getDaysUntilGoal(userId)` — compute from goal date
  - `generatePlan(topics, gaps, days)` — Claude call with structured output
- [ ] Agent orchestration: chain tools → produce day-by-day JSON plan
- [ ] Store plan in DB, re-generate when new sessions complete or goal date changes
- [ ] Frontend: learning plan display (calendar-style or list view)

### Day 12: Knowledge Gap Detection
- [ ] Aggregate quiz results: identify concepts with consistently low scores
- [ ] Gap analysis prompt: Claude summarizes weak areas with specific material references
- [ ] Gaps Report stored in DB, updated after every quiz session
- [ ] Frontend: gaps report panel on dashboard

### Day 13–14: Telegram Bot
- [ ] Set up Telegram Bot (BotFather → token)
- [ ] Webhook endpoint in NestJS to receive Telegram updates
- [ ] `/start` command: link Telegram account to Ilm AI account (via token)
- [ ] Daily reminder: cron job sends message at user-configured time
- [ ] `/quiz` command: runs 5-question quiz on user's most recent topic
- [ ] Streak tracking: consecutive days with at least one session

---

## Week 3 — Polish & Integrations (2026-06-01 to 2026-06-07)

Goal: Payment flow in test mode, full UI polish, mobile-responsive, knowledge gaps live.

### Day 15–16: Stripe Payment Integration
- [ ] Stripe customer + subscription creation on premium upgrade
- [ ] Checkout session endpoint (redirect to Stripe hosted page)
- [ ] Webhook handler: `checkout.session.completed` → activate premium in DB
- [ ] Webhook handler: `customer.subscription.deleted` → downgrade to free
- [ ] Free tier enforcement: 3 quiz sessions/day, 5 file uploads, basic chat
- [ ] Frontend: pricing page, upgrade/downgrade flow, billing history

### Day 17–18: UI Polish & Mobile
- [ ] Responsive layout using MUI Grid/Breakpoints (test on 375px mobile)
- [ ] Dashboard: stats cards (sessions, topics, streak, knowledge score trend)
- [ ] Navigation: sidebar (desktop) / bottom nav (mobile)
- [ ] Loading states, error boundaries, empty states for all pages
- [ ] Toast notifications for key actions

### Day 19–20: Monitoring & Logging
- [ ] LLM call logging: log every Claude/OpenAI request — prompt, response, latency, token count — to `llm_logs` table
- [ ] Sentry integration (backend error tracking)
- [ ] Basic usage metrics endpoint (DAU, quiz completions, upload counts)

### Day 21: Testing & Bug fixes
- [ ] Manual end-to-end walkthrough: sign up → upload → chat → quiz → plan → payment
- [ ] Fix critical bugs found in walkthrough
- [ ] Write at least 5 integration tests for core API endpoints

---

## Week 4 — Ship It (2026-06-08 to 2026-06-14)

Goal: Deployed to production, CI/CD running, evaluation complete, deliverables ready.

### Day 22–23: Docker & Deployment
- [ ] Production Dockerfile for backend (multi-stage build)
- [ ] Production build for frontend (static export or Node server)
- [ ] Docker Compose for production
- [ ] Deploy to Railway / Render / VPS (DigitalOcean / Hetzner)
- [ ] Configure production environment secrets (never in repo)
- [ ] Test production deployment end-to-end

### Day 24: CI/CD
- [ ] GitHub repository setup (push code)
- [ ] GitHub Actions: run lint + tests on every push
- [ ] GitHub Actions: auto-deploy to production on merge to `main`

### Day 25–26: Quality Evaluation (Required Deliverable)
- [ ] Create evaluation rubric (accuracy, groundedness, helpfulness, tone — 1–5 scale)
- [ ] Run 50 AI companion interactions (upload real material, ask real questions)
- [ ] Rate each response on the rubric
- [ ] Document results in `evaluation-report.md`

### Day 27–28: Final Deliverables
- [ ] Write `README.md` (setup instructions, architecture diagram, API docs)
- [ ] Record 5-minute demo video (sign up → upload → chat → quiz → plan → payment)
- [ ] Write 1-page reflection document
- [ ] Get 3+ real people to test the app and collect feedback
- [ ] Final presentation prep (person story, demo, architecture, hard thing, what's next)

---

## Database Schema (Reference)

```sql
-- Core
users (id, email, name, password_hash, google_id, plan, telegram_chat_id, goal_text, goal_date, created_at)
sessions (id, user_id, started_at, ended_at)

-- Materials
topics (id, user_id, name, created_at)
documents (id, user_id, topic_id, filename, file_path, status, created_at)
document_chunks (id, document_id, content, embedding vector(1536), chunk_index)

-- Chat
chat_sessions (id, user_id, topic_id, created_at)
chat_messages (id, chat_session_id, role, content, source_chunks jsonb, created_at)

-- Quiz
quiz_sessions (id, user_id, topic_id, difficulty, score, created_at)
quiz_questions (id, quiz_session_id, question, type, correct_answer, user_answer, is_correct, explanation, source_chunk_id)

-- Plans & Gaps
learning_plans (id, user_id, plan_json jsonb, generated_at)
gap_reports (id, user_id, report_json jsonb, generated_at)

-- Subscriptions & Usage
subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
usage_daily (id, user_id, date, quiz_sessions_count, uploads_count)

-- Monitoring
llm_logs (id, user_id, provider, model, prompt_tokens, completion_tokens, latency_ms, created_at)
```

---

## Key Questions to Decide Before Coding

- [ ] Will you use NestJS built-in queues (BullMQ) for async document processing, or process synchronously? (Recommend BullMQ — uploads can take time)
- [ ] Will chat streaming use SSE (Server-Sent Events) or WebSockets? (Recommend SSE — simpler with NestJS)
- [ ] Monorepo (single git repo with `/backend` and `/frontend`) or two separate repos? (Recommend monorepo)

---

## Useful Commands (to be set up)

```bash
# Backend
cd backend && npm run start:dev

# Frontend  
cd frontend && npm start

# DB (via Docker)
docker compose up postgres

# Run migrations
cd backend && npm run migration:run
```
