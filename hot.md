# hot.md — Session L1 Cache

## What this is
Wage Theft Watchdog — hackathon app. Voice → FLSA demand letter in <60s.
Docs: CLAUDE.md (rules), INDEX.md (routing), TODO.md (queue), PLAN.md (decisions), DESIGN.md (ADRs), TEST.md (verify).

## Stack
FastAPI · Vite+React+Tailwind · ChromaDB · OpenAI embeddings · Groq Whisper · Claude API
Pipeline: `/transcribe` → `/extract` → `/analyze` → `/generate-letter`
Models: Haiku 4.5 (/extract) · Sonnet 4.6 (/analyze, /generate-letter) · Groq whisper-large-v3-turbo

## Current State — H+6 ✅ DONE, starting H+7

| Step | Status |
|------|--------|
| H+0 — Full scaffolding | ✅ Complete |
| H+1 — Whisper + input wired | ✅ Complete |
| H+2 — NER + RAG corpus | ✅ Complete |
| H+3 — /analyze | ✅ Complete |
| H+4 — /generate-letter | ✅ Complete |
| H+5 — Frontend wire-up | ✅ Complete |
| H+6 — E2E demo path | ✅ Complete |
| H+7 — Polish + demo prep | 🔜 Next |

**What's running:**
- Backend: `uvicorn backend.main:app --reload --port 8000` (activate `.venv\Scripts\activate` first)
- Frontend: `cd frontend && npm run dev` → `http://localhost:5173`

**What's built:**
- `POST /transcribe` → Groq Whisper → `{transcript, language, duration_sec}`
- `POST /extract` → Claude Haiku → structured facts JSON
- `POST /analyze` → RAG (ChromaDB + OpenAI embeddings) + Sonnet classifier → violations + citations
- `POST /generate-letter` → Sonnet → demand letter + DOL prefill (max_tokens=4000)
- Full React frontend: step state machine, 5 UI components, spinners, error states, copy buttons

**Key gotchas learned:**
- Haiku model ID must be full: `claude-haiku-4-5-20251001`
- All services: use `raw.find('{')` / `raw.rfind('}')` to extract JSON — don't trust startswith check
- ChromaDB must use `PersistentClient` — in-memory resets on restart
- max_tokens=4000 needed for multi-violation letters (2000 causes truncation)
- CORS must be `allow_origins=["*"]` for browser testing flexibility
- RAG retrieval weak for min wage + tip skimming (see LATER #16 in TODO.md)

## Key Rules (non-negotiable)
- NO audio to disk. Memory only. See DESIGN.md ADR-006.
- Every legal claim needs verbatim citation: `[Statute, Code, "exact text"]`
- Prompt caching on /analyze + /generate-letter. Cache breakpoint: after system+chunks, before worker facts.
- Disclaimer "legal information, not legal advice" on every output
