"""Fetch key FLSA sections from law.cornell.edu and save to backend/corpus/flsa.txt."""
import urllib.request
import re
import os
import time

BASE = "https://www.law.cornell.edu/uscode/text/29/{section}"
OUT = os.path.join(os.path.dirname(__file__), "..", "backend", "corpus", "flsa.txt")

# Key FLSA sections for wage theft detection
SECTIONS = {
    "203": "§ 203 — Definitions",
    "206": "§ 206 — Minimum Wage",
    "207": "§ 207 — Maximum Hours (Overtime)",
    "211": "§ 211 — Collection of Data / Records",
    "212": "§ 212 — Child Labor",
    "213": "§ 213 — Exemptions",
    "215": "§ 215 — Prohibited Acts (Anti-Retaliation)",
    "216": "§ 216 — Penalties",
    "217": "§ 217 — Injunction Proceedings",
    "218": "§ 218 — Relation to Other Laws",
}

def fetch_section(section_num: str) -> str:
    url = BASE.format(section=section_num)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode("utf-8")

    # Extract main content between <div class="field-items"> or <article>
    # Try to get the statute text block
    match = re.search(r'<div[^>]*class="[^"]*field[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)

    # Strip all HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Try to find the statute body — look for the section number anchor
    # Extract text after "U.S. Code" breadcrumb to trim nav noise
    start = text.find(f"§ {section_num}")
    if start == -1:
        start = text.find(f"§{section_num}")
    if start != -1:
        text = text[start:start + 8000]  # grab up to 8k chars per section

    return text.strip()


os.makedirs(os.path.dirname(OUT), exist_ok=True)
all_text = []

for num, label in SECTIONS.items():
    print(f"Fetching {label} ...")
    try:
        text = fetch_section(num)
        block = f"\n\n{'='*60}\nFLSA {label}\nSource: 29 U.S.C. § {num}\n{'='*60}\n\n{text}"
        all_text.append(block)
        print(f"  Got {len(text)} chars")
        time.sleep(0.5)  # polite crawl rate
    except Exception as e:
        print(f"  ERROR: {e}")

combined = "\n".join(all_text)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(combined)

lines = combined.splitlines()
print(f"\nSaved {len(lines)} lines, {len(combined)} chars to {OUT}")
print(f"Contains § 207: {'207' in combined}")
print(f"Contains § 206: {'206' in combined}")
