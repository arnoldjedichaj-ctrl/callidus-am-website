# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import wave
from pathlib import Path

import generate_kids_hoergeschichte_mvp as v1


BASE = Path(__file__).resolve().parent
SEG_DIR = BASE / "kids_hoergeschichte_mvp_v2_segments"
OUT_WAV = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v2.wav"
OUT_MP3 = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v2.mp3"
OUT_META = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v2.meta.json"

VOICE_PROFILES = {
    "erzaehler": {
        "voice": "Charon",
        "direction": (
            "Sprich als erwachsener männlicher Erzähler auf Deutsch. "
            "Normales, natürliches Vorlesetempo, warm, klar, lebendig, nicht meditativ und nicht zu langsam."
        ),
    },
    "noah": {
        "voice": "Puck",
        "direction": (
            "Sprich als fiktive Kinderbuchfigur Noah: neugierig, verschlafen, lebendig, etwas jungenhaft. "
            "Nicht schrill und nicht wie ein echtes Kind geklont."
        ),
    },
    "mira": {
        "voice": "Kore",
        "direction": (
            "Sprich als fiktive Kinderbuchfigur Mira: freundlich, klar, clever und warm. "
            "Deutlich anders als Noah, nicht wie ein echtes Kind geklont."
        ),
    },
    "calli": {
        "voice": "Orus",
        "direction": (
            "Sprich als Calli, ein kleiner weiser Kompass. Klar, freundlich, leicht feierlich, mit kleinem Schmunzeln."
        ),
    },
    "nino": {
        "voice": "Aoede",
        "direction": (
            "Sprich als Nino, der Nachtfreund. Weich, leise, beruhigend und schlafmützig, aber verständlich."
        ),
    },
}

SEGMENTS: list[dict[str, str | float]] = [
    {
        "speaker": "erzaehler",
        "text": (
            "Heute Abend war Noah eigentlich überhaupt nicht müde. Das sagte er jedenfalls. "
            "Seine Augen sahen das ein bisschen anders. Sie wurden schon schwer, während er vor seinem Bauklotzturm stand."
        ),
        "pause": 0.35,
    },
    {
        "speaker": "noah",
        "text": "Ich kann jetzt nicht schlafen. Mein Turm braucht noch ein Dach. Und ein Dach braucht einen Aufzug.",
        "pause": 0.25,
    },
    {
        "speaker": "erzaehler",
        "text": "Mira saß schon im Schlafanzug auf dem Teppich. Sie sah Noah an und grinste.",
        "pause": 0.25,
    },
    {
        "speaker": "mira",
        "text": "Noah, du hast gerade so groß gegähnt, dass fast dein ganzer Turm mit hineingepasst hätte.",
        "pause": 0.25,
    },
    {
        "speaker": "erzaehler",
        "text": "Da hüpfte Calli, der kleine Kompass, auf die Decke. Seine rote Nadel wackelte zufrieden.",
        "pause": 0.25,
    },
    {
        "speaker": "calli",
        "text": "Ein Gähnen ist kein Problem. Es ist eine Nachricht. Dein Körper sagt: Bitte einmal aufladen.",
        "pause": 0.3,
    },
    {
        "speaker": "noah",
        "text": "Aufladen? Ich bin doch kein Tablet.",
        "pause": 0.2,
    },
    {
        "speaker": "erzaehler",
        "text": "In diesem Moment wurde es in der Zimmerecke ganz sanft hell. Nicht gruselig. Eher wie eine kleine Nachtlampe, die atmet.",
        "pause": 0.35,
    },
    {
        "speaker": "nino",
        "text": "Guten Abend. Ich bin Nino. Und ich kenne mich mit müden Akkus ziemlich gut aus.",
        "pause": 0.25,
    },
    {
        "speaker": "erzaehler",
        "text": "Über Noahs Bett erschien ein Akku aus Mondlicht. Er war fast leer. Dann legte Noah sich hin, und der erste kleine Balken begann zu leuchten.",
        "pause": 0.35,
    },
    {
        "speaker": "mira",
        "text": "Heißt das, Schlaf macht wieder Kraft in den Körper?",
        "pause": 0.2,
    },
    {
        "speaker": "nino",
        "text": "Genau. Während du schläfst, sortiert dein Kopf den Tag. Dein Körper repariert kleine Stellen. Und dein Akku füllt sich für morgen.",
        "pause": 0.35,
    },
    {
        "speaker": "calli",
        "text": "Schlaf ist also keine verlorene Zeit. Schlaf ist Nachtarbeit mit Kuscheldecke.",
        "pause": 0.3,
    },
    {
        "speaker": "erzaehler",
        "text": "Noah zog die Decke bis zur Nase. Der zweite Balken im Mond-Akku leuchtete auf. Dann der dritte.",
        "pause": 0.3,
    },
    {
        "speaker": "noah",
        "text": "Wenn mein Akku morgen voll ist, baue ich vielleicht zwei Aufzüge.",
        "pause": 0.25,
    },
    {
        "speaker": "mira",
        "text": "Dann lade dich lieber ordentlich auf.",
        "pause": 0.25,
    },
    {
        "speaker": "erzaehler",
        "text": "Nino machte seine Laterne kleiner. Calli wurde ganz still. Und Noahs Atem wurde langsam und weich.",
        "pause": 0.35,
    },
    {
        "speaker": "nino",
        "text": "Gute Nacht, Noah. Erst kommt die Ruhe. Dann lädt der Schlaf.",
        "pause": 0.35,
    },
    {
        "speaker": "erzaehler",
        "text": (
            "Am Fenster stand der Mond. Im Zimmer war es warm und sicher. "
            "Und während Noah träumte, wurde sein Akku voll. Ganz ohne Eile. Genau richtig für einen neuen Morgen."
        ),
        "pause": 0.8,
    },
]


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def export_mp3() -> None:
    v1.base.run_ffmpeg(
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
            "title=Noahs Schlaf-Akku MVP v2",
            "-metadata",
            "artist=Callidus KIDS",
            str(OUT_MP3),
        ]
    )


def write_meta(duration: float) -> None:
    OUT_META.write_text(
        json.dumps(
            {
                "title": "Noahs Schlaf-Akku MVP v2",
                "purpose": "Local A/B test: stronger male narrator, clearer character attribution, more continuous storytelling. Not integrated into the website.",
                "duration_seconds": round(duration, 2),
                "duration_minutes": round(duration / 60, 2),
                "voice_provider": "Gemini TTS",
                "models": v1.TTS_MODELS,
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
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def main() -> None:
    v1.SEG_DIR = SEG_DIR
    v1.OUT_WAV = OUT_WAV
    v1.OUT_MP3 = OUT_MP3
    v1.OUT_META = OUT_META
    v1.VOICE_PROFILES = VOICE_PROFILES
    v1.SEGMENTS = SEGMENTS

    SEG_DIR.mkdir(exist_ok=True)
    keys = v1.load_keys()
    paths: list[Path] = []
    for index, segment in enumerate(SEGMENTS):
        speaker = str(segment["speaker"])
        path = SEG_DIR / f"{index:02d}_{speaker}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)} {speaker}")
        v1.generate_tts(speaker, str(segment["text"]), path, keys)
        paths.append(path)
    duration = v1.build_wav(paths)
    export_mp3()
    write_meta(duration)
    print(f"Done: {OUT_MP3} ({duration:.1f}s)")


if __name__ == "__main__":
    main()
