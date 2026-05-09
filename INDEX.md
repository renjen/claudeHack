# INDEX.md — Wage Theft Watchdog

**Last updated:** 2026-05-09 | **Status:** H+6 complete — full pipeline built and tested

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
| **Active step pickup** | `TODO.md` | the file the step touches | everything else | `TODO.md` (tick box), target file |
| **Verify / test feature** | `TEST.md` | target module | unrelated modules | `tests/` if scripted; nothing if manual |
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
| `TODO.md` | Active work queue + later list |
| `DESIGN.md` | All architectural decisions (ADRs) |
| `FEATURES.md` | Features, status, related files |
| `TEST.md` | Per-module / per-stage testing guide |
| `README.md` | Quickstart — setup, run, API reference |
| `DEMO.md` | 2-min timed demo script + fallback instructions |
| `.env.example` | Template for API keys |

### Tests (`tests/`)
| File | Purpose |
|------|---------|
| `tests/fixtures/demo_es_overtime.mp3` | Spanish OT demo audio (gTTS generated) |

### Backend (`backend/`)
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app, 4 routes, CORS=* |
| `backend/whisper_service.py` | Audio → transcript via Groq `whisper-large-v3-turbo` |
| `backend/ner_service.py` | Claude Haiku structured JSON fact extraction |
| `backend/rag_service.py` | ChromaDB PersistentClient + OpenAI embeddings + FLSA retrieval |
| `backend/classifier.py` | Claude Sonnet violation classifier w/ prompt caching |
| `backend/letter_service.py` | Claude Sonnet demand letter + DOL prefill (max_tokens=4000) |
| `backend/corpus/flsa.txt` | FLSA full text — 146 chunks embedded in `.chromadb/` |
| `backend/requirements.txt` | Python deps |
| `backend/.chromadb/` | Persisted ChromaDB embeddings (auto-populated on first run) |

### Frontend (`frontend/`)
| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Step state machine: idle→extracting→analyzing→generating→complete |
| `frontend/src/main.jsx` | Vite entry |
| `frontend/vite.config.js` | Vite config (allowedHosts: host.docker.internal) |
| `frontend/index.html` | HTML entry |
| `frontend/src/components/VoiceRecorder.jsx` | Mic input → POST /transcribe → onTranscript |
| `frontend/src/components/TextInput.jsx` | Textarea → onTranscript (sessionStorage draft) |
| `frontend/src/components/TranscriptViewer.jsx` | Transcript + language badge |
| `frontend/src/components/FactsPanel.jsx` | Extracted facts grid + claims |
| `frontend/src/components/ViolationBadge.jsx` | Violation type/severity/citation/damages card |
| `frontend/src/components/DemandLetter.jsx` | Full letter with copy button |
| `frontend/src/components/DOLForm.jsx` | DOL prefill fields + copy + filing link |
| `frontend/package.json` | Vite + React + Tailwind deps |

### Scripts (`scripts/`)
| File | Purpose |
|------|---------|
| `scripts/test_scenarios.py` | H+6 scenario suite: 5 violation types + 3 edge cases |

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
