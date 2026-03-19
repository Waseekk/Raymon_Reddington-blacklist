"""
One-time script: embed all transcript chunks and store them in ChromaDB.

Usage:
    cd backend
    python rag/ingest.py

Safe to re-run — existing documents are upserted (no duplicates).
Requires transcripts to already exist in data/transcripts/ (run scraper.py first).
"""

import hashlib
import logging
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

from rag.chunker import chunk_transcript

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

TRANSCRIPTS_DIR = Path(__file__).parent.parent / "data" / "transcripts"
CHROMA_DIR = Path(__file__).parent.parent / "data" / "chroma_db"
COLLECTION_NAME = "blacklist_transcripts"
EMBED_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 128


def chunk_id(episode: str, index: int) -> str:
    raw = f"{episode}_{index}"
    return hashlib.md5(raw.encode()).hexdigest()


def main():
    txt_files = sorted(TRANSCRIPTS_DIR.glob("*.txt"))
    if not txt_files:
        log.error(f"No transcript files found in {TRANSCRIPTS_DIR}. Run scraper.py first.")
        return

    log.info(f"Loading embedding model '{EMBED_MODEL}'…")
    model = SentenceTransformer(EMBED_MODEL)

    log.info(f"Connecting to ChromaDB at {CHROMA_DIR}")
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    total_chunks = 0

    for txt_file in txt_files:
        log.info(f"Processing {txt_file.name}…")
        chunks = chunk_transcript(txt_file)
        if not chunks:
            log.warning(f"  No chunks extracted from {txt_file.name}")
            continue

        ids = [chunk_id(c.episode, i) for i, c in enumerate(chunks)]
        texts = [c.text for c in chunks]
        metadatas = [
            {
                "episode": c.episode,
                "season": c.season,
                "speaker": c.speaker,
                "is_red": str(c.is_red),  # ChromaDB metadata values must be str/int/float
            }
            for c in chunks
        ]

        # Embed in batches
        for start in range(0, len(texts), BATCH_SIZE):
            batch_ids = ids[start : start + BATCH_SIZE]
            batch_texts = texts[start : start + BATCH_SIZE]
            batch_meta = metadatas[start : start + BATCH_SIZE]
            embeddings = model.encode(batch_texts, show_progress_bar=False).tolist()
            collection.upsert(
                ids=batch_ids,
                embeddings=embeddings,
                documents=batch_texts,
                metadatas=batch_meta,
            )

        log.info(f"  → {len(chunks)} chunks ingested from {txt_file.name}")
        total_chunks += len(chunks)

    log.info(f"Ingestion complete. Total chunks in ChromaDB: {total_chunks}")


if __name__ == "__main__":
    main()
