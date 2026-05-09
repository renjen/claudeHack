# INDEX.md — Wage Theft Watchdog

**Last updated:** 2026-05-09 | **Status:** H+0 — foundations setup

---

## 8-Hour Milestone Timeline

| Hour | Milestone | Deliverable |
|------|-----------|-------------|
| H+0 → H+1 | Scaffolding | Repo dirs, FastAPI hello, Vite/React hello, `.env` keys validated |
| H+1 → H+2 | Whisper wired | `/transcribe` endpoint, browser mic → transcript demo |
| H+2 → H+3 | NER + RAG corpus | `/extract` endpoint with Haiku JSON. FLSA corpus chunked + embedded |
| H+3 → H+5 | `/analyze` + `/generate-letter` | Sonnet w/ prompt caching. End-to-end pipeline functional |
| H+5 → H+6 | Frontend wire-up | All 4 endpoints called from React. Streaming output |
| H+6 → H+7 | E2E demo path | Spanish voice → English letter w/ FLSA citations |
| H+7 → H+8 | Polish + demo prep | UI cleanup, README, demo script, edge case smoothing |

**Hard rule:** if any hour goes long, cut frontend polish before pipeline correctness.

---

## Routing Table

INDEX.md is assumed loaded at session start. Re-read only if registry changed.

| Task | Read First | Then Read | Skip | Write To |
|------|-----------|-----------|------|----------|
| **Frontend feature** | `FEATURES.md` | relevant `frontend/src/components/` | backend, corpus | `frontend/src/`, `FEATURES.md` |
| **Backend endpoint** | `FEATURES.md` | relevant `backend/*_service.py` | frontend, unrelated services | `backend/`, `FEATURES.md` |
| **Whisper / transcribe** | `backend/whisper_service.py` | `backend/main.py` | other services, frontend | `backend/whisper_service.py` |
| **NER / extract** | `backend/ner_service.py` | `backend/main.py` | rag, frontend | `backend/ner_service.py` |
| **RAG / corpus** | `backend/rag_service.py` | `backend/corpus/` | frontend, ner | `backend/rag_service.py`, `backend/corpus/` |
| **Classify / analyze** | `backend/classifier.py` | `backend/rag_service.py` | frontend, whisper | `backend/classifier.py` |
| **Letter / generate** | `backend/letter_service.py` | `backend/classifier.py` | frontend, whisper, ner | `backend/letter_service.py` |
| **Architectural decision** | `DESIGN.md` | relevant service file | unrelated services | `DESIGN.md` |
| **Bug fix** | file with bug | files it imports (max 2) | unrelated | the broken file only |
| **Bulk/script op** | `scripts/` (existing scripts) | target file | everything else | `scripts/`, target |
| **Feature status check** | `FEATURES.md` | nothing | everything | `FEATURES.md` only |

**Rule: If a file is not in the Read column for your current task, do not open it.**

---

## File Registry

> Update this every time a new file is created or a file's purpose changes.

### Config & Docs
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Session instructions, rules, citation standard |
| `INDEX.md` | This file — routing + registry |
| `PLAN.md` | Build plan + reconciliation decisions |
| `DESIGN.md` | All architectural decisions (ADRs) |
| `FEATURES.md` | Features, status, related files |
| `README.md` | Quickstart (populated at H+7) |
| `.env.example` | Template for API keys |

### Backend (`backend/`)
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app, 4 routes, CORS — *(scaffold pending H+0)* |
| `backend/whisper_service.py` | Audio → transcript via Groq Whisper — *(pending H+1)* |
| `backend/ner_service.py` | Claude Haiku extraction → structured JSON — *(pending H+2)* |
| `backend/rag_service.py` | ChromaDB setup + FLSA chunk retrieval — *(pending H+2)* |
| `backend/classifier.py` | Claude Sonnet violation classification — *(pending H+3)* |
| `backend/letter_service.py` | Claude Sonnet demand letter + DOL pre-fill — *(pending H+4)* |
| `backend/corpus/flsa.txt` | FLSA full text (public domain) — *(pending H+2)* |
| `backend/requirements.txt` | Pinned Python deps |

### Frontend (`frontend/`)
| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Single-page app shell, step state — *(pending H+0)* |
| `frontend/src/main.jsx` | Vite entry — *(pending H+0)* |
| `frontend/vite.config.js` | Vite config — *(pending H+0)* |
| `frontend/index.html` | HTML entry — *(pending H+0)* |
| `frontend/src/components/VoiceRecorder.jsx` | Mic input, MediaRecorder — *(pending H+5)* |
| `frontend/src/components/TranscriptViewer.jsx` | Editable transcript + lang badge — *(pending H+5)* |
| `frontend/src/components/FactsPanel.jsx` | Extracted facts summary — *(pending H+5)* |
| `frontend/src/components/ViolationBadge.jsx` | Violation type + confidence + citation — *(pending H+5)* |
| `frontend/src/components/DemandLetter.jsx` | Generated letter, copy/download — *(pending H+5)* |
| `frontend/src/components/DOLForm.jsx` | DOL pre-fill, copy button — *(pending H+5)* |
| `frontend/package.json` | Vite + React + Tailwind deps |

### Scripts (`scripts/`)
| File | Purpose |
|------|---------|
| *(none yet)* | — |

---

## Pipeline Diagram

```
[Browser MediaRecorder]
    ↓ audio blob
POST /transcribe → backend/whisper_service.py → Groq Whisper
    ↓ {transcript, language}
POST /extract → backend/ner_service.py → Claude Haiku (JSON)
    ↓ {employer, hours, wages, dates, raw_claims}
POST /analyze → backend/rag_service.py → ChromaDB (FLSA corpus)
                ↓ retrieved law chunks
                backend/classifier.py → Claude Sonnet (cached prompt + JSON)
    ↓ {violations[], citations, employer_claim_debunked}
POST /generate-letter → backend/letter_service.py → Claude Sonnet
    ↓ {demand_letter, dol_prefill}
[Frontend renders all]
```

---

## Violation Type Taxonomy

| Type | Federal Basis | Common Aliases |
|------|--------------|----------------|
| Overtime theft | FLSA § 207 | unpaid OT, time shaving |
| Minimum wage violation | FLSA § 206 | underpayment |
| Tip theft / tip credit abuse | FLSA § 203(m) | tip skimming |
| Employee misclassification | FLSA § 203(e) | 1099 abuse |
| Illegal deductions | FLSA § 206 / state | uniform costs, paycheck deductions |
| Off-the-clock work | FLSA § 254 | unpaid prep time, travel time |
| Retaliation | FLSA § 215(a)(3) | fired for complaining |

---

## External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| DOL WHD | `dol.gov/agencies/whd` | Complaint filing, fact sheets |
| FLSA Text | `law.cornell.edu/uscode/text/29/chapter-8` | Primary statute |
| DOL Complaint Form | `dol.gov/agencies/whd/contact/complaints` | Direct user link |
| Anthropic API | `docs.anthropic.com` | Claude API + prompt caching |
| Groq Whisper | `console.groq.com/docs/speech-text` | Fast transcription |
| ChromaDB | `docs.trychroma.com` | Vector store |
