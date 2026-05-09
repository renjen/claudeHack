# Wage Theft Watchdog — Claude Code Build Plan

> The build plan below (from §"Project overview" onward) is the source of truth for *what to build*.
> The "RECONCILIATION & OPTIMIZATIONS" section below resolves conflicts between this plan and `CLAUDE.md` / `INDEX.md`, plus optimizations to bake in before coding starts.

---

# RECONCILIATION & OPTIMIZATIONS

## A. Conflicts Between PLAN.md ↔ CLAUDE.md / INDEX.md

| # | Topic | PLAN.md says | CLAUDE.md / INDEX.md says | Resolution |
|---|-------|--------------|---------------------------|------------|
| 1 | Folder structure | `wage-theft-watchdog/backend/main.py` (flat) | `src/backend/api/`, `src/backend/ml/`, `src/backend/rag/`, `src/agents/` (nested) | **Keep PLAN.md flat structure.** Faster for an 8-hour build. Nested structure was over-engineered. Update CLAUDE.md + INDEX.md folder map. |
| 2 | Frontend | React + Vite + Tailwind | Next.js | **Use Vite + React + Tailwind.** Lighter, no SSR needed for demo, faster dev server. Update CLAUDE.md stack line. |
| 3 | Whisper | OpenAI `whisper-1` API | unspecified | **Use Groq `whisper-large-v3-turbo`.** $0.04/hr vs OpenAI's $0.006/min ≈ same price, but Groq is ~10x faster (matters for live demo). If Groq key is a problem → fall back to OpenAI Whisper API (PLAN.md original). Never local Whisper on Windows. |
| 4 | Embeddings | OpenAI `text-embedding-3-small` | unspecified | **Stick with `text-embedding-3-small`.** Voyage `voyage-law-2` would be slightly better on legal text but adds another API key for marginal gain. Not worth it. |
| 5 | NER implementation | Claude (single Sonnet for everything) | spaCy NER (in CLAUDE.md stack line) | **Drop spaCy from CLAUDE.md.** PLAN.md is correct — Claude with structured JSON output. Use **Haiku 4.5** here, not Sonnet (cost cut). |
| 6 | Violation classifier | Claude (Sonnet) | "Custom classifier" implied | **Claude Sonnet 4.6 with structured JSON.** PLAN.md is correct. Update CLAUDE.md/INDEX.md to remove "classifier" implying a separate ML model. |
| 7 | LangChain | Not used | Listed in CLAUDE.md stack | **Drop LangChain from CLAUDE.md.** ChromaDB Python client directly. |
| 8 | `docs/citations/` folder | N/A | Exists in INDEX.md | **Drop it.** Merge into `backend/corpus/`. PLAN.md uses `corpus/` directly — simpler. |
| 9 | Build hours | 7 hours | 8 hours | **Use 8 hours** (matches user statement). Add 1 hour buffer at H+7 for demo polish. |
| 10 | Model ID | `claude-sonnet-4-20250514` (outdated) | unspecified | **Use `claude-sonnet-4-6` and `claude-haiku-4-5`** — current model IDs. PLAN.md model ID is stale. |

---

## B. Optimizations to Bake In Before Coding

### B.1 Model tiering (cost cut)
| Stage | Model | Why |
|-------|-------|-----|
| `/transcribe` | Groq Whisper API | 10x faster than OpenAI, similar cost |
| `/extract` (NER) | **Haiku 4.5** | Structured extraction, ~10x cheaper than Sonnet, fast |
| `/analyze` (RAG + classify) | **Sonnet 4.6** + prompt caching | Legal reasoning is the product — quality matters |
| `/generate-letter` | **Sonnet 4.6** | User-facing output — quality matters |

### B.2 Prompt caching (mandatory)
- The retrieved FLSA chunks + system prompt for `/analyze` and `/generate-letter` should be cached
- Cache breakpoint placement: after retrieved law chunks, before the worker's specific facts
- Expected savings: ~90% on repeat demo runs (judges will hammer the same flow)

### B.3 Max-token caps (in code, not prompts)
- `/extract`: `max_tokens=500`
- `/analyze`: `max_tokens=1500`
- `/generate-letter`: `max_tokens=2000`

### B.4 Pipeline stays at 5 separated stages (per user direction)
Each stage = independent FastAPI endpoint with clear input/output contract. Debuggable in isolation. Implementation is simplified (Claude API calls instead of training spaCy/classifiers), but stages stay separate.

