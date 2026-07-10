# -*- coding: utf-8 -*-
"""
Create an original German advanced guided breathwork audio.

The file reuses the existing Klarheitsreset audio pipeline:
- Gemini TTS via the existing runtime key source
- Pixabay music already downloaded in audio-test
- generated ocean/waves ambience
- ffmpeg final mix

This is deliberately more intense than the gentle audio, but it avoids
dangerous extremes such as very long breath holds or instructions to push
through dizziness.
"""

from __future__ import annotations

import json
from pathlib import Path

import generate_klarheitsreset_gemini_pixabay as base


BASE = Path(__file__).resolve().parent
TITLE = "Power Breathwork - Energie und Klarheit"
DISPLAY_TITLE = "Power Breathwork: Energie und Klarheit"
TARGET_SECONDS = 15 * 60

SEG_DIR = BASE / "power_breathwork_segments"
OUT_VOICE = BASE / "power_breathwork_voice.wav"
OUT_MUSIC = BASE / "power_breathwork_music_bed.wav"
OUT_WAVES = BASE / "power_breathwork_waves.wav"
OUT_FINAL_WAV = BASE / "power-breathwork-gemini-pixabay-waves.wav"
OUT_FINAL_MP3 = BASE / "power-breathwork-gemini-pixabay-waves.mp3"
OUT_META = BASE / "power-breathwork-gemini-pixabay-waves.meta.json"

