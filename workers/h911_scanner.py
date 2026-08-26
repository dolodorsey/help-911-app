#!/usr/bin/env python3
"""H911 radio-to-lead worker for local SDR recordings or authorized streams."""

import hashlib
import json
import logging
import os
import re
import signal
import sqlite3
import subprocess
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from shutil import which

import requests

CONFIG_PATH = Path.home() / ".h911_config.json"
LOG_PATH = Path(os.environ.get("H911_LOG_PATH", str(Path.home() / "h911_scanner.log")))
DEFAULT_RECORDINGS_DIR = Path.home() / "Desktop" / "TERMINAL" / "h911-radio" / "recordings"
CHUNK_SECONDS = 45
MAX_CONCURRENT = 6
SUPPORTED_AUDIO = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"}
LOCAL_SYSTEMS = {
    "atlanta": {"feed_id": "atlanta-p25", "feed_name": "Atlanta Public Safety", "county": "Fulton"},
    "dekalb": {"feed_id": "dekalb-p25", "feed_name": "DeKalb Public Safety", "county": "DeKalb"},
    "cobb": {"feed_id": "cobb-p25", "feed_name": "Cobb Public Safety", "county": "Cobb"},
    "coweta": {"feed_id": "coweta-p25", "feed_name": "Coweta Public Safety", "county": "Coweta"},
    "spalding": {"feed_id": "spalding-p25", "feed_name": "Spalding Public Safety", "county": "Spalding"},
}

FEEDS = {
    "35626": ("Atlanta Fire Rescue", "Fulton"),
    "40345": ("Atlanta Metro Public Safety", "Fulton"),
    "37528": ("DeKalb County Fire Rescue", "DeKalb"),
    "44774": ("Decatur Police/Fire", "DeKalb"),
    "32253": ("Cobb County Public Safety", "Cobb"),
    "42181": ("Coweta County Public Safety", "Coweta"),
    "31181": ("Spalding County Public Safety", "Spalding"),
}
CRASH_KEYWORDS = (
    "10-50", "ten fifty", "accident", "crash", "collision", "wreck",
    "motor vehicle", "mvc", "mva", "rollover", "overturned",
    "pedestrian struck", "hit and run", "entrapment", "ejection",
    "fatality", "dead on arrival", "injury accident", "extrication",
    "multi-vehicle", "head-on", "t-bone", "pileup", "vehicle fire",
)
SEVERITY_KEYWORDS = {
    "fatal": ("fatal", "fatality", "dead on arrival", "deceased", "coroner"),
    "serious": ("entrapment", "extrication", "ejection", "rollover", "critical", "unresponsive"),
    "injury": ("injuries", "injury", "ambulance", "ems", "transport", "hospital", "medic"),
}


def configure_logging():
    logger = logging.getLogger("h911")
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    rotating = RotatingFileHandler(LOG_PATH, maxBytes=5_000_000, backupCount=3)
    rotating.setFormatter(formatter)
    logger.handlers[:] = [stream, rotating]
    return logger


LOGGER = configure_logging()


def load_config(path=CONFIG_PATH):
    if not path.exists():
        raise RuntimeError("missing config: %s" % path)
    config = json.loads(path.read_text())
    required = ("supabase_url", "supabase_key")
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise RuntimeError("missing required config keys: " + ", ".join(missing))
    configured_directory = os.environ.get("H911_RECORDINGS_DIR")
    if configured_directory:
        config["recordings_dir"] = configured_directory
    elif not config.get("recordings_dir") and not config.get("feed_urls"):
        config["recordings_dir"] = str(DEFAULT_RECORDINGS_DIR)
    if not config.get("recordings_dir") and not config.get("feed_urls"):
        raise RuntimeError("configure recordings_dir for local SDR or feed_urls for authorized streams")
    if config.get("feed_urls") and not isinstance(config["feed_urls"], dict):
        raise RuntimeError("feed_urls must be an object keyed by feed ID")
    return config


def configured_feeds(config):
    feeds = []
    for feed_id, url in config.get("feed_urls", {}).items():
        if feed_id not in FEEDS or not isinstance(url, str) or not url.startswith("https://"):
            LOGGER.warning("feed_config_skipped feed_id=%s", feed_id)
            continue
        name, county = FEEDS[feed_id]
        feeds.append({"id": feed_id, "name": name, "county": county, "url": url})
    return feeds


