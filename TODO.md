# TODO.md — Wage Theft Watchdog Build Queue

> Active work queue. Each step is small, sequential, and testable.
> Tick boxes as you complete. After ticking, run the matching verification step from `TEST.md`.
> The **LATER** section is intentionally not auto-worked. Only pull from it when explicitly requested.

---

### To-Do

#### H+0 — Scaffolding

- [ ] **0.1** Create empty service files in `backend/`: `main.py`, `whisper_service.py`, `ner_service.py`, `rag_service.py`, `classifier.py`, `letter_service.py`, plus `backend/corpus/` directory
  - Verify: `ls backend/` shows all 6 .py files + `corpus/` + `requirements.txt`
- [ ] **0.2** Create Python venv and install backend deps
  - Run: `python -m venv .venv && .venv\Scripts\activate && pip install -r backend\requirements.txt`
  - Verify: `python -c "import fastapi, anthropic, openai, groq, chromadb"` returns no error
- [ ] **0.3** Implement minimal `backend/main.py`: FastAPI app, CORS for `http://localhost:5173`, `GET /health` returns `{"ok": true}`
  - Verify: `uvicorn backend.main:app --reload --port 8000` runs; `curl http://localhost:8000/health` returns `{"ok":true}`
- [ ] **0.4** Scaffold Vite + React frontend: `npm create vite@latest frontend -- --template react`, then `cd frontend && npm install`
  - Verify: `npm run dev` shows the React default page at `http://localhost:5173`
- [ ] **0.5** Add Tailwind to frontend: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`, configure `tailwind.config.js` content paths, add `@tailwind` directives to `src/index.css`
  - Verify: an element with `className="text-red-500"` renders red
- [ ] **0.6** Replace `App.jsx` with a "Wage Theft Watchdog" header + a fetch to `GET /health`, show "Backend: ok" or "Backend: down"
  - Verify: page shows "Backend: ok" — proves CORS + connectivity
- [ ] **0.7** Create `.env` from `.env.example`, fill in API keys (Anthropic, Groq, OpenAI required)
  - Verify: `python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('A' if os.getenv('ANTHROPIC_API_KEY') else 'X', 'G' if os.getenv('GROQ_API_KEY') else 'X', 'O' if os.getenv('OPENAI_API_KEY') else 'X')"` prints `A G O`

#### H+1 — Whisper wired

- [ ] **1.1** Implement `backend/whisper_service.py`: `transcribe_audio(audio_bytes: bytes, content_type: str) -> dict` using Groq client (model `whisper-large-v3-turbo`, `response_format="verbose_json"`)
  - Verify: smoke-test with bytes of a short WAV returns `{"transcript": str, "language": str, "duration_sec": float}`
- [ ] **1.2** Add `POST /transcribe` to `main.py`: accept `UploadFile`, read bytes in memory (no `tempfile`, no disk write), call `transcribe_audio`
  - Verify: `curl -X POST -F "file=@tests/fixtures/sample_en.wav" http://localhost:8000/transcribe` returns transcript JSON
- [ ] **1.3** PII check: confirm no audio file in `tempfile.gettempdir()` or `backend/` after the curl call
- [ ] **1.4** Build `frontend/src/components/VoiceRecorder.jsx`: mic button using MediaRecorder, posts blob to `/transcribe`, calls `getTracks().forEach(t=>t.stop())` on stop
  - Verify: click record, speak, click stop → transcript prints to browser console
- [ ] **1.5** Wire VoiceRecorder into `App.jsx`, render transcript and language badge
  - Verify: end-to-end browser → backend → Groq → display, transcript visible in UI

#### H+2 — NER + RAG corpus

- [ ] **2.1** Download FLSA full text into `backend/corpus/flsa.txt` (from `law.cornell.edu/uscode/text/29/chapter-8`)
  - Verify: file is >100 lines and contains "§ 207"
- [ ] **2.2** Implement `backend/ner_service.py`: `extract_facts(transcript: str) -> dict` using Claude Haiku 4.5 with structured JSON output (schema in `PLAN.md` §3)
  - Verify: input "I work 60 hours, paid for 40, boss is John at Acme Pizza" → output has `employer_name="Acme Pizza"`, `hours_worked_per_week=60`, `hours_paid_per_week=40`
- [ ] **2.3** Add `POST /extract` to `main.py`
  - Verify: `curl -X POST -H "Content-Type: application/json" -d '{"transcript":"..."}' http://localhost:8000/extract` returns facts JSON
- [ ] **2.4** Implement `backend/rag_service.py`: `init_corpus()` chunks `flsa.txt` (~400 tokens, 50 overlap), embeds with OpenAI `text-embedding-3-small`, stores in ChromaDB collection `"flsa_corpus"` with metadata `{source, section, text}`
  - Verify: after `init_corpus()`, `collection.count() >= 50`
- [ ] **2.5** Implement `retrieve(query: str, k: int = 5) -> list[dict]` returning chunks with `{source, section, text, score}` (verbatim text, not paraphrased)
  - Verify: `retrieve("overtime")` top result has `section` containing "§ 207"; `retrieve("minimum wage")` top result has "§ 206"