SEGMENTS: list[tuple[str, float]] = [
    ("Willkommen zu Power Breathwork. Diese Folge ist intensiv und nur für Fortgeschrittene gedacht.", 4),
    ("Bitte höre sie nicht beim Autofahren, nicht im Wasser, nicht im Stehen und nicht beim Bedienen von Maschinen.", 4),
    ("Übe nur im Sitzen oder Liegen. Wenn dir schwindlig, taub, eng oder unwohl wird, stoppe sofort und atme normal weiter.", 5),
    ("Nicht geeignet bei Schwangerschaft, Epilepsie, schweren Herz-Kreislauf-Erkrankungen, akuter Panik, Atemnot oder medizinischer Unsicherheit.", 5),
    ("Diese Audio ist keine Therapie und keine medizinische Anleitung. Du bleibst verantwortlich für deinen Körper.", 5),
    ("Wenn du bereit bist, richte dich stabil ein. Füße am Boden oder Rücken auf der Unterlage. Kiefer locker. Hände entspannt.", 7),
    ("Wir starten kontrolliert. Tief durch die Nase oder den Mund ein. Aktiv aus. Ohne Pressen.", 6),
    ("Ein. Aus. Ein. Aus. Lass den Atem größer werden.", 7),
    ("Ein. Aus. Ein. Aus. Mehr Energie. Mehr Präsenz.", 7),
    ("Runde eins beginnt. Dreißig aktive Atemzüge. Ich führe dich.", 5),
    ("Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.", 6),
    ("Zieh den Atem tief in den Körper. Lass ihn kraftvoll wieder gehen.", 6),
    ("Ein. Aus. Ein. Aus. Ein. Aus. Bleib wach. Bleib klar.", 7),
    ("Wenn es zu viel wird, verlangsame sofort. Du musst niemandem etwas beweisen.", 7),
    ("Weiter. Ein. Aus. Ein. Aus. Ein. Aus.", 7),
    ("Noch zehn Atemzüge. Kraftvoll. Kontrolliert. Nicht verkrampfen.", 6),
    ("Fünf. Vier. Drei. Zwei. Eins. Lasse den Atem los.", 6),
    ("Atme normal. Spüre den Körper. Nichts festhalten. Nur wahrnehmen.", 15),
    ("Runde zwei. Jetzt etwas tiefer, aber weiterhin sauber und kontrolliert.", 5),
    ("Ein. Aus. Ein. Aus. Fülle den Brustraum. Leere weich.", 7),
    ("Ein. Aus. Ein. Aus. Mehr Sauerstoffgefühl. Mehr Wachheit.", 7),
    ("Bleib im Rhythmus. Wenn Kribbeln entsteht, beobachte es. Wenn es unangenehm wird, pausiere.", 8),
    ("Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.", 8),
    ("Du gehst nicht über deine Grenze. Du gehst nur an den Rand deiner Aufmerksamkeit.", 8),
    ("Weiter. Ein. Aus. Ein. Aus. Ein. Aus.", 8),
    ("Noch zehn. Neun. Acht. Sieben. Sechs.", 5),
    ("Fünf. Vier. Drei. Zwei. Eins. Lasse los.", 6),
    ("Atme normal. Spüre Hitze, Puls, Weite oder Ruhe. Alles darf da sein.", 18),
    ("Runde drei. Die stärkste Runde. Nur wenn du dich stabil fühlst. Sonst bleib in normaler Atmung.", 7),
    ("Ein. Aus. Ein. Aus. Präsenz in den Körper.", 7),
    ("Ein. Aus. Ein. Aus. Druck raus. Energie rein.", 7),
    ("Kraftvoll, aber nicht hektisch. Tief, aber nicht brutal.", 8),
    ("Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.", 8),
    ("Lass die Ausatmung gehen. Lass Spannung gehen. Lass Kontrolle ein Stück los.", 8),
    ("Weiter. Ein. Aus. Ein. Aus. Ein. Aus.", 8),
    ("Noch zehn Atemzüge. Du bleibst wach. Du bleibst sicher. Du bleibst bei dir.", 7),
    ("Fünf. Vier. Drei. Zwei. Eins. Stopp. Lass alles los.", 6),
    ("Atme normal weiter. Kein Halten. Kein Zwingen. Nur Raum.", 20),
    ("Jetzt kommt die Integration. Dein Atem findet von selbst zurück.", 12),
    ("Spüre den Boden. Spüre Hände und Füße. Spüre dein Gesicht.", 10),
    ("Vielleicht ist Energie da. Vielleicht Ruhe. Vielleicht Zittern. Du musst nichts daraus machen.", 12),
    ("Atme durch die Nase ein. Langsam durch den Mund aus.", 12),
    ("Noch einmal. Einatmen. Langsam ausatmen.", 14),
    ("Lege innerlich einen Satz auf den Atem: Ich kann Kraft halten, ohne mich zu verlieren.", 12),
    ("Einatmen. Kraft. Ausatmen. Klarheit.", 12),
    ("Einatmen. Wach. Ausatmen. Geerdet.", 12),
    ("Lasse den Atem jetzt ganz natürlich fließen.", 14),
    ("Nimm den Raum um dich herum wahr. Geräusche. Temperatur. Kontaktpunkte.", 12),
    ("Bewege langsam Finger und Zehen. Rolle die Schultern, wenn es gut tut.", 10),
    ("Atme noch einmal tief ein. Und vollständig aus.", 10),
    ("Wenn du bereit bist, öffne die Augen.", 8),
    ("Trinke nachher Wasser. Steh langsam auf. Nimm diese Klarheit mit in eine einfache nächste Handlung.", 6),
    ("Danke, dass du diese intensive Praxis bewusst und verantwortlich genutzt hast.", 4),
]


