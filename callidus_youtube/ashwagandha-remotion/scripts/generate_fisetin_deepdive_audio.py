from pathlib import Path
import base64
import json
import math
import sys
import time
import wave

import requests

sys.path.insert(0, r'C:\Users\marga\callidus_youtube')
from instagram_bot import GEMINI_KEYS  # noqa: E402

ROOT = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion')
AUDIO_DIR = ROOT / 'public' / 'audio' / 'fisetin-deepdive-normalos'
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

FPS = 30
VOICE_PLAYBACK_RATE = 0.88
SCENE_PAD_SECONDS = 1.25
FINAL_PAD_SECONDS = 2.0
VOICE_NAME = 'Aoede'

sources = json.loads(r'''[
  {
    "label": "Yousefzadeh et al.",
    "year": "2018",
    "finding": "Zell- und Tierdaten: Fisetin wirkte senotherapeutisch; noch kein Human-Wirkversprechen."
  },
  {
    "label": "Pilotstudie",
    "year": "2024",
    "finding": "Kleine Human-Pilotdaten zu biologischen Altersmarkern; vorläufig einordnen."
  },
  {
    "label": "ClinicalTrials.gov",
    "year": "laufend",
    "finding": "Mehrere Studien prüfen Nutzen, Dosis und Sicherheit beim Menschen."
  },
  {
    "label": "Review",
    "year": "2024",
    "finding": "Übersicht: spannend, aber Human-Evidenz und Dosierungsfragen bleiben offen."
  }
]''')
scene_specs = json.loads(r'''[
  {
    "image": "pexels/fisetin-v1/01-strawberries.jpg",
    "secondaryImage": "pexels/fisetin-v1/03-microscope.jpg",
    "eyebrow": "Gesundheits-Wissen",
    "title": "Fisetin einfach erklärt",
    "subtitle": "Was es ist, warum Zombie-Zellen Thema sind und wo der Hype zu weit geht.",
    "mode": "problemSolution",
    "accent": "gold",
    "bullets": [
      "Pflanzenstoff",
      "Problem: Hype",
      "Lösung: Belege prüfen"
    ],
    "sourceIndex": 0,
    "voice": "Fisetin klingt nach zellulärem Frühjahrsputz. Einfach gesagt: Es ist ein Pflanzenstoff, der vor allem aus der Longevity-Forschung bekannt ist. Das Problem ist der Hype um sogenannte Zombie-Zellen. Die Lösung ist nüchtern: verstehen, was gemeint ist, und sauber trennen zwischen Forschung und bewiesener Wirkung beim Menschen."
  },
  {
    "image": "pexels/fisetin-v1/02-strawberry-source.jpg",
    "secondaryImage": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
    "eyebrow": "Was ist es?",
    "title": "Ein gelber Pflanzenstoff",
    "subtitle": "Fisetin gehört zu den Flavonolen: Schutzstoffe aus Pflanzen, nicht automatisch ein Medikament.",
    "mode": "molecule",
    "accent": "berry",
    "bullets": [
      "Formel: C15H10O6",
      "In Erdbeeren",
      "Auch in Pflanzen"
    ],
    "sourceIndex": 0,
    "voice": "Was ist Fisetin überhaupt? Fachlich ist es ein Flavonol. Normal gesagt: ein gelber Pflanzenstoff aus der Polyphenol-Familie. Er kommt zum Beispiel in Erdbeeren, Äpfeln, Zwiebeln, Trauben und Gurken vor. Wichtig: Nur weil ein Stoff natürlich ist, ist er nicht automatisch ein bewiesenes Anti-Aging-Mittel."
  },
  {
    "image": "pexels/fisetin-v1/03-microscope.jpg",
    "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
    "eyebrow": "Einfach erklärt",
    "title": "Zombie-Zellen = müde Zellen",
    "subtitle": "Sie teilen sich kaum noch, können aber störende Entzündungssignale senden.",
    "mode": "senescence",
    "accent": "slate",
    "bullets": [
      "alt und träge",
      "Signalstoffe",
      "Forschungsthema"
    ],
    "sourceIndex": 0,
    "voice": "Der nächste Begriff ist seneszente Zellen. Umgangssprachlich nennt man sie oft Zombie-Zellen. Gemeint sind Zellen, die nicht mehr richtig arbeiten und sich kaum noch teilen. Sie sind nicht einfach böse, aber sie können Botenstoffe aussenden, die Entzündung und Gewebe-Stress fördern. Genau deshalb interessiert sich die Forschung dafür."
  },
  {
    "image": "pexels/fisetin-v1/08-research.jpg",
    "secondaryImage": "pexels/fisetin-v1/03-microscope.jpg",
    "eyebrow": "Senolytikum?",
    "title": "Aufräumen klingt gut",
    "subtitle": "Senolytisch heißt: alte Problemzellen gezielt entfernen. Beim Menschen ist das noch nicht bewiesen.",
    "mode": "senolytic",
    "accent": "green",
    "bullets": [
      "erkennen",
      "entfernen",
      "noch Forschung"
    ],
    "sourceIndex": 0,
    "voice": "Senolytisch bedeutet: Ein Stoff könnte alte Problemzellen gezielt entfernen. Das klingt nach Aufräumen im Körper. In Zell- und Tiermodellen sah Fisetin spannend aus. Aber der entscheidende Punkt ist: Ein Mechanismus im Labor ist noch keine bewiesene Wirkung im Alltag eines Menschen."
  },
  {
    "image": "pexels/fisetin-v1/01-strawberries.jpg",
    "secondaryImage": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
    "eyebrow": "Food first",
    "title": "Erdbeeren sind kein Protokoll",
    "subtitle": "Lebensmittel liefern Fisetin, aber in kleinen Mengen und zusammen mit vielen anderen Stoffen.",
    "mode": "foods",
    "accent": "berry",
    "bullets": [
      "Erdbeeren",
      "Äpfel",
      "Zwiebeln"
    ],
    "sourceIndex": 0,
    "voice": "Lebensmittel zuerst ist trotzdem sinnvoll. Erdbeeren, Äpfel, Zwiebeln, Trauben und Gurken enthalten Fisetin. Aber: Eine Schale Erdbeeren ist kein Hochdosis-Protokoll. Essen liefert ein Muster aus Ballaststoffen, Vitaminen und Pflanzenstoffen. Das ist die Basis, nicht die Garantie für Zellverjüngung."
  },
  {
    "image": "pexels/fisetin-v1/07-biohacking.jpg",
    "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
    "eyebrow": "Problem",
    "title": "Mäusestudie ist kein Menschenbeweis",
    "subtitle": "Die spannendsten Daten sind präklinisch. Humanstudien laufen, viele Fragen sind offen.",
    "mode": "evidence",
    "accent": "teal",
    "bullets": [
      "Tierdaten spannend",
      "Menschen-Daten früh",
      "keine Garantie"
    ],
    "sourceIndex": 1,
    "voice": "Das größte Problem ist die Übersetzung. Viele starke Fisetin-Daten stammen aus Zell- oder Tierstudien. Das ist wichtig für Forschung, aber noch nicht gleich Alltagsempfehlung. Erste kleine Human-Daten und laufende Studien prüfen jetzt, ob Dosis, Sicherheit und messbare Effekte beim Menschen wirklich zusammenpassen."
  },
  {
    "image": "pexels/fisetin-v1/05-capsules.jpg",
    "secondaryImage": "pexels/fisetin-v1/07-biohacking.jpg",
    "eyebrow": "Problem / Lösung",
    "title": "Mehr Kapseln lösen es nicht",
    "subtitle": "Bei Fisetin ist unklar, welche Dosis für wen sinnvoll, wirksam und langfristig sicher ist.",
    "mode": "dose",
    "accent": "clay",
    "bullets": [
      "Dosis offen",
      "Qualität prüfen",
      "ärztlich denken"
    ],
    "sourceIndex": 2,
    "voice": "Der nächste Mythos: Viel hilft viel. Gerade bei Fisetin wäre ich damit vorsichtig. Hohe Dosierungen aus Studien sind keine allgemeine Empfehlung für gesunde Menschen. Die Lösung ist: nicht blind hochdosieren, sondern Nutzen, Risiko, Medikamente und persönliche Situation fachlich einordnen."
  },
  {
    "image": "pexels/fisetin-v1/05-capsules.jpg",
    "secondaryImage": "pexels/fisetin-v1/01-strawberries.jpg",
    "eyebrow": "Wenn Supplement",
    "title": "Sauber statt laut",
    "subtitle": "Klare Milligramm-Angabe, transparente Herkunft und wenige Zusatzstoffe sind wichtiger als Werbesprache.",
    "mode": "quality",
    "accent": "green",
    "bullets": [
      "mg klar",
      "Reinheit",
      "kein Heilversprechen"
    ],
    "sourceIndex": 3,
    "voice": "Wenn ein Supplement genutzt wird, dann lieber sauber statt laut. Steht die Menge klar drauf? Ist die Herkunft nachvollziehbar? Gibt es Angaben zu Reinheit und Zusatzstoffen? Und ganz wichtig: Wird ehrlich gesagt, dass die Human-Evidenz noch begrenzt ist? Gute Aufklärung klingt nicht wie ein Wunder-Versprechen."
  },
  {
    "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
    "secondaryImage": "pexels/fisetin-v1/05-capsules.jpg",
    "eyebrow": "Sicherheit",
    "title": "Nicht für jeden einfach nehmen",
    "subtitle": "Schwangerschaft, Medikamente, Immunsystem, OPs oder Erkrankungen vorher abklären.",
    "mode": "safety",
    "accent": "clay",
    "bullets": [
      "Schwangerschaft",
      "Medikamente",
      "Erkrankungen"
    ],
    "sourceIndex": 2,
    "voice": "Sicherheit bleibt wichtig. In Schwangerschaft und Stillzeit würde ich Fisetin nicht empfehlen. Bei Immunsuppressiva, Blutverdünnern, geplanten Operationen, Krebserkrankungen oder chronischen Erkrankungen bitte vorher fachlich abklären. Ein Supplement ersetzt keine medizinische Beratung."
  },
  {
    "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
    "secondaryImage": "pexels/fisetin-v1/01-strawberries.jpg",
    "eyebrow": "Kurzfazit",
    "title": "Spannender Kandidat, keine Abkürzung",
    "subtitle": "Fisetin bleibt interessant. Die Basis bleibt Ernährung, Bewegung, Schlaf und Stressregulation.",
    "mode": "summary",
    "accent": "gold",
    "bullets": [
      "einfach verstehen",
      "Hype bremsen",
      "Basis zuerst"
    ],
    "sourceIndex": 3,
    "voice": "Das Fazit: Fisetin ist spannend, besonders in der Forschung zu müden Zellen und gesundem Altern. Aber es ist kein bewiesener Jungbrunnen. Die Basis bleibt langweilig und stark: Ernährung, Bewegung, Schlaf und Stressregulation. Fisetin ist ein Kandidat. Keine Abkürzung."
  }
]''')


