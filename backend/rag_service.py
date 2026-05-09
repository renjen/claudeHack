"""ChromaDB corpus init and retrieval."""
import os
import re
import chromadb
from openai import OpenAI

CORPUS_PATH = os.path.join(os.path.dirname(__file__), "corpus", "flsa.txt")
COLLECTION_NAME = "flsa_corpus"
CHUNK_TOKENS = 100
CHUNK_OVERLAP = 20

_chroma = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), ".chromadb"))
_collection = None
_openai = None


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


def _chunk_text(text: str, chunk_size: int = CHUNK_TOKENS, overlap: int = CHUNK_OVERLAP) -> list[dict]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i: i + chunk_size]
        chunk_text = " ".join(chunk_words)
        # Try to detect section header near start of chunk
        section_match = re.search(r"§\s*\d+\w*", chunk_text)
        section = section_match.group(0) if section_match else f"chunk_{len(chunks)}"
        chunks.append({
            "text": chunk_text,
            "source": "FLSA",
            "section": section,
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
        return  # already populated, skip re-embedding

    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = _chunk_text(text)
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = _embed(texts)
        col.add(
            ids=[f"chunk_{i + j}" for j in range(len(batch))],
            embeddings=embeddings,
            documents=texts,
            metadatas=[{"source": c["source"], "section": c["section"]} for c in batch],
        )
    print(f"Corpus loaded: {col.count()} chunks")


def retrieve(query: str, k: int = 5) -> list[dict]:
    col = _get_collection()
    query_embedding = _embed([query])[0]
    results = col.query(query_embeddings=[query_embedding], n_results=k)
    chunks = []
    for i in range(len(results["ids"][0])):
        chunks.append({
            "source": results["metadatas"][0][i]["source"],
            "section": results["metadatas"][0][i]["section"],
            "text": results["documents"][0][i],
            "score": results["distances"][0][i] if results.get("distances") else None,
        })
    return chunks
