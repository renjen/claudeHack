# TODO.md — Wage Theft Watchdog Build Queue

> Active work queue. Each step is small, sequential, and testable.
> Tick boxes as you complete. After ticking, run the matching verification step from `TEST.md`.
> The **LATER** section is intentionally not auto-worked. Only pull from it when explicitly requested.

---

### To-Do

#### H+0 — Scaffolding

- [x] **0.1** Create empty service files in `backend/`: `main.py`, `whisper_service.py`, `ner_service.py`, `rag_service.py`, `classifier.py`, `letter_service.py`, plus `backend/corpus/` directory
- [x] **0.2** Create Python venv and install backend deps (using uv)
- [x] **0.3** Implement minimal `backend/main.py`: FastAPI app, CORS for `http://localhost:5173`, `GET /health` returns `{"ok": true}`
- [x] **0.4** Scaffold Vite + React frontend
- [x] **0.5** Add Tailwind to frontend
- [x] **0.6** Replace `App.jsx` with health check — shows "Backend: ok"
- [x] **0.7** `.env` filled with all 3 API keys

#### H+1 — Whisper wired

- [x] **1.1** Implement `backend/whisper_service.py`: `transcribe_audio(audio_bytes, content_type) -> dict` via Groq `whisper-large-v3-turbo`
- [x] **1.2** Add `POST /transcribe` to `main.py` — in-memory, no disk write
- [x] **1.3** PII check passed — no audio files in tempdir after call
- [x] **1.4** Build `VoiceRecorder.jsx` — MediaRecorder → POST blob → onTranscript callback
- [x] **1.5** Build `TextInput.jsx` — textarea + sessionStorage draft + onTranscript callback
- [x] **1.6** Wire Voice/Type tabs into `App.jsx` — transcript history (last 10, newest first, sessionStorage-persisted)

#### H+2 — NER + RAG corpus

- [x] **2.1** Download FLSA key sections → `backend/corpus/flsa.txt` (2614 lines, 77KB, §§ 203/206/207/215 confirmed)
- [x] **2.2** Implement `ner_service.py`: `extract_facts(transcript) -> dict` via Haiku `claude-haiku-4-5-20251001`
- [x] **2.3** Add `POST /extract` to `main.py` — verified working
- [x] **2.4** Implement `rag_service.py`: `init_corpus()` — 100-word chunks, OpenAI embeddings, PersistentClient
- [x] **2.5** Implement `retrieve(query, k=5) -> list[dict]` with verbatim text
- [x] **2.6** Startup hook via FastAPI lifespan — skips re-embedding on second start

#### H+3 — `/analyze`

- [x] **3.1** Implement `backend/classifier.py`: `classify_violations(facts: dict, retrieved_chunks: list[dict]) -> dict` using Claude Sonnet 4.6 with structured JSON. Place `cache_control: {"type": "ephemeral"}` on the system-prompt-plus-chunks block (not on the worker facts block)
  - Verify: input OT facts + retrieved §207 chunks → output `violations[0].type == "overtime_theft"`, `relevant_law` contains "§ 207"
- [x] **3.2** Add `POST /analyze` to `main.py`: calls `retrieve()` then `classify_violations()`
  - Verify: `curl -X POST -d '{"facts":{...}}' http://localhost:8000/analyze` returns `{"violations":[...]}`
- [ ] ~~**3.3**~~ Moved to LATER — see item 15

#### H+4 — `/generate-letter`

- [x] **4.1** Implement `backend/letter_service.py`: `generate_letter(facts, violations) -> dict` using Sonnet 4.6 with prompt caching
  - Verify: returns `{"demand_letter": str, "dol_prefill": dict}`; letter contains employer name, "FLSA", a "$" amount with calculation, "not legal advice" disclaimer
- [x] **4.2** Add `POST /generate-letter` to `main.py`
  - Verify: full pipeline test — record → transcribe → extract → analyze → generate-letter all succeed
- [x] **4.3** Sanity-check letter content
  - Verify: letter contains the literal strings "FLSA", "$", and "not legal advice"

#### H+5 — Frontend wire-up

- [x] **5.1** Create UI shells with Tailwind: `TranscriptViewer.jsx`, `FactsPanel.jsx`, `ViolationBadge.jsx`, `DemandLetter.jsx`, `DOLForm.jsx` (each accepts mock props, renders nicely)
  - Verify: each component renders with hardcoded mock data
- [x] **5.2** Implement step state in `App.jsx`: enum `idle | extracting | analyzing | generating | complete | error`. Wire all 4 endpoints sequentially after recording stops
  - Verify: full pipeline chain (extract → analyze → generate-letter) confirmed working end-to-end via Python
