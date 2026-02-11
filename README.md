# Workflow Builder Lite

A single-page app for building and running text-processing workflows. Create workflows as a visual graph (START → steps → END), run them with input text, and see step-by-step results. No login required—the app identifies the browser via a stored ID.

## Tech stack

- **Backend:** FastAPI, PostgreSQL (async), Upstash Redis (workflow cache), Google Gemini (LLM for step execution)
- **Frontend:** React 18, TypeScript, Vite, ReactFlow, Zustand, Tailwind CSS

## Prerequisites

- Python 3.9+
- Node 18+
- PostgreSQL
- Upstash Redis (optional; app works without it, cache is skipped)
- [Gemini API key](https://ai.google.dev/) for running workflows

## Setup

### 1. Environment

From the project root, copy the example env and edit:

```bash
cp .env.example .env
```

Edit `.env` (file lives at **project root**, not inside `backend/`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL, e.g. `postgresql+asyncpg://user:pass@localhost:5432/workflows` |
| `DATABASE_SSL_NO_VERIFY` | Set to `true` if your DB uses SSL and you need to skip cert verification (optional). |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (from [Upstash Console](https://console.upstash.com/)). Optional. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. Optional; leave both empty to run without cache. |
| `GEMINI_API_KEY` | Required to run workflows (step execution). |
| `GEMINI_MODEL` | Optional; default is `gemini-2.5-flash`. Override with e.g. `gemini-2.0-flash` if needed. |

### 2. Database and backend deps

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
alembic upgrade head
```

### 3. Upstash Redis (optional, good for deployment)

Create a Redis database at [Upstash Console](https://console.upstash.com/), then set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env` at project root. The backend uses Upstash’s REST API to cache workflow reads (GET by id) with a 1-hour TTL; cache is invalidated on any workflow/step/edge update or delete. No Redis server to run—works in serverless (e.g. Vercel, Railway). If both are unset, the app still works and skips caching (health shows Redis as `not_configured`). To verify Upstash from the command line, run from `backend/`: `python scripts/upstash_connect_sync.py` (or from project root: `python backend/scripts/upstash_connect_sync.py`).

### 4. Backend

Activate the backend venv if needed, then from `backend/`:

```bash
cd backend
source .venv/bin/activate   # if not already activated
uvicorn app.main:app --reload --port 8000 --reload-dir app
```

Watching only `app` avoids reloads when `.venv` or other non-app files change. If you need reloads on alembic/config changes, run without `--reload-dir` (reloads may be triggered by venv activity).

API: `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

### 5. Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`. The dev server proxies `/api` to `http://127.0.0.1:8000`.

## Project layout

- **backend/** – FastAPI app, routes (workflows, runs, health), services (validation, LLM, Upstash Redis cache), models, Alembic migrations
- **frontend/** – React app, workflow editor (ReactFlow), run panel, run history, status page

## API overview

- **Workflows:** `GET/POST /api/workflows`, `GET/PATCH/DELETE /api/workflows/{id}`, `GET /api/workflows/{id}/validate`, step and edge CRUD under `/api/workflows/{id}/steps` and `.../edges/{edge_id}`. All require `X-Browser-ID` header.
- **Runs:** `POST /api/runs/workflows/{id}/run` (body: `input_text`), `GET /api/runs`, `GET /api/runs/{id}`.
- **Health:** `GET /api/health` (no auth) – returns status for backend, database, Redis (`not_configured` / `connected` / `disconnected`), and LLM.

## License

MIT.
