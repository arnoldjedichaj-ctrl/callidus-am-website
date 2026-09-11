"""Render guided sessions using the established YouTube TTS account."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import time
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from pydub import AudioSegment

from generate_klare_gedanken_yt_aoede import load_keys
from generate_klarheitsreset_gemini_pixabay import build_waves

BASE = Path(__file__).resolve().parent
SCRIPT = BASE / "schlafuebergang.script.json"
CACHE = BASE / "schlafuebergang_segments"
OUTPUT = BASE.parent / "public/audio/schlafuebergang"
MUSIC = BASE / "pixabay-grand-project-deep-meditation-192828.mp3"
WAVES = BASE / "klarheitsreset_waves.wav"
STEM = "schlafuebergang-den-tag-ablegen"


def find_ffmpeg() -> str:
    candidates = [
        os.environ.get("FFMPEG_PATH"),
        *map(str, (Path.home() / "AppData/Local/Microsoft/WinGet/Packages").glob("Gyan.FFmpeg_*/ffmpeg-*/bin/ffmpeg.exe")),
        str(Path.home() / "callidus_youtube/ashwagandha-remotion/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"),
        shutil.which("ffmpeg"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    raise RuntimeError("FFmpeg not found; set FFMPEG_PATH.")


def ffmpeg(*args: str) -> None:
    result = subprocess.run(
        [find_ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", *args],
        capture_output=True, text=True,
    )
    if result.returncode:
        raise RuntimeError(result.stderr[-2000:])


def duration(path: Path) -> float:
    with wave.open(str(path), "rb") as source:
        return source.getnframes() / source.getframerate()


def synthesize(item: tuple[int, dict], config: dict, keys: list[str]) -> Path:
    index, segment = item
    prompt = config["direction"] + "\n\nTRANSKRIPT:\n" + segment["text"]
    signature = hashlib.sha256(
        (config["model"] + config["voice"] + prompt).encode("utf-8")
    ).hexdigest()[:12]
    path = CACHE / f"{index:02d}-{signature}.wav"
    min_seconds = len(segment["text"].split()) / 4.5
    max_seconds = len(segment["text"].split()) * 1.5 + 12
    if path.exists() and min_seconds < duration(path) < max_seconds:
        print(f"Cached {index + 1:02d}/{len(config['segments'])}", flush=True)
        return path

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {
                "prebuiltVoiceConfig": {"voiceName": config["voice"]}
            }},
        },
    }
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{config['model']}:generateContent"
    last_error = "No key available"
    for key in keys:
        for attempt in range(3):
            print(f"TTS {index + 1:02d}/{len(config['segments'])}, attempt {attempt + 1}", flush=True)
            try:
                response = requests.post(
                    endpoint, json=payload, headers={"x-goog-api-key": key},
                    timeout=(15, 150),
                )
            except requests.RequestException as exc:
                # Do not log request objects or headers containing credentials.
                last_error = type(exc).__name__
                time.sleep(5)
                continue
            if response.status_code != 200:
                last_error = f"HTTP {response.status_code}"
                if response.status_code in (400, 401, 403, 404):
                    break
                print(f"  {last_error}; retrying", flush=True)
                time.sleep(min(30, 10 * (attempt + 1)))
                continue
            parts = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
            chunks = [base64.b64decode(part["inlineData"]["data"])
                      for part in parts if part.get("inlineData", {}).get("mimeType", "").startswith("audio/")]
            pcm = b"".join(chunks)
            seconds = len(pcm) / 48000
            if not min_seconds < seconds < max_seconds or len(pcm) % 2:
                last_error = f"Unexpected audio length ({seconds:.1f}s)"
                continue
            with wave.open(str(path), "wb") as target:
                target.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
                target.writeframes(pcm)
            print(f"Ready {index + 1:02d}: {seconds:.1f}s", flush=True)
            return path
    raise RuntimeError(f"Segment {index + 1} failed: {last_error}")


def assemble(paths: list[Path], config: dict) -> dict:
    speech_seconds = sum(duration(path) for path in paths)
    target = config["targetSeconds"]
    available = target - config["leadInSeconds"] - config["tailSeconds"] - speech_seconds
    pause_total = sum(segment["pause"] for segment in config["segments"])
    scale = available / pause_total
    if not 0.45 <= scale <= 2.5:
        raise RuntimeError(f"Pacing needs review: pause scale {scale:.2f}")

    voice_path = BASE / f"{STEM}_voice.wav"
    chapters = []
    segments = []
    with wave.open(str(voice_path), "wb") as target_wav:
        target_wav.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
        frames_written = round(config["leadInSeconds"] * 24000)
        target_wav.writeframes(b"\0\0" * frames_written)
        for source_path, segment in zip(paths, config["segments"]):
            start = frames_written / 24000
            if segment.get("chapter"):
                chapters.append({"title": segment["chapter"], "startSeconds": round(start, 2)})
            with wave.open(str(source_path), "rb") as source:
                frames = source.readframes(source.getnframes())
            target_wav.writeframes(frames)
            frames_written += len(frames) // 2
            segments.append({"startSeconds": round(start, 2), "endSeconds": round(frames_written / 24000, 2), "text": segment["text"]})
            pause_frames = round(segment["pause"] * scale * 24000)
            target_wav.writeframes(b"\0\0" * pause_frames)
            frames_written += pause_frames
        remaining = target * 24000 - frames_written
        if remaining < 0:
            raise RuntimeError("Voice exceeds requested duration")
        target_wav.writeframes(b"\0\0" * remaining)

    AudioSegment.converter = find_ffmpeg()
    music = AudioSegment.from_file(MUSIC, format="mp3").set_frame_rate(44100).set_channels(2)
    bed = music
    while len(bed) < target * 1000:
        bed = bed.append(music, crossfade=8000)
    bed_path = BASE / f"{STEM}_music.wav"
    bed[:target * 1000].export(bed_path, format="wav")

    voice_normalized = BASE / f"{STEM}_voice_normalized.wav"
    music_normalized = BASE / f"{STEM}_music_normalized.wav"
    if not WAVES.exists():
        build_waves(target)
    ffmpeg("-i", str(voice_path), "-af", "loudnorm=I=-19:TP=-3:LRA=9", "-ar", "44100", "-ac", "2", str(voice_normalized))
    ffmpeg("-i", str(bed_path), "-af", "loudnorm=I=-28:TP=-8:LRA=7", "-ar", "44100", "-ac", "2", str(music_normalized))

    output_path = OUTPUT / f"{STEM}.mp3"
    # Normalization happens before the final fade, keeping the ending silent.
    fade_duration = config.get("fadeOutSeconds", 80)
    if fade_duration > config["tailSeconds"]:
        raise RuntimeError("Fade must fit within the music-only ending")
    fade_start = target - fade_duration
    mix = (
        "[0:a]aformat=channel_layouts=stereo[voice];"
        f"[1:a]afade=t=in:d=5,afade=t=out:st={fade_start}:d={fade_duration}[music];"
        f"[2:a]volume=0.10,afade=t=out:st={fade_start}:d={fade_duration}[waves];"
        "[voice][music][waves]amix=inputs=3:duration=first:normalize=0,"
        f"alimiter=limit=0.8414:level=false:latency=true,afade=t=out:st={fade_start}:d={fade_duration}[out]"
    )
    ffmpeg(
        "-i", str(voice_normalized), "-i", str(music_normalized), "-i", str(WAVES),
        "-filter_complex", mix, "-map", "[out]", "-t", str(target),
        "-ar", "44100", "-ac", "2", "-codec:a", "libmp3lame", "-b:a", "192k",
        "-id3v2_version", "3", "-metadata", f"title={config['title']}",
        "-metadata", "artist=Callidus A&M", str(output_path),
    )
    metadata = {
        "title": config["title"], "durationSeconds": target,
        "voice": config["voice"], "model": config["model"],
        "speechSeconds": round(speech_seconds, 2), "pauseScale": round(scale, 3),
        "tailSeconds": config["tailSeconds"], "fadeOutSeconds": fade_duration,
        "music": {"title": "Deep Meditation", "creator": "Grand_Project",
                  "source": "https://pixabay.com/music/meditationspiritual-deep-meditation-192828/",
                  "license": "https://pixabay.com/service/license-summary/"},
        "mix": {"voiceLUFS": -19, "musicLUFS": -28, "background": "Generated wave ambience"},
        "chapters": chapters, "segments": segments,
    }
    (BASE / f"{STEM}.meta.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def main() -> None:
    global CACHE, OUTPUT, STEM
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", type=Path, default=SCRIPT)
    parser.add_argument("--sample", action="store_true", help="Generate only the first speech segment")
    args = parser.parse_args()
    config = json.loads(args.script.read_text(encoding="utf-8"))
    slug = config.get("slug", "schlafuebergang")
    if not slug or any(char not in "abcdefghijklmnopqrstuvwxyz0123456789-" for char in slug):
        raise ValueError("Session slug must contain only lowercase letters, digits and hyphens")
    CACHE = BASE / f"{slug}_segments"
    OUTPUT = BASE.parent / "public/audio" / slug
    STEM = config.get("stem", STEM)
    if Path(STEM).name != STEM or "/" in STEM or "\\" in STEM or STEM in ("", ".", ".."):
        raise ValueError("Output stem must be a filename without directory components")
    CACHE.mkdir(exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    keys = load_keys()
    if args.sample:
        print(synthesize((0, config["segments"][0]), config, keys))
        return
    with ThreadPoolExecutor(max_workers=2) as executor:
        paths = list(executor.map(lambda item: synthesize(item, config, keys), enumerate(config["segments"])))
    meta = assemble(paths, config)
    print(f"Done: {OUTPUT / (STEM + '.mp3')}; {meta['durationSeconds']} seconds", flush=True)


if __name__ == "__main__":
    main()
