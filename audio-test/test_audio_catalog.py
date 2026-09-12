import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AudioCatalogTests(unittest.TestCase):
    def setUp(self):
        self.sessions = json.loads((ROOT / "src/data/audio-sessions.json").read_text(encoding="utf-8"))
        self.sources = json.loads((ROOT / "src/data/audio-research.json").read_text(encoding="utf-8"))

    def test_catalog_has_unique_ids_and_one_published_feature(self):
        self.assertEqual(len(self.sessions), len({session["id"] for session in self.sessions}))
        featured = [session for session in self.sessions if session.get("featured")]
        self.assertEqual(len(featured), 1)
        self.assertEqual(featured[0]["status"], "published")

    def test_published_audio_files_exist(self):
        for session in self.sessions:
            if session["status"] == "published":
                with self.subTest(session=session["id"]):
                    path = ROOT / "public" / session["path"].lstrip("/")
                    self.assertTrue(path.is_file(), str(path))
                    self.assertGreater(path.stat().st_size, 1000)
                    self.assertGreater(session["durationSeconds"], 0)

    def test_research_references_resolve(self):
        ids = {source["id"] for source in self.sources}
        for session in self.sessions:
            self.assertTrue(set(session.get("research", [])).issubset(ids))

    def test_new_series_has_consistent_durations_and_no_public_transcripts(self):
        for slug in ("selbstreflexion", "erfolg-im-alltag", "selbstvertrauen", "bewusstsein-fokus"):
            with self.subTest(slug=slug):
                script = json.loads((ROOT / f"audio-test/{slug}.script.json").read_text(encoding="utf-8"))
                meta = json.loads((ROOT / f"audio-test/{script['stem']}.meta.json").read_text(encoding="utf-8"))
                self.assertEqual(script["targetSeconds"], 600)
                self.assertEqual(meta["durationSeconds"], script["targetSeconds"])
                self.assertEqual(meta["voice"], "Aoede")
                self.assertEqual(len(meta["segments"]), len(script["segments"]))
                self.assertLessEqual(meta["fadeOutSeconds"], meta["tailSeconds"])
                self.assertFalse(list((ROOT / f"public/audio/{slug}").glob("*.txt")))


if __name__ == "__main__":
    unittest.main()
