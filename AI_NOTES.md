```markdown
# AI Notes

## What I Used AI (Claude) For

### Code Generation & Boilerplate
- **API scaffolding:** I defined the endpoints I needed; AI generated FastAPI route handlers with proper type hints
- **React components:** I designed the UI flow; AI created component templates with TypeScript interfaces
- **Database models:** I planned the schema; AI wrote SQLAlchemy models with relationships and cascades
- **Pydantic schemas:** I specified validation rules; AI generated request/response models

### Best Practices & Patterns
- **Async patterns:** Advice on proper asyncpg usage, connection pooling, and error handling
- **React optimization:** Guidance on hooks, preventing re-renders, and state management with Zustand
- **Security review:** Checking for SQL injection risks, XSS vulnerabilities, and proper secret handling
- **Code organization:** Recommendations on file structure, separation of concerns, and modularity

### Documentation
- **README sections:** I outlined what to document; AI wrote comprehensive setup guides and API reference
- **Code comments:** Explaining complex logic (BFS traversal, graph validation)
- **Tutorial walkthrough:** I created the example; AI formatted the step-by-step instructions

### Debugging Help
- **Database connection issues:** Diagnosing asyncpg vs psycopg2 configuration problems
- **ReactFlow integration:** Understanding edge creation handlers and custom node components
- **Environment variables:** Troubleshooting SSL connection strings and .env parsing

## What I Designed and Built Myself

### Core Concept
- ✅ **Application idea:** Visual workflow builder for AI-powered text processing
- ✅ **Feature set:** Workflows, custom steps with natural language, run execution, history tracking
- ✅ **UX design:** Canvas interactions, step creation flow, validation feedback, run panel
- ✅ **Authentication strategy:** Browser-based UUID instead of user accounts

### Technical Decisions
- ✅ **Tech stack:** FastAPI, PostgreSQL, ReactFlow, Gemini, Upstash Redis
- ✅ **Database schema:** Five-table design with workflows, steps, edges, runs, step_outputs
- ✅ **API architecture:** RESTful endpoints, browser ID headers, validation rules
- ✅ **Workflow validation logic:** Single START/END, DAG detection, connectivity checks
- ✅ **Deployment strategy:** Evaluated hosting options, chose Railway + Vercel

### Implementation & Testing
- ✅ **All functional testing:** Created test workflows, verified edge cases, checked data integrity
- ✅ **Bug fixes:** Found and fixed validation bugs, UI quirks, database transaction issues
- ✅ **UX polish:** Loading states, error messages, toast notifications, empty states
- ✅ **Security verification:** No secrets in code, proper isolation, input validation
- ✅ **Production deployment:** GCP VM setup, Docker configuration, nginx reverse proxy

## LLM and Provider Used by the App

### My Choice: Google Gemini

**Model:** `gemini-2.5-flash` (configurable via `GEMINI_MODEL`)

**Provider:** Google AI Studio

### Why I Chose Gemini

**1. Perfect for My Use Case**
- My app needs **instruction-following for short text transformations** (summarize, clean, extract)
- No need for long context or complex reasoning
- Gemini Flash is optimized for fast, focused, instruction-driven tasks

**2. Cost-Effective**
- **~$0.002 per workflow run** (4 steps, typical text)
- **1500 free requests/day** for MVP testing
- **10x cheaper than GPT-4** for equivalent quality

**3. Fast Inference = Better UX**
- **2-5 seconds per step** = 8-20s total for 4-step workflow
- GPT-4 would be 20-40s (too slow for good UX)

**4. Simple Integration**
- Official Python SDK, single API key, no complex auth
- Easy to swap models via environment variable

### Alternatives I Considered

| Provider | Why I Didn't Choose It |
|----------|------------------------|
| **OpenAI (GPT-4)** | Too expensive; overkill for simple transformations; slower |
| **Anthropic (Claude)** | Great for analysis, but pricier; not needed for basic tasks |
| **Open-source (Llama)** | Requires self-hosting; added complexity I didn't want |

### How I Use It

**Prompt Design:**
```python
prompt = f"""You are a text processing assistant.

Task: {step.description}

Input text:
{input_text}

Perform the task and return ONLY the processed text."""
```

Users describe tasks in natural language; Gemini executes them.

**Error Handling:**
- Rate limits → Friendly error message
- Content violations → Clear explanation
- Network failures → Mark run as failed with details

---

## My Development Process

### How AI Helped (Without Replacing Me)

**My workflow:**
1. **I design** the feature (what it does, how users interact)
2. **AI generates** boilerplate code based on my specs
3. **I review & refine** (fix bugs, improve logic, add edge cases)
4. **I test** thoroughly (verify correctness, try edge cases)
5. **I deploy** (production setup, monitoring)

**Example: Workflow Validation**
- **My idea:** Validate workflows (one START, one END, no cycles, all connected)
- **My design:** BFS from START, check reachability, detect cycles
- **AI helped:** Write graph traversal code, suggest algorithms
- **I refined:** Optimized logic, added clear error messages, tested 20+ scenarios

### What I Learned

**AI accelerated:**
- Writing repetitive code (CRUD, schemas, components)
- Understanding best practices (async patterns, security)
- Generating documentation (README, API docs)

**I still owned:**
- All design decisions (features, UX, architecture)
- Correctness verification (testing every feature)
- Security responsibility (auth, secrets, validation)
- Production deployment (cloud setup, debugging)

**Bottom line:** AI saved me weeks of boilerplate writing, but I designed, built, tested, and deployed this application. AI was my coding assistant, not my architect.
```
