# -*- coding: utf-8 -*-
"""
Create an original 15-minute German meditation audio:
- Voice: Gemini TTS via the existing callidus_youtube API keys (read at runtime, never stored here)
- Music: Pixabay track downloaded into this folder
- Atmosphere: generated ocean/waves bed
- Mix: voice + music + waves via ffmpeg
"""

from __future__ import annotations

import base64
import json
import math
import os
import random
import re
import subprocess
import time
import wave
from array import array
from pathlib import Path

import requests
from pydub import AudioSegment


BASE = Path(__file__).resolve().parent
YOUTUBE_TTS_SOURCE = Path(r"C:\Users\marga\callidus_youtube\main_v2.py")
FFMPEG = Path(r"C:\Users\marga\callidus_youtube\ashwagandha-remotion\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe")

VOICE = "Sulafat"  # Warm. Good fit for calm German meditation.
TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
TARGET_SECONDS = 15 * 60
LEAD_IN_SECONDS = 10.0
TAIL_SECONDS = 24.0

MUSIC_SOURCE = BASE / "pixabay-grand-project-deep-meditation-192828.mp3"
SEG_DIR = BASE / "klarheitsreset_segments"
OUT_VOICE = BASE / "klarheitsreset_voice.wav"
OUT_MUSIC = BASE / "klarheitsreset_music_bed.wav"
OUT_WAVES = BASE / "klarheitsreset_waves.wav"
OUT_FINAL_WAV = BASE / "klarheitsreset-callidus-gemini-pixabay-waves.wav"
OUT_FINAL_MP3 = BASE / "klarheitsreset-callidus-gemini-pixabay-waves.mp3"
OUT_META = BASE / "klarheitsreset-callidus-gemini-pixabay-waves.meta.json"
MUSIC_VOLUME = 0.30
MUSIC_FADE_IN_SECONDS = 10.0
MUSIC_FADE_OUT_SECONDS = 45.0


