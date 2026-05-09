# TEST.md — Testing Guide

> How to verify each module, endpoint, and the full pipeline.
> Update when adding a new feature: append its test method here.

---

## Test Categories

| Category | When to run |
|----------|-------------|
| **Smoke** — endpoint returns 200 with expected shape | After any backend change |
| **Unit** — one function/module in isolation | When refactoring a service |
| **Integration** — full pipeline end-to-end | Before demo, after wiring components |
| **Manual UX** — browser audio, visual flow | After frontend changes |
| **Demo** — pre-recorded scenarios | Before demo |
| **PII** — assert no PII on disk or in logs | Before any commit |
| **Cost / caching** — verify prompt caching is hitting | After Sonnet endpoint changes |

---

## Setup

```bash
# Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install

# Env
copy .env.example .env
# fill in ANTHROPIC_API_KEY, GROQ_API_KEY, OPENAI_API_KEY

# Run (in separate terminals)
uvicorn backend.main:app --reload --port 8000
cd frontend && npm run dev          # opens http://localhost:5173
```

---

## Smoke Tests

### Backend health
```bash
curl http://localhost:8000/health
# Expected: {"ok":true}
```

### Frontend up
- Open `http://localhost:5173`
- Expected: header visible
- Expected: "Backend: ok" status (proves CORS + connectivity)

---

## Per-Module Tests

### `backend/whisper_service.py` — `transcribe_audio`

**Setup:** put a 3–5s WAV file at `tests/fixtures/sample_en.wav`

**Test:**
```bash
python -c "
import os; from dotenv import load_dotenv; load_dotenv()
from backend.whisper_service import transcribe_audio
with open('tests/fixtures/sample_en.wav','rb') as f:
    print(transcribe_audio(f.read(), 'audio/wav'))
"
```

**Pass criteria:**
- Returns dict with `transcript`, `language`, `duration_sec`
- `transcript` is non-empty
- `language` matches the clip
- After call, `tempfile.gettempdir()` has no new audio files

---

### `backend/ner_service.py` — `extract_facts`

**Test:**
```bash
python -c "
import os; from dotenv import load_dotenv; load_dotenv()
from backend.ner_service import extract_facts
print(extract_facts('I work 60 hours per week, but my boss only pays me for 40 hours. My boss is John at Acme Pizza in Los Angeles.'))
"
```

**Pass criteria:**
- Returns dict matching `PLAN.md` §3 schema
- `employer_name == "Acme Pizza"`
- `hours_worked_per_week == 60`
- `hours_paid_per_week == 40`
- `raw_claims` contains a verbatim quote

**Negative case:** input "my boss is mean to me" → all extractable fields are `null`, no hallucinated values, `raw_claims` has the quote.

---

### `backend/rag_service.py` — `init_corpus` + `retrieve`

**Test:**
```bash
python -c "
from backend.rag_service import init_corpus, retrieve
init_corpus()
for q in ['overtime','minimum wage','tips','misclassification']:
    chunks = retrieve(q, k=3)
    print(q, '->', chunks[0]['section'])
"
```

**Pass criteria:**
- After `init_corpus()`, collection has ≥50 chunks
- `retrieve("overtime")` top result `section` contains "§ 207"
- `retrieve("minimum wage")` top result `section` contains "§ 206"
- `retrieve("tips")` top result `section` contains "§ 203"
- Every returned chunk has `{source, section, text}` — text is verbatim

---

### `backend/classifier.py` — `classify_violations`

**Test:**
```bash
python -c "
import os; from dotenv import load_dotenv; load_dotenv()
from backend.rag_service import init_corpus, retrieve
from backend.classifier import classify_violations
init_corpus()
facts = {'employer_name':'Acme','hours_worked_per_week':60,'hours_paid_per_week':40,'hourly_rate':15,'pay_period':'weekly','employment_type':'employee'}
chunks = retrieve('overtime not paid hourly', k=5)
print(classify_violations(facts, chunks))
"
```

**Pass criteria:**
- Returns dict with `violations[]`
- `violations[0].type == "overtime_theft"`
- `violations[0].relevant_law` contains "207"
- `violations[0].evidence` is non-empty
- Run twice within 5 min → second response usage shows `cache_read_input_tokens > 0`

---

### `backend/letter_service.py` — `generate_letter`

**Test:** wire `facts` + `violations` from above into `generate_letter()`.

**Pass criteria:**
- Returns `{"demand_letter": str, "dol_prefill": dict}`
- `demand_letter` contains: employer name, "FLSA", a "$" amount, "not legal advice"
- `dol_prefill` keys ≥: `worker_name`, `employer_name`, `violation_type`, `dates`, `estimated_owed`

