#!/usr/bin/env python3
"""Fetch real public jobs into JobCollar's SQLite database.

The worker intentionally avoids RemoteOK and only uses sources listed in
data/sources.json. Each run upserts seen jobs and can expire active jobs from a
source when those jobs no longer appear in the source response.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.environ.get("JOBCOLLAR_DB", ROOT / "storage" / "jobcollar.sqlite"))
SOURCES_PATH = ROOT / "data" / "sources.json"
TRADES_PATH = ROOT / "data" / "trades.json"

USER_AGENT = "JobCollarBot/0.1 (+https://jobcollar.com; public job aggregator)"

EXCLUDE_PATTERNS = [
    "software engineer",
    "frontend",
    "backend",
    "full stack",
    "data scientist",
    "product manager",
    "account executive",
    "sales development",
    "growth marketer",
    "ux designer",
    "remote ok",
    "remoteok",
]

AI_RESISTANT_SIGNALS = [
    "install",
    "repair",
    "maintain",
    "operate",
    "drive",
    "weld",
    "inspect",
    "field",
    "construction",
    "equipment",
    "license",
    "cdl",
    "apprentice",
    "journeyman",
    "shift",
    "site",
    "plant",
    "warehouse",
    "emergency",
    "hands-on",
    "manual",
]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def utc_today() -> dt.date:
    return dt.datetime.now(dt.timezone.utc).date()


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode = WAL")
    migrate(con)
    return con


def migrate(con: sqlite3.Connection) -> None:
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            source_name TEXT NOT NULL,
            external_id TEXT NOT NULL,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            category TEXT NOT NULL,
            trade TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            url TEXT NOT NULL,
            salary_min REAL,
            salary_max REAL,
            salary_text TEXT,
            posted_at TEXT,
            expires_at TEXT,
            ai_proof_score INTEGER NOT NULL DEFAULT 75,
            ai_proof_notes TEXT NOT NULL DEFAULT '',
            tags_json TEXT NOT NULL DEFAULT '[]',
            source_payload TEXT NOT NULL DEFAULT '{}',
            first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER NOT NULL DEFAULT 1,
            UNIQUE(source_id, external_id)
        );
        CREATE INDEX IF NOT EXISTS idx_jobs_active_posted ON jobs(is_active, posted_at DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category, trade);
        CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
        CREATE TABLE IF NOT EXISTS sync_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            status TEXT NOT NULL,
            started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            finished_at TEXT,
            fetched_count INTEGER NOT NULL DEFAULT 0,
            upserted_count INTEGER NOT NULL DEFAULT 0,
            expired_count INTEGER NOT NULL DEFAULT 0,
            error TEXT
        );
        """
    )


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def request_json(url: str, retries: int = 2) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return json.loads(response.read().decode(charset))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            if attempt >= retries:
                raise
            time.sleep(2**attempt)


def clean_text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_date(value: Any) -> str | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    if text.isdigit():
        try:
            return dt.datetime.fromtimestamp(int(text), tz=dt.timezone.utc).replace(microsecond=0).isoformat()
        except (ValueError, OSError):
            return None
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            parsed = dt.datetime.strptime(text[:26], fmt)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=dt.timezone.utc)
            return parsed.replace(microsecond=0).isoformat()
        except ValueError:
            continue
    try:
        return dt.datetime.fromisoformat(text.replace("Z", "+00:00")).replace(microsecond=0).isoformat()
    except ValueError:
        return None


def parse_expiry(value: Any) -> str | None:
    parsed = parse_date(value)
    return parsed


def expired(expires_at: str | None) -> bool:
    if not expires_at:
        return False
    try:
        return dt.datetime.fromisoformat(expires_at).date() < utc_today()
    except ValueError:
        return False


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def trade_aliases(trade: str) -> set[str]:
    base = normalize_key(trade)
    aliases = {base}
    aliases.add(base.replace(" technician", " tech"))
    aliases.add(base.replace(" installer repairer", " installer"))
    aliases.add(base.replace(" dockworker longshoreman", " dockworker"))
    if "/" in trade:
        aliases.update(normalize_key(part) for part in trade.split("/"))
    if trade.lower().endswith(" worker"):
        aliases.add(base.removesuffix(" worker").strip())
    if trade.lower().endswith(" technician"):
        aliases.add(base.removesuffix(" technician").strip())
    if trade.lower().endswith(" operator"):
        aliases.add(base.removesuffix(" operator").strip())
    return {alias for alias in aliases if len(alias) >= 3}