# Text is deliberately original. It is not a translation or rewrite of the YouTube video.
SEGMENTS: list[tuple[str, float]] = [
    ("Willkommen zu deinem Klarheitsreset. Diese Audio-Session ist eine ruhige geführte Meditation für Fokus, innere Ordnung und einen klaren nächsten Schritt.", 5),
    ("Bitte höre sie nicht beim Autofahren, nicht beim Bedienen von Maschinen und nicht in Situationen, in denen du aufmerksam bleiben musst.", 5),
    ("Suche dir eine bequeme Haltung. Du kannst sitzen oder liegen. Erlaube deinem Körper, für die nächsten Minuten nichts leisten zu müssen.", 7),
    ("Wenn es angenehm ist, schließe die Augen. Wenn nicht, lasse deinen Blick weich auf einem Punkt ruhen.", 7),
    ("Atme langsam durch die Nase ein. Und lasse die Luft ruhig wieder ausströmen.", 8),
    ("Noch einmal. Einatmen. Und ausatmen. Mit jedem Ausatmen darf der Tag ein kleines Stück leiser werden.", 9),
    ("Spüre den Kontakt deines Körpers mit dem Boden, dem Stuhl oder der Unterlage.", 8),
    ("Lasse die Stirn weich werden. Löse den Kiefer. Erlaube den Schultern, etwas tiefer zu sinken.", 9),
    ("Du musst nichts wegdrücken. Alles, was gerade da ist, darf für einen Moment da sein.", 8),
    ("Einatmen. Raum entsteht. Ausatmen. Spannung darf gehen.", 10),
    ("Richte deine Aufmerksamkeit auf deinen Atem. Nicht um ihn zu kontrollieren, sondern um bei dir anzukommen.", 9),
    ("Der Atem kommt. Der Atem geht. Und du musst ihm nur folgen.", 10),
    ("Stelle dir nun vor, deine Gedanken liegen vor dir wie einzelne Blätter auf einem Tisch.", 9),
    ("Manche Gedanken sind wichtig. Manche sind laut. Manche gehören gar nicht mehr in diesen Tag.", 9),
    ("Du musst jetzt nicht alles lösen. Du schaust nur hin. Ruhig. Freundlich. Mit Abstand.", 11),
    ("Frage dich innerlich: Was ist gerade wirklich wesentlich?", 12),
    ("Lasse die Antwort nicht erzwingen. Gib ihr Raum. Oft kommt Klarheit nicht als lauter Befehl, sondern als leiser Hinweis.", 11),
    ("Frage dich nun: Was kostet mich Energie, ohne mich wirklich weiterzubringen?", 12),
    ("Vielleicht taucht ein Gedanke auf. Vielleicht ein Name. Vielleicht eine Aufgabe. Vielleicht nur ein Gefühl.", 10),
    ("Du musst nichts bewerten. Du darfst nur erkennen.", 10),
    ("Atme ein. Und sage innerlich: Ich sehe klarer.", 9),
    ("Atme aus. Und sage innerlich: Ich lasse los, was mich zerstreut.", 11),
    ("Stelle dir jetzt einen ruhigen Weg vor. Vor dir liegt nicht der ganze Plan. Nur der nächste Schritt.", 10),
    ("Dieser Schritt ist überschaubar. Er ist nicht perfekt. Er ist nur ehrlich.", 10),
    ("Vielleicht ist es ein Gespräch. Vielleicht eine Entscheidung. Vielleicht ein Nein. Vielleicht ein Ja.", 9),
    ("Spüre, wie es sich anfühlt, wenn du nicht alles auf einmal tragen musst.", 11),
    ("Du darfst handeln, ohne Druck. Du darfst wachsen, ohne Härte gegen dich selbst.", 10),
    ("Ich lese dir nun einige Sätze vor. Du kannst sie innerlich wiederholen oder einfach wirken lassen.", 8),
    ("Mein Geist wird ruhig.", 9),
    ("Ich erkenne, was wichtig ist.", 9),
    ("Ich lasse los, was mich zerstreut.", 9),
    ("Ich vertraue meiner Wahrnehmung.", 9),
    ("Ich treffe Entscheidungen Schritt für Schritt.", 9),
    ("Ich darf fokussiert sein und trotzdem entspannt bleiben.", 9),
    ("Mein Erfolg entsteht aus Klarheit, Ausdauer und innerer Ordnung.", 10),
    ("Ich handle aus Ruhe, nicht aus Druck.", 9),
    ("Ich wähle heute einen klaren nächsten Schritt.", 12),
    ("Bleibe nun für einen Moment in dieser Stille. Lasse Musik, Atem und Körper zusammenfinden.", 24),
    ("Stelle dir vor, in der Mitte deiner Brust sammelt sich ein warmes, ruhiges Licht.", 12),
    ("Dieses Licht muss nichts beweisen. Es ist einfach da. Still. Stabil. Verlässlich.", 13),
    ("Mit jedem Atemzug wird es klarer. Mit jedem Ausatmen wird dein System weicher.", 12),
    ("Du kannst jederzeit zu dieser Klarheit zurückkehren. Ein Atemzug. Eine Pause. Ein nächster Schritt.", 13),
    ("Beginne langsam, deinen Körper wieder bewusster zu spüren.", 6),
    ("Spüre Finger und Zehen. Spüre Schultern und Gesicht. Spüre den Raum um dich herum.", 8),
    ("Atme noch einmal tief ein. Und langsam wieder aus.", 7),
    ("Wenn du bereit bist, öffne die Augen.", 6),
    ("Nimm diesen Satz mit in deinen Tag: Ich muss nicht alles auf einmal wissen. Ich gehe den nächsten klaren Schritt.", 5),
    ("Danke, dass du dir diese Zeit genommen hast.", 2),
]


def load_gemini_keys() -> list[str]:
    if not YOUTUBE_TTS_SOURCE.exists():
        raise FileNotFoundError(f"TTS source not found: {YOUTUBE_TTS_SOURCE}")
    src = YOUTUBE_TTS_SOURCE.read_text(encoding="utf-8", errors="ignore")
    keys = re.findall(r'GEMINI_API_KEY(?:_\d+)?\s*=\s*"([^"]+)"', src)
    keys = [k for k in keys if k and not k.startswith("TODO")]
    if not keys:
        raise RuntimeError("No Gemini keys found in the YouTube TTS source.")
    return keys


