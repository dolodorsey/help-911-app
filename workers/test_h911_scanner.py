import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

os.environ["H911_LOG_PATH"] = str(Path(__file__).with_name("test_h911_scanner.log"))
spec = importlib.util.spec_from_file_location("h911_scanner", Path(__file__).with_name("h911_scanner.py"))
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


class ClassificationTests(unittest.TestCase):
    def test_collision_is_detected(self):
        result = scanner.classify("Units responding to a motor vehicle crash on I-85 north with injuries")
        self.assertIn("crash", result["keywords"])
        self.assertEqual(result["severity"], "injury")

    def test_non_crash_is_not_a_lead(self):
        self.assertEqual(scanner.classify("Engine 4 returning after a routine alarm")["keywords"], [])

    def test_fatal_overrides_injury(self):
        result = scanner.classify("10-50 with injuries and one deceased near Main Street")
        self.assertEqual(result["severity"], "fatal")
        self.assertEqual(result["lead_score"], 90)

    def test_local_sdr_config_does_not_require_paid_api(self):
        with tempfile.TemporaryDirectory() as directory:
            config_path = Path(directory) / "config.json"
            config_path.write_text(json.dumps({
                "supabase_url": "https://example.supabase.co",
                "supabase_key": "server-key",
                "recordings_dir": directory,
            }))
            config = scanner.load_config(config_path)
            self.assertEqual(config["recordings_dir"], directory)

    def test_existing_config_defaults_to_local_radio_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            config_path = Path(directory) / "config.json"
            config_path.write_text(json.dumps({
                "supabase_url": "https://example.supabase.co",
                "supabase_key": "server-key",
            }))
            config = scanner.load_config(config_path)
            self.assertEqual(Path(config["recordings_dir"]), scanner.DEFAULT_RECORDINGS_DIR)

    def test_multi_system_recording_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "dekalb" / "call.wav"
            path.parent.mkdir()
            path.touch()
            metadata = scanner.recording_metadata(path, {
                "recordings_dir": str(root),
                "systems": {
                    "dekalb": {
                        "feed_id": "dekalb-p25",
                        "feed_name": "DeKalb Public Safety",
                        "county": "DeKalb",
                    }
                },
            })
            self.assertEqual(metadata["id"], "dekalb-p25")
            self.assertEqual(metadata["county"], "DeKalb")

    def test_crash_recording_uses_restart_safe_source_id(self):
        class MemoryDatabase:
            def __init__(self):
                self.inserts = []

            def insert(self, table, payload):
                self.inserts.append((table, payload))
                return {"id": "saved-id"}

        database = MemoryDatabase()
        scanner.persist_transcript(
            database,
            {"id": "atlanta-p25", "name": "Atlanta Public Safety", "county": "Fulton"},
            "Motor vehicle crash with entrapment on I-85 north",
            {"engine": "whisper.cpp", "sha256": "abc123"},
            12345,
            "2026-08-15T00:00:00+00:00",
            "call.wav",
        )
        self.assertEqual(database.inserts[1][0], "h911_accident_leads")
        self.assertEqual(database.inserts[1][1]["source_report_id"], "sdr:abc123")


if __name__ == "__main__":
    unittest.main()
