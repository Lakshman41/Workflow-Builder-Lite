# Workflow Builder Lite

A visual, no-code automation builder for text processing workflows. Create multi-step pipelines with natural language descriptions, powered by AI. No login required—browser-based authentication keeps your workflows private.

---

## Submission summary

**How to run (one command):**
```bash
cp .env.example .env   # then edit .env with DATABASE_URL and GEMINI_API_KEY
docker compose up --build
```
Open **http://localhost:8080**. See [Quick Start](#-quick-start) and [Detailed Setup](#-detailed-setup) for full steps.

**What is done:**
- Create workflows with 2–4+ steps (e.g. clean text, summarize, extract key points, tag category)
- Run workflow on input text and see output of each step
- Run history (last 5 runs per workflow + global run history page)
- Simple home page with clear steps; Status page (backend, database, LLM, Redis health)
- Basic handling for empty/wrong input (validation, toasts, error messages)
- No API keys in code; settings via `.env` and [.env.example](.env.example)

**What is not done:**
- User accounts / auth (browser-ID only)
- Document upload or file-based steps
- Scheduled or triggered runs

**Submission files:** [AI_NOTES.md](AI_NOTES.md) (AI use and LLM choice), [ABOUTME.md](ABOUTME.md) (name and resume), [PROMPTS_USED.md](PROMPTS_USED.md) (prompts used). Do not commit `.env`; use [.env.example](.env.example) as template.

---

## 🎯 What is this?

**Workflow Builder Lite** lets you chain text transformations into automated pipelines:

- **Visual editor** – Drag-and-drop nodes (like n8n) to build workflows
- **Natural language steps** – Describe what each step should do (e.g., "Remove all email addresses", "Summarize in 3 sentences")
- **AI-powered execution** – Google Gemini processes each step
- **Real-time results** – See input/output for every step
- **Run history** – Review past executions with full step-by-step outputs

**Example workflow:**
```
START: Clean Text → Summarize → Extract Key Points → END: Final Output
```

**Use cases:**
- Content processing (blog posts, emails, research notes)
- Data cleaning (remove sensitive info, standardize formatting)
- Analysis pipelines (summarize → extract insights → categorize)
- Custom text transformations (translate → simplify → tag)

---