class Ledger:
    """Local idempotency ledger so restarts never duplicate Supabase rows."""

    def __init__(self, path):
        self.lock = threading.Lock()
        self.connection = sqlite3.connect(str(path), timeout=30, check_same_thread=False)
        self.connection.execute(
            "create table if not exists processed (sha256 text primary key, path text, processed_at text)"
        )
        self.connection.commit()

    def contains(self, digest):
        with self.lock:
            return self.connection.execute("select 1 from processed where sha256=?", (digest,)).fetchone() is not None

    def mark(self, digest, path):
        with self.lock:
            self.connection.execute(
                "insert or ignore into processed(sha256,path,processed_at) values(?,?,?)",
                (digest, str(path), datetime.now(timezone.utc).isoformat()),
            )
            self.connection.commit()


class Supabase:
    def __init__(self, config):
        self.base = config["supabase_url"].rstrip("/") + "/rest/v1"
        key = config["supabase_key"]
        self.headers = {
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def preflight(self):
        response = requests.get(
            self.base + "/h911_scanner_transcripts?select=id&limit=1",
            headers=self.headers,
            timeout=15,
        )
        if response.status_code != 200:
            raise RuntimeError("Supabase preflight failed: HTTP %s %s" % (response.status_code, response.text[:160]))

    def insert(self, table, payload):
        response = requests.post(self.base + "/" + table, headers=self.headers, json=payload, timeout=20)
        if response.status_code not in (200, 201):
            raise RuntimeError("%s insert failed: HTTP %s %s" % (table, response.status_code, response.text[:200]))
        rows = response.json()
        return rows[0] if rows else None


def capture_audio(feed, duration=CHUNK_SECONDS):
    handle, raw_path = tempfile.mkstemp(prefix="h911_%s_" % feed["id"], suffix=".mp3")
    os.close(handle)
    path = Path(raw_path)
    command = [
        "ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", feed["url"],
        "-t", str(duration), "-ar", "16000", "-ac", "1", "-b:a", "32k", str(path),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=duration + 30)
    except subprocess.TimeoutExpired as exc:
        path.unlink(missing_ok=True)
        raise RuntimeError("audio timeout after %ss" % exc.timeout)
    if result.returncode != 0 or not path.exists() or path.stat().st_size < 1000:
        path.unlink(missing_ok=True)
        detail = (result.stderr or "empty audio response").strip().replace("\n", " ")[:240]
        raise RuntimeError("audio capture failed: " + detail)
    return path


def local_whisper_paths(config):
    root = Path.home() / "Desktop" / "TERMINAL" / "whisper.cpp"
    cli = Path(config.get("whisper_cli", root / "build" / "bin" / "whisper-cli"))
    model = Path(config.get("whisper_model", root / "models" / "ggml-base.en.bin"))
    return cli, model


def transcribe_local(path, config):
    cli, model = local_whisper_paths(config)
    handle, wav_name = tempfile.mkstemp(prefix="h911_whisper_", suffix=".wav")
    os.close(handle)
    wav = Path(wav_name)
    try:
        converted = subprocess.run(
            ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", str(path),
             "-ar", "16000", "-ac", "1", str(wav)],
            capture_output=True, text=True, timeout=60,
        )
        if converted.returncode != 0:
            raise RuntimeError("audio conversion failed: " + converted.stderr.strip()[:180])
        whisper_command = [
            str(cli), "-m", str(model), "-f", str(wav), "--no-timestamps", "-t",
            str(config.get("whisper_threads", 4)), "--language", "en",
        ]
        if config.get("whisper_cpu_only", True):
            whisper_command.append("--no-gpu")
        result = subprocess.run(
            whisper_command,
            capture_output=True, text=True, timeout=int(config.get("whisper_timeout_seconds", 180)),
        )
        if result.returncode != 0:
            raise RuntimeError("local transcription failed: " + result.stderr.strip()[-220:])
        transcript = re.sub(r"\[.*?\]", "", result.stdout).strip()
        if not transcript:
            raise RuntimeError("local transcription returned no speech")
        return transcript, {"engine": "whisper.cpp", "model": model.name}
    finally:
        wav.unlink(missing_ok=True)


def transcribe_openai(path, api_key):
    with path.open("rb") as audio:
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": "Bearer " + api_key},
            files={"file": (path.name, audio, "audio/mpeg")},
            data={
                "model": "whisper-1", "language": "en", "response_format": "json",
                "prompt": "Georgia police fire EMS dispatch, traffic collision, 10-50, motor vehicle crash",
            },
            timeout=90,
        )
    if response.status_code != 200:
        raise RuntimeError("transcription failed: HTTP %s %s" % (response.status_code, response.text[:180]))
    data = response.json()
    return str(data.get("text", "")).strip(), data


