# -*- coding: utf-8 -*-
"""
Erzeugt eine geführte Meditation (~15 Min) als MP3:
- Stimme: Microsoft Edge Neural TTS (de-DE-SeraphinaMultilingualNeural)
- Musik: selbst synthetisierter Ambient-Pad (ffmpeg, 100% lizenzfrei)
- Segmente werden einzeln generiert und mit Pausen zusammengesetzt.
"""
import asyncio
import os
import subprocess

import edge_tts
from pydub import AudioSegment

BASE = os.path.dirname(os.path.abspath(__file__))
SEG_DIR = os.path.join(BASE, "segments")
os.makedirs(SEG_DIR, exist_ok=True)

VOICE = "de-DE-SeraphinaMultilingualNeural"
RATE = "-15%"          # etwas langsamer sprechen
PITCH = "-2Hz"
TARGET_SECONDS = 15 * 60
LEAD_IN = 6.0          # Sekunden Musik vor der ersten Silbe
TAIL = 20.0            # Sekunden Musik-Ausklang am Ende

# (Text, Pause danach in Sekunden - wird skaliert, um ~15 Min zu erreichen)
SEGMENTS = [
    # --- Ankommen ---
    ("Herzlich willkommen zu dieser geführten Meditation für Klarheit und Erfolg.", 4),
    ("In den nächsten fünfzehn Minuten schenkst du dir selbst etwas Kostbares: Zeit. Zeit, um zur Ruhe zu kommen, deinen Geist zu klären und dich neu auszurichten.", 5),
    ("Suche dir einen Ort, an dem du für eine Weile ungestört bist. Du kannst bequem sitzen oder liegen, ganz wie es sich für dich gut anfühlt.", 6),
    ("Wenn du magst, schließe sanft deine Augen.", 6),
    ("Nimm nun einen tiefen Atemzug durch die Nase, und lass die Luft ganz langsam durch den Mund wieder los.", 8),
    ("Noch einmal: tief einatmen. Und mit dem Ausatmen darfst du alles loslassen, was du gerade nicht brauchst.", 8),
    ("Mit jedem Atemzug wirst du ruhiger. Weicher. Klarer.", 9),
    # --- Körperreise ---
    ("Spüre nun, wie sich eine angenehme Schwere in deinem Körper ausbreitet. Beginne bei deiner Stirn: Lass die kleinen Muskeln rund um deine Augen weich werden.", 7),
    ("Dein Kiefer entspannt sich. Deine Schultern sinken ein Stück nach unten.", 7),
    ("Diese Welle der Entspannung fließt weiter. Durch deine Arme, bis in die Fingerspitzen.", 7),
    ("Durch deinen Rücken. Deinen Bauch. Deine Beine. Bis in die Zehen.", 8),
    ("Dein ganzer Körper ist jetzt ruhig und entspannt. Es gibt nichts zu tun. Nur zu sein.", 10),
    # --- Atem ---
    ("Richte deine Aufmerksamkeit nun auf deinen Atem. Beobachte, wie er kommt und geht, ganz von selbst.", 8),
    ("Stell dir vor, mit jedem Einatmen strömt frische, klare Energie in deinen Körper.", 7),
    ("Und mit jedem Ausatmen verlassen dich Anspannung, Zweifel und Gedankenlärm.", 8),
    ("Einatmen: Klarheit. Ausatmen: Loslassen.", 10),
    ("Einatmen: Ruhe. Ausatmen: Vertrauen.", 12),
    # --- Visualisierung ---
    ("Stelle dir nun vor, du stehst auf einem hohen Punkt über einer weiten Landschaft. Die Luft ist frisch und klar, der Himmel weit.", 8),
    ("Von hier oben siehst du deinen Weg. Was gestern noch verworren wirkte, ordnet sich vor deinen Augen.", 8),
    ("Du erkennst: Du musst nicht alles auf einmal lösen. Nur den nächsten Schritt sehen. Und diesen Schritt siehst du jetzt ganz deutlich.", 10),
    ("Spüre, wie sich Klarheit in dir ausbreitet. Wie ein stiller See, dessen Oberfläche vollkommen glatt ist.", 10),
    ("In diesem klaren Zustand triffst du gute Entscheidungen. In diesem Zustand gelingt dir, was dir wichtig ist.", 10),
    # --- Affirmationen ---
    ("Ich spreche nun einige Affirmationen. Lass jede davon in Ruhe auf dich wirken. Und wenn du magst, wiederhole sie innerlich in deinen eigenen Worten.", 7),
    ("Mein Geist ist ruhig und klar.", 9),
    ("Ich sehe, was wichtig ist, und lasse los, was mich aufhält.", 9),
    ("Ich vertraue meinen Entscheidungen.", 9),
    ("Ich gehe meinen Weg Schritt für Schritt. Gelassen und fokussiert.", 9),
    ("Herausforderungen sind für mich Aufgaben, an denen ich wachse.", 9),
    ("Ich ziehe die richtigen Menschen und Gelegenheiten in mein Leben.", 9),
    ("Erfolg ist für mich kein Zufall. Er ist die Folge meiner Klarheit, meiner Ausdauer und meiner inneren Ruhe.", 9),
    ("Ich bin dankbar für das, was ist. Und offen für das, was kommt.", 9),
    ("Jeden Tag werde ich klarer, stärker und zuversichtlicher.", 9),
    ("Ich habe alles in mir, was ich brauche.", 12),
    # --- Integration ---
    ("Bleibe nun noch einen Moment in dieser Stille. Lass alles nachklingen.", 25),
    ("Spüre, wie sich diese Klarheit tief in dir verankert. Sie ist jetzt ein Teil von dir. Du kannst jederzeit zu ihr zurückkehren, mit einem einzigen tiefen Atemzug.", 18),
    # --- Rückkehr ---
    ("Und nun komme langsam wieder zurück ins Hier und Jetzt.", 5),
    ("Spüre deinen Körper. Bewege sanft deine Finger und deine Zehen.", 5),
    ("Atme noch einmal tief ein. Und aus.", 5),
    ("Und wenn du bereit bist, öffne deine Augen. Wach, klar und voller Zuversicht.", 4),
    ("Danke, dass du dir diese Zeit genommen hast. Nimm diese Klarheit mit in deinen Tag.", 2),
]

