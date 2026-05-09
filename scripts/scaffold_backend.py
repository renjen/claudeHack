"""Create empty backend service files with module-level docstring stubs."""
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "backend")
os.makedirs(os.path.join(ROOT, "corpus"), exist_ok=True)

files = {
    "main.py": '"""FastAPI app entry point."""\n',
    "whisper_service.py": '"""Groq Whisper transcription service."""\n',
    "ner_service.py": '"""Claude Haiku NER — extract structured facts from transcript."""\n',
    "rag_service.py": '"""ChromaDB corpus init and retrieval."""\n',
    "classifier.py": '"""Claude Sonnet violation classifier."""\n',
    "letter_service.py": '"""Claude Sonnet demand letter generator."""\n',
}

for name, content in files.items():
    path = os.path.join(ROOT, name)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        print(f"SKIP (exists + non-empty): {name}")
        continue
    with open(path, "w") as f:
        f.write(content)
    print(f"CREATED: {name}")

print("Done. backend/ contents:")
for f in sorted(os.listdir(ROOT)):
    print(f"  {f}")
