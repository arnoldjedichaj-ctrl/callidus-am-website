# -*- coding: utf-8 -*-
"""Local-only longer audio-story prototype with a few hand-made sound moments."""
from __future__ import annotations

import json
import math
import random
import wave
from pathlib import Path

from pydub import AudioSegment

import generate_kids_hoergeschichte_mvp as v1


BASE = Path(__file__).resolve().parent
SEG_DIR = BASE / "kids_hoergeschichte_mvp_v3_segments"
SFX_DIR = BASE / "kids_hoergeschichte_mvp_v3_sfx"
OUT_WAV = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v3.wav"
OUT_MP3 = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v3.mp3"
OUT_META = BASE / "kids-hoergeschichte-schlaf-akku-mvp-v3.meta.json"

VOICE_PROFILES = {
    "erzaehler": {
        "voice": "Iapetus",
        "direction": (
            "Sprich als erwachsener maennlicher Erzaehler auf Deutsch. "
            "Normales, natuerliches Vorlesetempo, warm, klar und bildhaft. "
            "Nicht meditativ, nicht langsam und nicht werblich."
        ),
    },
    "noah": {
        "voice": "Puck",
        "direction": (
            "Sprich als fiktive Kinderbuchfigur Noah: neugierig, ein wenig verschlafen, "
            "lebendig und jungenhaft. Nicht schrill und nicht wie ein echtes Kind geklont."
        ),
    },
    "mira": {
        "voice": "Kore",
        "direction": (
            "Sprich als fiktive Kinderbuchfigur Mira: freundlich, klar, klug und warm. "
            "Deutlich anders als Noah, nicht wie ein echtes Kind geklont."
        ),
    },
    "calli": {
        "voice": "Orus",
        "direction": "Sprich als Calli, ein kleiner weiser Kompass. Klar, freundlich, leicht feierlich und mit Schmunzeln.",
    },
    "nino": {
        "voice": "Aoede",
        "direction": "Sprich als Nino, der Nachtfreund. Weich, leise, freundlich und beruhigend, aber deutlich verstaendlich.",
    },
}

