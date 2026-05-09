"""Evaluation script — precision/recall/F1 per violation type across labeled test cases.

Usage:
    cd /path/to/claudeHack
    backend/.venv/bin/python scripts/evaluate.py
"""
import json
import requests
import sys
from collections import defaultdict

BASE = "http://localhost:8000"

# (transcript, expected_violation_types)
# Ground truth: what a correct classifier MUST detect given the transcript
LABELED_CASES = [
    (
        "I work 60 hours a week at Acme Corp. My boss only pays me for 40 hours at $15/hr.",
        {"overtime_theft"},
    ),
    (
        "I work at Downtown Grill as a server. My manager collects all our tips at the end of every shift and keeps half. I earn $2.13 an hour.",
        {"tip_skimming"},
    ),
    (
        "Metro Delivery calls me an independent contractor but I work set hours 8am to 6pm, use their van, wear their uniform, and they control my route. I get $400 a week flat, no overtime.",
        {"misclassification"},
    ),
    (
        "I work at Sparkle Auto car wash. They pay me $5 an hour. My boss says minimum wage laws don't apply to small businesses. I work 40 hours a week.",
        {"minimum_wage"},
    ),
    (
        "I work at FreshMart. Every day I must come in 30 minutes early to stock shelves before clocking in and stay 20 minutes after clocking out to clean up. That's 4 unpaid hours a week at $14/hr.",
        {"off_the_clock"},
    ),
    (
        "I complained to HR about unpaid overtime at my job and my boss fired me two days later. He said it was for performance but I had never had a bad review before.",
        {"retaliation"},
    ),
    (
        "My employer has 150 workers and just announced they are shutting the plant next week with no notice.",
        {"other"},  # WARN Act violation — maps to "other" in current schema
    ),
    # True negatives — vague input, no detectable violation
    ("My boss is mean to me.", set()),
    ("I think something might be wrong with my paycheck but I'm not sure what.", set()),
    ("", set()),
]

ALL_TYPES = {"overtime_theft", "minimum_wage", "tip_skimming", "misclassification", "off_the_clock", "retaliation", "other"}


def run_pipeline(transcript: str) -> set:
    if not transcript.strip():
        return set()
    try:
        r1 = requests.post(f"{BASE}/extract", json={"transcript": transcript}, timeout=30)
        r1.raise_for_status()
        facts = r1.json()

        r2 = requests.post(f"{BASE}/analyze", json={"facts": facts}, timeout=60)
        r2.raise_for_status()
        analysis = r2.json()

        return {v["type"] for v in analysis.get("violations", [])}
    except Exception as e:
        print(f"  [ERROR] {e}")
        return set()


def main():
    print("Wage Theft Watchdog — Violation Classifier Evaluation")
    print(f"Backend: {BASE}\n")

    # Check backend is up
    try:
        requests.get(f"{BASE}/health", timeout=5).raise_for_status()
    except Exception:
        print("ERROR: Backend not reachable. Start it with:")
        print("  backend/.venv/bin/uvicorn backend.main:app --port 8000")
        sys.exit(1)

    stats = defaultdict(lambda: {"tp": 0, "fp": 0, "tn": 0, "fn": 0})
    case_results = []

    for i, (transcript, expected) in enumerate(LABELED_CASES):
        label = (transcript[:70] + "...") if len(transcript) > 70 else (transcript or "(empty)")
        print(f"[{i+1:2d}] {label}")

        predicted = run_pipeline(transcript)
        correct = predicted == expected or (not expected and not (predicted - {"other"}))

        print(f"     Expected:  {sorted(expected) or 'none'}")
        print(f"     Predicted: {sorted(predicted) or 'none'}")
        print(f"     {'✓ MATCH' if correct else '✗ MISMATCH'}\n")

        for vtype in ALL_TYPES:
            exp = vtype in expected
            pred = vtype in predicted
            if exp and pred:
                stats[vtype]["tp"] += 1
            elif not exp and pred:
                stats[vtype]["fp"] += 1
            elif exp and not pred:
                stats[vtype]["fn"] += 1
            else:
                stats[vtype]["tn"] += 1

        case_results.append({"transcript": transcript[:60], "expected": sorted(expected), "predicted": sorted(predicted)})

    # Summary table
    print("=" * 70)
    print(f"{'Violation Type':<25} {'Prec':>6} {'Rec':>6} {'F1':>6} {'TP':>4} {'FP':>4} {'FN':>4} {'TN':>4}")
    print("=" * 70)

    macro_p, macro_r, macro_f1, n = 0, 0, 0, 0
    for vtype in sorted(ALL_TYPES):
        s = stats[vtype]
        tp, fp, fn, tn = s["tp"], s["fp"], s["fn"], s["tn"]
        if tp + fp + fn == 0:
            continue  # type not tested
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        macro_p += precision; macro_r += recall; macro_f1 += f1; n += 1
        print(f"{vtype:<25} {precision:>6.2f} {recall:>6.2f} {f1:>6.2f} {tp:>4} {fp:>4} {fn:>4} {tn:>4}")

    if n > 0:
        print("-" * 70)
        print(f"{'Macro average':<25} {macro_p/n:>6.2f} {macro_r/n:>6.2f} {macro_f1/n:>6.2f}")

    print(f"\nTotal cases: {len(LABELED_CASES)}")


if __name__ == "__main__":
    main()