def transcribe(path, config, delete_source=False):
    cli, model = local_whisper_paths(config)
    try:
        if cli.exists() and model.exists():
            return transcribe_local(path, config)
        if config.get("openai_api_key"):
            return transcribe_openai(path, config["openai_api_key"])
        raise RuntimeError("local whisper is unavailable and no transcription fallback is configured")
    finally:
        if delete_source:
            path.unlink(missing_ok=True)


def classify(transcript):
    lowered = transcript.lower()
    keywords = sorted({keyword for keyword in CRASH_KEYWORDS if keyword in lowered})
    severity = "minor"
    for level, candidates in SEVERITY_KEYWORDS.items():
        if any(candidate in lowered for candidate in candidates):
            severity = level
            break
    location = ""
    for pattern in (
        r"(?:on|at|near)\s+([\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Highway|Hwy|Parkway|Pkwy))",
        r"(I-\d+\s*(?:north|south|east|west|NB|SB|EB|WB)?)",
    ):
        matches = re.findall(pattern, transcript, re.IGNORECASE)
        if matches:
            location = "; ".join(matches[:3])
            break
    score = {"fatal": 90, "serious": 70, "injury": 50, "minor": 25}[severity]
    return {"keywords": keywords[:10], "severity": severity, "location": location, "lead_score": score}


def process_feed(feed, config, database):
    started = time.monotonic()
    audio = capture_audio(feed)
    audio_bytes = audio.stat().st_size
    transcript, raw = transcribe(audio, config, delete_source=True)
    result = classify(transcript)
    database.insert("h911_scanner_transcripts", {
        "feed_id": feed["id"], "feed_name": feed["name"], "county": feed["county"],
        "recorded_at": datetime.now(timezone.utc).isoformat(), "audio_seconds": CHUNK_SECONDS,
        "audio_bytes": audio_bytes, "transcript": transcript[:8000], "transcript_chars": len(transcript),
        "has_crash_keywords": bool(result["keywords"]), "crash_keywords_found": result["keywords"],
        "extracted_address": result["location"] or None, "extracted_severity": result["severity"],
        "raw_response": raw,
    })
    if not result["keywords"]:
        LOGGER.info("feed_ok feed_id=%s chars=%d elapsed=%.1fs", feed["id"], len(transcript), time.monotonic() - started)
        return False
    lead = database.insert("h911_accident_leads", {
        "source": "scanner_" + feed["county"].lower(), "county": feed["county"], "state": "GA",
        "location_desc": result["location"] or ("Scanner: " + transcript[:200]),
        "severity": result["severity"], "lead_score": result["lead_score"], "lead_status": "new",
        "notes": "SCANNER | %s | Keywords: %s" % (feed["name"], ", ".join(result["keywords"])),
        "raw_data": {"transcript": transcript[:2000], "feed_id": feed["id"]},
    })
    LOGGER.warning("crash_lead_saved feed_id=%s severity=%s lead_id=%s", feed["id"], result["severity"], (lead or {}).get("id"))
    return True


