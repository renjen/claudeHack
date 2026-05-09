# Wage Theft Watchdog

AI-powered legal triage for workers. Describe your situation by voice or text — get FLSA violation analysis, law citations, estimated damages, and a ready-to-send demand letter in under 30 seconds.

Built for the Claude Hackathon — Track 1: Economic Empowerment & Education.

---

## What it does

1. **Describe** — Record your voice (any language) or type your situation
2. **Analyze** — Claude extracts facts, retrieves FLSA law via RAG, classifies violations with citations
3. **Act** — Generates a demand letter + pre-filled DOL complaint form

Pipeline: Groq Whisper → Claude Haiku (NER) → ChromaDB + Claude Sonnet (RAG + classify) → Claude Sonnet (letter)

---

## Quickstart

### Requirements

- Python 3.11+
- Node 18+
- API keys: Anthropic, OpenAI, Groq

### 1 — Environment

```bash
cp .env.example .env
# Fill in:
#   ANTHROPIC_API_KEY
#   OPENAI_API_KEY   (embeddings)
#   GROQ_API_KEY     (Whisper transcription)
```

### 2 — Backend

```bash
# From the project root
cd backend && python -m venv .venv && cd ..
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/uvicorn backend.main:app --port 8000
```

On first start, ChromaDB embeds the FLSA corpus (~146 chunks). Takes ~15 seconds. Subsequent starts skip re-embedding.

Verify: `curl http://localhost:8000/health` → `{"ok": true}`

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (or http://localhost:5174 if 5173 is taken).

---

## API endpoints

| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/transcribe` | `multipart/form-data` audio file | `{transcript, language, duration_sec}` |
| POST | `/extract` | `{transcript: str}` | `{employer_name, hours_worked_per_week, ...}` |
| POST | `/analyze` | `{facts: dict}` | `{violations: [...], clarifications_needed: [...]}` |
| POST | `/generate-letter` | `{facts: dict, violations: [...]}` | `{demand_letter: str, dol_prefill: dict}` |

---

## Demo scenarios

Run all 5 test scenarios against a running backend:

```bash
cd backend
source .venv/bin/activate
python ../scripts/test_scenarios.py
```

Scenarios: overtime theft (Spanish), tip skimming, misclassification, minimum wage, off-the-clock.

---

## Privacy

Voice recordings are processed in-memory and never written to disk. Transcripts and facts are held only in the browser session. The backend is stateless — no data is retained between requests.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + Tailwind |
| Backend | FastAPI (Python) |
| Transcription | Groq `whisper-large-v3-turbo` |
| NER | Claude Haiku 4.5 |
| RAG | ChromaDB + OpenAI `text-embedding-3-small` |
| Analysis + Letter | Claude Sonnet 4.6 (prompt caching) |

---

## Legal disclaimer

This tool provides **legal information**, not legal advice. Always consult a licensed attorney for your specific situation.
