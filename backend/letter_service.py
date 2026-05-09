"""Claude Sonnet demand letter generator with prompt caching."""
import os
import json
import re
import anthropic

_client = None

SYSTEM = """You are a legal document specialist generating demand letters for wage theft victims.

Return ONLY valid JSON — no markdown, no explanation:
{
  "demand_letter": "full letter text as a single string with \\n for newlines",
  "dol_prefill": {
    "complainant_name": "Worker (or provided name)",
    "employer_name": "string or null",
    "violation_type": "overtime" | "minimum_wage" | "tip_skimming" | "misclassification" | "off_the_clock" | "other",
    "estimated_back_wages": "dollar amount string or null",
    "period_of_violation": "description of time period or null",
    "flsa_section": "e.g. 29 U.S.C. § 207(a)(1)"
  }
}

Demand letter requirements (ALL mandatory):
1. Professional heading: date, employer name/address placeholder, "Re: Demand for Payment of Wages"
2. Cite at least one federal statute with full citation (e.g. FLSA, 29 U.S.C. § 207(a)(1))
3. State the specific violation in plain English
4. Show the dollar calculation explicitly (hours × rate × multiplier = amount)
5. Demand payment within 14 days
6. State FLSA liquidated damages exposure (equal amount if willful)
7. Include verbatim statutory text that supports the claim
8. End with: "DISCLAIMER: This letter provides legal information, not legal advice. Consult a licensed attorney for advice specific to your situation."
9. Note that FLSA protections apply regardless of immigration status if relevant

Letter tone: firm, professional, factual. No threats beyond statutory remedies."""


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


# DO NOT LOG — handles PII (employer name, wages, worker facts)
def generate_letter(facts: dict, violations: list[dict]) -> dict:
    client = _get_client()

    violations_block = json.dumps(violations, indent=2)

    # Cache breakpoint: system prompt + violations structure cached; worker-specific facts NOT cached
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=[
            {
                "type": "text",
                "text": SYSTEM + "\n\n---\nDetected Violations:\n" + violations_block,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": f"Worker Facts:\n{json.dumps(facts, indent=2)}\n\nGenerate the demand letter and DOL prefill.",
            }
        ],
    )

    usage = response.usage
    cc = getattr(usage, "cache_creation", None)
    cache_stats = {
        "cache_creation_input_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "cache_read_input_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "ephemeral_5m_input_tokens": getattr(cc, "ephemeral_5m_input_tokens", 0) if cc else 0,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
    }
    print(f"[letter_service] usage: {cache_stats}")

    raw = response.content[0].text.strip()
    start, end = raw.find('{'), raw.rfind('}')
    if start >= 0 and end >= 0:
        raw = raw[start:end + 1]

    result = json.loads(raw)
    result["_cache_stats"] = cache_stats
    return result