- [x] **5.3** Loading states (spinner per step) and error states (toast or banner)
  - Verify: Spinner component shown per step; error state with message on failure
- [x] **5.4** "Copy letter" and "Copy DOL" buttons (Clipboard API)
  - Verify: implemented in DemandLetter.jsx and DOLForm.jsx — paste verify in browser at localhost:5174

#### H+6 — End-to-end demo path

- [x] **6.1** Pre-record Spanish demo audio — saved as `tests/fixtures/demo_es_overtime.mp3` via gTTS (mp3 works with Whisper)
- [x] **6.2** Run the Spanish clip through the full pipeline
  - Verify: detected off_the_clock + overtime_theft, debunked immigration claim, FLSA § 207 cited, $27,456 damage calc
- [x] **6.3** Test 4 more scenarios: tip skimming, misclassification, minimum wage, off-the-clock
  - Verify: all 4 produce correct violation types — confirmed via `scripts/test_scenarios.py`
- [x] **6.4** Edge cases: silence, no employer name, vague claim
  - Verify: all 3 GRACEFUL — violations=[], clarifications_needed populated, no crash

#### H+7 — Polish + demo prep

- [x] **7.1** UI polish: typography, spacing, color palette, mobile breakpoint
  - Verify: looks good on 1080p laptop and on phone width
- [x] **7.2** Write `README.md` quickstart: setup, run backend, run frontend, .env keys
  - Verify: a stranger could follow it and run the app
- [x] **7.3** Write 2-min demo script (talking points + timed actions) → `DEMO.md`
  - Verify: timed run-through stays under 2:00
- [ ] **7.4** Pre-record fallback demo video as backup if live mic fails
  - Verify: video plays without audio glitches

#### H+8 — Buffer / final QA

- [x] **8.1** Run all 5 demo scenarios from `TEST.md` once more
  - Verify: 5/5 PASS — fixed off_the_clock FAIL (NER was extracting "FreshMart grocery store" instead of "FreshMart"; fixed NER prompt + test check)
- [x] **8.2** PII audit: search backend folder for audio files; search logs for transcripts/employer names
  - Verify: CLEAN — no audio in tempdir, no log files, no PII in source print/log calls

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
15. **Prompt caching verification (3.3)** — `cache_read_input_tokens` returns 0 on both calls despite correct `cache_control` placement. Investigate API plan / `claude-sonnet-4-6` reporting format. Files: `backend/classifier.py` (cache_control block), `backend/letter_service.py` (same pattern to apply once resolved)
16. **RAG retrieval weak for min wage + tip skimming** — Overtime retrieval solid (scores 0.81–0.94). Min wage (§ 206) and tip skimming (§ 203(m)) return poor top results (scores > 1.0) due to semantic mismatch between colloquial claims and dense FLSA legal text. Fix: add metadata-based fallback lookup by violation type keyword (e.g. query contains "minimum wage" → directly pull § 206 chunks). Files: `backend/rag_service.py`, `backend/main.py` (`/analyze` query builder)

- bias and fairness tests (questions in different languages and evulating)
- login system, collect minimal data, and then maybe provide a different level of helpfulness to different age groups? or help at different levels? if that makes sense
- Connect them to a reputable lawyer line if the llm choose to add the "consult a lawyer" disclaimer (must)
- evaluations -- fp/tp/fn/tn, etc

---

### Parallel Track A — Backend / Data / Infrastructure
> Python only. No frontend files touched.

