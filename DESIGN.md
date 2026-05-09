# DESIGN.md — Architectural Decisions

> Every non-obvious design decision lives here as an ADR (Architecture Decision Record).
> Add an ADR before writing code that depends on the decision. Update if reversed.

---

## ADR Template

```
### ADR-NNN — [Decision title]
**Date:** YYYY-MM-DD | **Status:** proposed | accepted | superseded by ADR-XXX

**Context:**
What constraint or need triggered this decision?

**Decision:**
What we're doing.

**Why:**
Trade-off rationale.

**Consequences:**
What this enables and what it costs.

**Revisit if:**
Specific condition that would change the answer.
```

---

## Decision Log

### ADR-001 — Stack Choices
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
8-hour hackathon build. Need fast iteration, minimal setup friction, defensible component choices.

**Decision:**
- Frontend: Vite + React + Tailwind (not Next.js)
- Backend: FastAPI (Python)
- Vector DB: ChromaDB (local, in-process)
- Embeddings: OpenAI `text-embedding-3-small`
- LLM: Claude (Haiku 4.5 + Sonnet 4.6)
- Whisper: Groq `whisper-large-v3-turbo` (fallback: OpenAI `whisper-1`)

**Why:**
- Vite over Next.js: no SSR needed, faster dev server, smaller scope
- ChromaDB over Pinecone: zero signup, in-process, no network latency
- OpenAI embeddings over Voyage `voyage-law-2`: marginal quality gain not worth another API key
- Groq Whisper over OpenAI Whisper API: ~10x faster (matters for live demo), similar cost
- Never local Whisper: PyTorch install on Windows + slow CPU inference = demo-day risk

**Consequences:**
- 3 API keys total (Anthropic, OpenAI, Groq)
- ChromaDB doesn't persist by default — `PersistentClient` needed if survival across restarts is required (not for demo)

**Revisit if:**
- Need persistence → switch to ChromaDB `PersistentClient` or SQLite
- Groq is unreachable on demo day → fall back to OpenAI Whisper (already in `.env.example`)

---

### ADR-002 — Pipeline Stage Boundaries
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
Tradeoff: collapsing stages saves API calls, but harder to debug. User explicitly wanted separated stages for debuggability.

**Decision:**
5 logical stages mapped to 4 FastAPI endpoints:
1. `/transcribe` — audio → text
2. `/extract` — text → structured facts (Claude Haiku)
3. `/analyze` — facts + RAG retrieval + violation classification (one Sonnet call, prompt-cached)
4. `/generate-letter` — facts + violations → demand letter + DOL pre-fill (Sonnet, prompt-cached)

**Why:**
RAG retrieval and violation classification share the same context (retrieved law chunks). Splitting them into two endpoints would duplicate the chunks across two Claude calls — wasteful with no debuggability gain. They stay in one endpoint with a clear internal boundary: `rag_service.retrieve()` → `classifier.classify()`.

**Consequences:**
- Each endpoint testable in isolation with stubbed inputs
- Failure modes localized to one endpoint
- Internal RAG-vs-classify boundary in `/analyze` is logged for debugging

**Revisit if:**
- We need different retrieval strategies per violation type (would split into 2 endpoints)

---

### ADR-003 — Model Tiering
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
Need to balance cost and quality. Hackathon budget matters. Demo will be hammered repeatedly by judges.

**Decision:**
- `/extract`: Claude Haiku 4.5 (`claude-haiku-4-5`)
- `/analyze`: Claude Sonnet 4.6 (`claude-sonnet-4-6`) with prompt caching
- `/generate-letter`: Claude Sonnet 4.6 with prompt caching
- Never Opus

**Why:**
NER extraction is structured-JSON extraction with a fixed schema — Haiku handles this trivially. Legal reasoning + letter writing are the product differentiators — Sonnet quality matters.

**Consequences:**
- ~10x cost cut on `/extract` vs all-Sonnet
- Two model IDs to maintain (acceptable)

**Revisit if:**
- Haiku NER accuracy drops below acceptable on demo inputs → upgrade `/extract` to Sonnet

---

### ADR-004 — Prompt Caching Strategy
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
Demo will be re-run many times by judges with similar inputs. Each run sends the same FLSA chunks + system prompt to Sonnet. Without caching, this is pure waste.

**Decision:**
Use Anthropic prompt caching on `/analyze` and `/generate-letter`. Cache breakpoint placement:
- **Cached:** system prompt + retrieved law chunks (the heavy stable context)
- **Uncached:** worker-specific facts (the variable input)

