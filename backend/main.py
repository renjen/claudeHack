"""FastAPI app entry point."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from backend.whisper_service import transcribe_audio
from backend.ner_service import extract_facts
from backend.rag_service import init_corpus, retrieve
from backend.classifier import classify_violations
from backend.letter_service import generate_letter

@asynccontextmanager
async def lifespan(app):
    init_corpus()
    yield

app = FastAPI(title="Wage Theft Watchdog", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


# DO NOT LOG — handles PII (audio bytes, transcript)
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return transcribe_audio(audio_bytes, file.content_type or "audio/webm")

class TranscriptRequest(BaseModel):
    transcript: str


# DO NOT LOG — handles PII (transcript, employer name)
@app.post("/extract")
def extract(req: TranscriptRequest):
    return extract_facts(req.transcript)


class AnalyzeRequest(BaseModel):
    facts: dict


# DO NOT LOG — handles PII (employer name, work hours)
@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    facts = req.facts
    claims = " ".join(facts.get("raw_claims") or [])
    # Build a semantic query from the claims + key numeric context
    hrs_worked = facts.get("hours_worked_per_week")
    hrs_paid = facts.get("hours_paid_per_week")
    rate = facts.get("hourly_rate")
    extras = []
    if hrs_worked and hrs_worked > 40:
        extras.append("overtime wages forty hours workweek")
    if rate and rate < 7.25:
        extras.append("minimum wage rate employer pay")
    if not claims and not extras:
        claims = "wage theft labor violation unpaid wages"
    query = " ".join(filter(None, [claims] + extras))
    chunks = retrieve(query, k=8)
    return classify_violations(req.facts, chunks)


class LetterRequest(BaseModel):
    facts: dict
    violations: list


# DO NOT LOG — handles PII (employer name, wages, worker facts)
@app.post("/generate-letter")
def generate_letter_endpoint(req: LetterRequest):
    return generate_letter(req.facts, req.violations)