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
| Repo scaffold (dirs, deps) | `in-progress` | H+0 | `backend/requirements.txt`, `frontend/package.json`, `.env.example` |
| FastAPI shell + CORS | `planned` | H+0 | `backend/main.py` |
| Vite + React shell | `planned` | H+0 | `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/index.html`, `frontend/vite.config.js` |
| `/transcribe` (Whisper) | `planned` | H+1 | `backend/whisper_service.py`, `backend/main.py` |
| `/extract` (NER w/ Haiku) | `planned` | H+2 | `backend/ner_service.py`, `backend/main.py` |
| FLSA corpus + ChromaDB | `planned` | H+2 | `backend/rag_service.py`, `backend/corpus/flsa.txt` |
| `/analyze` (RAG + classify) | `planned` | H+3 | `backend/classifier.py`, `backend/rag_service.py`, `backend/main.py` |
| `/generate-letter` | `planned` | H+4 | `backend/letter_service.py`, `backend/main.py` |
| Prompt caching on analyze + letter | `planned` | H+4 | `backend/classifier.py`, `backend/letter_service.py` |
| VoiceRecorder component | `planned` | H+5 | `frontend/src/components/VoiceRecorder.jsx` |
| TranscriptViewer component | `planned` | H+5 | `frontend/src/components/TranscriptViewer.jsx` |
| FactsPanel component | `planned` | H+5 | `frontend/src/components/FactsPanel.jsx` |
| ViolationBadge component | `planned` | H+5 | `frontend/src/components/ViolationBadge.jsx` |
| DemandLetter component | `planned` | H+5 | `frontend/src/components/DemandLetter.jsx` |
| DOLForm component | `planned` | H+5 | `frontend/src/components/DOLForm.jsx` |
| End-to-end Spanish demo path | `planned` | H+6 | All of the above |
| README quickstart | `planned` | H+7 | `README.md` |
