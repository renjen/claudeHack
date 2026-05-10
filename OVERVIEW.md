  Tech Stack

  Frontend
  - React + Vite — UI framework. Fast dev server, optimized builds.
  - Tailwind CSS — utility-first styling. Dark mode, responsive, no CSS files.
  - jsPDF — PDF generation for the demand letter, runs entirely in the browser.

  Backend
  - FastAPI (Python) — REST API. Four main endpoints form the pipeline.
  - SQLite — lightweight database for user accounts and saved cases. No setup needed.
  - slowapi — rate limiting (10 req/min per IP on expensive endpoints).

  AI / ML
  - Groq + Whisper large-v3-turbo — voice transcription. 10x faster than OpenAI's Whisper API.
  - Claude Haiku (claude-haiku-4-5) — fact extraction from transcript. Cheap + fast structured JSON.
  - Claude Sonnet (claude-sonnet-4-6) — legal violation analysis + demand letter generation. Best reasoning quality.
  - OpenAI embeddings (text-embedding-3-small) — converts law text into vectors for semantic search.
  - ChromaDB — vector database that stores the embedded law corpus locally.

  Auth
  - bcrypt — password hashing.
  - PyJWT — JWT tokens, 7-day expiry.

  ---
  Project Structure (high level)

  claudeHack/
  ├── backend/
  │   ├── main.py           ← FastAPI app, all endpoints, auth routes
  │   ├── whisper_service.py ← Groq transcription
  │   ├── ner_service.py     ← Claude Haiku fact extraction
  │   ├── rag_service.py     ← ChromaDB vector search
  │   ├── classifier.py      ← Claude Sonnet violation detection
  │   ├── letter_service.py  ← Claude Sonnet demand letter
  │   ├── auth_service.py    ← bcrypt + JWT + case CRUD
  │   ├── db.py              ← SQLite schema
  │   └── corpus/            ← FLSA + state law text files
  ├── frontend/
  │   └── src/
  │       ├── App.jsx         ← main app, pipeline orchestration
  │       ├── i18n.js         ← EN/ES translations
  │       └── components/     ← VoiceRecorder, DemandLetter, etc.
  └── scripts/
      ├── evaluate.py         ← precision/recall/F1 eval
      └── bias_test.py        ← demographic fairness audit

  The pipeline in one sentence: voice/text → Whisper → Claude Haiku extracts facts → ChromaDB retrieves relevant law → Claude Sonnet finds violations + writes letter.

  Prompt caching is active on Sonnet calls — the law chunks are cached, only the worker's facts are new each call. ~90% token cost reduction on repeat runs.



Evaluations

  scripts/evaluate.py — standard ML eval. 10 labeled test cases, checks the classifier against ground truth.

  Metrics it reports: Precision, Recall, F1 per violation type, plus macro average across all types.

  What we've seen in testing:
  - Overtime theft, off-the-clock, retaliation — consistently high F1 (good semantic match between the way people describe them and how FLSA is written)
  
  - Minimum wage, tip skimming — weaker out of the box (colloquial language doesn't match dense legal text), which is why we added keyword booster queries in the RAG layer to directly pull the right
  statute sections when those keywords appear
