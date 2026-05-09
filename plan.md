# Wage Theft Watchdog — Claude Code Build Plan

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