def generate_audio(text: str, output_path: Path) -> None:
    payload = {
        'contents': [{'parts': [{'text': text}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {
                'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE_NAME}}
            },
        },
    }
    models = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts']
    last_error = None
    for key_index, key in enumerate(GEMINI_KEYS):
        for model in models:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
            for attempt in range(4):
                try:
                    response = requests.post(url, json=payload, timeout=(10, 150))
                    if not response.ok:
                        last_error = f'HTTP {response.status_code}: {response.text[:200]}'
                        response.raise_for_status()
                    audio_b64 = response.json()['candidates'][0]['content']['parts'][0]['inlineData']['data']
                    audio_bytes = base64.b64decode(audio_b64)
                    with wave.open(str(output_path), 'wb') as wav:
                        wav.setnchannels(1)
                        wav.setsampwidth(2)
                        wav.setframerate(24000)
                        wav.writeframes(audio_bytes)
                    print(f'audio ok: {output_path.name} via key{key_index + 1}/{model}')
                    return
                except requests.exceptions.Timeout:
                    last_error = 'timeout'
                    print(f'timeout {output_path.name}, attempt {attempt + 1}')
                    time.sleep(8)
                except requests.exceptions.HTTPError:
                    print(f'http error {output_path.name}: {last_error}')
                    wait = 45 * (attempt + 1) if response.status_code == 429 else 8
                    time.sleep(wait)
                except Exception as exc:
                    last_error = str(exc)
                    print(f'error {output_path.name}: {last_error}')
                    time.sleep(8)
    raise RuntimeError(f'TTS failed for {output_path.name}: {last_error}')


def audio_duration_seconds(path: Path) -> float:
    with wave.open(str(path), 'rb') as wav:
        return wav.getnframes() / float(wav.getframerate())


for index, scene in enumerate(scene_specs, 1):
    audio_path = AUDIO_DIR / f'scene-{index:02d}-aoede.wav'
    if not audio_path.exists() or audio_path.stat().st_size < 10000:
        generate_audio(scene['voice'], audio_path)
    scene['audio'] = f'audio/fisetin-deepdive-normalos/{audio_path.name}'
    scene['audioSeconds'] = round(audio_duration_seconds(audio_path), 3)

current_start = 0
for index, scene in enumerate(scene_specs):
    effective_audio_seconds = scene['audioSeconds'] / VOICE_PLAYBACK_RATE
    pad = FINAL_PAD_SECONDS if index == len(scene_specs) - 1 else SCENE_PAD_SECONDS
    duration = max(300, int(math.ceil((effective_audio_seconds + pad) * FPS)))
    scene['start'] = current_start
    scene['duration'] = duration
    current_start += duration

duration_frames = current_start


def ts(value, indent=0):
    space = ' ' * indent
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    if value is None:
        return 'null'
    if isinstance(value, list):
        if not value:
            return '[]'
        return '[' + ', '.join(ts(item, indent) for item in value) + ']'
    if isinstance(value, dict):
        lines = ['{']
        for key, item in value.items():
            if key == 'voice':
                continue
            lines.append(f'{space}  {key}: {ts(item, indent + 2)},')
        lines.append(space + '}')
        return '\n'.join(lines)
    raise TypeError(type(value))


sources_ts = ',\n'.join(ts(source, 2) for source in sources)
scenes_ts = ',\n'.join(ts(scene, 2) for scene in scene_specs)
copy_ts = f'''export const fisetinDeepDiveDurationInFrames = {duration_frames};

export const fisetinDeepDiveVoicePlaybackRate = {VOICE_PLAYBACK_RATE};

export const fisetinDeepDiveSources = [
{sources_ts}
] as const;

export const fisetinDeepDiveScenes = [
{scenes_ts}
] as const;
'''
(ROOT / 'src' / 'fisetin-deepdive-copy.ts').write_text(copy_ts, encoding='utf-8')

upload = '''Titel:
Fisetin einfach erklärt: Zombie-Zellen, Longevity-Hype und was Studien wirklich zeigen

Beschreibung:
Fisetin ist ein Pflanzenstoff aus der Polyphenol-Familie und wird in der Longevity-Forschung als möglicher senolytischer Kandidat diskutiert. Dieses Video erklärt in einfacher Sprache, was Zombie-Zellen eigentlich sind, warum Fisetin spannend ist, was bisher vor allem präklinisch gezeigt wurde und warum Humanstudien, Dosis und Sicherheit noch vorsichtig eingeordnet werden müssen.

Keine medizinische Beratung. Keine Heilversprechen. Bei Schwangerschaft, Medikamenten, chronischen Erkrankungen, Krebsdiagnosen, Immunsuppression oder geplanten Operationen bitte fachlich abklären.

Quellen:
- Yousefzadeh et al. 2018, EBioMedicine: https://doi.org/10.1016/j.ebiom.2018.09.015
- The Effects of Fisetin on Reducing Biological Aging: A Pilot Study, 2024: https://pubmed.ncbi.nlm.nih.gov/39269340/
- Fisetin as a senotherapeutic agent, Review 2024: https://doi.org/10.1016/j.mad.2024.111995
- ClinicalTrials.gov Fisetin-Studien: https://clinicaltrials.gov/search?term=fisetin
'''
(ROOT / 'fisetin-deepdive-normalos-upload-text.txt').write_text(upload, encoding='utf-8')

print(json.dumps({
    'durationFrames': duration_frames,
    'durationSeconds': round(duration_frames / FPS, 2),
    'audioSeconds': round(sum(scene['audioSeconds'] for scene in scene_specs), 2),
    'voice': VOICE_NAME,
    'playbackRate': VOICE_PLAYBACK_RATE,
}, ensure_ascii=False, indent=2))
