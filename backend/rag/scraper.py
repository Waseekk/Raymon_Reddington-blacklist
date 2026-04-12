"""
Scrape all Blacklist episode transcripts from blacklistdcd.com.

Source: https://blacklistdcd.com — full screenplay-style transcripts with
stage directions, scene context, music cues, and emotional tone in [ brackets ].

Usage:
    cd backend
    python rag/scraper.py

Safe to re-run — already-downloaded files are skipped.
"""

import re
import time
import logging
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
    force=True,
)
log = logging.getLogger(__name__)

INDEX_URL = (
    "https://blacklistdcd.com/surveillance-2/"
    "%e2%99%a4%e2%99%a4%f0%9f%94%b4-all-scripts-pending/"
)
OUT_DIR = Path(__file__).parent.parent / "data" / "transcripts"

# Full browser-like headers to reduce rate-limit risk
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}

DELAY = 30.0       # seconds between episode downloads
MAX_RETRIES = 3    # reduced — with 30s delay, retries are less needed


def make_session() -> requests.Session:
    """Create a session with browser-like headers."""
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def get(session: requests.Session, url: str) -> requests.Response:
    """GET with retries and exponential backoff. Follows redirects automatically."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, timeout=30, allow_redirects=True)
            if resp.status_code == 429:
                wait = 60 * attempt  # back off hard on rate limit
                log.warning(
                    f"Rate limited (429) from {resp.url}. "
                    f"Waiting {wait}s before retry {attempt}…"
                )
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            wait = 2 ** attempt
            log.warning(f"Attempt {attempt} failed for {url}: {exc}. Retrying in {wait}s…")
            time.sleep(wait)
    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} attempts")


def parse_episode_links(html: str) -> list[dict]:
    """
    Extract individual episode script links from the all-scripts index page.
    Only returns links whose label matches the episode pattern (e.g. "Episode 1:1").
    Excludes anchor links, highlight reels, song pages, and compilation pages.
    """
    soup = BeautifulSoup(html, "lxml")
    episodes = []
    seen = set()

    # Episode label must contain "Season:Episode" number like "1:1" or "10:22"
    EPISODE_NUM_RE = re.compile(r"\d+:\d+")

    for a in soup.find_all("a", href=re.compile(r"wp\.me/", re.IGNORECASE)):
        href = a["href"].strip()

        # Skip anchor links (they point to sections within compilation pages)
        if "#" in href:
            continue

        label = a.get_text(separator=" ", strip=True)

        # Must look like an episode (contains "N:N" pattern)
        if not EPISODE_NUM_RE.search(label):
            continue

        if href in seen:
            continue
        seen.add(href)

        episodes.append({"label": label, "url": href})

    return episodes


def label_to_filename(label: str, index: int) -> str:
    """
    Convert episode label to a filename.
    e.g. "⭕ Episode 1:1 Pilot" → "S01E01_Pilot.txt"
    Falls back to "episode_NNN.txt" if pattern not matched.
    """
    # Try to match season:episode pattern like "1:1" or "10:22"
    m = re.search(r"(\d+):(\d+)\s*(.*)", label)
    if m:
        season = int(m.group(1))
        episode = int(m.group(2))
        title = m.group(3).strip()
        # Clean title for filename
        title = re.sub(r"[^\w\s-]", "", title)
        title = re.sub(r"[\s-]+", "_", title).strip("_")
        title = title[:40]  # cap length
        base = f"S{season:02d}E{episode:02d}"
        return f"{base}_{title}.txt" if title else f"{base}.txt"
    # Fallback
    return f"episode_{index:03d}.txt"


def extract_transcript(html: str) -> str:
    """
    Extract the screenplay text from an episode page.
    blacklistdcd.com uses WordPress — content is in .entry-content div.
    Preserves stage directions in [ brackets ] and scene breaks ⋘⋙.
    """
    soup = BeautifulSoup(html, "lxml")

    # Try common WordPress content containers
    for selector in [
        {"class_": "entry-content"},
        {"class_": "post-content"},
        {"class_": "td-post-content"},
        {"id": "content"},
    ]:
        container = soup.find("div", **selector)
        if container:
            return container.get_text(separator="\n").strip()

    # Fallback: largest text block
    paragraphs = soup.find_all("p")
    if paragraphs:
        return "\n".join(p.get_text() for p in paragraphs).strip()

    return soup.get_text(separator="\n").strip()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    session = make_session()

    log.info("Fetching episode index from blacklistdcd.com…")
    index_html = get(session, INDEX_URL).text
    episodes = parse_episode_links(index_html)

    if not episodes:
        log.error("No episode links found — page structure may have changed.")
        return

    log.info(f"Found {len(episodes)} episode links.")
    log.info("Waiting 15s before starting downloads to avoid rate limiting…")
    time.sleep(15)

    success, skipped, failed = 0, 0, 0

    for i, ep in enumerate(episodes, 1):
        filename = label_to_filename(ep["label"], i)
        out_path = OUT_DIR / filename

        if out_path.exists():
            log.info(f"[{i}/{len(episodes)}] SKIP (exists): {filename}")
            skipped += 1
            continue

        log.info(f"[{i}/{len(episodes)}] Downloading: {ep['label']}")
        try:
            # Set Referer to look like we're navigating from the index page
            session.headers["Referer"] = INDEX_URL
            html = get(session, ep["url"]).text
            transcript = extract_transcript(html)

            if len(transcript) < 200:
                log.warning(f"  Very short transcript ({len(transcript)} chars) — may be wrong page")

            out_path.write_text(transcript, encoding="utf-8")
            log.info(f"  Saved {len(transcript):,} chars to {filename}")
            success += 1
        except Exception as exc:
            log.error(f"  ERROR for {ep['label']}: {exc}")
            failed += 1

        if i < len(episodes):
            log.info(f"  Waiting {DELAY}s before next episode…")
            time.sleep(DELAY)

    log.info(
        f"\nDone. {success} downloaded, {skipped} skipped, {failed} failed."
        f"\nTranscripts saved to: {OUT_DIR}"
    )


if __name__ == "__main__":
    main()