# Short beats keep the speakers easy to follow while forming one continuous story.
SEGMENTS: list[dict[str, str | float]] = [
    {"speaker": "erzaehler", "text": "Im Zimmer war es schon Abend. Auf Noahs Teppich stand ein hoher Bauklotzturm mit einer kleinen Luecke ganz oben. Davor kniete Noah im Schlafanzug und sah zu der Luecke hinauf.", "pause": 0.25},
    {"speaker": "noah", "text": "Nur noch ein Dach. Und unter dem Dach kommt ein Aufzug. Sonst kann niemand bis zur Mondterrasse fahren.", "pause": 0.22},
    {"speaker": "erzaehler", "text": "Noahs Augen wurden dabei immer schmaler. Einmal gaehnte er so gross, dass sein ganzer Turm fast mitgaehnt haette.", "pause": 0.22},
    {"speaker": "mira", "text": "Der Turm kann noch warten. Deine Augen machen schon die Schlafanzug-Ansage.", "pause": 0.22},
    {"speaker": "noah", "text": "Aber wenn ich jetzt schlafe, denke ich morgen vielleicht nicht mehr an den Aufzug.", "pause": 0.24},
    {"speaker": "erzaehler", "text": "Da sprang Calli, der kleine Kompass, auf Noahs Bettdecke. Seine rote Nadel drehte eine winzige Runde und blieb genau bei dem Wort morgen stehen.", "pause": 0.25},
    {"speaker": "calli", "text": "Dann geben wir dem Aufzug einen Parkplatz fuer die Nacht. Gute Ideen muessen nicht die ganze Nacht im Kreis fahren.", "pause": 0.24},
    {"speaker": "noah", "text": "Einen Parkplatz fuer Gedanken? Haben Gedanken denn Reifen?", "pause": 0.2},
    {"speaker": "mira", "text": "Vielleicht sehr leise Reifen. Komm, wir malen schnell ein Schild: Morgen bauen wir den Aufzug.", "pause": 0.24},
    {"speaker": "erzaehler", "text": "Mira legte einen kleinen Zettel neben den Turm. Noah malte einen Pfeil nach oben, zwei Tueren und drei runde Knoepfe. Dann stellte er den Stift weg.", "pause": 0.25},
    {"speaker": "noah", "text": "Jetzt weiss der Aufzug, wo er morgen sein soll.", "pause": 0.22},
    {"speaker": "erzaehler", "text": "In der Zimmerecke wurde es auf einmal sanft hell. Nicht wie eine grosse Lampe. Eher wie ein Mondstrahl, der einen freundlichen Besuch macht.", "pause": 0.3},
    {"speaker": "nino", "text": "Guten Abend, Noah. Ich bin Nino. Ich habe gehoert, hier sucht jemand einen Platz fuer einen wichtigen Gedanken.", "pause": 0.24},
    {"speaker": "noah", "text": "Der Platz ist gefunden. Aber ich bin immer noch nicht sicher, ob ich schlafen kann.", "pause": 0.22},
    {"speaker": "erzaehler", "text": "Ueber Noahs Bett erschien ein Akku aus Mondlicht. Nur ein kleiner Balken leuchtete darin. Der Rest war dunkelblau und wartete geduldig.", "pause": 0.28},
    {"speaker": "nino", "text": "Das ist dein Schlaf-Akku. Tagsueber hilft er dir beim Denken, Rennen, Lachen und Bauen. Nach einem langen Tag moechte er wieder Kraft sammeln.", "pause": 0.26},
    {"speaker": "mira", "text": "Also laedt Schlaf den Akku wieder auf?", "pause": 0.2},
    {"speaker": "nino", "text": "Genau. Und waehrend du schlaefst, wird auch die Nachtwerkstatt aktiv. Sie sortiert Erinnerungen und macht deinen Koerper bereit fuer morgen.", "pause": 0.28},
    {"speaker": "calli", "text": "Die Nachtwerkstatt arbeitet leise. Niemand muss dabei wach bleiben und zugucken.", "pause": 0.24},
    {"speaker": "noah", "text": "Kann sie auch einen Aufzug bauen?", "pause": 0.2},
    {"speaker": "calli", "text": "Den bauen morgen deine Haende. Aber die Nachtwerkstatt gibt ihnen neue Kraft.", "pause": 0.25},
    {"speaker": "erzaehler", "text": "Noah sah noch einmal zum Turm. Dann zog er die Decke ueber die Beine. Doch sein Kopf machte trotzdem noch kleine Hup-Hup-Runden um die Mondterrasse.", "pause": 0.25},
    {"speaker": "noah", "text": "Mein Kopf ist noch wach. Er denkt: Aufzug, Aufzug, Aufzug.", "pause": 0.22},
    {"speaker": "nino", "text": "Dann sagen wir ihm nicht: Sei sofort still. Wir sagen nur: Danke, Kopf. Der Zettel passt auf die Idee auf.", "pause": 0.25},
    {"speaker": "mira", "text": "Und wir machen es dem Kopf jetzt ein bisschen leichter.", "pause": 0.2},
    {"speaker": "erzaehler", "text": "Mira schob das helle Zimmerlicht aus. Nur die kleine Nachtlampe blieb an. Calli legte sich neben Noahs Kissen, und Nino hielt seine Laterne ganz tief.", "pause": 0.28},
    {"speaker": "calli", "text": "Erste Werkstatt-Regel: Alles wird langsam. Die Schultern duerfen schwer werden. Die Haende duerfen ausruhen.", "pause": 0.26},
    {"speaker": "erzaehler", "text": "Noah liess seine Finger auf der Decke liegen. Sie mussten nichts mehr festhalten. Auch seine Fuesse wurden warm und still.", "pause": 0.26},
    {"speaker": "nino", "text": "Und jetzt hoer einmal: ein Atemzug hinein, ein Atemzug hinaus. Mehr muss gerade nicht passieren.", "pause": 0.28},
    {"speaker": "erzaehler", "text": "Noah atmete ein. Dann wieder aus. Beim zweiten Mal wackelte der dunkle Akku ein wenig. Beim dritten Mal leuchtete ein weiterer Balken auf.", "pause": 0.28},
    {"speaker": "noah", "text": "Hat er sich gerade bewegt?", "pause": 0.2},
    {"speaker": "nino", "text": "Ja. Der Akku weiss schon, was zu tun ist. Ruhe ist sein Startknopf.", "pause": 0.24},
    {"speaker": "erzaehler", "text": "Draussen fuhr irgendwo ein Auto vorbei und wurde leiser. Im Zimmer war es kuschelig. Der Turm war noch da. Der Zettel war noch da. Nichts Wichtiges ging verloren.", "pause": 0.3},
    {"speaker": "mira", "text": "Morgen starten wir beim Aufzug. Ich darf doch die Knoepfe malen?", "pause": 0.22},
    {"speaker": "noah", "text": "Ja. Aber der Mondknopf gehoert mir.", "pause": 0.22},
    {"speaker": "erzaehler", "text": "Noah laechelte noch einmal. Dann wurde das Laecheln kleiner, weil seine Augen lieber zugehen wollten. Der dritte Balken im Mond-Akku leuchtete. Dann der vierte.", "pause": 0.28},
    {"speaker": "calli", "text": "Siehst du? Schlaf ist keine Pause von allen tollen Dingen. Schlaf ist die Vorbereitung auf sie.", "pause": 0.26},
    {"speaker": "noah", "text": "Dann lade ich jetzt fuer den Aufzug auf.", "pause": 0.24},
    {"speaker": "nino", "text": "Eine sehr gute Idee. Gute Nacht, Noah. Der Schlaf-Akku laedt sich leise auf.", "pause": 0.34},
    {"speaker": "erzaehler", "text": "Nino machte seine Laterne kleiner. Calli wurde ganz still. Mira zog die Tuere vorsichtig zu. Im Zimmer blieb der Mond auf dem Fensterbrett und der Akku leuchtete freundlich weiter.", "pause": 0.35},
    {"speaker": "erzaehler", "text": "Und waehrend Noah traeumte, machte die Nachtwerkstatt ihre ruhige Arbeit. Sie sortierte den Tag, sammelte neue Kraft und bewahrte den Aufzug sicher fuer den Morgen auf.", "pause": 0.35},
    {"speaker": "erzaehler", "text": "Als es draussen langsam hell wurde, lag der Zettel noch neben dem Turm. Noahs Akku war voll. Und in seinem Kopf wartete schon die erste Idee fuer einen Mondknopf.", "pause": 0.75},
]

