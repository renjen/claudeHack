# INDEX.md — Wage Theft Watchdog

**Last updated:** 2026-05-09 | **Status:** Pre-build (scaffold phase)

---

## Routing Table

Read this before every task. Load ONLY files listed for your task type.

| Task | Read First | Then Read | Skip | Write To |
|------|-----------|-----------|------|----------|
| **Frontend feature** | `FEATURES.md` | relevant `src/frontend/` files | backend, ml, rag | `src/frontend/`, `FEATURES.md` |
| **Backend API route** | `FEATURES.md` | `src/backend/api/` | frontend, rag internals | `src/backend/api/`, `FEATURES.md` |
| **ML component** (Whisper/NER/classifier) | `DESIGN.md` | `src/backend/ml/` | frontend, unrelated backend | `src/backend/ml/`, `DESIGN.md` |
| **RAG / retrieval** | `DESIGN.md` | `src/backend/rag/`, `docs/legal/` | frontend, classifier | `src/backend/rag/`, `DESIGN.md` |
| **Claude agent / prompt** | `src/agents/` | `DESIGN.md` | ml internals, frontend | `src/agents/`, `DESIGN.md` |
| **Legal corpus update** | `docs/citations/` | `docs/legal/` | src files | `docs/legal/`, `docs/citations/` |
| **Architectural decision** | `DESIGN.md` | relevant component files (max 3) | legal docs, scripts | `DESIGN.md` |
| **Bug fix** | file with the bug | files it imports (max 2) | unrelated components | the broken file only |
| **Bulk/script op** | `scripts/` (if similar script exists) | file it operates on | everything else | `scripts/`, target files |
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
| `DESIGN.md` | All architectural decisions + rationale |
| `FEATURES.md` | All features, status, related files |

### Frontend (`src/frontend/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | Next.js app — intake form, results view, multilingual UI |

### Backend API (`src/backend/api/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | FastAPI routes: `/analyze`, `/generate-letter`, `/file-complaint` |

### ML Components (`src/backend/ml/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | `whisper_transcribe.py` — audio → text + language ID |
| *(scaffold pending)* | `ner_extract.py` — extract employer, hours, wages, dates, location |
| *(scaffold pending)* | `violation_classify.py` — classify violation type from facts |

### RAG (`src/backend/rag/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | `embed_corpus.py` — embed FLSA + state law docs into ChromaDB |
| *(scaffold pending)* | `retrieve.py` — semantic retrieval with source + section + verbatim |
| *(scaffold pending)* | `chroma_store/` — vector DB (gitignored after size threshold) |

### Agents (`src/agents/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | `legal_analyst.py` — Claude agent: violation detection + citation |
| *(scaffold pending)* | `letter_writer.py` — Claude agent: demand letter generation |
| *(scaffold pending)* | `complaint_guide.py` — Claude agent: DOL/state filing walkthrough |

### Legal Corpus (`docs/legal/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | `flsa.md` — FLSA full text (29 U.S.C. §§ 201–219) |
| *(scaffold pending)* | `dol_fact_sheets/` — WHD Fact Sheets #1, #14, #17, #22, #23 |
| *(scaffold pending)* | `state_laws/` — per-state labor code excerpts |

### Scripts (`scripts/`)
| File | Purpose |
|------|---------|
| *(scaffold pending)* | `ingest_legal_corpus.py` — bulk embed legal docs into ChromaDB |
| *(scaffold pending)* | `test_ner_pipeline.py` — batch test NER extraction |

---

## Component Dependency Map

```
User Input (voice/text/any language)
  └─ Whisper (ml/whisper_transcribe.py)
       └─ NER Extraction (ml/ner_extract.py)
            └─ RAG Retrieval (rag/retrieve.py) ← ChromaDB ← Legal Corpus
                 └─ Violation Classifier (ml/violation_classify.py)
                      └─ Claude Legal Analyst (agents/legal_analyst.py)
                           ├─ Demand Letter (agents/letter_writer.py)
                           └─ Complaint Guide (agents/complaint_guide.py)
```

---

## Violation Type Taxonomy

| Type | Federal Basis | Common Aliases |
|------|--------------|----------------|
| Overtime theft | FLSA § 207 | unpaid OT, time shaving |
| Minimum wage violation | FLSA § 206 | underpayment |
| Tip theft / tip credit abuse | FLSA § 203(m) | tip skimming, tip pooling violation |
| Employee misclassification | FLSA § 203(e) | 1099 abuse, fake contractor |
| Illegal deductions | FLSA § 206 / state laws | paycheck deductions, uniform costs |
| Off-the-clock work | FLSA § 254 | unpaid prep time, travel time |
| Retaliation | FLSA § 215(a)(3) | fired for complaining |
| Child labor | FLSA §§ 212, 213 | minor work hour violations |

---

## Key External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| DOL WHD | `dol.gov/agencies/whd` | Complaint filing, fact sheets |
| FLSA Text | `law.cornell.edu/uscode/text/29/chapter-8` | Primary statute |
| Grants.gov (if pivot needed) | `grants.gov/web/grants/search-grants.html` | N/A for this project |
| Whisper API | OpenAI / local `whisper` lib | Audio transcription |
| ChromaDB | `docs.trychroma.com` | Vector store |