```
/transcribe → /extract → /analyze (= RAG + classify in 1 endpoint) → /generate-letter
```

Note: PLAN.md §"FastAPI app" already has `/analyze` doing RAG + classify in one endpoint. That's fine — RAG and classification share the same Claude call (retrieved chunks become context for the classifier). They're logically coupled. Splitting them would mean two Claude calls back-to-back with the same context, which is wasteful.

### B.5 Ethics / PII rules (currently missing from CLAUDE.md)
- Voice recordings: process in memory only, never write to disk
- Transcripts: never log to a file or external service
- Employer names: never sent to analytics or telemetry
- Add explicit `# DO NOT LOG` comments at boundary functions

### B.6 Git policy for hackathon speed
- Squash-style commits OK: `scaffold backend`, `wire whisper`, `RAG working`, `demo polish`
- Don't bikeshed messages
- Push to `main` directly (no branches for an 8-hour solo-pair build)
- Never add `Co-Authored-By` lines

---

## C. Files to Add (currently missing)

| File | Purpose | When |
|------|---------|------|
| `.env.example` | Template for `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY` | H+0 |
| `backend/requirements.txt` | Pinned Python deps | H+0 |
| `frontend/package.json` | Vite + React deps | H+0 |
| `README.md` quickstart | How to run locally | H+7 (last hour) |

---

## D. Files to Update Once Plan Is Approved

