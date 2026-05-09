"""H+6 scenario tests — runs all 5 demo scenarios + edge cases against the live API."""
import sys
import requests
import json

BASE = "http://localhost:8000"


def run(transcript: str, label: str) -> dict:
    print(f"\n{'='*60}")
    print(f"SCENARIO: {label}")
    print(f"TRANSCRIPT: {transcript[:80]}{'...' if len(transcript)>80 else ''}")

    r1 = requests.post(f"{BASE}/extract", json={"transcript": transcript}, timeout=30)
    facts = r1.json()

    r2 = requests.post(f"{BASE}/analyze", json={"facts": facts}, timeout=60)
    analysis = r2.json()
    violations = analysis.get("violations", [])

    print(f"VIOLATIONS: {[v['type'] for v in violations]}")
    for v in violations:
        print(f"  [{v['severity']}] {v['type']} — {v['relevant_law']}")
        print(f"  Citation: {v['verbatim_citation'][:80]}...")
        if v.get("estimated_damages"):
            print(f"  Damages: {v['estimated_damages'][:80]}...")

    clarifications = analysis.get("clarifications_needed", [])
    if clarifications:
        print(f"CLARIFICATIONS NEEDED: {len(clarifications)}")

    print(f"IMMIGRATION DISCLAIMER: {analysis.get('immigration_disclaimer')}")

    if violations:
        r3 = requests.post(
            f"{BASE}/generate-letter",
            json={"facts": facts, "violations": violations},
            timeout=60,
        )
        letter_data = r3.json()
        letter = letter_data.get("demand_letter", "")
        checks = {
            "has_FLSA": "FLSA" in letter,
            "has_dollar": "$" in letter,
            "has_disclaimer": "not legal advice" in letter.lower(),
            "has_employer": facts.get("employer_name", "") in letter if facts.get("employer_name") else True,
        }
        print(f"LETTER CHECKS: {checks}")
        all_ok = all(checks.values())
        print(f"LETTER PASS: {all_ok}")
        return {"label": label, "violations": [v["type"] for v in violations], "letter_pass": all_ok}
    else:
        print("NO VIOLATIONS DETECTED — checking graceful handling")
        return {"label": label, "violations": [], "letter_pass": None}


scenarios = [
    (
        "spanish_overtime",
        # English text simulating what Whisper outputs from Spanish audio
        "I work 10 hours a day, 6 days a week at a restaurant called El Rancho. "
        "My boss only pays me for 8 hours a day. He says overtime does not apply to immigrants. "
        "My hourly rate is 12 dollars.",
    ),
    (
        "tip_skimming",
        "I work as a server at Downtown Grill. My manager collects all our tips at the end of every shift "
        "and keeps half of them for himself. We never see that money. My hourly wage is $2.13.",
    ),
    (
        "misclassification",
        "I drive for Metro Delivery Co. They call me an independent contractor but I work set hours "
        "from 8am to 6pm, use their van, wear their uniform, and they tell me exactly what to do. "
        "I get paid $400 a week flat, no overtime, no benefits.",
    ),
    (
        "minimum_wage",
        "I work at a car wash called Sparkle Auto. My boss pays me $5 an hour and says the minimum wage "
        "laws don't apply to small businesses. I work 40 hours a week.",
    ),
    (
        "off_the_clock",
        "I work at FreshMart grocery store. Every day I have to come in 30 minutes early to stock shelves "
        "before I clock in, and stay 20 minutes after to clean up after clocking out. "
        "That is about 4 extra hours a week I am never paid for. I make $14 an hour.",
    ),
    # Edge cases
    (
        "edge_no_employer",
        "My boss owes me money. He has not paid me in two weeks.",
    ),
    (
        "edge_vague",
        "I think something is wrong with my paycheck but I am not sure what.",
    ),
    (
        "edge_silence",
        "",
    ),
]

results = []
failed = []

for label, transcript in scenarios:
    if not transcript.strip():
        print(f"\n{'='*60}")
        print(f"SCENARIO: {label} — empty/silence, expecting graceful failure")
        try:
            r = requests.post(f"{BASE}/extract", json={"transcript": ""}, timeout=15)
            print(f"  /extract status: {r.status_code}")
            facts = r.json()
            print(f"  Facts: {facts}")
            results.append({"label": label, "violations": [], "letter_pass": None, "graceful": True})
        except Exception as e:
            print(f"  ERROR: {e}")
            failed.append(label)
        continue

    try:
        result = run(transcript, label)
        results.append(result)
    except Exception as e:
        print(f"\nFAILED [{label}]: {e}")
        failed.append(label)

print(f"\n\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
for r in results:
    status = "PASS" if r.get("letter_pass") else ("GRACEFUL" if r.get("letter_pass") is None else "FAIL")
    print(f"  {status:8} {r['label']:25} violations={r['violations']}")
if failed:
    print(f"\nFAILED: {failed}")
    sys.exit(1)
