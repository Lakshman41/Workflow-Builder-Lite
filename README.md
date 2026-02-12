# Workflow Builder Lite

A single-page app for building and running text-processing workflows. Create workflows as a visual graph (START → steps → END), run them with input text, and see step-by-step results. No login required—the app identifies the browser via a stored ID.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Project layout](#project-layout)
- [Tutorial: Building a workflow](#tutorial-building-a-workflow)
- [Validation rules](#validation-rules)
- [API overview](#api-overview)
- [License](#license)

---

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| **Backend**  | FastAPI, PostgreSQL (async), Upstash Redis (workflow cache), Google Gemini (LLM for step execution) |
| **Frontend** | React 18, TypeScript, Vite, ReactFlow, Zustand, Tailwind CSS |

---

## Prerequisites

- **Python** 3.9+
- **Node** 18+
- **PostgreSQL**
- **Upstash Redis** (optional; app works without it, cache is skipped)
- **[Gemini API key](https://ai.google.dev/)** for running workflows

---

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

- **API:** `http://localhost:8000`
- **Docs:** `http://localhost:8000/docs`

### 5. Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

- **App:** `http://localhost:3000`. The dev server proxies `/api` to `http://127.0.0.1:8000`.

---

## Project layout

| Path | Description |
|------|-------------|
| **backend/** | FastAPI app, routes (workflows, runs, health), services (validation, LLM, Upstash Redis cache), models, Alembic migrations |
| **frontend/** | React app, workflow editor (ReactFlow), run panel, run history, status page |

---

## Tutorial: Building a workflow

This section walks through creating a workflow, adding steps, connecting them with edges, changing step types, and running the workflow.

### 1. Create a new workflow

1. Open the app at `http://localhost:3000`.
2. Click **New Workflow**.
3. Enter a name (e.g. “My first workflow”) and click **Create**.
4. You are taken to the **workflow editor**: canvas on the left, **+ New Step** / **Validate** / **Save** at the top, **Predefined steps** and **Run** panel on the right.

### 2. Add a step

You can add steps in two ways.

**Option A: Custom step (full control)**

1. Click **+ New Step**.
2. In the modal:
   - **Step Name:** e.g. `Clean Text`.
   - **Description:** e.g. `Remove special characters and extra whitespace` (used by the LLM when running).
   - **Step Type:** choose **START**, **NORMAL**, or **END** (see [Step types](#step-types) below).
3. Click **Create**. The step appears on the canvas.

**Option B: Predefined step (quick add)**

1. Open the **Predefined steps** sidebar (right side of the canvas).
2. Click one of the suggested steps (e.g. “Clean Text”, “Summarize”, “Extract Key Points”, “Tag Category”). A **NORMAL** step with that name and description is added to the canvas.

**Step types**

- **START** – Exactly one per workflow (required when you have 2+ steps). Entry point; no incoming edge.
- **NORMAL** – Processing steps in the middle. Can have one incoming and one outgoing edge.
- **END** – Exactly one per workflow (required when you have 2+ steps). Exit; no outgoing edge.

For a **single-step workflow**, that step must be **START** (no END). For **two or more steps**, you must have exactly one **START** and one **END**.

### 3. Create an edge (connection)

Edges define the order of execution: output of one step becomes input to the next.

1. Each step has two **handles**:
   - **Left** (target) – incoming connection.
   - **Right** (source) – outgoing connection.
2. **Drag from the right handle (source) of one step to the left handle (target) of another.** When the connection is valid, the edge is created and an arrow points to the target step.
3. **Rules:**
   - At most **one outgoing** edge per step (one connection from the right handle).
   - At most **one incoming** edge per step (one connection to the left handle).
   - So the graph is a **linear chain**: START → NORMAL → … → END.

Example: connect **START** (right handle) → **NORMAL** (left handle), then **NORMAL** (right handle) → **END** (left handle).

### 4. Change the type of a step

1. On the step card, click **Edit**.
2. In the modal, change **Step Type** to **START**, **NORMAL**, or **END**.
3. Click **Update**. The step’s type (and border color) updates on the canvas.

Use this to mark one step as START and another as END when you have multiple steps.

### 5. Delete an edge

1. **Click the edge** (the line between two steps) so it is selected.
2. Press **Delete** or **Backspace**. The edge is removed and the backend is updated.

### 6. Delete a step

1. On the step card, click **Delete**.
2. Confirm in the dialog. The step and any edges connected to it are removed.

### 7. Save and validate

- **Save** – Saves the current canvas (steps and edges) to the backend. Do this after adding/editing steps or connections.
- **Validate** – Checks the workflow against the [validation rules](#validation-rules). If invalid, you’ll see which steps are disconnected or which types are wrong.

### 8. Run the workflow

1. Click **Save** if you have unsaved changes.
2. In the **Run** panel (right side), enter **Input text** (e.g. a paragraph).
3. Click **Run**. The workflow runs step by step (START → … → END). Expand each step in the results to see the LLM output.

You can also open **View All Runs** or the **Run History** section to see past runs and their step-by-step outputs.

### 9. Edit workflow name

Click **Edit name** next to the workflow title, change the name, and save. The name is stored in the backend.

---

## Validation rules

The backend validates a workflow before run. Summary:

- **Single step:** That step must be **START** (no END required).
- **Two or more steps:** There must be exactly **one START** and **one END**; every step must be **connected** (one incoming and one outgoing edge, except START has no incoming and END has no outgoing); and the graph must form one **linear chain** (no branches or cycles).

If validation fails, the API returns clear errors (e.g. which steps are disconnected, or “Missing START/END”).

---

## API overview

All workflow and run endpoints require the **`X-Browser-ID`** header (the frontend sets this automatically).

| Area | Endpoints |
|------|-----------|
| **Workflows** | `GET/POST /api/workflows`, `GET/PATCH/DELETE /api/workflows/{id}`, `GET /api/workflows/{id}/validate`. Step CRUD: `POST /api/workflows/{id}/steps`, `PATCH /api/workflows/{id}/steps/{step_id}`, `DELETE /api/workflows/{id}/steps/{step_id}`. Edge delete: `DELETE /api/workflows/{id}/edges/{edge_id}`. |
| **Runs** | `POST /api/runs/workflows/{id}/run` (body: `input_text`), `GET /api/runs`, `GET /api/runs/{id}`. |
| **Health** | `GET /api/health` (no auth) – returns status for backend, database, Redis (`not_configured` / `connected` / `disconnected`), and LLM. |

Interactive API docs: `http://localhost:8000/docs`.

---

## License

MIT.
