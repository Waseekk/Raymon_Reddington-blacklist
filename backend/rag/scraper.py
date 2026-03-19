"""
One-time script: scrape all Blacklist episode transcripts from
springfieldspringfield.co.uk and save them to data/transcripts/.

Usage:
    cd backend
    python rag/scraper.py

Safe to re-run — already-downloaded files are skipped.
"""

import os
import re
import time
import logging
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

BASE_URL = "https://www.springfieldspringfield.co.uk"
SHOW_URL = f"{BASE_URL}/episode_scripts.php?tv-show=the-blacklist"
OUT_DIR = Path(__file__).parent.parent / "data" / "transcripts"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}
DELAY = 1.2        # seconds between requests
MAX_RETRIES = 3


def get(url: str) -> requests.Response:
    """GET with retries and exponential backoff."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            wait = 2 ** attempt
            log.warning(f"Attempt {attempt} failed for {url}: {exc}. Retrying in {wait}s…")
            time.sleep(wait)
    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} attempts")


def parse_episode_links(html: str) -> list[dict]:
    """Return list of {label, url} for every episode on the show page."""
    soup = BeautifulSoup(html, "html.parser")
    episodes = []
    for a in soup.select("a[href*='view_episode_scripts']"):
        href = a["href"]
        full_url = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('/')}"
        episodes.append({"label": a.get_text(strip=True), "url": full_url})
    return episodes


def label_to_filename(label: str) -> str:
    """Convert 'S01E01 - Pilot' → 'S01E01_Pilot.txt'"""
    safe = re.sub(r"[^\w\s-]", "", label)
    safe = re.sub(r"[\s-]+", "_", safe).strip("_")
    return f"{safe}.txt"


def extract_transcript(html: str) -> str:
    """Pull the plain transcript text from an episode page."""
    soup = BeautifulSoup(html, "html.parser")
    # Springfield Springfield wraps transcript in a div with class 'scrolling-script-container'
    container = soup.find("div", class_="scrolling-script-container")
    if container:
        return container.get_text(separator="\n").strip()
    # Fallback: largest <p> block
    paragraphs = soup.find_all("p")
    if paragraphs:
        return "\n".join(p.get_text() for p in paragraphs).strip()
    return soup.get_text(separator="\n").strip()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    log.info(f"Fetching episode list from {SHOW_URL}")
    index_html = get(SHOW_URL).text
    episodes = parse_episode_links(index_html)

    if not episodes:
        log.error("No episodes found — the page structure may have changed.")
        return

    log.info(f"Found {len(episodes)} episodes.")

    for i, ep in enumerate(episodes, 1):
        filename = label_to_filename(ep["label"])
        out_path = OUT_DIR / filename

        if out_path.exists():
            log.info(f"[{i}/{len(episodes)}] SKIP (exists): {filename}")
            continue

        log.info(f"[{i}/{len(episodes)}] Downloading: {ep['label']}")
        try:
            html = get(ep["url"]).text
            transcript = extract_transcript(html)
            out_path.write_text(transcript, encoding="utf-8")
            log.info(f"  → Saved {len(transcript):,} chars to {filename}")
        except Exception as exc:
            log.error(f"  → ERROR for {ep['label']}: {exc}")

        time.sleep(DELAY)

    log.info("Scraping complete.")


if __name__ == "__main__":
    main()
