# -*- coding: utf-8 -*-
from __future__ import annotations

import base64
import re
import wave
from pathlib import Path

import requests

import generate_klarheitsreset_gemini_pixabay as base


OUT = Path(__file__).resolve().parent / "yt-aoede-voice-test.wav"
YOUTUBE_SECRETS = Path(r"C:\Users\marga\callidus_youtube\secrets.env")
VOICE = "Aoede"
MODEL = "gemini-2.5-flash-preview-tts"


def load_keys() -> list[str]:
    keys: list[str] = []
    if YOUTUBE_SECRETS.exists():
        src = YOUTUBE_SECRETS.read_text(encoding="utf-8", errors="ignore")
        wanted = {"GEMINI_API_KEY", "GEMINI_API_KEY_2", "GOOGLE_API_KEY"}
        for raw_line in src.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            name = name.strip()
            if name not in wanted:
                continue
            value = value.strip().strip('"').strip("'")
            if value and not value.startswith("#") and not value.startswith("TODO"):
                keys.append(value)
    if keys:
        return keys
    return base.load_gemini_keys()


def main() -> None:
    key = load_keys()[0]
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
