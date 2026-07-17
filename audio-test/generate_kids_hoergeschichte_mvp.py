# -*- coding: utf-8 -*-
from __future__ import annotations

import base64
import json
import time
import wave
from pathlib import Path

import requests

import generate_klarheitsreset_gemini_pixabay as base


BASE = Path(__file__).resolve().parent
SEG_DIR = BASE / "kids_hoergeschichte_mvp_segments"
OUT_WAV = BASE / "kids-hoergeschichte-schlaf-akku-mvp.wav"
OUT_MP3 = BASE / "kids-hoergeschichte-schlaf-akku-mvp.mp3"
OUT_META = BASE / "kids-hoergeschichte-schlaf-akku-mvp.meta.json"
YOUTUBE_SECRETS = Path(r"C:\Users\marga\callidus_youtube\secrets.env")

TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]

VOICE_PROFILES = {
    "erzaehler": {
        "voice": "Sulafat",
        "direction": "Sprich warm, ruhig und vorlesend auf Deutsch, wie ein freundlicher Erwachsener bei einer Gutenachtgeschichte.",
    },
    "noah": {
        "voice": "Puck",
        "direction": "Sprich als fiktive, helle, neugierige Kinderbuchfigur Noah. Lebendig, verschlafen und freundlich, aber nicht schrill und nicht wie ein echtes Kind geklont.",
    },
    "mira": {
        "voice": "Leda",
        "direction": "Sprich als fiktive, klare, freundliche Kinderbuchfigur Mira. Warm, klug, leicht staunend, aber nicht wie ein echtes Kind geklont.",
    },
    "calli": {
        "voice": "Achird",
        "direction": "Sprich als kleiner, freundlicher Kompass Calli. Hell, weise, leicht schelmisch und sehr klar.",
    },
    "nino": {
        "voice": "Aoede",
        "direction": "Sprich als Nino, der Nachtfreund. Sehr weich, langsam, schlafmützig, beruhigend und warm.",
    },
}

SEGMENTS: list[dict[str, str | float]] = [
    {
        "speaker": "erzaehler",
        "text": "Es war Abend. In Noahs Zimmer wurde das Licht langsam weich, und draußen hing der Mond wie eine kleine Lampe am Himmel.",
        "pause": 0.6,
    },
    {
        "speaker": "noah",
        "text": "Ich bin noch gar nicht müde. Mein Turm braucht noch ein Dach. Und vielleicht einen Aufzug.",
        "pause": 0.35,
    },
    {
        "speaker": "mira",
        "text": "Noah, du gähnst so groß, dass fast ein Kissen hineinpasst.",
        "pause": 0.35,
    },
    {
        "speaker": "calli",
        "text": "Das ist ein sehr gutes Zeichen. Dein Körper sagt: Die Nachtwerkstatt möchte öffnen.",
        "pause": 0.45,
    },
    {
        "speaker": "noah",
        "text": "Eine Werkstatt? In mir? Aber ich liege doch nur da.",
        "pause": 0.35,
    },
    {
        "speaker": "nino",
        "text": "Nicht nur. Während du schläfst, lädt dein innerer Akku wieder auf. Ganz leise. Ganz gemütlich.",
        "pause": 0.55,
    },
    {
        "speaker": "erzaehler",
        "text": "Über Noahs Bett erschien ein kleiner Akku aus Mondlicht. Er blinkte freundlich und wurde Strich für Strich voller.",
        "pause": 0.5,
    },
    {
        "speaker": "mira",
        "text": "Also ist Schlaf nicht langweilig?",
        "pause": 0.25,
    },
    {
        "speaker": "nino",
        "text": "Überhaupt nicht. Schlaf ist Aufladen, Sortieren und Reparieren. Nur eben mit Kuscheldecke.",
        "pause": 0.45,
    },
    {
        "speaker": "calli",
        "text": "Und morgen merkt man es: Die Augen sind wacher, der Kopf ist klarer, und der Turm bekommt vielleicht sogar zwei Aufzüge.",
        "pause": 0.4,
    },
    {
        "speaker": "noah",
        "text": "Zwei Aufzüge? Dann schlafe ich jetzt lieber schnell.",
        "pause": 0.3,
    },
    {
        "speaker": "erzaehler",
        "text": "Noah kuschelte sich ins Kissen. Mira lächelte. Nino machte seine Laterne ein kleines bisschen dunkler.",
        "pause": 0.45,
    },
    {
        "speaker": "nino",
        "text": "Gute Nacht, ihr zwei. Erst kommt die Ruhe. Dann lädt der Schlaf.",
        "pause": 0.5,
    },
    {
        "speaker": "erzaehler",
        "text": "Und während Noah träumte, wurde sein Akku voll. Nicht laut. Nicht schnell. Sondern genau richtig für einen neuen Morgen.",
        "pause": 1.2,
    },
]


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
            if name.strip() not in wanted:
                continue
            value = value.strip().strip('"').strip("'")
            if value and not value.startswith("#") and not value.startswith("TODO"):
                keys.append(value)
    if keys:
        return keys
    return base.load_gemini_keys()


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def write_silence(out: wave.Wave_write, seconds: float) -> None:
    out.writeframes(b"\x00\x00" * max(0, int(24000 * seconds)))