async def tts_segment(text, path):
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(path)

async def generate_all():
    for i, (text, _) in enumerate(SEGMENTS):
        path = os.path.join(SEG_DIR, f"seg_{i:02d}.mp3")
        if os.path.exists(path) and os.path.getsize(path) > 1000:
            continue
        await tts_segment(text, path)
        print(f"  TTS {i+1}/{len(SEGMENTS)}")

def main():
    print("1) Erzeuge Sprachsegmente...")
    asyncio.run(generate_all())

    print("2) Setze Segmente zusammen...")
    segs = []
    speech_total = 0.0
    for i in range(len(SEGMENTS)):
        a = AudioSegment.from_file(os.path.join(SEG_DIR, f"seg_{i:02d}.mp3"))
        segs.append(a)
        speech_total += len(a) / 1000.0

    pause_sum = sum(p for _, p in SEGMENTS)
    avail = TARGET_SECONDS - LEAD_IN - TAIL - speech_total
    scale = max(1.0, avail / pause_sum)
    print(f"   Sprache: {speech_total:.0f}s, Pausen-Skalierung: x{scale:.2f}")

    voice = AudioSegment.silent(duration=int(LEAD_IN * 1000))
    for a, (_, p) in zip(segs, SEGMENTS):
        voice += a + AudioSegment.silent(duration=int(p * scale * 1000))
    voice += AudioSegment.silent(duration=int(TAIL * 1000))

    total_s = len(voice) / 1000.0
    print(f"   Gesamtlänge: {total_s/60:.1f} min")

    print("3) Synthetisiere Ambient-Pad (ffmpeg)...")
    pad_path = os.path.join(BASE, "pad.wav")
    d = total_s
    fade_out_start = d - 12
    filter_c = (
        "[0]volume=0.50,tremolo=f=0.10:d=0.35[a];"
        "[1]volume=0.34,tremolo=f=0.13:d=0.45[b];"
        "[2]volume=0.22,tremolo=f=0.11:d=0.55[c];"
        "[3]volume=0.13,tremolo=f=0.17:d=0.65[d];"
        "[a][b][c][d]amix=inputs=4:normalize=0,"
        "lowpass=f=750,"
        f"afade=t=in:d=10,afade=t=out:st={fade_out_start:.1f}:d=12"
    )
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"sine=frequency=110:duration={d:.1f}",
        "-f", "lavfi", "-i", f"sine=frequency=164.81:duration={d:.1f}",
        "-f", "lavfi", "-i", f"sine=frequency=220:duration={d:.1f}",
        "-f", "lavfi", "-i", f"sine=frequency=277.18:duration={d:.1f}",
        "-filter_complex", filter_c,
        "-ar", "44100", pad_path,
    ], check=True, capture_output=True)

    print("4) Mische Stimme und Musik...")
    pad = AudioSegment.from_file(pad_path)
    music = pad - 21  # Musik deutlich leiser als Stimme
    final = music.overlay(voice)

    out = os.path.join(BASE, "meditation-klarheit-erfolg.mp3")
    final.export(out, format="mp3", bitrate="192k",
                 tags={"title": "Klarheit & Erfolg - Geführte Meditation",
                       "artist": "Callidus AM"})
    print(f"FERTIG: {out} ({len(final)/60000:.1f} min)")

if __name__ == "__main__":
    main()
