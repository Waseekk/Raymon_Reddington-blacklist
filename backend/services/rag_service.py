import os
from typing import List, Dict

# Module-level singletons — loaded once when RAG data is actually present
_model = None
_chroma_client = None

_CHROMA_PATH = "./data/chroma_db"


def _data_ready() -> bool:
    """Return True only if ChromaDB data has been ingested."""
    return os.path.isdir(_CHROMA_PATH) and any(
        True for _ in os.scandir(_CHROMA_PATH)
    )


def get_context(query: str, n: int = 5) -> List[Dict]:
    # Skip entirely when no data is ingested — avoids loading the 90 MB
    # SentenceTransformer model on every chat request.
    if not _data_ready():
        return []

    try:
        global _model, _chroma_client
        from sentence_transformers import SentenceTransformer
        import chromadb

        # Cache model and client — only instantiated once per process
        if _model is None:
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        if _chroma_client is None:
            _chroma_client = chromadb.PersistentClient(path=_CHROMA_PATH)

        embedding = _model.encode(query).tolist()
        collection = _chroma_client.get_collection("blacklist_transcripts")

        # Try Red-only results first
        results = collection.query(
            query_embeddings=[embedding],
            n_results=n,
            where={"is_red": True},
        )
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]

        if len(docs) < 3:
            # Fallback to all speakers
            results = collection.query(
                query_embeddings=[embedding],
                n_results=n,
            )
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]

        return [
            {"text": doc, "episode": meta.get("episode", "")}
            for doc, meta in zip(docs, metas)
        ]
    except Exception:
        return []