## 📚 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Project Structure](#project-structure)
- [Tutorial: Building Your First Workflow](#tutorial-building-your-first-workflow)
- [Workflow Validation Rules](#workflow-validation-rules)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
|-------|--------------|---------|
| **Frontend** | React 18, TypeScript, Vite | Modern, fast UI |
| | ReactFlow | Visual workflow canvas |
| | Zustand | Lightweight state management |
| | Tailwind CSS + shadcn/ui | Beautiful, accessible components |
| **Backend** | FastAPI (Python 3.9+) | High-performance async API |
| | SQLAlchemy + asyncpg | Async PostgreSQL ORM |
| | Upstash Redis | Serverless workflow caching (optional) |
| | Google Gemini API | LLM for step execution |
| **Database** | PostgreSQL 15+ | Relational data (workflows, runs, history) |
| **Deployment** | Vercel (frontend) | Free static hosting with CI/CD |
| | Railway/GCP (backend) | Containerized backend deployment |

---

## ✨ Features

### Core Functionality
- ✅ **Visual Workflow Builder** – n8n-style drag-and-drop canvas
- ✅ **Custom Step Descriptions** – Write steps in plain English (no coding)
- ✅ **Predefined Templates** – Quick-add common steps (Clean Text, Summarize, etc.)
- ✅ **Real-time Validation** – Instant feedback on workflow structure
- ✅ **Synchronous Execution** – Run workflows and see full results
- ✅ **Step-by-Step Outputs** – Inspect input/output for each step
- ✅ **Run History** – Last 5 runs per workflow with full details
- ✅ **Browser-based Auth** – No login required, UUID-based isolation

### UI/UX
- 🎨 **Responsive Design** – Works on desktop, tablet, mobile
- 🌓 **Clean Interface** – Minimalist design, focus on workflows
- 📊 **Progress Indicators** – Loading states for all async operations
- 🔔 **Toast Notifications** – Success/error feedback
- ⚡ **Fast Interactions** – Optimistic UI updates, smooth animations

### Developer Experience
- 📝 **Full TypeScript** – Type-safe frontend
- 🧪 **API Documentation** – Interactive Swagger/ReDoc at `/docs`
- 🔄 **Hot Reload** – Instant updates during development
- 🐳 **Docker Ready** – Containerized deployment (optional)
- 📦 **Modular Architecture** – Clean separation of concerns

---

## 📋 Prerequisites

### Required
- **Python 3.9+** (backend)
- **Node.js 18+** (frontend)
- **PostgreSQL 15+** (database)
- **Gemini API Key** ([Get one free](https://ai.google.dev/))

### Optional
- **Upstash Redis** (for workflow caching in production)
- **Docker** (for containerized deployment)

### Recommended Tools
- **VS Code** with extensions:
  - Python (Microsoft)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **Postman** or **Thunder Client** (API testing)
- **pgAdmin** or **TablePlus** (database management)

---

## 🚀 Quick Start

### 1-Minute Setup (Local Development)

```bash
# Clone the repo
git clone https://github.com/yourusername/workflow-builder-lite.git
cd workflow-builder-lite

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000 --reload-dir app

# In a new terminal: Frontend setup
cd frontend
npm install
npm run dev

# Open http://localhost:3000 🎉
```

---

## 📦 Detailed Setup

### Step 1: Environment Configuration

Create `.env` file at **project root** (not inside `backend/`):

```bash
cp .env.example .env
```

**Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (use `postgresql+asyncpg://` for async driver) | `postgresql+asyncpg://user:pass@localhost:5432/workflows` |
| `GEMINI_API_KEY` | Google Gemini API key for step execution | _(from Google AI Studio)_ |

**Optional Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_SSL_NO_VERIFY` | `false` | Set to `true` for self-signed DB SSL certs |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Override Gemini model (e.g., `gemini-2.0-flash`) |
| `UPSTASH_REDIS_REST_URL` | _(empty)_ | Upstash Redis REST endpoint for caching |
| `UPSTASH_REDIS_REST_TOKEN` | _(empty)_ | Upstash Redis authentication token |
| `API_PREFIX` | `api` | URL prefix for all API routes |

**Getting API Keys:**

1. **Gemini API Key:**
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Click "Get API Key"
   - Create new project or use existing
   - Copy API key to `.env`

2. **Upstash Redis** (optional, for production caching):
   - Visit [Upstash Console](https://console.upstash.com/)
   - Create free Redis database
   - Copy REST URL and Token to `.env`
   - Test connection: `python backend/scripts/upstash_connect_sync.py`

### Step 2: Database Setup

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (Mac)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb workflows

# Update .env
DATABASE_URL=postgresql+asyncpg://yourusername@localhost:5432/workflows
```

**Option B: Managed PostgreSQL (Neon, Supabase, etc.)**

```bash
# Get connection string from your provider
# Example Neon connection string:
DATABASE_URL=postgresql+asyncpg://user:pass@ep-cool-name.us-east-2.aws.neon.tech/workflows?sslmode=require

# If using SSL with self-signed cert, add:
DATABASE_SSL_NO_VERIFY=true
```

### Step 3: Backend Installation

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate venv
source .venv/bin/activate  # Mac/Linux
# OR
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Verify setup
python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
```

### Step 4: Start Backend Server

```bash
# From backend/ directory with venv activated
uvicorn app.main:app --reload --port 8000 --reload-dir app
```

**Verify backend is running:**
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

**Expected health response:**
```json
{
  "status": "ok",
  "database": "connected",
  "backend_response_time_ms": 2,
  "redis": "not_configured",
  "llm": "gemini_configured"
}
```

### Step 5: Frontend Installation

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Verify frontend is running:**
- App: http://localhost:3000
- Hot reload should work (edit any file, see instant updates)

**Dev server features:**
- API proxy: `/api/*` → `http://localhost:8000/api/*`
- Fast refresh: <50ms for most changes
- TypeScript checking: Real-time error detection

---

## 📁 Project Structure

```
workflow-builder-lite/
├── backend/                    # FastAPI backend
│   ├── alembic/               # Database migrations
│   │   └── versions/          # Migration scripts
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── health.py      # Health check endpoint
│   │   │   ├── runs.py        # Run creation and retrieval
│   │   │   └── workflows.py   # Workflow CRUD
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py      # Settings (from .env)
│   │   │   └── dependencies.py # Dependency injection
│   │   ├── db/                # Database layer
│   │   │   ├── models.py      # SQLAlchemy models
│   │   │   └── session.py     # DB connection setup
│   │   ├── schemas/           # Pydantic schemas (request/response)
│   │   │   ├── workflow.py
│   │   │   └── run.py
│   │   ├── services/          # Business logic
│   │   │   ├── cache.py       # Upstash Redis caching
│   │   │   ├── llm.py         # Gemini integration
│   │   │   ├── validation.py  # Workflow validation
│   │   │   └── workflow_executor.py # Step execution
│   │   └── main.py            # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   └── scripts/               # Utility scripts
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Header, Container
│   │   │   ├── workflow/      # Canvas, StepNode, Modal
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useWorkflows.ts
│   │   │   └── useRunExecution.ts
│   │   ├── pages/             # Page components (routes)
│   │   │   ├── LandingPage.tsx
│   │   │   ├── WorkflowEditorPage.tsx
│   │   │   └── StatusPage.tsx
│   │   ├── services/          # API client layer
│   │   │   ├── api.ts         # Axios instance
│   │   │   ├── workflowService.ts
│   │   │   └── runService.ts
│   │   ├── store/             # Zustand stores
│   │   │   ├── workflowStore.ts
│   │   │   └── runStore.ts
│   │   ├── types/             # TypeScript types
│   │   │   ├── workflow.ts
│   │   │   └── run.ts
│   │   ├── utils/             # Utility functions
│   │   │   └── browserIdManager.ts
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example               # Environment template
├── .env                       # Your environment (gitignored)
└── README.md                  # This file
```

---

## 📖 Tutorial: Building Your First Workflow

### Example: "Blog Post Cleaner"

**Goal:** Clean messy blog text → Summarize → Extract key points → Output polished version

#### Step 1: Create Workflow

1. Open http://localhost:3000
2. Click **"+ New Workflow"** button
3. Enter details:
   - **Name:** `Blog Post Cleaner`
   - **Description:** `Cleans and processes blog posts`
4. Click **"Create"**
5. You're now in the visual editor

#### Step 2: Add Steps

**Method A: Custom Steps (Full Control)**

1. Click **"+ New Step"** button (floating action button on canvas)
2. Fill in the form:

   **Step 1 (START):**
   ```
   Name: Clean Text
   Description: Remove special characters, fix spacing, standardize punctuation
   Type: START
   ```

   **Step 2 (NORMAL):**
   ```
   Name: Summarize
   Description: Create a 2-3 sentence summary of the main points
   Type: NORMAL
   ```

   **Step 3 (NORMAL):**
   ```
   Name: Extract Key Points
   Description: List 3-5 key takeaways as bullet points
   Type: NORMAL
   ```

   **Step 4 (END):**
   ```
   Name: Final Output
   Description: Combine summary and key points into a polished format
   Type: END
   ```

**Method B: Predefined Steps (Quick Add)**

1. Open **"Predefined Steps"** sidebar (right side)
2. Click these in order:
   - **Clean Text** (auto-adds as NORMAL, you'll change to START)
   - **Summarize**
   - **Extract Key Points**
3. Manually add "Final Output" step (set as END)

#### Step 3: Connect Steps

**Create the flow:** Clean Text → Summarize → Extract Key Points → Final Output

1. **Hover over "Clean Text" step** → See right edge handle (small circle)
2. **Drag from right handle** → Drop on left handle of "Summarize"
   - Green checkmark appears = connection successful
3. **Repeat:** Summarize → Extract Key Points
4. **Repeat:** Extract Key Points → Final Output

**Visual Result:**
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ START        │      │ NORMAL       │      │ NORMAL       │      │ END          │
│ Clean Text   │ ───► │ Summarize    │ ───► │ Extract      │ ───► │ Final Output │
└──────────────┘      └──────────────┘      │ Key Points   │      └──────────────┘
                                             └──────────────┘
```

#### Step 4: Adjust Step Types

If you added all steps as NORMAL, fix the types:

1. **Click "Clean Text" step** → Click **"Edit"** button
2. Change **"Type"** to **START** → Click **"Update"**
3. **Click "Final Output" step** → Edit → Change to **END**

**Visual indicators:**
- START steps: Green border + badge
- NORMAL steps: Blue border + badge
- END steps: Red border + badge

#### Step 5: Validate Workflow

1. Click **"Validate"** button (top bar)
2. Expected result: ✅ **"Workflow is valid"** toast notification

**If you see errors:**
- ❌ "Must have exactly one START" → Multiple steps marked START
- ❌ "Must have exactly one END" → Missing or multiple END steps
- ❌ "Step X is disconnected" → Not in path from START to END
- ❌ "Cycle detected" → Steps connect in a loop

Fix errors, then validate again until green.

#### Step 6: Save Workflow

1. Click **"Save"** button (top bar)
2. Success toast: ✅ **"Workflow saved successfully"**

**Behind the scenes:**
- Frontend sends `PATCH /api/workflows/{id}`
- Backend stores all steps, edges, positions
- If Upstash Redis configured: Cache invalidated

#### Step 7: Run Workflow

1. Click **"Run"** button (top bar) → Run panel slides in
2. Paste sample text in **"Input Text"** area:

   ```
   This is a messy blog post!!!! It has way too many exclamation marks???? And the 
   formatting is all over the place... But it talks about how AI is revolutionizing 
   content creation, making it easier for anyone to write high-quality articles 
   without needing years of experience!!!
   ```

3. Click **"▶ Run Workflow"** button
4. **Watch execution** (10-20 seconds):
   - Progress indicator shows: "Processing workflow..."
   - Each step lights up as it completes

5. **View Results:**

   **Step 1 Output (Clean Text):**
   ```
   This is a messy blog post. It has way too many exclamation marks. And the 
   formatting is all over the place. But it talks about how AI is revolutionizing 
   content creation, making it easier for anyone to write high-quality articles 
   without needing years of experience.
   ```

   **Step 2 Output (Summarize):**
   ```
   This post discusses how AI is transforming content creation by making high-quality 
   writing accessible to everyone, regardless of experience level.
   ```

   **Step 3 Output (Extract Key Points):**
   ```
   • AI is revolutionizing content creation
   • Makes writing high-quality articles easier
   • Removes the need for years of experience
   ```

   **Step 4 Output (Final Output):**
   ```
   Summary: This post discusses how AI is transforming content creation by making 
   high-quality writing accessible to everyone, regardless of experience level.

   Key Takeaways:
   • AI is revolutionizing content creation
   • Makes writing high-quality articles easier
   • Removes the need for years of experience
   ```

6. **Download or Copy Results** (buttons in results area)

#### Step 8: View Run History

1. Click **"← Back"** to return to landing page
2. Click **"View All Runs"** or find your workflow card
3. See **Run #1** in history with:
   - Timestamp: "2 minutes ago"
   - Status: ✅ Completed
   - Input preview: "This is a messy blog post..."
4. Click **"View Details"** → See full step-by-step breakdown

---

## ✅ Workflow Validation Rules

Before execution, workflows are validated against these rules:

### Single-Step Workflows
- ✅ **Must be START type** (no END required)
- ✅ Can have any description

**Valid Example:**
```
┌──────────────┐
│ START        │
│ Process Text │
└──────────────┘
```

### Multi-Step Workflows (2+ steps)

#### Required Elements
1. **Exactly ONE START step**
   - No incoming edges
   - Must have one outgoing edge
2. **Exactly ONE END step**
   - Must have one incoming edge
   - No outgoing edges
3. **All steps must be connected**
   - Every step in path from START to END
   - No orphaned steps

#### Connection Rules
- **Linear chain only** (no branches)
- Each NORMAL step: 1 incoming + 1 outgoing edge
- **No cycles** (can't connect back to earlier steps)

**Valid Examples:**

```
Simple chain:
START → NORMAL → END

Longer chain:
START → NORMAL → NORMAL → NORMAL → END
```

**Invalid Examples:**

```
❌ Two START steps:
START → NORMAL → END
START → NORMAL → END

❌ Missing END:
START → NORMAL → NORMAL

❌ Disconnected step:
START → NORMAL → END
         ↓
      ORPHAN

❌ Cycle:
START → NORMAL → END
         ↑________|

❌ Branch (not supported):
START → NORMAL → END
         ↓
      NORMAL → END
```

### Validation Timing

**Client-side (Frontend):**
- When clicking "Validate" button
- Before allowing run (pre-check)

**Server-side (Backend):**
- When `POST /api/runs/workflows/{id}/run` is called
- Returns 400 with detailed errors if invalid

**Error Messages:**
```json
{
  "detail": [
    "Must have exactly one START step (found 2)",
    "Must have exactly one END step (found 0)",
    "Step 'Summarize' (abc-123) is disconnected"
  ]
}
```

---

## 🌐 API Reference

### Authentication

All endpoints (except `/health`) require:
```
X-Browser-ID: <uuid-v4>
```

Frontend automatically generates and stores this UUID in localStorage on first visit.

### Endpoints

#### Health Check

**`GET /api/health`** (no auth required)

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "backend_response_time_ms": 12,
  "redis": "connected",
  "llm": "gemini_configured"
}
```

#### Workflows

**List Workflows**
```http
GET /api/workflows
X-Browser-ID: <uuid>
```
Response: Array of `WorkflowListItem` (id, name, description, created_at)

**Get Workflow**
```http
GET /api/workflows/{workflow_id}
X-Browser-ID: <uuid>
```
Response: Full workflow with steps and edges

**Create Workflow**
```http
POST /api/workflows
X-Browser-ID: <uuid>
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Process text",
  "steps": [
    {
      "name": "Clean",
      "description": "Remove special chars",
      "step_type": "START",
      "position": {"x": 0, "y": 0}
    }
  ],
  "edges": []
}
```

**Update Workflow**
```http
PATCH /api/workflows/{workflow_id}
X-Browser-ID: <uuid>
Content-Type: application/json

{
  "name": "Updated Name",
  "steps": [...],
  "edges": [...]
}
```

**Delete Workflow**
```http
DELETE /api/workflows/{workflow_id}
X-Browser-ID: <uuid>
```

**Validate Workflow**
```http
GET /api/workflows/{workflow_id}/validate
X-Browser-ID: <uuid>
```
Response:
```json
{
  "valid": false,
  "errors": [
    "Must have exactly one START step"
  ]
}
```

#### Steps

**Add Step**
```http
POST /api/workflows/{workflow_id}/steps
X-Browser-ID: <uuid>
Content-Type: application/json

{
  "name": "Summarize",
  "description": "Create summary",
  "step_type": "NORMAL",
  "position": {"x": 100, "y": 0}
}
```

**Update Step**
```http
PATCH /api/workflows/{workflow_id}/steps/{step_id}
X-Browser-ID: <uuid>
Content-Type: application/json

{
  "name": "New Name",
  "step_type": "START"
}
```

**Delete Step**
```http
DELETE /api/workflows/{workflow_id}/steps/{step_id}
X-Browser-ID: <uuid>
```

#### Runs

**Execute Workflow**
```http
POST /api/runs/workflows/{workflow_id}/run
X-Browser-ID: <uuid>
Content-Type: application/json

{
  "input_text": "Text to process..."
}
```
Response (after execution completes):
```json
{
  "run_id": "abc-123...",
  "workflow_id": "def-456...",
  "status": "completed"
}
```

**List Runs**
```http
GET /api/runs?limit=5
X-Browser-ID: <uuid>
```

**Get Run Details**
```http
GET /api/runs/{run_id}
X-Browser-ID: <uuid>
```
Response: Full run with step_outputs array

### Interactive API Docs

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

Try all endpoints directly in the browser with authentication.

---

**Production `.env`:**
```bash
# Database (use managed service)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/workflows?sslmode=require
DATABASE_SSL_NO_VERIFY=false

# LLM (required)
GEMINI_API_KEY=<your-key-from-google-ai-studio>
GEMINI_MODEL=gemini-2.5-flash

# Redis (optional but recommended)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# API (usually default)
API_PREFIX=api
```

---

## 🚀 Deployment

### Docker (single image: backend + frontend)

From the project root:

```bash
docker compose up --build
```

App: **http://localhost:8080**. The image runs migrations on startup and serves the API and the React SPA. Use a `.env` file or set `DATABASE_URL` and `GEMINI_API_KEY` (see [docker-compose.yml](docker-compose.yml)).

To build the image only:

```bash
docker build -t workflow-builder-lite .
```

### Google Cloud Platform (GCP)

Deploy to **Cloud Run** with **Cloud SQL (PostgreSQL)**. No Kubernetes required.

1. **Build and push** the same Docker image to Artifact Registry.
2. **Create a Cloud SQL** PostgreSQL instance and database.
3. **Deploy to Cloud Run** with the image, Cloud SQL connection, and env/Secret Manager for `DATABASE_URL`, `GEMINI_API_KEY`, and optional Upstash Redis.

Full steps, IAM, and commands: **[docs/DEPLOY-GCP.md](docs/DEPLOY-GCP.md)**.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "X-Browser-ID header is required"

**Cause:** Frontend not sending browser ID header

**Fix:**
```typescript
// Check localStorage in browser console
localStorage.getItem('browserId')

// If null, clear and refresh:
localStorage.clear()
// Refresh page
```

#### 2. Database connection fails

**Symptoms:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Fix:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Must start with postgresql+asyncpg://

# Test connection
psql $DATABASE_URL
# If fails, check:
# - PostgreSQL running: brew services list
# - Correct credentials
# - Database exists: createdb workflows
```

#### 3. Gemini API errors

**Symptoms:**
```json
{
  "detail": "LLM error at step 'Summarize': API key not valid"
}
```

**Fix:**
```bash
# Check API key is set
echo $GEMINI_API_KEY

# Verify key at https://ai.google.dev/
# Generate new key if needed

# Test directly:
python backend/scripts/test_llm.py
```

#### 4. Frontend can't reach backend

**Symptoms:** Network errors in browser console

**Fix:**
```bash
# Check backend is running:
curl http://localhost:8000/api/health

# Check Vite proxy config (frontend/vite.config.ts):
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}

# Try direct URL:
curl http://localhost:8000/api/health
```

#### 5. Upstash Redis connection fails

**Symptoms:** Health shows `redis: "disconnected"`

**Fix:**
```bash
# Test connection manually:
cd backend
python scripts/upstash_connect_sync.py

# Check credentials:
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# If empty, app works without Redis (no caching)
# If wrong, regenerate in Upstash console
```

### Debug Mode

**Backend:**
```bash
# Enable debug logging
uvicorn app.main:app --reload --log-level debug
```

**Frontend:**
```bash
# Open React DevTools (browser extension)
# Check Zustand store state
# Inspect network requests in DevTools
```

### Getting Help

- **GitHub Issues:** Report bugs with logs and steps to reproduce
- **Discussions:** Ask questions, share workflows
- **API Docs:** http://localhost:8000/docs (test endpoints)

---

## 🤝 Contributing

Contributions welcome! Please:

1. **Fork the repo**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- **Code Style:** Follow existing patterns (Prettier for TS, Black for Python)
- **Type Safety:** No `any` types in TypeScript
- **Testing:** Add tests for new features (future enhancement)
- **Documentation:** Update README for new features

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **ReactFlow** - Visual workflow canvas
- **FastAPI** - High-performance Python API framework
- **Google Gemini** - AI-powered step execution
- **shadcn/ui** - Beautiful UI components
- **Upstash** - Serverless Redis for caching