SFX_CUES = {
    0: ("zimmerabend", -31),
    14: ("mondakku", -29),
    29: ("aufladen", -31),
    39: ("nachtabschluss", -33),
}


def make_sfx(path: Path, kind: str, seconds: float = 5.0, rate: int = 44100) -> None:
    """Create gentle, non-looping tonal atmospheres; no music bed under dialogue."""
    randomizer = random.Random(71 + len(kind))
    frames: list[bytes] = []
    for index in range(int(seconds * rate)):
        t = index / rate
        envelope = min(1.0, t / 0.7, (seconds - t) / 1.4)
        noise = (randomizer.random() * 2 - 1) * 0.012
        if kind == "zimmerabend":
            sample = noise + 0.018 * math.sin(2 * math.pi * 174 * t) + 0.009 * math.sin(2 * math.pi * 261 * t)
        elif kind == "mondakku":
            shimmer = 0.024 * math.sin(2 * math.pi * 523.25 * t) + 0.016 * math.sin(2 * math.pi * 783.99 * t)
            sample = noise + shimmer * (0.35 + 0.65 * math.sin(math.pi * t / seconds) ** 2)
        elif kind == "aufladen":
            pulse = 0.5 + 0.5 * math.sin(2 * math.pi * 0.7 * t)
            sample = noise + pulse * (0.020 * math.sin(2 * math.pi * 293.66 * t) + 0.010 * math.sin(2 * math.pi * 440 * t))
        else:
            sample = noise + 0.012 * math.sin(2 * math.pi * 196 * t) + 0.007 * math.sin(2 * math.pi * 293.66 * t)
        frames.append(int(max(-1, min(1, sample * envelope)) * 32767).to_bytes(2, "little", signed=True))
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(b"".join(frames))


