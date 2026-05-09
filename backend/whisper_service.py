"""Groq Whisper transcription service."""
import os
from groq import Groq

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client

# DO NOT LOG — handles PII (audio bytes, transcript)
def transcribe_audio(audio_bytes: bytes, content_type: str) -> dict:
    ext = "webm" if "webm" in content_type else "wav"
    response = _get_client().audio.transcriptions.create(
        file=(f"audio.{ext}", audio_bytes, content_type),
        model="whisper-large-v3-turbo",
        response_format="verbose_json",
    )
    return {
        "transcript": response.text,
        "language": response.language,
        "duration_sec": getattr(response, "duration", None),
    }
