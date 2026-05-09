"""FastAPI app entry point."""
from dotenv import load_dotenv
load_dotenv()

import os
import re
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.whisper_service import transcribe_audio
from backend.ner_service import extract_facts
from backend.rag_service import init_corpus, retrieve
from backend.classifier import classify_violations
from backend.letter_service import generate_letter

# A10: Optional Sentry — only activates if SENTRY_DSN is set
_sentry_dsn = os.environ.get("SENTRY_DSN")
if _sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=0.1,
        # A10: Never send PII — scrub request/response bodies
        before_send=lambda event, hint: {
            **event,
            "request": {k: v for k, v in event.get("request", {}).items() if k not in ("data", "body")},
        },
    )

# B18: Rate limiter — 10 req/min per IP on expensive endpoints
limiter = Limiter(key_func=get_remote_address)

# B21: CORS — default to localhost only; override with ALLOWED_ORIGINS env var in production
_allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"
).split(",")

# B19: Server-side audio size gate (client-side cap in VoiceRecorder.jsx is UX only)
_MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB

# A2: Keyword boosters for weak semantic retrieval
# Colloquial terms often miss dense legal text — these queries surface the right sections
_CLAIM_BOOSTERS = {
    ("tip", "gratuity", "tipping"):
        "tips gratuities employer shall not keep employee tip credit section 203",
    ("minimum wage", "underpay", "below minimum", "$5", "$6"):
        "minimum wage rate employer shall pay section 206 seven dollars",
    ("retaliat", "fired for complaining", "threat", "immigration threat"):
        "discharge discriminate employee filed complaint investigation section 215",
    ("off the clock", "before clocking", "after clocking", "unpaid prep"):
        "hours worked compensable time portal to portal section 254",
    ("fmla", "maternity", "paternity", "family leave", "medical leave"):
        "leave workweeks eligible employee serious health condition section 2612",
    ("warn", "layoff notice", "plant closing", "mass layoff"):
        "plant closing mass layoff sixty day notice section 2102",
}


# B20: Strip null bytes and C0 control chars from transcript before any Claude prompt.
# Preserves \t, \n, \r. Logs (without content) when stripping occurs.
def _sanitize_transcript(text: str) -> str:
    if not isinstance(text, str):
        return text
    cleaned = text.replace("\x00", "")
    cleaned = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f]", "", cleaned)
    if cleaned != text:
        print("[sanitize] stripped control characters from transcript")
    return cleaned


@asynccontextmanager
async def lifespan(app):
    init_corpus()
    yield

app = FastAPI(title="Wage Theft Watchdog", lifespan=lifespan)

# B18: Wire rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# B21: Hardened CORS — env-configurable, not wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


# DO NOT LOG — handles PII (audio bytes, transcript)
@app.post("/transcribe")
@limiter.limit("10/minute")
async def transcribe(request: Request, file: UploadFile = File(...)):
    audio_bytes = await file.read()
    # B19: Reject oversized audio server-side
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 10 MB limit")
    return transcribe_audio(audio_bytes, file.content_type or "audio/webm")


class TranscriptRequest(BaseModel):
    transcript: str


# DO NOT LOG — handles PII (transcript, employer name)
@app.post("/extract")
def extract(req: TranscriptRequest):
    # B20: Sanitize before injecting into Claude prompt
    safe = _sanitize_transcript(req.transcript)
    return extract_facts(safe)


class AnalyzeRequest(BaseModel):
    facts: dict


# DO NOT LOG — handles PII (employer name, work hours)
@app.post("/analyze")
@limiter.limit("10/minute")
def analyze(request: Request, req: AnalyzeRequest):
    facts = req.facts
    claims = " ".join(facts.get("raw_claims") or [])

    # Primary semantic query
    query_parts = [claims] if claims else []
    hrs_worked = facts.get("hours_worked_per_week")
    rate = facts.get("hourly_rate")
    if hrs_worked and hrs_worked > 40:
        query_parts.append("overtime wages forty hours workweek")
    if rate and rate < 7.25:
        query_parts.append("minimum wage rate employer pay")
    if not query_parts:
        query_parts = ["wage theft labor violation unpaid wages"]

    query = " ".join(query_parts)
    chunks = retrieve(query, k=8)

    # A2: Keyword fallback — supplement weak semantic retrieval for known hard cases
    claims_lower = (claims + " " + query).lower()
    seen_texts = {c["text"] for c in chunks}
    for keywords, booster_query in _CLAIM_BOOSTERS.items():
        if any(kw in claims_lower for kw in keywords):
            top_score = chunks[0].get("score") if chunks else 1.0
            if top_score is None or top_score > 0.6 or any(kw in claims_lower for kw in keywords):
                for extra in retrieve(booster_query, k=3):
                    if extra["text"] not in seen_texts:
                        chunks.append(extra)
                        seen_texts.add(extra["text"])

    return classify_violations(req.facts, chunks)


class LetterRequest(BaseModel):
    facts: dict
    violations: list


# DO NOT LOG — handles PII (employer name, wages, worker facts)
@app.post("/generate-letter")
@limiter.limit("10/minute")
def generate_letter_endpoint(request: Request, req: LetterRequest):
    return generate_letter(req.facts, req.violations)