def file_digest(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def recording_metadata(path, config):
    relative = path.relative_to(Path(config["recordings_dir"]).expanduser())
    system_key = relative.parts[0] if len(relative.parts) > 1 else ""
    systems = dict(LOCAL_SYSTEMS)
    systems.update(config.get("systems", {}))
    system = systems.get(system_key, {})
    return {
        "id": str(system.get("feed_id", config.get("default_feed_id", relative.parent.name or "local-sdr"))),
        "name": str(system.get("feed_name", config.get("default_feed_name", relative.parent.name or "Local SDR"))),
        "county": str(system.get("county", config.get("default_county", "Fulton"))),
    }


def persist_transcript(database, feed, transcript, raw, audio_bytes, recorded_at, source_name):
    result = classify(transcript)
    transcript_row = database.insert("h911_scanner_transcripts", {
        "feed_id": feed["id"], "feed_name": feed["name"], "county": feed["county"],
        "recorded_at": recorded_at, "audio_bytes": audio_bytes,
        "transcript": transcript[:8000], "transcript_chars": len(transcript),
        "has_crash_keywords": bool(result["keywords"]), "crash_keywords_found": result["keywords"],
        "extracted_address": result["location"] or None, "extracted_severity": result["severity"],
        "raw_response": dict(raw, source_file=source_name),
    })
    if not result["keywords"]:
        return transcript_row, None
    lead = database.insert("h911_accident_leads", {
        "source": "scanner_" + feed["county"].lower(), "county": feed["county"], "state": "GA",
        "source_report_id": "sdr:" + raw["sha256"],
        "location_desc": result["location"] or ("Scanner: " + transcript[:200]),
        "severity": result["severity"], "lead_score": result["lead_score"], "lead_status": "new",
        "notes": "LOCAL SDR | %s | Keywords: %s" % (feed["name"], ", ".join(result["keywords"])),
        "raw_data": {"transcript": transcript[:2000], "source_file": source_name},
    })
    return transcript_row, lead


def process_recording(path, digest, config, database, ledger):
    if ledger.contains(digest):
        return False
    feed = recording_metadata(path, config)
    transcript, raw = transcribe(path, config)
    _, lead = persist_transcript(
        database, feed, transcript, dict(raw, sha256=digest), path.stat().st_size,
        datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(), path.name,
    )
    ledger.mark(digest, path)
    LOGGER.warning("recording_processed file=%s chars=%d crash=%s", path.name, len(transcript), bool(lead))
    return bool(lead)


def pending_recordings(config, ledger):
    root = Path(config["recordings_dir"]).expanduser()
    cutoff = time.time() - int(config.get("file_stability_seconds", 5))
    candidates = []
    seen = set()
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_AUDIO and path.stat().st_mtime <= cutoff:
            digest = file_digest(path)
            if digest not in seen and not ledger.contains(digest):
                candidates.append((path, digest))
                seen.add(digest)
    return sorted(candidates, key=lambda item: item[0].stat().st_mtime)


def run_recording_worker(config, database):
    root = Path(config["recordings_dir"]).expanduser()
    ledger_path = Path(config.get("ledger_path", root / ".h911_processed.sqlite3")).expanduser()
    ledger = Ledger(ledger_path)
    concurrency = max(1, int(config.get("transcription_workers", 2)))
    LOGGER.info("local_sdr_worker_started directory=%s workers=%d", root, concurrency)
    while RUNNING:
        batch = pending_recordings(config, ledger)[: int(config.get("batch_size", 50))]
        if not batch:
            time.sleep(2)
            continue
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = {
                pool.submit(process_recording, path, digest, config, database, ledger): path
                for path, digest in batch
            }
            for future in as_completed(futures):
                path = futures[future]
                try:
                    future.result()
                except Exception as exc:
                    LOGGER.error("recording_failed file=%s error=%s", path.name, exc)


def preflight(config, feeds, database):
    if not which("ffmpeg"):
        raise RuntimeError("ffmpeg is not installed")
    database.preflight()
    cli, model = local_whisper_paths(config)
    if config.get("recordings_dir"):
        root = Path(config["recordings_dir"]).expanduser()
        root.mkdir(parents=True, exist_ok=True)
        if not cli.exists() or not model.exists():
            raise RuntimeError("local whisper.cpp CLI/model is missing")
        LOGGER.info("preflight_local_sdr_ok directory=%s whisper_model=%s", root, model.name)
    elif feeds:
        sample = capture_audio(feeds[0], duration=5)
        LOGGER.info("preflight_audio_ok feed_id=%s bytes=%d", feeds[0]["id"], sample.stat().st_size)
        sample.unlink(missing_ok=True)


RUNNING = True


def stop(_signal, _frame):
    global RUNNING
    RUNNING = False


def main():
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    try:
        config = load_config()
        feeds = configured_feeds(config)
        database = Supabase(config)
        preflight(config, feeds, database)
    except Exception as exc:
        LOGGER.critical("startup_failed error=%s", exc)
        return 1
    if config.get("recordings_dir"):
        run_recording_worker(config, database)
        return 0
    failures = {feed["id"]: 0 for feed in feeds}
    LOGGER.info("worker_started feeds=%d", len(feeds))
    while RUNNING:
        with ThreadPoolExecutor(max_workers=min(MAX_CONCURRENT, len(feeds))) as pool:
            futures = {pool.submit(process_feed, feed, config, database): feed for feed in feeds}
            for future in as_completed(futures):
                feed = futures[future]
                try:
                    future.result()
                    failures[feed["id"]] = 0
                except Exception as exc:
                    failures[feed["id"]] += 1
                    LOGGER.error("feed_failed feed_id=%s consecutive=%d error=%s", feed["id"], failures[feed["id"]], exc)
        time.sleep(15)
    LOGGER.info("worker_stopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