def build_wav(paths: list[Path]) -> float:
    SFX_DIR.mkdir(exist_ok=True)
    for name, _ in SFX_CUES.values():
        sfx_path = SFX_DIR / f"{name}.wav"
        if not sfx_path.exists():
            make_sfx(sfx_path, name)

    track = AudioSegment.silent(duration=500, frame_rate=44100).set_channels(1)
    for index, (path, segment) in enumerate(zip(paths, SEGMENTS)):
        clip = AudioSegment.from_wav(path).set_frame_rate(44100).set_channels(1)
        cue = SFX_CUES.get(index)
        if cue:
            effect = AudioSegment.from_wav(SFX_DIR / f"{cue[0]}.wav").set_frame_rate(44100).set_channels(1) + cue[1]
            clip = effect.overlay(clip)
        track += clip + AudioSegment.silent(duration=int(float(segment["pause"]) * 1000), frame_rate=44100)
    track += AudioSegment.silent(duration=1100, frame_rate=44100)
    track.export(OUT_WAV, format="wav")
    return len(track) / 1000.0


def export_mp3() -> None:
    v1.base.run_ffmpeg([
        "-y", "-i", str(OUT_WAV), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "2",
        "-codec:a", "libmp3lame", "-b:a", "192k", "-id3v2_version", "3",
        "-metadata", "title=Noahs Schlaf-Akku MVP v3", "-metadata", "artist=Callidus KIDS", str(OUT_MP3),
    ])


def write_meta(duration: float) -> None:
    OUT_META.write_text(json.dumps({
        "title": "Noahs Schlaf-Akku MVP v3",
        "purpose": "Local-only extended audio story with intermittent original tonal atmospheres. Not integrated into the website.",
        "duration_seconds": round(duration, 2), "duration_minutes": round(duration / 60, 2),
        "voice_provider": "Gemini TTS", "models": v1.TTS_MODELS,
        "characters": {name: {"voice": profile["voice"], "direction": profile["direction"]} for name, profile in VOICE_PROFILES.items()},
        "sound_design": {"approach": "Four short, generated tonal atmospheres placed only at story transitions; no continuous music bed.", "cues": SFX_CUES},
        "disclosure_note": "Uses synthetic TTS voices for fictional characters; no real child voice cloning.",
        "files": {"wav": OUT_WAV.name, "mp3": OUT_MP3.name, "generator": Path(__file__).name, "segments": SEG_DIR.name, "sound_effects": SFX_DIR.name},
        "script_segments": SEGMENTS,
    }, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    v1.VOICE_PROFILES = VOICE_PROFILES
    SEG_DIR.mkdir(exist_ok=True)
    keys = v1.load_keys()
    paths: list[Path] = []
    for index, segment in enumerate(SEGMENTS):
        speaker = str(segment["speaker"])
        path = SEG_DIR / f"{index:02d}_{speaker}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)} {speaker}")
        v1.generate_tts(speaker, str(segment["text"]), path, keys)
        paths.append(path)
    duration = build_wav(paths)
    export_mp3()
    write_meta(duration)
    print(f"Done: {OUT_MP3} ({duration:.1f}s)")


if __name__ == "__main__":
    main()