| File | Changes |
|------|---------|
| `CLAUDE.md` | Drop LangChain. Drop spaCy. Drop `docs/citations/`. Update stack to Vite+React. Add model tiering rule. Add prompt caching rule. Add PII rule. Add max-token caps. Update folder map to flat structure. |
| `INDEX.md` | Update folder map. Drop nested `src/backend/api/ml/rag/agents/` structure. Update file registry to match PLAN.md flat layout. Add 8-hour milestone timeline. Add status enum reference. Drop "violation classifier" as separate component (it's part of `/analyze`). |
| `DESIGN.md` | Add ADR template. Add ADRs for: stack choices (B.1), prompt caching strategy (B.2), pipeline stage boundaries (B.4), PII handling (B.5). |
| `FEATURES.md` | Add status enum (`planned / in-progress / built / broken`). Pre-populate rows for the 5 stages. |

---

## E. Open Questions for You

1. **Groq API key** — do you have one? If not, fall back to OpenAI Whisper API (PLAN.md original).
2. **Frontend stack** — confirm Vite + React + Tailwind (not Next.js)?
3. **State coverage** — start with FLSA federal only, then add CA + NY + TX state laws if time? Or federal-only for the demo?
4. **Persistence** — confirm: zero persistence, in-memory only, no DB? (recommended for PII reasons)
5. **Demo language pair** — Spanish → English the primary demo? Worth pre-recording a clip in case live mic fails on demo day.

---

## F. Order of Execution Once Approved

1. Update `CLAUDE.md` (changes from §D)
2. Update `INDEX.md` (changes from §D)
3. Add ADR template + first 4 ADRs to `DESIGN.md`
4. Initialize `FEATURES.md` with status enum + pre-populated stage rows
5. Create `.env.example`, `backend/requirements.txt`, `frontend/package.json`
6. Begin H+0 build per existing PLAN.md "Build order" §

---

# ORIGINAL BUILD PLAN (source of truth for what to build)

## Project overview

A voice-first web app that helps workers (especially non-English speakers) identify wage theft violations and generate a formal demand letter + DOL complaint pre-fill — in under 60 seconds.

**Track:** Economic Empowerment & Education  
**Core demo moment:** Worker speaks Spanish → English demand letter citing actual FLSA law appears in ~10 seconds.

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React + Tailwind CSS |
| Voice transcription | OpenAI Whisper API (`whisper-1`) |
| NER / extraction | Claude (`claude-sonnet-4-20250514`) via prompt |
| Vector DB | ChromaDB (local, no signup needed) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Legal reasoning + drafting | Claude (`claude-sonnet-4-20250514`) |
| Backend | Python + FastAPI |
| Package manager | pip + npm |

---

## Project structure

```
wage-theft-watchdog/
├── backend/
│   ├── main.py               # FastAPI app, all API routes
│   ├── whisper_service.py    # Audio → transcript via Whisper API
│   ├── ner_service.py        # Extract structured facts from transcript
│   ├── rag_service.py        # ChromaDB setup + FLSA retrieval
│   ├── classifier.py         # Violation type classification
│   ├── letter_service.py     # Demand letter + DOL form generation
│   ├── corpus/
│   │   └── flsa.txt          # FLSA full text (public domain, download from DOL)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── VoiceRecorder.jsx     # Mic input, recording state
│   │   │   ├── TranscriptViewer.jsx  # Shows transcript + detected language
│   │   │   ├── FactsPanel.jsx        # Extracted facts (employer, hours, pay)
│   │   │   ├── ViolationBadge.jsx    # Violation type + severity
│   │   │   ├── DemandLetter.jsx      # The generated letter, copyable
│   │   │   └── DOLForm.jsx           # Pre-filled complaint form fields
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Backend — step by step

### 1. FastAPI app (`main.py`)

Set up CORS for localhost frontend. Four endpoints:

```
POST /transcribe        → accepts audio blob, returns { transcript, language }
POST /extract           → accepts transcript, returns { employer, hours_worked, pay_rate, pay_period, dates, raw_claims }
POST /analyze           → accepts extracted facts, returns { violation_types, retrieved_laws, severity }
POST /generate-letter   → accepts all above, returns { demand_letter, dol_prefill }
```

### 2. Whisper service (`whisper_service.py`)

- Accept audio as bytes (webm or mp4 from browser MediaRecorder)
- Call `openai.Audio.transcribe("whisper-1", audio_file)`
- Return transcript text + detected language code (e.g. `"es"` for Spanish)
- No language needs to be specified — Whisper auto-detects

### 3. NER extraction (`ner_service.py`)

Use Claude with a structured extraction prompt. Return JSON with these fields:

```json
{
  "employer_name": "string or null",
  "hours_worked_per_week": "number or null",
  "hours_paid_per_week": "number or null",
  "hourly_rate": "number or null",
  "pay_period": "weekly | biweekly | monthly | null",
  "employment_type": "employee | contractor | unknown",
  "dates": ["list of any mentioned dates"],
  "raw_claims": ["direct quotes of the worker's specific complaints"]
}
```

Prompt guidance: tell Claude to extract only what is explicitly stated, use null for anything not mentioned, and never infer or assume.

### 4. RAG setup (`rag_service.py`)

**Corpus prep (run once at startup):**
- Download FLSA full text from: `https://www.dol.gov/agencies/whd/flsa` (public domain)
- Also include a plain-text summary of key sections: §206 (min wage), §207 (overtime), §203 (definitions), §215 (prohibited acts)
- Chunk into ~400 token segments with 50 token overlap
- Embed with `text-embedding-3-small`
- Store in ChromaDB collection named `"flsa_corpus"`

**Query at runtime:**
- Build a query string from extracted facts + claimed violations
- Retrieve top 5 most relevant chunks
- Return chunks as context for the classifier and letter generator

### 5. Violation classifier (`classifier.py`)

Send extracted facts + retrieved law chunks to Claude. Ask it to output a JSON list:

```json
{
  "violations": [
    {
      "type": "overtime_theft | minimum_wage | misclassification | tip_skimming | off_clock_work | pay_stub_fraud",
      "confidence": "high | medium | low",
      "evidence": "one sentence explaining why this applies",
      "relevant_law": "FLSA section reference"
    }
  ],
  "employer_claim_debunked": "string explaining why any employer justification is legally wrong, or null"
}
```

Important: include a system message clarifying that immigration status is irrelevant under FLSA and should never be treated as a valid employer defense.

### 6. Letter + DOL form generation (`letter_service.py`)

**Demand letter prompt:**
- Inputs: worker facts (anonymized if preferred), violation types, law references, retrieved FLSA text
- Output: a formal demand letter with:
  - Date, worker name placeholder, employer name
  - Clear statement of violation(s) with FLSA section citations
  - Calculation of estimated back pay owed
  - Demand for payment within 14 days
  - Note that DOL complaint will be filed if unpaid
  - Plain English, no legalese
  - Disclaimer: "This letter was generated with AI assistance. Consider consulting an employment attorney."

**DOL pre-fill output:**
- Return a JSON object matching fields on the DOL Wage and Hour Division complaint form:
  - Worker name, employer name, employer address (if mentioned)
  - Type of violation
  - Approximate dates
  - Estimated wages owed

---

## Frontend — step by step

### App flow (single page, linear)

```
[Step 1: Record] → [Step 2: Review transcript] → [Step 3: View violations] → [Step 4: Get letter]
```

Show a step indicator at the top. Each step unlocks after the previous completes.

### VoiceRecorder.jsx

- Use `navigator.mediaDevices.getUserMedia({ audio: true })`
- Record with `MediaRecorder` API, collect chunks
- On stop: combine chunks into a Blob, POST to `/transcribe`
- Show recording state: idle / recording (pulsing red dot) / processing
- Add a language indicator once transcript comes back ("Detected: Spanish")

### TranscriptViewer.jsx

- Show the raw transcript text
- If language is not English, show a note: "Transcript detected in [language] — proceeding in English"
- Allow user to edit the transcript before continuing (textarea)
- "Analyze this" button triggers `/extract` then `/analyze`

### FactsPanel.jsx

- Display extracted facts as a clean summary card:
  - Employer, hours worked vs hours paid, pay rate, pay period
  - Any dates mentioned
  - Raw claims in a scrollable list
- Show a "looks wrong? edit above" nudge

### ViolationBadge.jsx

- For each detected violation, show a colored badge + one-line evidence string
- Red = high confidence, amber = medium, gray = low
- Show the FLSA section referenced
- If employer_claim_debunked is present, show it in a highlighted callout box

### DemandLetter.jsx

- Show the letter in a clean, readable card
- "Copy letter" button
- "Download as .txt" button
- Prominent disclaimer at the bottom in muted text

### DOLForm.jsx

- Show pre-filled fields in a read-only form layout
- "Copy for DOL website" button
- Link to the actual DOL complaint page: `https://www.dol.gov/agencies/whd/contact/complaints`

---

## Environment variables needed

```
OPENAI_API_KEY=        # for Whisper + embeddings
ANTHROPIC_API_KEY=     # for Claude NER, classification, letter gen
```

---

## Build order (7-hour sprint)

1. **Hour 0–1** — Scaffold FastAPI + React, get `/transcribe` working end-to-end with Whisper. Test with a Spanish voice clip.
2. **Hour 1–2.5** — Build NER extraction (`/extract`). Test with 3–4 realistic worker story transcripts.
3. **Hour 2.5–4** — Set up ChromaDB, chunk + embed FLSA corpus, build `/analyze` with RAG + violation classifier.
4. **Hour 4–6** — Build `/generate-letter`, wire up demand letter + DOL pre-fill output.
5. **Hour 6–7** — Connect all frontend components, clean up UI, run full Spanish → letter demo end-to-end, fix any bugs.

---

## What to cut if running out of time

- DOL form pre-fill → just show the demand letter
- Multi-violation detection → just detect the most likely single violation
- Editable transcript → make it read-only
- Download button → copy-to-clipboard only
- ChromaDB → hardcode the 5 most relevant FLSA chunks as context (lossy but works for demo)

---

## Demo script (2 minutes)

1. Open the app, hit record
2. Speak (or play a pre-recorded clip): *"I work 10 hours a day, 6 days a week, but my boss only pays me for 8 hours each day. He says overtime doesn't apply to immigrants."*
3. Show transcript appearing, language detected as English (or use a Spanish clip for max impact)
4. Show extracted facts panel — hours, pay discrepancy highlighted
5. Show violation badge: **Overtime theft — FLSA §207** + debunking of the immigration claim
6. Show the demand letter with actual FLSA citation and back pay calculation
7. Show DOL pre-fill ready to paste

**Talking points for judges:**
- Whisper + NER + RAG + Claude = a real ML pipeline, not just an API call
- FLSA corpus is public domain — this is grounded in actual law
- Immigration status is irrelevant under federal law — the tool actively corrects this misconception
- 50% of minimum wage violations happen to immigrant workers (cite DOL stats)
- No app, no literacy required — voice-first means a flip phone can use this

---

## Ethical considerations to address proactively

- **Not legal advice:** Disclaimer on every output. Prompt to consult an attorney.
- **Retaliation protections:** Surface FLSA anti-retaliation info (§215) alongside any output.
- **Data privacy:** Don't persist voice recordings. Process in memory, discard after session.
- **Accuracy:** Include a "review before sending" step — user must read the letter before downloading.
- **Language accuracy:** Whisper is strong but not perfect. Show the transcript so the worker can catch errors.
