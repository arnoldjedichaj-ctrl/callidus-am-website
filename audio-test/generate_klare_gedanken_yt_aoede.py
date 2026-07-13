# -*- coding: utf-8 -*-
"""
Generate "Die Kraft klarer Gedanken" with the Callidus YouTube TTS voice.

Output:
- Gemini TTS voice Aoede, matching the existing YouTube/Remotion pipeline
- no background music
- no waves
- clean voiceover MP3 plus metadata
"""

from __future__ import annotations

import base64
import json
import re
import time
import wave
from pathlib import Path

import requests

import generate_klarheitsreset_gemini_pixabay as base


BASE = Path(__file__).resolve().parent
SEG_DIR = BASE / "klare_gedanken_yt_aoede_segments"
OUT_VOICE = BASE / "kraft-klarer-gedanken-yt-aoede.wav"
OUT_MP3 = BASE / "kraft-klarer-gedanken-yt-aoede.mp3"
OUT_META = BASE / "kraft-klarer-gedanken-yt-aoede.meta.json"
YOUTUBE_SECRETS = Path(r"C:\Users\marga\callidus_youtube\secrets.env")

VOICE = "Aoede"
TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]

SEGMENTS: list[tuple[str, float]] = [
    (
        """Willkommen. In dieser Audio geht es um die Kraft klarer Gedanken.
Nicht als leeres positives Denken. Sondern als praktische innere Ausrichtung.
Klare Gedanken helfen uns zu erkennen, was wir wirklich wollen, worauf wir achten und welcher nächste Schritt sinnvoll ist.
Nimm dir diese Zeit ohne Druck. Du musst nichts beweisen. Es reicht, zuzuhören, klarer zu werden und innerlich Ordnung entstehen zu lassen.""",
        2.8,
    ),
    (
        """Unsere Gedanken beeinflussen, worauf wir achten und wie wir handeln.
Wer ein klares Ziel hat, erkennt leichter Möglichkeiten, trifft bewusstere Entscheidungen und bleibt eher am Ball.
Ein Wunsch allein reicht jedoch nicht. Wir müssen wissen, was wir wirklich möchten, und bereit sein, etwas dafür zu tun.""",
        2.5,
    ),
    (
        """Der erste Schritt lautet: Stellen Sie sich Ihr Ziel genau vor.
Machen Sie sich ein klares Bild davon, was Sie erreichen möchten.
Vielleicht sehen Sie sich in einer gewünschten Arbeit. Vielleicht erleben Sie finanzielle Sicherheit.
Vielleicht schließen Sie ein wichtiges Projekt erfolgreich ab. Oder Sie sehen sich gesund, ausgeglichen und handlungsfähig.
Je klarer dieses Bild ist, desto leichter kann sich Ihre Aufmerksamkeit darauf richten.""",
        3.0,
    ),
    (
        """Der zweite Schritt lautet: Verbinden Sie dieses Bild mit einem guten Gefühl.
Stellen Sie sich nicht nur das Ergebnis vor. Spüren Sie auch, wie es sich anfühlen würde.
Vielleicht ist es Freude. Vielleicht Dankbarkeit. Vielleicht Ruhe, Vertrauen oder Erleichterung.
Positive Gefühle helfen dabei, ein Ziel innerlich ernst zu nehmen.
Angst, ständiger Zweifel und innerer Druck können dagegen dazu führen, dass wir uns selbst blockieren.""",
        3.0,
    ),
    (
        """Der dritte Schritt lautet: Finden Sie einen kurzen Satz.
Wählen Sie einen einfachen Satz, der zu Ihrem Ziel passt.
Zum Beispiel: Ich bin bereit. Ich vertraue meinem Weg. Es ist möglich. Oder einfach: Danke.
Dieser Satz soll Sie an Ihr Ziel erinnern. Und an das Gefühl, mit dem Sie dieses Ziel verbinden.
Der vierte Schritt lautet: Wiederholen Sie die Übung in Ruhe.
Nehmen Sie sich regelmäßig einige Minuten Zeit. Entspannen Sie sich, stellen Sie sich Ihr Ziel vor und wiederholen Sie Ihren Satz.
Nicht krampfhaft. Nicht als Zwang. Sondern ruhig, klar und ohne Druck.""",
        3.3,
    ),
    (
        """Wünsche geben uns eine Richtung.
Sie gehören zum Leben. Sie bewegen uns dazu, etwas zu verändern, zu lernen oder zu erschaffen.
Viele Erfindungen entstanden, weil Menschen ein Problem lösen wollten.
Häuser schützen vor Kälte und Regen. Heizungen sorgen für Wärme. Klimaanlagen helfen bei großer Hitze.
Auch im Alltag handeln wir aus Wünschen heraus.
Wir suchen Nähe. Wir bauen etwas auf. Wir versorgen unsere Familie. Wir kümmern uns um unsere Gesundheit, weil wir uns besser fühlen möchten.
Ein Wunsch ist deshalb nicht grundsätzlich egoistisch. Entscheidend ist, wie wir mit ihm umgehen.""",
        3.1,
    ),
    (
        """Wohlstand ist mehr als Geld.
Wohlstand kann Gesundheit bedeuten, Wissen, gute Beziehungen, Zeit, Sicherheit und innere Ruhe.
Geld ist ein Werkzeug. Es kann Bildung, Mobilität, Technik, Unterstützung und persönliche Entwicklung ermöglichen.
Es ist weder gut noch schlecht. Entscheidend ist, wofür wir es verwenden.
Das Ziel sollte nicht sein, Geld nur anzuhäufen.
Geld kann sinnvoll eingesetzt werden, um das eigene Leben zu gestalten und anderen zu helfen.""",
        3.0,
    ),
    (
        """Erschaffen statt kämpfen.
Wohlstand muss nicht immer auf Kosten anderer entstehen.
Menschen können neue Ideen, Produkte, Dienstleistungen, Kunstwerke und Arbeitsplätze schaffen.
Dadurch kann ein Nutzen entstehen, von dem mehrere Menschen profitieren.
Die bessere Frage lautet deshalb nicht: Wie kann ich mehr bekommen als andere?
Sondern: Was kann ich erschaffen, das für mich und andere einen Wert hat?""",
        3.1,
    ),
    (
        """Vergleichen Sie sich nicht ständig.
Neid entsteht oft aus der Angst, dass nicht genug für alle da ist.
Doch der Erfolg eines anderen bedeutet nicht automatisch, dass für Sie weniger übrig bleibt.
Der Erfolg anderer kann auch zeigen, was möglich ist.
Statt sich mit anderen zu vergleichen, können Sie sich auf Ihren eigenen Weg konzentrieren.
Lassen Sie auch die Vergangenheit los.
Vergangene Fehler oder Verluste müssen nicht über Ihre Zukunft entscheiden.
Sie können aus der Vergangenheit lernen. Sie sollten aber nicht jeden neuen Schritt danach beurteilen, was früher schiefgegangen ist.
Wichtig ist, was Sie heute denken, entscheiden und tun.""",
        3.3,
    ),
    (
        """Achten Sie auf Ihre Sprache.
Sätze, die mit Ich bin beginnen, beeinflussen Ihr Selbstbild.
Wer ständig sagt: Ich bin ein Versager. Ich bin zu arm. Ich kann das nicht.
Der festigt diese Sicht auf sich selbst.
Hilfreicher sind realistische und stärkende Aussagen.
Ich kann dazulernen. Ich suche nach einer Lösung. Ich werde sicherer. Ich gehe den nächsten Schritt.
Worte allein verändern nicht das Leben.
Sie beeinflussen aber, wie wir uns selbst sehen und welche Möglichkeiten wir wahrnehmen.""",
        3.1,
    ),
    (
        """Zu viel Druck kann blockieren.
Manchmal versuchen Menschen so verzweifelt, ein Ziel zu erreichen, dass sie innerlich immer angespannter werden.
Ein Teil denkt: Ich möchte es schaffen.
Ein anderer Teil denkt: Es wird sowieso nicht funktionieren.
Diese widersprüchlichen Gedanken können sich gegenseitig blockieren.
Deshalb ist es oft sinnvoller, das Ziel ruhig vor Augen zu behalten, statt sich unter Druck zu setzen.
Ein kurzer Satz wie: Ich finde einen Weg, kann dabei helfen, die Gedanken zu beruhigen.""",
        3.2,
    ),
    (
        """Dankbarkeit schafft einen anderen Blick.
Dankbarkeit bedeutet nicht, Probleme zu leugnen.
Sie richtet den Blick zusätzlich auf das, was bereits vorhanden ist.
Wer dankbar ist, erkennt häufiger Unterstützung, Fähigkeiten, Chancen und Fortschritte.
Ein einfaches Ritual kann sein, morgens oder abends an drei Dinge zu denken, für die man dankbar ist.
Vertrauen und Handeln gehören zusammen.
Eine klare Vorstellung kann uns innerlich ausrichten. Vertrauen kann uns Mut geben.
Doch Ziele brauchen meistens auch Entscheidungen, Übung und konkretes Handeln.""",
        3.4,
    ),
    (
        """Gedanken ersetzen nicht die Wirklichkeit.
Sie können jedoch beeinflussen, wie wir mit der Wirklichkeit umgehen.
Die zentrale Idee lautet:
Stellen Sie sich klar vor, was Sie erreichen möchten.
Verbinden Sie dieses Ziel mit Vertrauen.
Sprechen Sie innerlich respektvoll mit sich selbst.
Bleiben Sie offen für Möglichkeiten.
Und richten Sie Ihr Handeln auf Ihr Ziel aus.""",
        3.4,
    ),
    (
        """Nehmen Sie zum Abschluss einen einfachen Gedanken mit:
Klarheit entsteht nicht durch Druck.
Klarheit entsteht, wenn ein Ziel, ein Gefühl, ein Satz und eine Handlung zusammenfinden.
Wählen Sie heute nicht alles. Wählen Sie den nächsten ehrlichen Schritt.
Atmen Sie einmal ruhig ein. Und langsam wieder aus.
Dann gehen Sie diesen Schritt. Mit ruhigem, klarem Denken.""",
        1.8,
    ),
]


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


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


