# -*- coding: utf-8 -*-
from __future__ import annotations

import base64
import wave
from pathlib import Path

import requests

import generate_klarheitsreset_gemini_pixabay as base


OUT = Path(__file__).resolve().parent / "yt-aoede-voice-test.wav"
VOICE = "Aoede"
MODEL = "gemini-2.5-flash-preview-tts"


def main() -> None:
    key = base.load_gemini_keys()[0]
    payload = {
        "contents": [{"parts": [{"text": "Callidus Test. Klarheit entsteht durch ruhige, klare Gedanken."}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    response = requests.post(url, json=payload, timeout=(10, 120))
    response.raise_for_status()
    audio_b64 = response.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    audio_bytes = base64.b64decode(audio_b64)
    with wave.open(str(OUT), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(audio_bytes)
    print(f"Done: {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
