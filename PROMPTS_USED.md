# Prompts Used

Records of prompts used during app development.

---

## Initial Planning & Architecture

- "how we can do this [Problem statement B: Workflow Builder Lite] - tell me an abstract idea no code just a story type idea"
- "a step can be defined by user itself no predefined step that can happen?"
- "so here is my idea [detailed workflow builder concept with n8n-style grid] - analyse it go through it and then see mistakes or things which you think are unnecessary"
- "ok your points are good but text box at bottom is good we can define a step as starting or ending step... so we have to create an end to end project so do not miss anything so one by explain each part of our project and where what tech should I use"

## Deployment Strategy

- "the deployment will happen on free sites so it is your choice what scaling method is good"
- "can I get free credit somewhere as I will not need it more than a month"
- "First: Oracle Cloud (try to get Ampere A1 - free forever!) - lets see how to get this as accordingly we will choose the tech stack"
- "there is only one option coming for credit card no option for debit card"
- "I am going to use gcp lets summarise what we have discussed and make a short form of it to give it to claude to start building the project"

---

## Implementation (with Cursor)

I led the build and used Cursor to implement. I read FastAPI, ReactFlow, and deployment docs myself and often pasted relevant snippets or said exactly what I wanted so the agent could match my intent. I also wrote or adjusted code in places and asked Cursor to fix, extend, or refactor.

**Direction I gave (examples):**
- "Implement full frontend plan to match the backend" / "add step types START, NORMAL, END" / "one connection per side, edge delete"
- "Validation: fix 'all steps must be connected' – clearer errors" / "single-step workflow: only START, no END"
- "Implement Redis from the plan; then switch to Upstash" / "test Upstash after adding credentials"
- "Uvicorn reload – stop reloads from .venv" / "Redis status showing disconnected – credentials are correct"
- "Deploy on GCP using Docker" / "deploy frontend and connect it with the backend"
- "Go through every file for submission rules; add AI_NOTES, ABOUTME, PROMPTS_USED; home page clear steps; no API keys in code"

**What I provided myself:** Code snippets for connection rules, env/config patterns, and deployment commands. I ran and tested locally and on Cloud Run and fixed issues (e.g. pip/venv, Docker COPY paths, gcloud beta for logs).

**Cursor’s role:** Implemented routes, validation, UI components, and deployment files when I asked; followed my snippets and docs; did not decide architecture or product—I did.