def generate_tts(text: str, output_path: Path, keys: list[str]) -> None:
    if output_path.exists() and output_path.stat().st_size > 1000:
        duration = wav_duration(output_path)
        if 0.5 <= duration <= max(80.0, len(text.split()) * 1.6 + 16):
            return
        output_path.unlink(missing_ok=True)

    payload = {
        "contents": [{"parts": [{"text": text}]}],
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
                    response = requests.post(url, json=payload, timeout=(10, 120))
                    if response.status_code == 429:
                        last_error = f"HTTP 429 rate limit on key {key_index}, {model}"
                        wait_s = 45 * (2**attempt)
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
                    return
                except Exception as exc:
                    last_error = exc
                    time.sleep(5)
    raise RuntimeError(f"TTS failed: {last_error}")


def write_silence(out: wave.Wave_write, seconds: float) -> None:
    frames = max(0, int(24000 * seconds))
    out.writeframes(b"\x00\x00" * frames)


def append_wav(source: Path, out: wave.Wave_write) -> float:
    with wave.open(str(source), "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 24000:
            raise RuntimeError(f"Unexpected WAV format: {source}")
        out.writeframes(wf.readframes(wf.getnframes()))
        return wf.getnframes() / float(wf.getframerate())


def build_voice(segment_paths: list[Path]) -> float:
    with wave.open(str(OUT_VOICE), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(24000)
        write_silence(out, 0.8)
        for path, (_, pause) in zip(segment_paths, SEGMENTS):
            append_wav(path, out)
            write_silence(out, pause)
        write_silence(out, 2.4)
    return wav_duration(OUT_VOICE)


def export_mp3() -> None:
    base.run_ffmpeg(
        [
            "-y",
            "-i",
            str(OUT_VOICE),
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
            "title=Die Kraft klarer Gedanken",
            "-metadata",
            "artist=Callidus AM",
            str(OUT_MP3),
        ]
    )


def write_metadata(duration: float) -> None:
    meta = {
        "title": "Die Kraft klarer Gedanken",
        "duration_seconds": round(duration, 2),
        "duration_minutes": round(duration / 60, 2),
        "voice_provider": "Gemini TTS",
        "voice": VOICE,
        "voice_context": "Same Gemini prebuilt voice used by the Callidus YouTube video pipeline.",
        "background_music": "none",
        "style": "Callidus YouTube TTS pipeline style. Intro and ending added.",
        "files": {
            "voice_wav": OUT_VOICE.name,
            "final_mp3": OUT_MP3.name,
            "generator": Path(__file__).name,
        },
    }
    OUT_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    SEG_DIR.mkdir(exist_ok=True)
    keys = load_keys()
    segment_paths = []
    for index, (text, _) in enumerate(SEGMENTS):
        path = SEG_DIR / f"seg_{index:02d}.wav"
        print(f"TTS {index + 1:02d}/{len(SEGMENTS)}")
        generate_tts(text, path, keys)
        segment_paths.append(path)
    duration = build_voice(segment_paths)
    export_mp3()
    write_metadata(duration)
    print(f"Done: {OUT_MP3} ({duration / 60:.2f} min)")


if __name__ == "__main__":
    main()
