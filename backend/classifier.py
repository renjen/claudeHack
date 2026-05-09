"""Claude Sonnet violation classifier with prompt caching."""
import os
import json
import anthropic

_client = None

SYSTEM = """You are a wage theft legal analyst. Given a worker's extracted facts and retrieved law excerpts, identify labor law violations.

Return ONLY valid JSON — no markdown, no explanation:
{
  "violations": [
    {
      "type": "overtime_theft" | "minimum_wage" | "tip_skimming" | "misclassification" | "off_the_clock" | "other",
      "description": "one-sentence plain-English description",
      "severity": "high" | "medium" | "low",
      "relevant_law": "statute name and section (e.g. FLSA § 207(a)(1))",
      "verbatim_citation": "exact quoted text from the retrieved law chunks",
      "estimated_damages": "calculation string or null if insufficient data"
    }
  ],
  "jurisdiction_notes": "federal or state notes if applicable",
  "clarifications_needed": ["list of facts needed to complete analysis, or empty array"],
  "immigration_disclaimer": true
}

Rules:
- Only cite law text that appears verbatim in the provided chunks — never invent citations
- immigration_disclaimer must always be true (FLSA covers all workers regardless of status)
- If facts are insufficient, return violations: [] and populate clarifications_needed
- Overtime: >40hrs/week at 1.5x rate required (FLSA § 207)
- Minimum wage: $7.25/hr federal floor (FLSA § 206)
- Tip skimming: employer cannot keep tips (FLSA § 203(m)(2)(B))
- Misclassification: contractor vs employee test"""


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def _build_law_block(chunks: list[dict]) -> str:
    lines = []
    for c in chunks:
        lines.append(f"[{c['source']}, {c['section']}]\n{c['text']}")
    return "\n\n".join(lines)


# DO NOT LOG — handles PII (employer name, work hours)
def classify_violations(facts: dict, retrieved_chunks: list[dict]) -> dict:
    client = _get_client()
    law_block = _build_law_block(retrieved_chunks)

    # Cache breakpoint: system prompt + law chunks cached together, worker facts NOT cached
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=[
            {
                "type": "text",
                "text": SYSTEM + "\n\n---\nRetrieved Law Excerpts:\n" + law_block,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": f"Worker Facts:\n{json.dumps(facts, indent=2)}\n\nIdentify all violations.",
            }
        ],
    )

    usage = response.usage
    cc = getattr(usage, "cache_creation", None)
    cache_stats = {
        "cache_creation_input_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "cache_read_input_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "ephemeral_5m_input_tokens": getattr(cc, "ephemeral_5m_input_tokens", 0) if cc else 0,
        "ephemeral_1h_input_tokens": getattr(cc, "ephemeral_1h_input_tokens", 0) if cc else 0,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
    }
    print(f"[classifier] usage: {cache_stats}")

    raw = response.content[0].text.strip()
    start, end = raw.find('{'), raw.rfind('}')
    if start >= 0 and end >= 0:
        raw = raw[start:end + 1]

    result = json.loads(raw)
    result["_cache_stats"] = cache_stats
    return result
