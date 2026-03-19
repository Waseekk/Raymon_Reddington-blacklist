"""
Split raw transcript text into speaker-level chunks for RAG ingestion.

Each chunk is ~500 characters (hard max 600), with 50-char overlap carried
from the end of the previous chunk. Metadata per chunk:
  { episode, season, speaker, is_red }
"""

import re
from dataclasses import dataclass
from pathlib import Path

CHUNK_TARGET = 500
CHUNK_MAX = 600
OVERLAP = 50

# Matches lines like "REDDINGTON:", "LIZ:", "RESSLER:", etc.
SPEAKER_RE = re.compile(r"^([A-Z][A-Z\s\-'\.]{1,30}):\s*", re.MULTILINE)
RED_NAMES = {"REDDINGTON", "RED"}


@dataclass
class Chunk:
    text: str
    episode: str
    season: int
    speaker: str
    is_red: bool


def _parse_season_episode(filename: str) -> tuple[int, str]:
    """Extract season number and episode label from filename like S01E01_Pilot.txt"""
    m = re.match(r"S(\d+)E\d+", filename, re.IGNORECASE)
    season = int(m.group(1)) if m else 0
    episode = Path(filename).stem  # e.g. "S01E01_Pilot"
    return season, episode


def _split_into_speaker_blocks(text: str) -> list[tuple[str, str]]:
    """Return list of (speaker, dialogue) pairs."""
    blocks: list[tuple[str, str]] = []
    parts = SPEAKER_RE.split(text)

    # parts alternates: [pre-text, speaker, dialogue, speaker, dialogue, ...]
    # index 0 is everything before the first speaker tag
    i = 1
    while i + 1 < len(parts):
        speaker = parts[i].strip().upper()
        dialogue = parts[i + 1].strip()
        if dialogue:
            blocks.append((speaker, dialogue))
        i += 2
    return blocks


def _chunk_dialogue(speaker: str, dialogue: str, episode: str, season: int) -> list[Chunk]:
    """Break a potentially long dialogue block into ≤CHUNK_MAX char chunks."""
    chunks: list[Chunk] = []
    is_red = speaker in RED_NAMES
    words = dialogue.split()
    current = ""
    overlap_carry = ""

    for word in words:
        candidate = (current + " " + word).strip() if current else word
        if len(candidate) > CHUNK_MAX and current:
            full_text = f"{speaker}: {current}"
            chunks.append(Chunk(text=full_text, episode=episode, season=season,
                                speaker=speaker, is_red=is_red))
            # carry overlap from end of current chunk
            overlap_carry = current[-OVERLAP:] if len(current) > OVERLAP else current
            current = (overlap_carry + " " + word).strip()
        else:
            current = candidate

    if current:
        full_text = f"{speaker}: {current}"
        chunks.append(Chunk(text=full_text, episode=episode, season=season,
                            speaker=speaker, is_red=is_red))

    return chunks


def chunk_transcript(filepath: Path) -> list[Chunk]:
    """Load a transcript file and return all speaker chunks."""
    text = filepath.read_text(encoding="utf-8", errors="ignore")
    season, episode = _parse_season_episode(filepath.name)
    blocks = _split_into_speaker_blocks(text)

    all_chunks: list[Chunk] = []
    for speaker, dialogue in blocks:
        all_chunks.extend(_chunk_dialogue(speaker, dialogue, episode, season))

    return all_chunks
