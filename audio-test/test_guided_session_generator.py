import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import Mock, patch

import generate_schlafuebergang as generator


class GuidedSessionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cache = patch.object(generator, "CACHE", Path(self.temp.name))
        self.cache.start()
        self.addCleanup(self.cache.stop)
        self.config = {
            "direction": "Read only the transcript.", "model": "test-model",
            "voice": "Aoede", "segments": [{"text": "Ein kurzer Test.", "pause": 0}],
        }

    def test_daily_quota_stops_after_one_request(self):
        response = Mock(status_code=429)
        response.json.return_value = {"error": {"details": [{"violations": [{
            "quotaId": "GenerateRequestsPerDayPerProjectPerModel", "quotaValue": "100",
        }]}]}}
        with patch.object(generator.requests, "post", return_value=response) as post:
            with self.assertRaisesRegex(RuntimeError, "Daily TTS quota"):
                generator.synthesize((0, self.config["segments"][0]), self.config, ["test-key"])
            self.assertEqual(post.call_count, 1)

    def test_temporary_error_has_bounded_retries(self):
        response = Mock(status_code=500)
        with patch.object(generator.requests, "post", return_value=response) as post:
            with patch.object(generator.time, "sleep"):
                with self.assertRaisesRegex(RuntimeError, "HTTP 500"):
                    generator.synthesize((0, self.config["segments"][0]), self.config, ["test-key"])
            self.assertEqual(post.call_count, 3)

    def test_generated_audio_is_reused_without_network(self):
        import base64

        response = Mock(status_code=200)
        response.json.return_value = {"candidates": [{"content": {"parts": [{"inlineData": {
            "mimeType": "audio/L16;rate=24000", "data": base64.b64encode(bytes(144000)).decode(),
        }}]}}]}
        with patch.object(generator.requests, "post", return_value=response) as post:
            path = generator.synthesize((0, self.config["segments"][0]), self.config, ["test-key"])
            self.assertEqual(generator.synthesize((0, self.config["segments"][0]), self.config, ["test-key"]), path)
            self.assertEqual(post.call_count, 1)
            with wave.open(str(path)) as audio:
                self.assertEqual(audio.getframerate(), 24000)
                self.assertEqual(audio.getnframes(), 72000)


if __name__ == "__main__":
    unittest.main()