def classify_job(trades: dict[str, list[str]], title: str, description: str, tags: Iterable[str]) -> tuple[str, str] | None:
    haystack = normalize_key(" ".join([title, description, " ".join(tags)]))
    if any(pattern in haystack for pattern in EXCLUDE_PATTERNS):
        return None

    best: tuple[int, str, str] | None = None
    for category, trade_names in trades.items():
        for trade in trade_names:
            aliases = trade_aliases(trade)
            for alias in aliases:
                if re.search(rf"\b{re.escape(alias)}s?\b", haystack):
                    score = len(alias)
                    if best is None or score > best[0]:
                        best = (score, category, trade)

    if best:
        return best[1], best[2]

    industry_terms = {
        "Construction & Building Trades": [
            ("construction", "Construction laborer"),
            ("building maintenance", "Construction laborer"),
            ("facility maintenance", "Construction laborer"),
        ],
        "Manufacturing & Factory Jobs": [
            ("manufacturing", "Factory worker"),
            ("production", "Production technician"),
            ("factory", "Factory worker"),
            ("assembly", "Assembly line worker"),
        ],
        "Transportation & Logistics": [
            ("warehouse", "Warehouse worker"),
            ("logistics", "Logistics operator"),
            ("freight", "Freight handler"),
            ("driver", "Delivery driver"),
        ],
        "Utilities & Energy": [
            ("utility", "Utility worker"),
            ("water treatment", "Water treatment operator"),
            ("power plant", "Plant operator"),
            ("energy", "Utility worker"),
        ],
        "Public Safety & Service": [
            ("firefighter", "Firefighter"),
            ("public safety", "Security guard"),
            ("custodian", "Custodian/janitor"),
            ("sanitation", "Sanitation worker"),
        ],
    }
    for category, terms in industry_terms.items():
        for term, fallback_trade in terms:
            if term in haystack:
                return category, fallback_trade

    return None


def ai_score(title: str, description: str, trade: str) -> tuple[int, str]:
    text = normalize_key(f"{title} {description} {trade}")
    score = 72
    for signal in AI_RESISTANT_SIGNALS:
        if signal in text:
            score += 2
    if any(word in text for word in ["licensed", "license", "certified", "cdl", "journeyman"]):
        score += 6
    if any(word in text for word in ["field", "onsite", "site", "emergency"]):
        score += 5
    score = max(65, min(score, 98))
    if score >= 90:
        note = "High hands-on resilience"
    elif score >= 80:
        note = "Strong physical-world work"
    else:
        note = "Practical trade pathway"
    return score, note


def salary_text(min_salary: Any, max_salary: Any, salary_frequency: str | None = None) -> tuple[float | None, float | None, str | None]:
    def to_float(value: Any) -> float | None:
        if value in (None, ""):
            return None
        try:
            return float(str(value).replace(",", "").replace("$", ""))
        except ValueError:
            return None

    low = to_float(min_salary)
    high = to_float(max_salary)
    if low is None and high is None:
        return None, None, None

    suffix = f" {salary_frequency.lower()}" if salary_frequency else ""
    if low is not None and high is not None:
        text = f"${low:,.0f}-${high:,.0f}{suffix}"
    elif low is not None:
        text = f"${low:,.0f}+{suffix}"
    else:
        text = f"up to ${high:,.0f}{suffix}"
    return low, high, text