- [ ] **2.6** Add a startup hook in `main.py` that calls `init_corpus()` once, skips if collection already populated
  - Verify: second startup is fast (no re-embedding)

#### H+3 — `/analyze`

- [ ] **3.1** Implement `backend/classifier.py`: `classify_violations(facts: dict, retrieved_chunks: list[dict]) -> dict` using Claude Sonnet 4.6 with structured JSON. Place `cache_control: {"type": "ephemeral"}` on the system-prompt-plus-chunks block (not on the worker facts block)
  - Verify: input OT facts + retrieved §207 chunks → output `violations[0].type == "overtime_theft"`, `relevant_law` contains "§ 207"
- [ ] **3.2** Add `POST /analyze` to `main.py`: calls `retrieve()` then `classify_violations()`
  - Verify: `curl -X POST -d '{"facts":{...}}' http://localhost:8000/analyze` returns `{"violations":[...]}`
- [ ] **3.3** Validate prompt caching: log `response.usage`. Two calls within 5 min → second has `cache_read_input_tokens > 0` and `cache_creation_input_tokens == 0`

#### H+4 — `/generate-letter`

- [ ] **4.1** Implement `backend/letter_service.py`: `generate_letter(facts, violations) -> dict` using Sonnet 4.6 with prompt caching
  - Verify: returns `{"demand_letter": str, "dol_prefill": dict}`; letter contains employer name, "FLSA", a "$" amount with calculation, "not legal advice" disclaimer
- [ ] **4.2** Add `POST /generate-letter` to `main.py`
  - Verify: full pipeline test — record → transcribe → extract → analyze → generate-letter all succeed
- [ ] **4.3** Sanity-check letter content
  - Verify: letter contains the literal strings "FLSA", "$", and "not legal advice"

#### H+5 — Frontend wire-up

- [ ] **5.1** Create UI shells with Tailwind: `TranscriptViewer.jsx`, `FactsPanel.jsx`, `ViolationBadge.jsx`, `DemandLetter.jsx`, `DOLForm.jsx` (each accepts mock props, renders nicely)
  - Verify: each component renders with hardcoded mock data
- [ ] **5.2** Implement step state in `App.jsx`: enum `idle | recording | transcribed | extracted | analyzed | complete`. Wire all 4 endpoints sequentially after recording stops
  - Verify: full flow works end-to-end with browser audio
- [ ] **5.3** Loading states (spinner per step) and error states (toast or banner)
  - Verify: throttle network in DevTools → spinners appear; kill backend → error message
- [ ] **5.4** "Copy letter" and "Copy DOL" buttons (Clipboard API)
  - Verify: paste shows the content correctly

#### H+6 — End-to-end demo path

- [ ] **6.1** Pre-record Spanish demo audio: "Trabajo 10 horas al día, 6 días a la semana, pero mi jefe sólo me paga por 8 horas. Dice que el tiempo extra no aplica a inmigrantes." Save as `tests/fixtures/demo_es_overtime.wav`
  - Verify: file plays back correctly
- [ ] **6.2** Run the Spanish clip through the full pipeline
  - Verify: English demand letter cites FLSA § 207, debunks the immigration claim, includes a dollar calculation
- [ ] **6.3** Test 4 more scenarios: tip skimming, misclassification, minimum wage, off-the-clock
  - Verify: each produces correct `violations[0].type`
- [ ] **6.4** Edge cases: silence, no employer name, vague claim "boss owes me money"
  - Verify: each handled gracefully (asks for clarification, no crash)

#### H+7 — Polish + demo prep

- [ ] **7.1** UI polish: typography, spacing, color palette, mobile breakpoint
  - Verify: looks good on 1080p laptop and on phone width
- [ ] **7.2** Write `README.md` quickstart: setup, run backend, run frontend, .env keys
  - Verify: a stranger could follow it and run the app
- [ ] **7.3** Write 2-min demo script (talking points + timed actions)
  - Verify: timed run-through stays under 2:00
- [ ] **7.4** Pre-record fallback demo video as backup if live mic fails
  - Verify: video plays without audio glitches

#### H+8 — Buffer / final QA

- [ ] **8.1** Run all 5 demo scenarios from `TEST.md` once more
  - Verify: all 5 produce correct violation + citation
- [ ] **8.2** PII audit: search backend folder for audio files; search logs for transcripts/employer names
  - Verify: clean — see `TEST.md` PII Tests

---

### LATER

> Do not work on these unless explicitly requested.

1. Organize FEATURES.md
2. Add CA, NY, TX state law corpora to ChromaDB; surface state-specific violations
3. Multi-violation detection ranking (currently focus is top violation only)
4. Streaming responses for `/analyze` and `/generate-letter` (better UX while Sonnet thinks)
5. Editable transcript step before `/extract` (let user fix Whisper errors)
6. PDF download of demand letter
7. Surface FLSA § 215 anti-retaliation info alongside any output
8. Dollar-amount estimator with confidence band
9. Auth + persistence (SQLite for "my cases") — only with consent UI
10. Spanish UI (not just Spanish input)
11. Pytest scaffolding for unit tests (currently manual verification only)
12. Dockerize for one-command demo
13. Add other federal violations: WARN Act, ADA, FMLA
14. Add error telemetry (Sentry, etc.) — careful: must not capture PII
