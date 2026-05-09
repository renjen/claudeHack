# CLAUDE.md — Wage Theft Watchdog

> Read this file at the start of EVERY session before doing anything else.
> Then read `INDEX.md` to orient on file registry and routing.

---

## Project Identity

**App:** Wage Theft Watchdog — AI-powered legal triage for workers
**Hackathon:** Claude Hackathon — Track 1: Economic Empowerment & Education
**Team:** Aryan + partner
**Stack:** Vite + React + Tailwind · FastAPI · Claude API · Whisper (Groq, OpenAI fallback) · ChromaDB · OpenAI embeddings · Python

**Pipeline (5 logical stages, 4 endpoints):**
```
/transcribe        → Whisper (Groq)        → text + lang
/extract           → Claude Haiku (JSON)    → structured facts
/analyze           → ChromaDB + Sonnet     → violations + citations
/generate-letter   → Claude Sonnet         → demand letter + DOL pre-fill
```

---

## Session Start Checklist

1. Read `CLAUDE.md` (this file) ✓
2. Read `INDEX.md` — file registry + routing
3. Read `PLAN.md` if mid-build (build plan + reconciliation decisions)
4. Read `DESIGN.md` if making architectural decisions
5. Wait for instruction. Do NOT preemptively load source files.

---

## Folder Map

| Path | Purpose | Write? |
|------|---------|--------|
| `backend/` | FastAPI app, all services | YES |
| `backend/corpus/` | FLSA + state law text files | YES (on request) |
| `frontend/` | Vite + React app | YES |
| `frontend/src/components/` | React components | YES |
| `scripts/` | Reusable bulk operation scripts | YES |
| `PLAN.md` | Build plan + reconciliation decisions | YES |
| `DESIGN.md` | Architectural decisions (ADRs) | YES |
| `FEATURES.md` | Feature status tracker | YES |
| `INDEX.md` | Routing + file registry | YES (keep current) |

---

## Citation Standard (Non-Negotiable)

Every legal claim must be cited with source + section + verbatim text. No paraphrase, no bare assertions.

**Format:**
`[Statute Name, Citation Code, "exact quoted text"]`

**Examples:**
- `[FLSA, 29 U.S.C. § 207(a)(1), "no employer shall employ any employee for a workweek longer than forty hours unless..."]`
- `[CA Labor Code § 510, "Any work in excess of eight hours in one workday..."]`
- `[DOL WHD Fact Sheet #23, Rev. July 2008, "..."]`

**Rules:**
- RAG retrieval MUST return source + section + verbatim, not paraphrase
- Demand letters MUST cite at minimum one federal statute (state if applicable)
- Never state a violation without a supporting citation in the output

---

## Model Strategy (cost-controlled)

| Stage | Model | Why |
|-------|-------|-----|
| `/transcribe` | Groq `whisper-large-v3-turbo` (fallback: OpenAI `whisper-1`) | 10x faster than OpenAI Whisper API |
| `/extract` (NER) | `claude-haiku-4-5` | Structured JSON extraction. ~10x cheaper than Sonnet |
| `/analyze` (RAG + classify) | `claude-sonnet-4-6` + prompt caching | Legal reasoning is the product |
| `/generate-letter` | `claude-sonnet-4-6` + prompt caching | User-facing output quality |

**Never use Opus.** Overkill, expensive, no quality gain on this task.

**Prompt caching mandatory** for `/analyze` and `/generate-letter`. Cache breakpoint: after retrieved law chunks + system prompt, before worker-specific facts. Expected ~90% cost cut on repeat demos.

**Max-token caps (in code, not prompts):**
- `/extract`: 500
- `/analyze`: 1500
- `/generate-letter`: 2000

---

## PII / Privacy Rules

- Voice recordings: process in memory only. NEVER write audio to disk.
- Transcripts: never log to file or external service.
- Employer names: never sent to analytics or telemetry.
- Add `# DO NOT LOG` comment at every boundary function that handles PII.
- Sessions are ephemeral. No DB, no persistence.

---

## Behavioral Rules

- Parallelize all independent operations
- Batch ToolSearch calls — `select:tool1,tool2,...` in one call
- For repetitive ops (5+ API calls OR 3+ file edits same shape): write a Python script to `scripts/`, run once
- Keep responses concise — one-sentence updates, not paragraphs
- Flag context bloat — suggest fresh chat when degraded
- Never add `Co-Authored-By` to git commits
- Squash-style commits OK: "scaffold backend", "wire whisper", "RAG working", "demo polish"
- Push to `main` directly. No branches for this 8-hour build.

---

## Legal Accuracy Rules

- The app gives **legal information**, not **legal advice** — every output must include the disclaimer
- Never state a dollar amount owed without showing the calculation
- Violation detection must cite the law before stating the violation
- When jurisdiction is ambiguous: surface both federal and state options, ask user
- If a fact pattern is ambiguous: ask for clarification, don't assume worst-case
- Immigration status is irrelevant under FLSA. Actively correct any mention of it as employer defense.

---

## Self-Maintenance Rules

- After any new file: add to `INDEX.md` file registry
- After any architectural decision: add ADR to `DESIGN.md`
- After any feature changes status: update `FEATURES.md`
- Keep `CLAUDE.md` under 200 lines — move detail to `INDEX.md` or `DESIGN.md` if it grows

---

## What You Never Do

- Invent legal citations — if a law isn't in corpus, say so
- Assume jurisdiction — always ask or surface both options
- Skip the disclaimer on legal output
- Generate a letter without at least one verified citation
- Persist voice recordings or transcripts to disk
- Read all source files at session start — use INDEX.md routing
- Edit 3+ files one-by-one for the same operation — write a script
- Let DESIGN.md or FEATURES.md go stale after changes