def append_wav(source: Path, out: wave.Wave_write) -> float:
    with wave.open(str(source), "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 24000:
            raise RuntimeError(f"Unexpected WAV format: {source}")
        out.writeframes(wf.readframes(wf.getnframes()))
        return wf.getnframes() / float(wf.getframerate())


def generate_tts(speaker: str, text: str, output_path: Path, keys: list[str]) -> None:
    if output_path.exists() and output_path.stat().st_size > 1000:
        return

    profile = VOICE_PROFILES[speaker]
    prompt = (
        f"{profile['direction']} "
        "Lies nur die folgende Zeile, ohne Sprechername, ohne Regieanweisung und ohne Zusatzkommentar: "
        f"{text}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": str(profile["voice"])},
                },
            },
        },
    }

    last_error: Exception | str | None = None
    for key_index, key in enumerate(keys, start=1):
        for model in TTS_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            for attempt in range(3):
                try:
                    response = requests.post(url, json=payload, timeout=(10, 120))
                    if response.status_code == 429:
                        wait_s = 35 * (attempt + 1)
                        print(f"  rate limit key {key_index}, {model}; wait {wait_s}s")
                        time.sleep(wait_s)
                        continue
                    response.raise_for_status()
                    data = response.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                    audio_bytes = base64.b64decode(data)
                    with wave.open(str(output_path), "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(audio_bytes)
                    return
                except Exception as exc:
                    last_error = exc
                    time.sleep(3)
    raise RuntimeError(f"TTS failed for {speaker}: {last_error}")


def build_wav(segment_paths: list[Path]) -> float:
    with wave.open(str(OUT_WAV), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(24000)
        write_silence(out, 0.5)
        for path, segment in zip(segment_paths, SEGMENTS):
            append_wav(path, out)
            write_silence(out, float(segment["pause"]))
        write_silence(out, 0.8)
    return wav_duration(OUT_WAV)


def export_mp3() -> None:
    base.run_ffmpeg(
        [
            "-y",
            "-i",
            str(OUT_WAV),
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            "-id3v2_version",
            "3",
            "-metadata",
            "title=Noahs Schlaf-Akku MVP",
            "-metadata",
            "artist=Callidus KIDS",
            str(OUT_MP3),
        ]
    )


def write_meta(duration: float) -> None:
    meta = {
        "title": "Noahs Schlaf-Akku MVP",
        "purpose": "Local proof of concept for a Callidus KIDS audio story. Not integrated into the website.",
        "duration_seconds": round(duration, 2),
        "duration_minutes": round(duration / 60, 2),
        "voice_provider": "Gemini TTS",
        "models": TTS_MODELS,
        "characters": {
            name: {"voice": profile["voice"], "direction": profile["direction"]}
            for name, profile in VOICE_PROFILES.items()
        },
        "disclosure_note": "Uses synthetic TTS voices for fictional characters; no real child voice cloning.",
        "files": {
            "wav": OUT_WAV.name,
            "mp3": OUT_MP3.name,
            "generator": Path(__file__).name,
            "segments": SEG_DIR.name,
        },
        "script_segments": SEGMENTS,
    }
    OUT_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    SEG_DIR.mkdir(exist_ok=True)
    keys = load_keys()
    paths: list[Path] = []
    for index, segment in enumerate(SEGMENTS):
        speaker = str(segment["speaker"])
        path = SEG_DIR / f"{index:02d}_{speaker}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)} {speaker}")
        generate_tts(speaker, str(segment["text"]), path, keys)
        paths.append(path)
    duration = build_wav(paths)
    export_mp3()
    write_meta(duration)
    print(f"Done: {OUT_MP3} ({duration:.1f}s)")


if __name__ == "__main__":
    main()