def normalize_arbeitnow(item: dict[str, Any], source: dict[str, Any], trades: dict[str, list[str]]) -> dict[str, Any] | None:
    title = clean_text(item.get("title"))
    description = clean_text(item.get("description"))
    tags = [clean_text(tag) for tag in item.get("tags", []) if clean_text(tag)]
    classified = classify_job(trades, title, description, tags)
    if not classified:
        return None
    category, trade = classified
    score, note = ai_score(title, description, trade)
    external_id = str(item.get("slug") or item.get("url") or title)
    return {
        "source_id": source["id"],
        "source_name": source["name"],
        "external_id": external_id,
        "title": title,
        "company": clean_text(item.get("company_name")) or "Company not listed",
        "location": clean_text(item.get("location")) or "Location not listed",
        "category": category,
        "trade": trade,
        "description": description,
        "url": item.get("url") or source["url"],
        "salary_min": None,
        "salary_max": None,
        "salary_text": None,
        "posted_at": parse_date(item.get("created_at") or item.get("published_at")),
        "expires_at": None,
        "ai_proof_score": score,
        "ai_proof_notes": note,
        "tags_json": json.dumps(tags[:8]),
        "source_payload": json.dumps(item, ensure_ascii=False),
    }


def normalize_nyc(item: dict[str, Any], source: dict[str, Any], trades: dict[str, list[str]]) -> dict[str, Any] | None:
    title = clean_text(item.get("business_title") or item.get("civil_service_title"))
    description = clean_text(" ".join([
        str(item.get("job_description") or ""),
        str(item.get("minimum_qual_requirements") or ""),
        str(item.get("preferred_skills") or ""),
    ]))
    tags = [
        clean_text(item.get("job_category")),
        clean_text(item.get("full_time_part_time_indicator")),
        clean_text(item.get("career_level")),
    ]
    classified = classify_job(trades, title, description, tags)
    if not classified:
        return None

    expires_at = parse_expiry(item.get("post_until"))
    if expired(expires_at):
        return None

    category, trade = classified
    score, note = ai_score(title, description, trade)
    low, high, salary = salary_text(item.get("salary_range_from"), item.get("salary_range_to"), item.get("salary_frequency"))
    job_id = str(item.get("job_id") or item.get("posting_updated") or title)
    url = f"https://cityjobs.nyc.gov/jobs?keyword={urllib.parse.quote(job_id)}"
    return {
        "source_id": source["id"],
        "source_name": source["name"],
        "external_id": job_id,
        "title": title,
        "company": clean_text(item.get("agency")) or "City of New York",
        "location": clean_text(item.get("work_location") or item.get("work_location_1")) or "New York, NY",
        "category": category,
        "trade": trade,
        "description": description,
        "url": url,
        "salary_min": low,
        "salary_max": high,
        "salary_text": salary,
        "posted_at": parse_date(item.get("posting_date") or item.get("posting_updated")),
        "expires_at": expires_at,
        "ai_proof_score": score,
        "ai_proof_notes": note,
        "tags_json": json.dumps([tag for tag in tags if tag][:8]),
        "source_payload": json.dumps(item, ensure_ascii=False),
    }


def fetch_arbeitnow(source: dict[str, Any], trades: dict[str, list[str]]) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    max_pages = int(source.get("max_pages", 3))
    for page in range(1, max_pages + 1):
        sep = "&" if "?" in source["url"] else "?"
        payload = request_json(f"{source['url']}{sep}page={page}")
        items = payload.get("data", []) if isinstance(payload, dict) else []
        if not items:
            break
        for item in items:
            normalized = normalize_arbeitnow(item, source, trades)
            if normalized:
                jobs.append(normalized)
        if not (payload.get("links") or {}).get("next"):
            break
    return jobs


def fetch_nyc(source: dict[str, Any], trades: dict[str, list[str]]) -> list[dict[str, Any]]:
    payload = request_json(source["url"])
    if not isinstance(payload, list):
        return []
    jobs = []
    for item in payload:
        normalized = normalize_nyc(item, source, trades)
        if normalized:
            jobs.append(normalized)
    return jobs


FETCHERS = {
    "arbeitnow": fetch_arbeitnow,
    "nyc_open_data": fetch_nyc,
}