---

## Endpoint Smoke Tests

```bash
# /transcribe
curl -X POST -F "file=@tests/fixtures/sample_en.wav" http://localhost:8000/transcribe

# /extract
curl -X POST -H "Content-Type: application/json" \
  -d "{\"transcript\":\"I work 60 hours, paid for 40, boss is John at Acme\"}" \
  http://localhost:8000/extract

# /analyze
curl -X POST -H "Content-Type: application/json" \
  -d "{\"facts\":{...}}" \
  http://localhost:8000/analyze

# /generate-letter
curl -X POST -H "Content-Type: application/json" \
  -d "{\"facts\":{...},\"violations\":{...}}" \
  http://localhost:8000/generate-letter
```

Each must return 200 with a body matching its declared schema (see `PLAN.md` §3).

---

## Browser / Manual UX Tests

### Voice recording flow
1. Open `http://localhost:5173`
2. Click record → grant mic permission
3. Speak: "I work 60 hours per week but my boss only pays me for 40 hours"
4. Click stop
5. In order, expect:
   - Transcript appears (≤3s)
   - Facts panel populates (≤3s)
   - Violation badge shows
   - Demand letter renders
   - DOL pre-fill renders

### Edge cases
- Deny mic permission → friendly error, no crash
- Stop recording immediately (silence) → "no speech detected" message
- Switch tabs mid-recording → recording continues OR stops cleanly (no zombie stream)
- Backend down → friendly error banner

### Copy buttons
- "Copy letter" → paste shows the letter text
- "Copy DOL" → paste shows the form fields

---

## Demo Scenarios (run all 5 before demo)

Place clips in `tests/fixtures/`:

| File | Language | Expected violation | Expected citation |
|------|----------|-------------------|-------------------|
| `demo_es_overtime.wav` | Spanish | overtime_theft + employer_claim_debunked (immigration) | FLSA § 207 |
| `demo_en_tips.wav` | English | tip_theft | FLSA § 203(m) |
| `demo_en_1099.wav` | English | misclassification | FLSA § 203(e) |
| `demo_en_minwage.wav` | English | minimum_wage | FLSA § 206 |
| `demo_en_offclock.wav` | English | off_clock_work | FLSA § 254 |

Run each through the live UI. All 5 must produce the expected violation + citation visible to the user.

---

## PII Tests (run before every commit)

```bash
# 1. After running a full pipeline, check for any audio files left on disk
python -c "import os, tempfile; t=tempfile.gettempdir(); print([f for f in os.listdir(t) if f.endswith(('.wav','.webm','.mp3','.m4a'))])"
# Expected: []
```

```bash
# 2. Search backend logs for transcript content
findstr /S /I "boss employer hours" backend\*.log 2>nul
# Expected: no matches (or no log files)
```

```bash
# 3. Search source for any logger/print calls that could include PII
findstr /S /N /R "logger\.\|logging\.\|print(" backend\*.py | findstr /I "transcript employer audio_bytes facts"
# Expected: no matches (errors-only logging is fine, never PII)
```

---

## Cost / Caching Tests

After implementing `/analyze` and `/generate-letter`:

```bash
python -c "
import os; from dotenv import load_dotenv; load_dotenv()
from backend.rag_service import init_corpus, retrieve
from backend.classifier import classify_violations
init_corpus()
facts = {'employer_name':'Acme','hours_worked_per_week':60,'hours_paid_per_week':40,'hourly_rate':15,'pay_period':'weekly','employment_type':'employee'}
chunks = retrieve('overtime', k=5)
r1 = classify_violations(facts, chunks)
r2 = classify_violations(facts, chunks)
print('Run 1 usage:', r1.get('_usage'))
print('Run 2 usage:', r2.get('_usage'))
"
```

**Pass criteria:**
- Run 1: `cache_creation_input_tokens > 0` (cache was written)
- Run 2: `cache_read_input_tokens > 0`, `cache_creation_input_tokens == 0` (cache was hit)

If Run 2 shows `cache_creation_input_tokens > 0` instead of `cache_read_input_tokens`, the cache breakpoint is in the wrong place — see `DESIGN.md` ADR-004.

---

## Adding a New Test

When adding a new feature:
1. Add a row to `FEATURES.md`
2. Add a verification step to its `TODO.md` task
3. Add a section here (Per-Module or Demo Scenarios) with a runnable command + pass criteria

When fixing a bug:
1. Add a regression case to "Demo Scenarios" if it's reproducible
2. Fix the bug
3. Re-run all demos
