from typing import List, Dict


def get_context(query: str, n: int = 5) -> List[Dict]:
    try:
        from sentence_transformers import SentenceTransformer
        import chromadb

        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode(query).tolist()

        client = chromadb.PersistentClient(path="./data/chroma")
        collection = client.get_collection("blacklist_transcripts")

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