def generate_tts(text: str, output_path: Path, keys: list[str]) -> None:
    if output_path.exists() and output_path.stat().st_size > 1000:
        cached_duration = wav_duration(output_path)
        max_duration = max(35.0, len(text.split()) * 1.6 + 12)
        if 0.5 <= cached_duration <= max_duration:
            return
        print(f"  drop invalid cached TTS {output_path.name}: {cached_duration:.2f}s > {max_duration:.2f}s")
        output_path.unlink(missing_ok=True)

    prompt = (
        "Sprich sehr ruhig, warm, langsam und meditativ auf Deutsch. "
        "Lies nur den folgenden Meditationstext, ohne Überschrift und ohne Zusatzkommentar: "
        + text
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }

    last_error = None
    for key_index, key in enumerate(keys, start=1):
        for model in TTS_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            for attempt in range(4):
                try:
                    response = requests.post(url, json=payload, timeout=(10, 150))
                    if response.status_code == 429:
                        wait_s = 45 * (2 ** attempt)
                        print(f"  TTS rate limit key {key_index}, {model}; wait {wait_s}s")
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
                    duration = wav_duration(output_path)
                    max_duration = max(35.0, len(text.split()) * 1.6 + 12)
                    if not (0.5 <= duration <= max_duration):
                        output_path.unlink(missing_ok=True)
                        raise RuntimeError(f"invalid TTS duration {duration:.2f}s > {max_duration:.2f}s")
                    return
                except Exception as exc:  # keep moving through fallback models/keys
                    last_error = exc
                    time.sleep(5)
    raise RuntimeError(f"TTS failed for segment: {last_error}")


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def append_wav_frames(source: Path, out: wave.Wave_write) -> float:
    with wave.open(str(source), "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 24000:
            raise RuntimeError(f"Unexpected WAV format for {source}")
        frames = wf.readframes(wf.getnframes())
        out.writeframes(frames)
        return wf.getnframes() / float(wf.getframerate())


def write_silence(out: wave.Wave_write, seconds: float) -> None:
    frames = max(0, int(24000 * seconds))
    out.writeframes(b"\x00\x00" * frames)


def build_voice_track(segment_paths: list[Path]) -> float:
    speech_total = sum(wav_duration(p) for p in segment_paths)
    pause_sum = sum(p for _, p in SEGMENTS)
    available_pause = TARGET_SECONDS - LEAD_IN_SECONDS - TAIL_SECONDS - speech_total
    pause_scale = max(0.35, available_pause / pause_sum)

    with wave.open(str(OUT_VOICE), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(24000)
        write_silence(out, LEAD_IN_SECONDS)
        for path, (_, pause) in zip(segment_paths, SEGMENTS):
            append_wav_frames(path, out)
            write_silence(out, pause * pause_scale)
        write_silence(out, TAIL_SECONDS)

    total = wav_duration(OUT_VOICE)
    print(f"Voice track: speech={speech_total/60:.2f} min, pause_scale={pause_scale:.2f}, total={total/60:.2f} min")
    return total


def run_ffmpeg(args: list[str]) -> None:
    exe = str(FFMPEG if FFMPEG.exists() else "ffmpeg")
    subprocess.run([exe, *args], check=True)


def build_waves(duration: float) -> None:
    """Generate a subtle ocean-like noise bed without ffmpeg source filters."""
    sample_rate = 24000
    total_frames = int(duration * sample_rate)
    rng = random.Random(4207)
    smooth = 0.0
    chunk_frames = sample_rate

    with wave.open(str(OUT_WAVES), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        written = 0
        while written < total_frames:
            count = min(chunk_frames, total_frames - written)
            buf = array("h")
            for i in range(count):
                frame = written + i
                t = frame / sample_rate
                fade_in = min(1.0, t / 24.0)
                fade_out = min(1.0, max(0.0, (duration - t) / 28.0))
                envelope = fade_in * fade_out
                swell = 0.50 + 0.35 * math.sin(2 * math.pi * 0.055 * t) + 0.15 * math.sin(2 * math.pi * 0.091 * t + 1.7)
                smooth = smooth * 0.992 + rng.uniform(-1.0, 1.0) * 0.008
                value = max(-1.0, min(1.0, smooth * swell * envelope * 0.38))
                buf.append(int(value * 32767))
            wf.writeframes(buf.tobytes())
            written += count


def build_music_bed(duration: float) -> None:
    if not MUSIC_SOURCE.exists():
        raise FileNotFoundError(f"Missing Pixabay music file: {MUSIC_SOURCE}")

    target_ms = int(duration * 1000)
    music = AudioSegment.from_file(MUSIC_SOURCE).set_frame_rate(44100).set_channels(2).set_sample_width(2)
    loops = target_ms // len(music) + 1
    bed = (music * loops)[:target_ms]
    bed = bed.apply_gain(20 * math.log10(MUSIC_VOLUME))
    bed = bed.fade_in(int(MUSIC_FADE_IN_SECONDS * 1000)).fade_out(int(MUSIC_FADE_OUT_SECONDS * 1000))
    bed.export(OUT_MUSIC, format="wav")


def mix_final(duration: float) -> None:
    filter_complex = (
        f"[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.18[voice];"
        f"[1:a]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo[music];"
        f"[2:a]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,volume=0.12[waves];"
        "[voice][music][waves]amix=inputs=3:duration=first:normalize=0"
    )
    run_ffmpeg([
        "-y",
        "-i", str(OUT_VOICE),
        "-i", str(OUT_MUSIC),
        "-i", str(OUT_WAVES),
        "-filter_complex", filter_complex,
        "-ar", "44100",
        "-ac", "2",
        str(OUT_FINAL_WAV),
    ])
    run_ffmpeg([
        "-y",
        "-i", str(OUT_FINAL_WAV),
        "-codec:a", "libmp3lame",
        "-b:a", "192k",
        "-id3v2_version", "3",
        "-metadata", "title=Klarheitsreset - Fokus und naechster Schritt",
        "-metadata", "artist=Callidus AM",
        str(OUT_FINAL_MP3),
    ])


def write_metadata(duration: float) -> None:
    meta = {
        "title": "Klarheitsreset - Fokus und naechster Schritt",
        "duration_seconds": round(duration, 2),
        "voice_provider": "Gemini TTS",
        "voice": VOICE,
        "music": {
            "title": "Deep Meditation",
            "creator": "Grand_Project",
            "source": "https://pixabay.com/music/meditationspiritual-deep-meditation-192828/",
            "downloaded_file": MUSIC_SOURCE.name,
            "license_summary": "https://pixabay.com/service/license-summary/",
        },
        "additional_background": "Generated ocean/waves ambience with deterministic Python noise bed.",
        "files": {
            "voice_wav": OUT_VOICE.name,
            "music_wav": OUT_MUSIC.name,
            "waves_wav": OUT_WAVES.name,
            "final_wav": OUT_FINAL_WAV.name,
            "final_mp3": OUT_FINAL_MP3.name,
        },
        "note": "Original German meditation script. Not based on or copied from the YouTube transcript.",
    }
    OUT_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    SEG_DIR.mkdir(exist_ok=True)
    keys = load_gemini_keys()

    segment_paths: list[Path] = []
    for index, (text, _) in enumerate(SEGMENTS):
        path = SEG_DIR / f"seg_{index:02d}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)}")
        generate_tts(text, path, keys)
        segment_paths.append(path)

    duration = build_voice_track(segment_paths)
    build_music_bed(duration)
    build_waves(duration)
    mix_final(duration)
    write_metadata(duration)

    print(f"Done: {OUT_FINAL_MP3} ({duration/60:.2f} min)")


if __name__ == "__main__":
    main()








