# CLAUDE.md — Wage Theft Watchdog

> Read this file at the start of EVERY session before doing anything else.
> Then read `INDEX.md` to orient on the current build state.

---

## Project Identity

**App:** Wage Theft Watchdog — AI-powered legal triage for workers
**Hackathon:** Claude Hackathon — Track 1: Economic Empowerment & Education
**Team:** Aryan + partner
**Stack:** Next.js · FastAPI · Claude API · Whisper · spaCy NER · LangChain RAG · ChromaDB · Python

**Core ML Pipeline:**
```
Voice/Text → Whisper (transcription + lang ID)
  → NER (employer, hours, wages, dates, location)
  → RAG (FLSA + state law corpus retrieval)
  → Violation Classifier
  → Claude (legal reasoning + document generation)
  → Output: demand letter · DOL complaint · action plan
```

---

## Session Start Checklist

1. Read `CLAUDE.md` (this file) ✓
2. Read `INDEX.md` — orient on file registry, routing table, current build state
3. Read `DESIGN.md` if making architectural decisions
4. Wait for instruction. Do NOT preemptively load source files.

---

## Folder Map

| Path | Purpose | Write? |
|------|---------|--------|
| `src/frontend/` | Next.js app | YES |
| `src/backend/api/` | FastAPI routes | YES |
| `src/backend/ml/` | Whisper, NER, classifier | YES |
| `src/backend/rag/` | Vector store, embeddings, retrieval | YES |
| `src/agents/` | Claude agent definitions, prompts | YES |
| `docs/legal/` | FLSA, state law corpus files | YES (on request) |
| `docs/citations/` | Citation templates and source registry | YES |
| `scripts/` | Reusable bulk operation scripts | YES |
| `DESIGN.md` | Every design decision + rationale | YES |
| `FEATURES.md` | Every feature, status, related files | YES |
| `INDEX.md` | Routing table + file registry | YES (keep current) |

---

## Citation Standard (Non-Negotiable)

Every legal claim made by the app or by Claude during dev must be cited. No bare assertions.

**Format:**
```
[Statute Name, Citation Code, "exact quoted text if applicable"]
```

**Examples:**
- Federal: `[FLSA, 29 U.S.C. § 207(a)(1), "no employer shall employ any employee for a workweek longer than forty hours unless such employee receives compensation..."]`
- State: `[CA Labor Code § 510, "Any work in excess of eight hours in one workday..."]`
- DOL Guidance: `[DOL WHD Fact Sheet #23, Rev. July 2008, "The FLSA requires that covered, nonexempt employees receive overtime pay..."]`
- Case law: `[IBP, Inc. v. Alvarez, 546 U.S. 21 (2005)]`

**Rules:**
- RAG retrieval must return source + section + verbatim excerpt, not paraphrase
- Demand letters must cite at minimum: one federal statute + one state statute (if applicable)
- Never state a violation type without a supporting citation in the output

---

## Behavioral Rules

- Parallelize all independent operations
- Batch ToolSearch calls — `select:tool1,tool2,...` in one call
- For repetitive ops (5+ API calls OR 3+ file edits same shape): write a Python script to `scripts/`, run once
- Keep responses concise. One sentence updates, not paragraphs
- Flag context bloat — suggest fresh chat when context degrades
- Never add `Co-Authored-By` to git commits
- Scripts stay in `scripts/` — don't delete after one use

---

## Legal Accuracy Rules

- The app gives **legal information**, not **legal advice** — every output must include the disclaimer
- Never state a dollar amount owed without showing the calculation
- Violation detection must cite the law before stating the violation
- When jurisdiction is ambiguous: surface both federal and state options, let the user clarify
- If a fact pattern is ambiguous: ask for clarification rather than assuming worst-case

---

## Self-Maintenance Rules

- After any new file is created: add it to `INDEX.md` file registry
- After any architectural decision: add it to `DESIGN.md`
- After any feature reaches "built" status: update `FEATURES.md`
- If `INDEX.md` routing table becomes stale: update it immediately, not later
- Keep `CLAUDE.md` under 150 lines — move detail to `INDEX.md` if it grows

---

## What You Never Do

- Invent legal citations — if a law can't be retrieved from the corpus, say so
- Make jurisdiction assumptions — always ask or surface both options
- Skip the disclaimer on any legal output
- Generate a demand letter without at least one verified citation
- Batch ingest legal documents without being asked
- Read all source files at session start — use INDEX.md routing
- Edit more than 3 files one-by-one for the same operation — write a script
- Let DESIGN.md or FEATURES.md go stale after changes
