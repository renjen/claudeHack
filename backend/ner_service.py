"""Claude Haiku NER — extract structured facts from transcript."""
import os
import re
import json
import anthropic

_client = None

SYSTEM = """You are a legal intake assistant. Extract structured facts from a worker's complaint transcript.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "employer_name": "string or null",
  "hours_worked_per_week": number or null,
  "hours_paid_per_week": number or null,
  "hourly_rate": number or null,
  "pay_period": "weekly" | "biweekly" | "monthly" | null,
  "employment_type": "employee" | "contractor" | "unknown",
  "dates": ["list of any mentioned dates as strings"],
  "raw_claims": ["direct quotes of the worker's specific complaints"]
}

Rules:
- Never hallucinate values not present in the transcript
- If a field cannot be determined, use null
- employer_name: extract the business name only, not the business type (e.g. "FreshMart" not "FreshMart grocery store", "Sparkle Auto" not "Sparkle Auto car wash")
- raw_claims must be verbatim quotes or close paraphrases from the transcript
- employment_type defaults to "unknown" if unclear"""


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


# DO NOT LOG — handles PII (transcript, employer name)
def extract_facts(transcript: str) -> dict:
    response = _get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=SYSTEM,
        messages=[{"role": "user", "content": f"Transcript:\n{transcript}"}],
    )
    raw = response.content[0].text.strip()
    start, end = raw.find('{'), raw.rfind('}')
    if start >= 0 and end >= 0:
        raw = raw[start:end + 1]
    return json.loads(raw)