# COMPACT POWER BREATHWORK OVERRIDE
# Fewer, longer TTS blocks are more reliable with the API than many tiny clips.
SEGMENTS = [
    ("""Willkommen zu Power Breathwork. Diese Folge ist intensiv und nur für Fortgeschrittene gedacht.
Bitte höre sie nicht beim Autofahren, nicht im Wasser, nicht im Stehen und nicht beim Bedienen von Maschinen.
Übe nur im Sitzen oder Liegen. Wenn dir schwindlig, taub, eng oder unwohl wird, stoppe sofort und atme normal weiter.
Nicht geeignet bei Schwangerschaft, Epilepsie, schweren Herz-Kreislauf-Erkrankungen, akuter Panik, Atemnot oder medizinischer Unsicherheit.
Diese Audio ist keine Therapie und keine medizinische Anleitung. Du bleibst verantwortlich für deinen Körper.""", 9),
    ("""Richte dich stabil ein. Füße am Boden oder Rücken auf der Unterlage. Kiefer locker. Hände entspannt.
Atme einmal tief ein. Und langsam aus.
Wir starten kontrolliert. Tief ein. Aktiv aus. Ohne Pressen.
Ein. Aus. Ein. Aus. Lass den Atem größer werden.
Ein. Aus. Ein. Aus. Mehr Energie. Mehr Präsenz.""", 12),
    ("""Runde eins beginnt. Dreißig aktive Atemzüge. Ich führe dich.
Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.
Zieh den Atem tief in den Körper. Lass ihn kraftvoll wieder gehen.
Ein. Aus. Ein. Aus. Ein. Aus. Bleib wach. Bleib klar.
Wenn es zu viel wird, verlangsame sofort. Du musst niemandem etwas beweisen.
Weiter. Ein. Aus. Ein. Aus. Ein. Aus.
Noch zehn Atemzüge. Kraftvoll. Kontrolliert. Nicht verkrampfen.
Fünf. Vier. Drei. Zwei. Eins. Lasse den Atem los.""", 12),
    ("""Atme normal. Spüre den Körper. Nichts festhalten. Nur wahrnehmen.
Vielleicht ist Wärme da. Vielleicht Puls. Vielleicht Weite. Vielleicht Widerstand.
Du musst nichts bewerten. Du kommst nur zurück in den Körper.
Normal atmen. Schultern weich. Gesicht weich. Hände locker.""", 22),
    ("""Runde zwei. Jetzt etwas tiefer, aber weiterhin sauber und kontrolliert.
Ein. Aus. Ein. Aus. Fülle den Brustraum. Leere weich.
Ein. Aus. Ein. Aus. Mehr Sauerstoffgefühl. Mehr Wachheit.
Bleib im Rhythmus. Wenn Kribbeln entsteht, beobachte es. Wenn es unangenehm wird, pausiere.
Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.
Du gehst nicht über deine Grenze. Du gehst nur an den Rand deiner Aufmerksamkeit.
Weiter. Ein. Aus. Ein. Aus. Ein. Aus.
Noch zehn. Neun. Acht. Sieben. Sechs. Fünf. Vier. Drei. Zwei. Eins. Lasse los.""", 14),
    ("""Atme normal. Spüre Hitze, Puls, Weite oder Ruhe. Alles darf da sein.
Kein Halten. Kein Zwingen. Dein Körper sortiert die Energie.
Lass die Musik tragen. Lass den Boden halten. Lass die Atmung von selbst kommen.""", 24),
    ("""Runde drei. Die stärkste Runde. Nur wenn du dich stabil fühlst. Sonst bleib in normaler Atmung.
Ein. Aus. Ein. Aus. Präsenz in den Körper.
Ein. Aus. Ein. Aus. Druck raus. Energie rein.
Kraftvoll, aber nicht hektisch. Tief, aber nicht brutal.
Ein. Aus. Ein. Aus. Ein. Aus. Ein. Aus.
Lass die Ausatmung gehen. Lass Spannung gehen. Lass Kontrolle ein Stück los.
Weiter. Ein. Aus. Ein. Aus. Ein. Aus.
Noch zehn Atemzüge. Du bleibst wach. Du bleibst sicher. Du bleibst bei dir.
Fünf. Vier. Drei. Zwei. Eins. Stopp. Lass alles los.""", 16),
    ("""Atme normal weiter. Kein Halten. Kein Zwingen. Nur Raum.
Jetzt kommt die Integration. Dein Atem findet von selbst zurück.
Spüre den Boden. Spüre Hände und Füße. Spüre dein Gesicht.
Vielleicht ist Energie da. Vielleicht Ruhe. Vielleicht Zittern. Du musst nichts daraus machen.""", 30),
    ("""Atme durch die Nase ein. Langsam durch den Mund aus.
Noch einmal. Einatmen. Langsam ausatmen.
Lege innerlich einen Satz auf den Atem: Ich kann Kraft halten, ohne mich zu verlieren.
Einatmen. Kraft. Ausatmen. Klarheit.
Einatmen. Wach. Ausatmen. Geerdet.""", 24),
    ("""Lasse den Atem jetzt ganz natürlich fließen.
Nimm den Raum um dich herum wahr. Geräusche. Temperatur. Kontaktpunkte.
Bewege langsam Finger und Zehen. Rolle die Schultern, wenn es gut tut.
Atme noch einmal tief ein. Und vollständig aus.
Wenn du bereit bist, öffne die Augen.
Trinke nachher Wasser. Steh langsam auf. Nimm diese Klarheit mit in eine einfache nächste Handlung.
Danke, dass du diese intensive Praxis bewusst und verantwortlich genutzt hast.""", 8),
]
def configure_base() -> None:
    base.SEGMENTS = SEGMENTS
    base.TARGET_SECONDS = TARGET_SECONDS
    base.LEAD_IN_SECONDS = 8.0
    base.TAIL_SECONDS = 42.0
    base.SEG_DIR = SEG_DIR
    base.OUT_VOICE = OUT_VOICE
    base.OUT_MUSIC = OUT_MUSIC
    base.OUT_WAVES = OUT_WAVES
    base.OUT_FINAL_WAV = OUT_FINAL_WAV
    base.OUT_FINAL_MP3 = OUT_FINAL_MP3
    base.OUT_META = OUT_META
    base.MUSIC_VOLUME = 0.34
    base.MUSIC_FADE_IN_SECONDS = 7.0
    base.MUSIC_FADE_OUT_SECONDS = 55.0


