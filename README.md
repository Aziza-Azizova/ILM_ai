# IlmAI

An AI-powered learning companion. Upload documents (PDF, DOCX, TXT), ask questions via RAG-powered streaming chat, and take AI-generated quizzes to test your knowledge.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, MUI v9, Zustand, React Router v7 |
| Backend | NestJS 11, TypeORM, Passport (JWT + Google OAuth) |
| Database | PostgreSQL 16 + pgvector |
| AI | Claude Sonnet 4.6 (chat & quiz gen), Claude Haiku 4.5 (answer eval), OpenAI text-embedding-3-small |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- Anthropic API key
- OpenAI API key
- Google OAuth credentials (optional, for social login)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd IlmAI

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in at minimum:

```env
JWT_SECRET=<long-random-string>
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

### 3. Start the database

```bash
# From the project root
docker compose up postgres -d
```

### 4. Run database migrations

```bash
cd backend
npm run migration:run
```

### 5. Start the backend

```bash
# From backend/
npm run start:dev   # runs on http://localhost:3001
```

### 6. Start the frontend

```bash
# From frontend/
npm run dev         # runs on http://localhost:5173
```

### Run everything with Docker

```bash
# From the project root — starts postgres, backend, and frontend together
docker compose up
```

## Project Structure

```
IlmAI/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/        # JWT + Google OAuth
│       │   ├── ai/          # Anthropic & OpenAI wrappers
│       │   ├── documents/   # Upload, parse, chunk, embed
│       │   ├── chat/        # RAG streaming chat (SSE)
│       │   ├── quiz/        # Quiz generation & evaluation
│       │   ├── topics/      # Topic CRUD
│       │   └── users/       # User CRUD
│       └── database/
│           ├── entities/    # TypeORM entities
│           └── migrations/  # DB migrations
└── frontend/
    └── src/
        ├── api/             # Axios modules per resource
        ├── components/      # Shared UI components
        ├── pages/           # Route-mapped pages
        ├── store/           # Zustand stores
        └── types/           # Shared TypeScript types
```

## Key Architectural Decisions

- **Streaming via SSE** — chat responses stream from NestJS using `Content-Type: text/event-stream`; the frontend consumes with `fetch` streaming.
- **RAG pipeline** — uploaded files are chunked (~500 tokens), embedded with OpenAI, and stored in PostgreSQL with a pgvector IVFFlat index. At query time, the top-k most similar chunks are retrieved via cosine similarity and passed to Claude as context.
- **Dual-model quiz evaluation** — Claude Sonnet generates questions, Claude Haiku evaluates answers (cost optimization).
- **All routes prefixed `/api`** — the frontend Axios client points `VITE_API_URL` at `http://localhost:3001/api`.
- **Auth** — JWT stored in localStorage under the key `ilmai_token`; a 401 response auto-logs the user out.

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `npm run start:dev` | Dev server with watch mode |
| `npm run build` | Compile TypeScript |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | Lint and auto-fix |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
