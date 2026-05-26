# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IlmAI is an AI-powered learning companion. Users upload documents (PDF/DOCX/TXT), ask questions via RAG-powered streaming chat, and take AI-generated quizzes. Backend is NestJS on port 3001; frontend is React + Vite on port 5173; database is PostgreSQL 16 with the pgvector extension.

## Commands

### Backend (`cd backend`)
```bash
npm run start:dev       # Watch mode dev server (port 3001)
npm run build           # Compile TypeScript
npm run migration:run   # Apply TypeORM migrations
npm run migration:revert
npm run test            # Unit tests (Jest)
npm run test:e2e        # End-to-end tests
npm run lint
```

### Frontend (`cd frontend`)
```bash
npm run dev             # Vite dev server (port 5173)
npm run build
npm run lint
```

### Docker
```bash
docker compose up                  # All services (postgres, backend, frontend)
docker compose up postgres         # Just the DB (then run backend manually)
```

## Architecture

### Backend Modules (`backend/src/modules/`)
- **auth** — JWT + Google OAuth 2.0 via Passport. All non-auth routes require `JwtAuthGuard`. The `@CurrentUser()` decorator extracts the user from the JWT payload.
- **ai** — Wraps Anthropic SDK (Claude Sonnet 4.6 for chat/quiz gen, Claude Haiku 4.5 for answer eval) and OpenAI SDK (text-embedding-3-small, 1536 dims). All LLM calls are logged to the `llm_logs` table.
- **documents** — Multer upload → pdf-parse / mammoth extraction → chunk → embed → store in `document_chunks` with pgvector column.
- **chat** — Creates `ChatSession`s, runs cosine similarity search over chunks, calls Claude with streaming, returns SSE. The stream endpoint is `/api/chat/sessions/:id/stream`.
- **quiz** — Generates question JSON via Claude, stores `QuizQuestion` records, evaluates answers via Claude Haiku, updates streak in `users` on `finishSession()`.
- **topics**, **users** — Standard CRUD.
- **plans**, **gaps**, **telegram**, **payments** — Placeholder folders for Week 2–3 features (not yet implemented).

### Frontend Structure (`frontend/src/`)
- **api/** — One Axios module per backend resource. `client.ts` sets `VITE_API_URL` as `baseURL` and attaches the JWT from localStorage; a 401 response triggers auto-logout.
- **store/auth.store.ts** — Zustand store holding `token`, `user`, `isAuthenticated`. Token key in localStorage: `ilmai_token`.
- **pages/** — Route-mapped pages (Auth, Dashboard, Topics, TopicDetail, Chat, Quiz, Profile).
- **components/layout/AppLayout** — Sidebar + protected route wrapper. Unauthenticated users are redirected to `/login`.

### Data Flow
1. File upload → `documents.controller` → extract text → chunk (≈500 tokens) → embed with OpenAI → save `DocumentChunk` rows with pgvector embeddings.
2. Chat message → embed query → cosine similarity search (`document_chunks`) → top-k chunks → Claude Sonnet 4.6 streaming → SSE to client.
3. Quiz start → select random chunks for topic → Claude Sonnet 4.6 generates JSON array of questions → save `QuizQuestion` rows → stream back to frontend.
4. Quiz answer → Claude Haiku 4.5 evaluates → returns `{ isCorrect, feedback }` → score accumulated → on finish, update streak.

### Database
TypeORM entities live in `backend/src/database/entities/`. A single migration (`001-initial-schema.ts`) creates all tables and enables the pgvector extension. The IVFFlat index on `document_chunks.embedding` enables fast cosine similarity. Cascade deletes are set from `User` down through all child entities.

### Environment Variables
Backend `.env` (see `.env.example` for all 38 vars). Key ones:
```
DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_NAME
JWT_SECRET / JWT_EXPIRES_IN
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
FRONTEND_URL          # Used for CORS
UPLOAD_DIR            # Default: ./uploads
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

## TypeScript Conventions

### Typing rules
- Never use inline anonymous object types. Every object shape must have a named `interface` or `type`.
  ```ts
  // Bad
  function login(data: { email: string; password: string }) {}
  const [form, setForm] = useState({ name: '', description: '' });

  // Good
  interface LoginData { email: string; password: string }
  interface TopicForm { name: string; description: string }
  ```
- Never use `as` type assertions. Use an explicit type annotation on the variable or function parameter instead.
  ```ts
  // Bad
  someArray.map(item as MyType)

  // Good
  const items: MyType[] = [...];
  ```
- Define types in the same file where they are used. Only extract to a separate file when the type is shared across multiple files.
  - Shared types live in `frontend/src/types/` (e.g. `auth.types.ts` for `AuthUser` used by both `auth.api.ts` and `auth.store.ts`).
- API request payload types (`CreateTopicData`, `LoginData`, etc.) are defined and exported from their corresponding `api/*.ts` file.
- MUI v9: `display`, `justifyContent`, and other CSS props must be inside `sx`, not as direct JSX props. Use `slotProps` instead of deprecated `*TypographyProps`.

## Key Conventions

- Global API prefix: `/api`. All backend routes are under `/api/...`.
- File uploads land in `backend/uploads/` (local MVP; S3 planned for production).
- Streaming uses SSE (not WebSockets). NestJS sets `Content-Type: text/event-stream`; the frontend consumes with `EventSource` or fetch streaming.
- Quiz answer evaluation uses Claude Haiku (not Sonnet) intentionally for cost.
- The Claude system prompt instructs the model to detect the user's language and reply in kind.
- BullMQ is installed but not yet wired up — file processing is currently synchronous.