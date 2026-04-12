"""
Context-window chunker for blacklistdcd.com transcripts.

Each chunk is built around a Red line with ±3 surrounding lines of context
(other dialogue + stage directions). This gives the embedding model the
situational context around each quote — not just the isolated words.

Example chunk:
    [ Tense music playing ]
    LIZ: Red, they're going to kill you.
    REDDINGTON: I once knew a man in Minsk who collected rare coins...
    LIZ: How is that relevant right now?
    [ Red smiles despite the danger ]

Metadata per chunk:
    episode, season, is_red (always True), has_context
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

# Lines above/below the Red line to include in context window
CONTEXT_WINDOW = 3

# Don't create a new chunk if a Red line starts within N lines of the previous one
# (merge them into one chunk instead)
MERGE_DISTANCE = 2

# Hard cap — very long monologues get split
MAX_CHUNK_CHARS = 900

# Identifies a scene break
SCENE_BREAK_RE = re.compile(r"⋘|⋙|[\u22d8\u22d9]|^[-=*]{4,}$", re.MULTILINE)

# Speaker line: bold markdown (**Name:**) or ALL-CAPS name followed by colon
SPEAKER_RE = re.compile(r"^\*{0,2}([A-Z][A-Za-z\s\-'\.]{1,30})\*{0,2}:\s*(.*)", re.DOTALL)

# Stage direction: text in [ brackets ]
ACTION_RE = re.compile(r"^\[.+\]$")

RED_NAMES = {"REDDINGTON", "RED", "RAYMOND"}


@dataclass
class ParsedLine:
    kind: Literal["red", "other_dialogue", "action", "break", "empty"]
    text: str          # cleaned display text
    speaker: str = ""  # only for dialogue lines


@dataclass
class Chunk:
    text: str
    red_line: str
    episode: str
    season: int
    is_red: bool = True
    has_context: bool = False


def _clean(line: str) -> str:
    """Remove markdown bold/italic markers, strip whitespace."""
    line = re.sub(r"\*{1,2}", "", line)
    return line.strip()


def _parse_line(raw: str) -> ParsedLine:
    """Classify a single transcript line."""
    line = raw.strip()
    if not line:
        return ParsedLine(kind="empty", text="")

    if SCENE_BREAK_RE.search(line):
        return ParsedLine(kind="break", text=line)

    if ACTION_RE.match(line):
        return ParsedLine(kind="action", text=line)

    m = SPEAKER_RE.match(line)
    if m:
        speaker = m.group(1).strip().upper()
        # Remove markdown bold from speaker name
        speaker = re.sub(r"\*", "", speaker).strip()
        dialogue = _clean(m.group(2))
        if not dialogue:
            return ParsedLine(kind="empty", text="")
        kind = "red" if speaker in RED_NAMES else "other_dialogue"
        display = f"{speaker}: {dialogue}"
        return ParsedLine(kind=kind, text=display, speaker=speaker)

    # Unmatched non-empty line — treat as action/context
    return ParsedLine(kind="action", text=_clean(line))


def _parse_transcript(text: str) -> list[ParsedLine]:
    """Parse full transcript text into a list of classified lines."""
    lines = []
    for raw in text.splitlines():
        parsed = _parse_line(raw)
        # Skip consecutive empties
        if parsed.kind == "empty":
            if lines and lines[-1].kind != "empty":
                lines.append(parsed)
        else:
            lines.append(parsed)
    return lines


def _build_chunks(lines: list[ParsedLine], episode: str, season: int) -> list[Chunk]:
    """
    For each Red line, collect ±CONTEXT_WINDOW surrounding lines.
    Merge chunks where Red lines are close together.
    """
    # Find indices of all Red lines
    red_indices = [i for i, l in enumerate(lines) if l.kind == "red"]
    if not red_indices:
        return []

    chunks: list[Chunk] = []
    used: set[int] = set()  # Red line indices already included in a chunk

    for ri in red_indices:
        if ri in used:
            continue

        # Collect window: look backward
        window_start = ri
        scene_crossed = False
        back_count = 0
        for j in range(ri - 1, max(ri - CONTEXT_WINDOW - 1, -1), -1):
            l = lines[j]
            if l.kind == "break":
                scene_crossed = True
                break
            if l.kind == "empty":
                continue
            back_count += 1
            window_start = j
            if back_count >= CONTEXT_WINDOW:
                break

        # Look forward — also absorb nearby Red lines (merge)
        window_end = ri
        fwd_count = 0
        for j in range(ri + 1, min(ri + CONTEXT_WINDOW + 1, len(lines))):
            l = lines[j]
            if l.kind == "break":
                break
            if l.kind == "empty":
                continue
            fwd_count += 1
            window_end = j
            # If this is another Red line close by, merge it
            if l.kind == "red" and fwd_count <= MERGE_DISTANCE:
                used.add(j)
            if fwd_count >= CONTEXT_WINDOW:
                break

        used.add(ri)

        # Build chunk text from window
        window_lines = [
            lines[k] for k in range(window_start, window_end + 1)
            if lines[k].kind != "empty"
        ]

        if not window_lines:
            continue

        text = "\n".join(l.text for l in window_lines)

        # Hard cap: if too long, trim to the Red line + minimal context
        if len(text) > MAX_CHUNK_CHARS:
            red_line_text = lines[ri].text
            # Try just ±1 line
            mini = [lines[k] for k in range(max(0, ri-1), min(len(lines), ri+2))
                    if lines[k].kind != "empty"]
            text = "\n".join(l.text for l in mini)
            if len(text) > MAX_CHUNK_CHARS:
                text = red_line_text

        has_context = len(window_lines) > 1
        red_line_text = lines[ri].text

        chunks.append(Chunk(
            text=text,
            red_line=red_line_text,
            episode=episode,
            season=season,
            is_red=True,
            has_context=has_context,
        ))

    return chunks


def _parse_season_episode(filename: str) -> tuple[int, str]:
    """Extract season number and episode label from filename like S01E01_Pilot.txt"""
    m = re.match(r"S(\d+)E\d+", filename, re.IGNORECASE)
    season = int(m.group(1)) if m else 0
    episode = Path(filename).stem
    return season, episode


def chunk_transcript(filepath: Path) -> list[Chunk]:
    """Load a transcript file and return all context-window chunks."""
    text = filepath.read_text(encoding="utf-8", errors="ignore")
    season, episode = _parse_season_episode(filepath.name)
    lines = _parse_transcript(text)
    return _build_chunks(lines, episode, season)
