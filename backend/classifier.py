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
      "type": "overtime_theft" | "minimum_wage" | "tip_skimming" | "misclassification" | "off_the_clock" | "retaliation" | "other",
      "description": "one-sentence plain-English description",
      "severity": "high" | "medium" | "low",
      "relevant_law": "statute name and section (e.g. FLSA § 207(a)(1))",
      "verbatim_citation": "exact quoted text from the retrieved law chunks",
      "estimated_damages": "mid-range calculation string or null if insufficient data",
      "damages_range": {
        "low": "conservative 1-year back pay estimate or null",
        "mid": "likely 2-year estimate or null",
        "high": "maximum with liquidated damages or null"
      }
    }
  ],
  "retaliation_warning": "Brief note about FLSA § 215(a)(3) anti-retaliation protections if employer threatened or retaliated, else null",
  "jurisdiction_notes": "state-specific notes if state law applies (CA, NY, TX), else null",
  "clarifications_needed": ["blocking clarifications only — facts that would change the violation finding; omit if violation is already clear"],
  "immigration_disclaimer": true
}

Rules:
- Only cite law text that appears verbatim in the provided chunks — never invent citations
- immigration_disclaimer must always be true (FLSA covers all workers regardless of immigration status)
- If facts are insufficient, return violations: [] and populate clarifications_needed
- clarifications_needed: only list facts that would materially change the finding — not exhaustive questions
- Overtime: >40hrs/week at 1.5x rate required (FLSA § 207); CA also triggers OT after 8hrs/day (CA Labor Code § 510)
- Minimum wage: $7.25/hr federal floor (FLSA § 206); CA $16/hr, NY $16–16.50/hr — cite whichever applies
- Tip skimming: employer cannot keep employee tips (FLSA § 203(m)(2)(B))
- Misclassification: economic reality test determines employee vs contractor status (FLSA § 203(e))
- Retaliation: FLSA § 215(a)(3) prohibits discharge or discrimination for filing a complaint or testifying
- damages_range: low = 1yr back pay only; mid = 2yr back pay; high = 3yr × 2 (with liquidated damages for willful violation)"""


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

    # Cache breakpoint: system prompt + law chunks cached; worker facts NOT cached
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
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
    cache_stats = {
        "cache_creation_input_tokens": getattr(usage, "cache_creation_input_tokens", 0) or 0,
        "cache_read_input_tokens": getattr(usage, "cache_read_input_tokens", 0) or 0,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
    }
    print(f"[classifier] usage: {cache_stats}")

    raw = response.content[0].text.strip()
    start, end = raw.find('{'), raw.rfind('}')
    if start >= 0 and end >= 0:
        raw = raw[start:end + 1]

    result = json.loads(raw)

    # A6: Sort violations by severity (high → medium → low)
    SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}
    result["violations"].sort(key=lambda v: SEVERITY_ORDER.get(v.get("severity", "low"), 2))

    result["_cache_stats"] = cache_stats
    return result
