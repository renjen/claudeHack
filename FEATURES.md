# FEATURES.md — Feature Tracker

> Every feature, status, and related files. Update on status change.

---

## Status Enum

| Status | Meaning |
|--------|---------|
| `planned` | Not started |
| `in-progress` | Active work, partially done |
| `built` | Functional end-to-end |
| `broken` | Was working, now regressed |

---

## Features

| Feature | Status | Hour | Related Files |
|---------|--------|------|---------------|
| Repo scaffold (dirs, deps) | `built` | H+0 | `backend/requirements.txt`, `frontend/package.json`, `.env.example` |
| FastAPI shell + CORS | `built` | H+0 | `backend/main.py` |
| Vite + React + Tailwind shell | `built` | H+0 | `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/index.html`, `frontend/vite.config.js` |
| `/transcribe` (Whisper via Groq) | `built` | H+1 | `backend/whisper_service.py`, `backend/main.py` |
| VoiceRecorder component | `built` | H+1 | `frontend/src/components/VoiceRecorder.jsx` |
| TextInput component (sessionStorage) | `built` | H+1 | `frontend/src/components/TextInput.jsx` |
| Transcript history (last 10, persisted) | `built` | H+1 | `frontend/src/App.jsx` |
| `/extract` (NER w/ Haiku) | `built` | H+2 | `backend/ner_service.py`, `backend/main.py` |
| FLSA corpus + ChromaDB | `built` | H+2 | `backend/rag_service.py`, `backend/corpus/flsa.txt` |
| `/analyze` (RAG + classify) | `built` | H+3 | `backend/classifier.py`, `backend/rag_service.py`, `backend/main.py` |
| `/generate-letter` | `built` | H+4 | `backend/letter_service.py`, `backend/main.py` |
| Prompt caching on analyze + letter | `built` | H+4 | `backend/classifier.py`, `backend/letter_service.py` |
| TranscriptViewer component | `built` | H+5 | `frontend/src/components/TranscriptViewer.jsx` |
| FactsPanel component | `built` | H+5 | `frontend/src/components/FactsPanel.jsx` |
| ViolationBadge component | `built` | H+5 | `frontend/src/components/ViolationBadge.jsx` |
| DemandLetter component | `built` | H+5 | `frontend/src/components/DemandLetter.jsx` |
| DOLForm component | `built` | H+5 | `frontend/src/components/DOLForm.jsx` |
| End-to-end Spanish demo path | `built` | H+6 | `scripts/test_scenarios.py`, `tests/fixtures/demo_es_overtime.mp3` |
| Robust JSON extraction (all services) | `built` | H+6 | `backend/ner_service.py`, `backend/classifier.py`, `backend/letter_service.py` |
| README quickstart | `built` | H+7 | `README.md` |
| UI polish (typography, mobile) | `built` | H+7 | `frontend/src/App.jsx`, `frontend/src/components/` |
| Demo script (2-min talking points) | `built` | H+7 | `DEMO.md` |
| Output sanitization (B14) | `built` | B-track | `frontend/src/utils/sanitize.js`, `frontend/src/components/DemandLetter.jsx`, `frontend/src/components/DOLForm.jsx`, `frontend/src/components/ViolationBadge.jsx` |
| Input sanitization / prompt injection guard (B22) | `built` | B-track | `frontend/src/utils/sanitize.js`, `frontend/src/App.jsx` |
| Clipboard PII warning toast (B16) | `built` | B-track | `frontend/src/components/PiiToast.jsx`, `frontend/src/components/DemandLetter.jsx`, `frontend/src/components/DOLForm.jsx` |
