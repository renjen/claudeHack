# Demo Script — Wage Theft Watchdog

**Target time:** under 2:00  
**Presenter:** Aryan + Renee  
**Setup:** Backend running on :8000, frontend on :5173/:5174, browser open to app

---

## Pre-flight (before judges arrive)

- [ ] `backend/.venv/bin/uvicorn backend.main:app --port 8000` running from project root (no error logs)
- [ ] `npm run dev` running, browser open to app
- [ ] Backend status badge shows **green "backend ok"**
- [ ] Have `tests/fixtures/demo_es_overtime.mp3` ready as fallback
- [ ] Mic tested — browser has permission granted

---

## Script (~2:30–3:00)

> **Note:** The full pipeline (extract → analyze → generate-letter) takes ~30–60s depending on Sonnet latency. Budget 3 minutes, not 2. Fill pipeline wait time with narration — it looks like confidence, not dead air.

---

### [0:00 – 0:20] The problem (talking)

> "Wage theft is the most common form of theft in the US — over $50 billion stolen from workers annually. Most workers don't know their rights, can't afford a lawyer, and don't know how to file a complaint. We built Wage Theft Watchdog to change that."

### [0:20 – 0:40] Voice demo — speak into mic

Click **Voice** tab. Start recording. Say:

> *"I work at Taco Palace. I work 12 hours a day, 6 days a week, but my boss only pays me for 8 hours each day. He says I'm lucky to have a job and that if I complain he'll call immigration."*

Stop recording. Let Whisper transcribe (~3s).

**Point out:** "Transcribed in Spanish or English — any language. Never stored."

### [0:40 – 1:40] Pipeline runs — narrate while it processes

Point to the step bar. While each step is in progress, fill time with narration:

**While "Extracting Facts" spins (~5s):**
> "First, Claude Haiku pulls structured facts out of the statement — employer name, hours worked, hours paid, any direct claims."

**Facts panel appears → point at it:**
> "There it is — 72 hours worked, 48 paid, $15/hr. The discrepancy is already quantified."

**While "Analyzing Violations" spins (~15–30s):**
> "Now Claude Sonnet searches our FLSA corpus — 146 chunks of federal law embedded in ChromaDB — and reasons about which violations apply and at what severity."

**Violations appear → point at them:**
> "Overtime theft, high severity, FLSA § 207. And notice — real verbatim law text, retrieved, not hallucinated. The immigration threat is flagged and debunked right here."

**While "Drafting Letter" spins (~15–30s):**
> "Finally, Sonnet drafts the demand letter using those citations and the worker's specific facts."

### [1:40 – 2:00] Demand letter + DOL form

Scroll to demand letter:
> "Ready-to-send. Employer name, dollar amount with calculation, FLSA citation, legal disclaimer — all in."

Scroll to DOL form:
> "And the DOL complaint is pre-filled. One click to the filing page."

Click **File Complaint with DOL** — show it navigates to dol.gov.

### [2:00 – 2:20] Tech + impact

> "Three API providers, under 100 lines of pipeline logic, prompt caching on both Sonnet calls for cost efficiency. Works in any language Whisper supports. Free for the worker. Seconds to generate."

### [2:20 – 2:35] Close

> "Wage theft is a solvable problem. Workers have rights — they just need a tool that tells them what those rights are and helps them act. That's Wage Theft Watchdog."

---

## Fallback — if mic fails

Use the **Type** tab instead. Paste:

```
I work at Taco Palace. I work 60 hours a week but only get paid for 40. 
My wage is $15/hr and I never get overtime pay.
```

Click **Analyze →**. Rest of demo proceeds identically.

---

## Edge case to mention (if asked)

Q: *What if there's no employer name?*  
A: "Clarifications needed" section surfaces. App asks rather than assumes.

Q: *What about state law?*  
A: FLSA federal coverage is built in. State law corpus (CA, NY, TX) is on our roadmap.

Q: *Is this legal advice?*  
A: The disclaimer at the bottom is mandatory: legal information, not legal advice. We surface rights and connect to DOL — a lawyer handles the rest.