def mix_final(duration: float) -> None:
    filter_complex = (
        f"[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.16[voice];"
        f"[1:a]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo[music];"
        f"[2:a]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,volume=0.10[waves];"
        "[voice][music][waves]amix=inputs=3:duration=first:normalize=0"
    )
    base.run_ffmpeg([
        "-y",
        "-i", str(OUT_VOICE),
        "-i", str(OUT_MUSIC),
        "-i", str(OUT_WAVES),
        "-filter_complex", filter_complex,
        "-ar", "44100",
        "-ac", "2",
        str(OUT_FINAL_WAV),
    ])
    base.run_ffmpeg([
        "-y",
        "-i", str(OUT_FINAL_WAV),
        "-codec:a", "libmp3lame",
        "-b:a", "192k",
        "-id3v2_version", "3",
        "-metadata", f"title={TITLE}",
        "-metadata", "artist=Callidus AM",
        str(OUT_FINAL_MP3),
    ])


def write_metadata(duration: float) -> None:
    meta = {
        "title": TITLE,
        "display_title": DISPLAY_TITLE,
        "duration_seconds": round(duration, 2),
        "voice_provider": "Gemini TTS",
        "voice": base.VOICE,
        "style": "Intensive guided breathwork for advanced users; active rounds with integration pauses.",
        "safety_note": "Not medical advice. Practice seated or lying down only. Stop immediately if dizzy, unwell, panicky, numb, or short of breath.",
        "music": {
            "title": "Deep Meditation",
            "creator": "Grand_Project",
            "source": "https://pixabay.com/music/meditationspiritual-deep-meditation-192828/",
            "downloaded_file": base.MUSIC_SOURCE.name,
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
    }
    OUT_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    configure_base()
    SEG_DIR.mkdir(exist_ok=True)
    keys = base.load_gemini_keys()

    segment_paths: list[Path] = []
    for index, (text, _) in enumerate(SEGMENTS):
        path = SEG_DIR / f"seg_{index:02d}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)}")
        base.generate_tts(text, path, keys)
        segment_paths.append(path)

    duration = base.build_voice_track(segment_paths)
    base.build_music_bed(duration)
    base.build_waves(duration)
    mix_final(duration)
    write_metadata(duration)
    print(f"Done: {OUT_FINAL_MP3} ({duration / 60:.2f} min)")


if __name__ == "__main__":
    main()
