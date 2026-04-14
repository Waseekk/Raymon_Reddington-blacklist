"""
Scrape Blacklist episode transcripts from blacklistdcd.com.

Accessible sources (Cloudflare blocks ?p=XXXX query-param URLs):
  S1, S3, S6  — season compilation pages (one big page per season)
  S9, S10     — individual dated permalink URLs from the index page

Usage:
    cd backend
    python rag/scraper.py

Safe to re-run — already-downloaded files are skipped.
"""

import re
import time
import random
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

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Full season compilation pages — one URL contains all episodes for that season
COMPILATION_PAGES = {
    1: "https://blacklistdcd.com/2012/01/12/%f0%9f%94%b4-season-one-scripts/",
    3: "https://blacklistdcd.com/2012/03/03/%f0%9f%94%b4-easy-search-s3-scripts/",
    6: "https://blacklistdcd.com/2012/06/06/%f0%9f%94%b4-easy-search-s6-scripts-%e2%ac%85%ef%b8%8f%ee%81%8a/",
}

# Seasons with individual dated permalink URLs in the index (S9, S10)
DIRECT_SEASONS = {9, 10}

DELAY_MIN = 25.0
DELAY_MAX = 40.0
MAX_RETRIES = 3


def get(url: str) -> requests.Response:
    """Stateless GET with retries and backoff."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
            if resp.status_code == 429:
                wait = 60 * attempt
                log.warning(f"429 from {resp.url}. Waiting {wait}s (retry {attempt})…")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            wait = 2 ** attempt
            log.warning(f"Attempt {attempt} failed for {url}: {exc}. Retry in {wait}s…")
            time.sleep(wait)
    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} attempts")


def parse_direct_links(html: str) -> dict[tuple, str]:
    """Find direct dated permalink links for episodes (S9, S10) in the index page."""
    soup = BeautifulSoup(html, "lxml")
    DATED_RE = re.compile(r"blacklistdcd\.com/\d{4}/\d{2}/\d{2}/")
    EPISODE_NUM_RE = re.compile(r"(\d+):(\d+)")
    direct_map = {}
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not DATED_RE.search(href) or "#" in href or "?" in href:
            continue
        if href in seen:
            continue
        label = a.get_text(separator=" ", strip=True)
        m = EPISODE_NUM_RE.search(label)
        if not m:
            continue
        seen.add(href)
        key = (int(m.group(1)), int(m.group(2)))
        direct_map[key] = (href, label)
    return direct_map


def label_to_filename(label: str, index: int) -> str:
    m = re.search(r"(\d+):(\d+)\s*(.*)", label)
    if m:
        season, episode = int(m.group(1)), int(m.group(2))
        title = re.sub(r"[^\w\s-]", "", m.group(3).strip())
        title = re.sub(r"[\s-]+", "_", title).strip("_")[:40]
        base = f"S{season:02d}E{episode:02d}"
        return f"{base}_{title}.txt" if title else f"{base}.txt"
    return f"episode_{index:03d}.txt"


def extract_transcript(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for selector in [
        {"class_": "entry-content"},
        {"class_": "post-content"},
        {"class_": "td-post-content"},
        {"id": "content"},
    ]:
        container = soup.find("div", **selector)
        if container:
            return container.get_text(separator="\n").strip()
    paragraphs = soup.find_all("p")
    if paragraphs:
        return "\n".join(p.get_text() for p in paragraphs).strip()
    return soup.get_text(separator="\n").strip()


def pause():
    delay = random.uniform(DELAY_MIN, DELAY_MAX)
    log.info(f"  Waiting {delay:.1f}s…")
    time.sleep(delay)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    log.info("Fetching episode index…")
    index_html = get(INDEX_URL).text
    direct_map = parse_direct_links(index_html)

    # Filter to only direct-season episodes (S9, S10)
    direct_episodes = {
        key: val for key, val in direct_map.items()
        if key[0] in DIRECT_SEASONS
    }
    log.info(f"Found {len(direct_episodes)} direct dated links for S9/S10.")

    success, skipped, failed = 0, 0, 0

    # -----------------------------------------------------------------------
    # 1. Individual S9 and S10 episodes via direct dated URLs
    # -----------------------------------------------------------------------
    log.info("\n--- Downloading S9 and S10 individual episodes ---")
    for i, ((season, ep_num), (url, label)) in enumerate(
        sorted(direct_episodes.items()), 1
    ):
        filename = label_to_filename(label, i)
        out_path = OUT_DIR / filename

        if out_path.exists():
            log.info(f"SKIP (exists): {filename}")
            skipped += 1
            continue

        pause()
        log.info(f"[S{season:02d}E{ep_num:02d}] {label}")
        try:
            html = get(url).text
            transcript = extract_transcript(html)
            if len(transcript) < 200:
                log.warning(f"  Very short ({len(transcript)} chars)")
            out_path.write_text(transcript, encoding="utf-8")
            log.info(f"  Saved {len(transcript):,} chars → {filename}")
            success += 1
        except Exception as exc:
            log.error(f"  ERROR: {exc}")
            failed += 1

    # -----------------------------------------------------------------------
    # 2. Season compilation pages for S1, S3, S6
    # -----------------------------------------------------------------------
    log.info("\n--- Downloading season compilation pages (S1, S3, S6) ---")
    for season, comp_url in COMPILATION_PAGES.items():
        out_path = OUT_DIR / f"S{season:02d}_compiled.txt"
        if out_path.exists():
            log.info(f"SKIP (exists): S{season:02d}_compiled.txt")
            skipped += 1
            continue

        pause()
        log.info(f"S{season:02d} compilation page…")
        try:
            html = get(comp_url).text
            transcript = extract_transcript(html)
            if len(transcript) < 1000:
                log.warning(f"  Very short ({len(transcript)} chars)")
            out_path.write_text(transcript, encoding="utf-8")
            log.info(f"  Saved {len(transcript):,} chars → S{season:02d}_compiled.txt")
            success += 1
        except Exception as exc:
            log.error(f"  ERROR for S{season:02d}: {exc}")
            failed += 1

    log.info(
        f"\nDone. {success} downloaded, {skipped} skipped, {failed} failed."
        f"\nTranscripts in: {OUT_DIR}"
    )


if __name__ == "__main__":
    main()
