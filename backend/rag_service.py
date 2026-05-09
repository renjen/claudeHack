"""ChromaDB corpus init and retrieval — loads all files in backend/corpus/."""
import os
import re
import chromadb
from openai import OpenAI

CORPUS_DIR = os.path.join(os.path.dirname(__file__), "corpus")
COLLECTION_NAME = "law_corpus_v2"
CHUNK_TOKENS = 100
CHUNK_OVERLAP = 20

_chroma = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), ".chromadb"))
_collection = None
_openai = None

# Map corpus filename stem → (source label, jurisdiction)
_SOURCE_MAP = {
    "flsa":      ("FLSA", "federal"),
    "ca_labor":  ("CA Labor Code", "CA"),
    "ny_labor":  ("NY Labor Law", "NY"),
    "tx_labor":  ("TX Labor Code", "TX"),
    "warn_act":  ("WARN Act", "federal"),
    "fmla":      ("FMLA", "federal"),
    "ada":       ("ADA", "federal"),
}


def _get_openai() -> OpenAI:
    global _openai
    if _openai is None:
        _openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai


def _get_collection():
    global _collection
    if _collection is None:
        _collection = _chroma.get_or_create_collection(COLLECTION_NAME)
    return _collection


def _chunk_text(text: str, source: str, jurisdiction: str,
                chunk_size: int = CHUNK_TOKENS, overlap: int = CHUNK_OVERLAP) -> list[dict]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i: i + chunk_size]
        chunk_text = " ".join(chunk_words)
        section_match = re.search(r"§\s*[\d]+[\w()\.]*", chunk_text)
        section = section_match.group(0) if section_match else f"chunk_{len(chunks)}"
        chunks.append({
            "text": chunk_text,
            "source": source,
            "section": section,
            "jurisdiction": jurisdiction,
        })
        i += chunk_size - overlap
    return chunks


def _embed(texts: list[str]) -> list[list[float]]:
    response = _get_openai().embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [r.embedding for r in response.data]


def init_corpus():
    col = _get_collection()
    if col.count() > 0:
        print(f"Corpus already loaded: {col.count()} chunks")
        return

    # Load all .txt files in corpus directory
    corpus_files = sorted(f for f in os.listdir(CORPUS_DIR) if f.endswith(".txt"))
    all_chunks = []
    for filename in corpus_files:
        stem = filename[:-4]  # strip .txt
        source, jurisdiction = _SOURCE_MAP.get(stem, (stem.upper(), "unknown"))
        with open(os.path.join(CORPUS_DIR, filename), "r", encoding="utf-8") as f:
            text = f.read()
        chunks = _chunk_text(text, source, jurisdiction)
        all_chunks.extend(chunks)
        print(f"  [{source}] {len(chunks)} chunks")

    batch_size = 50
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i: i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = _embed(texts)
        col.add(
            ids=[f"chunk_{i + j}" for j in range(len(batch))],
            embeddings=embeddings,
            documents=texts,
            metadatas=[{
                "source": c["source"],
                "section": c["section"],
                "jurisdiction": c["jurisdiction"],
            } for c in batch],
        )

    print(f"Corpus loaded: {col.count()} chunks from {len(corpus_files)} files")


def retrieve(query: str, k: int = 5) -> list[dict]:
    col = _get_collection()
    query_embedding = _embed([query])[0]
    results = col.query(query_embeddings=[query_embedding], n_results=k)
    chunks = []
    for i in range(len(results["ids"][0])):
        meta = results["metadatas"][0][i]
        chunks.append({
            "source": meta["source"],
            "section": meta["section"],
            "jurisdiction": meta.get("jurisdiction", "unknown"),
            "text": results["documents"][0][i],
            "score": results["distances"][0][i] if results.get("distances") else None,
        })
    return chunks