def upsert_job(con: sqlite3.Connection, job: dict[str, Any], seen_at: str) -> None:
    con.execute(
        """
        INSERT INTO jobs (
            source_id, source_name, external_id, title, company, location, category, trade,
            description, url, salary_min, salary_max, salary_text, posted_at, expires_at,
            ai_proof_score, ai_proof_notes, tags_json, source_payload, first_seen_at,
            last_seen_at, is_active
        ) VALUES (
            :source_id, :source_name, :external_id, :title, :company, :location, :category, :trade,
            :description, :url, :salary_min, :salary_max, :salary_text, :posted_at, :expires_at,
            :ai_proof_score, :ai_proof_notes, :tags_json, :source_payload, :seen_at,
            :seen_at, 1
        )
        ON CONFLICT(source_id, external_id) DO UPDATE SET
            source_name = excluded.source_name,
            title = excluded.title,
            company = excluded.company,
            location = excluded.location,
            category = excluded.category,
            trade = excluded.trade,
            description = excluded.description,
            url = excluded.url,
            salary_min = excluded.salary_min,
            salary_max = excluded.salary_max,
            salary_text = excluded.salary_text,
            posted_at = excluded.posted_at,
            expires_at = excluded.expires_at,
            ai_proof_score = excluded.ai_proof_score,
            ai_proof_notes = excluded.ai_proof_notes,
            tags_json = excluded.tags_json,
            source_payload = excluded.source_payload,
            last_seen_at = excluded.last_seen_at,
            is_active = 1
        """,
        {**job, "seen_at": seen_at},
    )


def expire_missing(con: sqlite3.Connection, source_id: str, seen_ids: set[str], seen_at: str) -> int:
    if not seen_ids:
        return 0

    placeholders = ",".join("?" for _ in seen_ids)
    params: list[Any] = [seen_at, source_id, *seen_ids]
    cur = con.execute(
        f"""
        UPDATE jobs
        SET is_active = 0, last_seen_at = ?
        WHERE source_id = ?
            AND is_active = 1
            AND external_id NOT IN ({placeholders})
        """,
        params,
    )
    return cur.rowcount


def sync_source(con: sqlite3.Connection, source: dict[str, Any], trades: dict[str, list[str]], should_expire_missing: bool) -> None:
    run_started = now_iso()
    run_id = con.execute(
        "INSERT INTO sync_runs(source_id, status, started_at) VALUES (?, ?, ?)",
        (source["id"], "running", run_started),
    ).lastrowid
    con.commit()

    fetched_count = upserted_count = expired_count = 0
    try:
        fetcher = FETCHERS[source["type"]]
        jobs = fetcher(source, trades)
        seen_at = now_iso()
        seen_ids = {job["external_id"] for job in jobs}
        fetched_count = len(jobs)
        with con:
            for job in jobs:
                upsert_job(con, job, seen_at)
                upserted_count += 1
            if should_expire_missing:
                expired_count = expire_missing(con, source["id"], seen_ids, seen_at)
            con.execute(
                """
                UPDATE sync_runs
                SET status = 'ok', finished_at = ?, fetched_count = ?, upserted_count = ?, expired_count = ?
                WHERE id = ?
                """,
                (seen_at, fetched_count, upserted_count, expired_count, run_id),
            )
        print(f"{source['id']}: fetched={fetched_count} upserted={upserted_count} expired={expired_count}")
    except Exception as exc:  # noqa: BLE001 - record source-level failure and continue.
        finished = now_iso()
        with con:
            con.execute(
                """
                UPDATE sync_runs
                SET status = 'error', finished_at = ?, fetched_count = ?, upserted_count = ?, expired_count = ?, error = ?
                WHERE id = ?
                """,
                (finished, fetched_count, upserted_count, expired_count, str(exc), run_id),
            )
        print(f"{source['id']}: ERROR {exc}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync public blue-collar jobs into SQLite.")
    parser.add_argument("--source", help="Only sync one source id")
    parser.add_argument("--no-expire", action="store_true", help="Do not expire missing jobs")
    args = parser.parse_args()

    config = load_json(SOURCES_PATH)
    trades = load_json(TRADES_PATH)
    sources = [source for source in config.get("sources", []) if source.get("enabled", True)]
    if args.source:
        sources = [source for source in sources if source["id"] == args.source]
    if not sources:
        print("No enabled sources matched.", file=sys.stderr)
        return 1

    con = connect()
    should_expire = bool(config.get("expire_missing", True)) and not args.no_expire
    for source in sources:
        if source.get("type") not in FETCHERS:
            print(f"{source['id']}: unsupported source type {source.get('type')}", file=sys.stderr)
            continue
        sync_source(con, source, trades, should_expire)
    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