Implementation: add `cache_control: {"type": "ephemeral"}` to the appropriate content block in the messages array.

**Why:**
Cache TTL is 5 minutes; demo runs are seconds-to-minutes apart. Cached portion (~2-4k tokens of legal context) gets ~90% cost reduction on cache hits.

**Consequences:**
- Slight code complexity in `classifier.py` and `letter_service.py`
- Need to validate cache hits during dev (log usage stats)

**Revisit if:**
- Demo runs >5 min apart consistently → cache misses negate the win (unlikely)

---

### ADR-005 — PII Handling
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
Workers describing wage theft give employer names, sometimes their own. Persistent storage = liability + ethical issue.

**Decision:**
- Zero persistence. No DB. No file logs of transcripts/audio.
- All processing in-memory. Audio blob discarded after `/transcribe` returns.
- Transcript and facts held only in browser session state.
- Backend is stateless — no per-user data retained between requests.
- `# DO NOT LOG` comment at every PII boundary function.

**Why:**
Removes legal/ethical risk surface. Worker confidence in tool. Simpler reasoning for a demo.

**Consequences:**
- No "my cases" view
- No ability to audit historical analyses
- Page refresh = data loss (acceptable for demo)

**Revisit if:**
- Production: would need encrypted DB + retention policy + user consent UI (out of scope)

---

### ADR-006 — In-Memory Audio Pipeline
**Date:** 2026-05-09 | **Status:** accepted

**Context:**
ADR-005 mandates no audio touches disk. This ADR specifies *how*, end to end, so implementation doesn't accidentally introduce a temp file or log line that violates the rule.

**Decision:**
Audio flows from browser RAM → HTTP body → backend RAM → Groq API → discarded. No filesystem step at any point.

**Browser side:**
```js
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream);
const chunks = [];
recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  await fetch('/transcribe', { method: 'POST', body: formData });
  stream.getTracks().forEach(t => t.stop());  // release mic
  // blob + chunks go out of scope → JS garbage collector reclaims them
};
recorder.start();
```

**Backend side (FastAPI):**
```python
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # DO NOT LOG: file content
    audio_bytes = await file.read()                   # bytes in RAM
    content_type = file.content_type or "audio/webm"
    return whisper_service.transcribe_audio(audio_bytes, content_type)
    # audio_bytes goes out of scope at return → Python GC reclaims it
```

**Whisper service:**
```python
def transcribe_audio(audio_bytes: bytes, content_type: str) -> dict:
    # DO NOT LOG: audio_bytes, transcript
    response = groq_client.audio.transcriptions.create(
        file=("audio.webm", audio_bytes, content_type),  # in-memory tuple
        model="whisper-large-v3-turbo",
        response_format="verbose_json",
    )
    return {
        "transcript": response.text,
        "language": response.language,
        "duration_sec": response.duration,
    }
```

**Why:**
- `UploadFile.read()` returns `bytes` directly — no temp file is created (FastAPI uses SpooledTemporaryFile internally with a high RAM threshold; for typical voice clips ≤1MB this stays in RAM)
- Groq's Python SDK accepts a `(filename, bytes, content_type)` tuple — no on-disk file required
- `bytes` is a Python primitive: when the variable goes out of scope at function return, it's eligible for garbage collection. No explicit cleanup needed.
- Browser `MediaStream.getTracks().forEach(t => t.stop())` releases the mic and lets the browser drop the underlying buffer.

**Forbidden patterns:**
- `tempfile.NamedTemporaryFile()` — writes to disk
- `aiofiles.open(...).write(audio_bytes)` — writes to disk
- `open("audio.webm", "wb").write(...)` — writes to disk
- `await file.save(...)` — writes to disk
- `logger.info(audio_bytes)` or any log including transcript or employer name

**Verification (in TEST.md):**
- After a `/transcribe` call, assert `os.listdir(tempfile.gettempdir())` has no new audio files
- Assert backend logs contain no transcript text or employer names

**Consequences:**
- For audio >large_threshold (FastAPI default ~1MB), SpooledTemporaryFile may roll over to disk. For demo voice clips this is irrelevant. If we need long recordings, we'd configure the spool threshold higher or stream-process.

**Revisit if:**
- Voice clips routinely exceed ~30 seconds (raise SpooledTemporaryFile threshold or stream)
- We need to retry Groq calls (would need to hold bytes longer, but still in RAM)