- [ ] **A1** Fix prompt caching — `cache_read_input_tokens` returns 0; verify breakpoint placement in `backend/classifier.py` + `backend/letter_service.py` *(LATER #15)*
- [ ] **A2** RAG retrieval fix — metadata-based fallback for min wage + tip skimming when semantic scores are weak; `backend/rag_service.py` + `/analyze` query builder *(LATER #16)*
- [ ] **A3** State law corpora — embed CA, NY, TX law text into ChromaDB; surface state violations alongside federal in `backend/classifier.py` *(LATER #2)*
- [ ] **A4** Additional federal violations — WARN Act, ADA, FMLA corpus chunks + classifier support *(LATER #13)*
- [ ] **A5** Anti-retaliation surfacing — flag FLSA § 215 whenever any violation is detected; `backend/classifier.py` + `backend/letter_service.py` *(LATER #7)*
- [ ] **A6** Multi-violation ranking — rank by severity + damages instead of flat list; `backend/classifier.py` *(LATER #3)*
- [ ] **A7** Dollar estimator with confidence band — add low/mid/high range to damage estimates; `backend/classifier.py` *(LATER #8)*
- [ ] **A8** Pytest scaffolding — unit tests for `extract_facts`, `retrieve`, `classify_violations`; `tests/` *(LATER #11)*
- [ ] **A9** Dockerize — `Dockerfile` + `docker-compose.yml` for one-command startup *(LATER #12)*
- [ ] **A10** Error telemetry — Sentry integration in `backend/main.py`, no PII in payloads *(LATER #14)*
- [ ] **A11** Evaluations — fp/tp/fn/tn script across labeled scenarios; `scripts/`

---

### Parallel Track B — Frontend / UX / Docs
> React/JS only unless noted. No unrelated backend files touched.

- [ ] **B1** Editable transcript step — insert editable textarea between Whisper output and `/extract`; new component + `frontend/src/App.jsx` *(LATER #5)*
- [ ] **B2** PDF download — "Download PDF" button in `frontend/src/components/DemandLetter.jsx` using `jspdf` or `html2canvas` *(LATER #6)*
- [ ] **B3** Spanish UI — i18n all component labels + status text; detect browser language and switch *(LATER #10)*
- [ ] **B4** Lawyer referral CTA — "Connect with a lawyer" call-to-action when disclaimer renders; new component *(LATER: connect)*
- [ ] **B5** Streaming UX — update `frontend/src/App.jsx` to consume SSE so analysis streams word-by-word instead of appearing all at once *(LATER #4 — frontend half)*
- [ ] **B6** Login + "my cases" UI — consent screen + session view; `frontend/src/App.jsx` + new components *(LATER #9 — frontend half)*
- [ ] **B7** Bias/fairness test scenarios — extend `scripts/test_scenarios.py` with multi-language + edge-case demographic prompts; evaluate output consistency
- [ ] **B8** Organize FEATURES.md *(LATER #1)*

#### Availability
- [ ] **B9** Pipeline retry logic — wrap each `fetch` in `App.jsx` with 2-attempt exponential backoff (500ms → 1500ms); show "Retrying…" in the spinner label on attempt 2
- [ ] **B10** Backend offline recovery — poll `/health` every 15s when status is `down`; auto-restore the nav status pill when it comes back online without a page reload

#### Scalability
- [ ] **B11** Audio file size cap — client-side 10 MB check in `VoiceRecorder.jsx` before POST to `/transcribe`; show inline error instead of sending oversized blob
- [ ] **B12** Transcript length cap — cap textarea in `TextInput.jsx` at 5 000 chars with a live character counter; disable submit and show error above threshold
- [ ] **B13** Bundle code-splitting — lazy-load `DemandLetter` and `DOLForm` with `React.lazy` + `Suspense` since they only render at end of pipeline; reduces initial JS parse time

#### Security
- [ ] **B14** Output sanitization — audit all places demand letter text touches the DOM; confirm no `dangerouslySetInnerHTML` path exists; strip HTML tags from letter string before render as a defense-in-depth measure
- [ ] **B15** Content Security Policy — add `<meta http-equiv="Content-Security-Policy">` to `frontend/index.html` restricting scripts to `'self'` + `fonts.googleapis.com`; block inline scripts and `eval`
- [ ] **B16** Clipboard PII warning — after copy in `DemandLetter.jsx` and `DOLForm.jsx`, show a 4s toast: "Copied — this document contains personal details. Store it securely."
- [ ] **B17** HTTP warning banner — on mount in `App.jsx`, detect `window.location.protocol === 'http:'` + not localhost; render a dismissible red banner: "Connection is not secure. Use HTTPS before submitting real information."
- [ ] **B22** Frontend input sanitization — before sending transcript to `/extract`, strip null bytes (` `), non-printable control characters (U+0001–U+001F except `\n\r\t`), and overly-long Unicode sequences from the text string in `App.jsx`; applies to both text input and Whisper-returned transcripts before any API call

#### Backend security (needs Track A work — flagged here for visibility)
- [ ] **B18** *(backend)* Server-side rate limiting — `slowapi` middleware on `/transcribe`, `/analyze`, `/generate-letter`: 10 req/min per IP; return 429 with `Retry-After` header; frontend surfaces this as a user-readable error
- [ ] **B19** *(backend)* Audio size enforcement server-side — reject `Content-Length > 10 MB` in `/transcribe` before passing to Groq; client-side cap (B11) is UX, server-side is the real gate
- [ ] **B20** *(backend)* Prompt injection guardrails — strip null bytes and control characters from transcript string before injecting into any Claude prompt; log (without content) when stripping occurs
- [ ] **B21** *(backend)* CORS hardening — move `allow_origins` to `ALLOWED_ORIGINS` env var (default `localhost:5173`); in production, restrict to the deployed frontend domain only