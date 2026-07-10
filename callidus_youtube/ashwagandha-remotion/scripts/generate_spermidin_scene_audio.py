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
AUDIO_DIR = ROOT / 'public' / 'audio' / 'spermidin-deepdive-normalos'
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

FPS = 30
VOICE_PLAYBACK_RATE = 0.88
SCENE_PAD_SECONDS = 1.25
FINAL_PAD_SECONDS = 2.0
VOICE_NAME = 'Aoede'

sources = [
    {
        'label': 'JAMA Network Open',
        'year': '2022',
        'finding': '12 Monate: kein Vorteil bei Gedächtnis oder Biomarkern vs. Placebo.',
    },
    {
        'label': 'Nutrients / PMC',
        'year': '2023',
        'finding': '15 mg/Tag erhöhten kurzfristig Plasma- oder Speichel-Spermidin nicht deutlich.',
    },
    {
        'label': 'Nutrition Research',
        'year': '2024',
        'finding': '40 mg/Tag: minimale Effekte auf zirkulierende Polyamine.',
    },
    {
        'label': 'ClinicalTrials.gov',
        'year': 'laufend',
        'finding': 'POLYCAD prüft kardiovaskuläre Fragen noch laufend.',
    },
]

scene_specs = json.loads(r'''[
  {
    "image": "pexels/spermidin-v1/02-microscope.jpg",
    "secondaryImage": "pexels/spermidin-v1/01-wheat-germ.jpg",
    "eyebrow": "Gesundheits-Wissen",
    "title": "Spermidin einfach erklärt",
    "subtitle": "Was es ist, welches Problem der Hype macht und welche Lösung im Alltag Sinn ergibt.",
    "mode": "problemSolution",
    "accent": "gold",
    "bullets": [
      "Was ist Spermidin?",
      "Problem: Hype",
      "Lösung: Food first"
    ],
    "voice": "Spermidin klingt schnell nach Anti-Aging-Wundermittel. In Ruhe betrachtet ist es vor allem ein kleiner natürlicher Zellstoff. Spannend ist: Er hängt mit Zell-Recycling zusammen. Das Problem ist der Hype. Die Lösung ist: erst verstehen, dann Lebensmittel und Studien nüchtern anschauen."
  },
  {
    "image": "pexels/spermidin-v1/07-biohacking.jpg",
    "secondaryImage": "pexels/spermidin-v1/06-soybeans.jpg",
    "eyebrow": "Was ist es?",
    "title": "Ein kleiner Zellstoff",
    "subtitle": "Spermidin gehört zu den Polyaminen: kleine Moleküle, die Zellen für Ordnung, Wachstum und Stoffwechsel nutzen.",
    "mode": "molecule",
    "accent": "teal",
    "bullets": [
      "Formel: C7H19N3",
      "Im Körper vorhanden",
      "Auch in Lebensmitteln"
    ],
    "voice": "Was ist Spermidin überhaupt? Fachlich sagt man: ein Polyamin. Einfacher gesagt: Es ist ein kleines Molekül, also ein winziger Zellstoff, der im Körper vorkommt. Zellen nutzen solche Stoffe für Ordnung, Wachstum und Stoffwechsel. Spermidin steckt auch in Lebensmitteln, zum Beispiel in Weizenkeimen, Soja, Pilzen und gereiftem Käse."
  },
  {
    "image": "pexels/spermidin-v1/02-microscope.jpg",
    "secondaryImage": "pexels/spermidin-v1/03-healthy-aging.jpg",
    "eyebrow": "Einfach erklärt",
    "title": "Autophagie = Zell-Recycling",
    "subtitle": "Die Zelle räumt alten Ballast weg und nutzt brauchbare Teile wieder.",
    "mode": "autophagy",
    "accent": "green",
    "bullets": [
      "Aufräumen",
      "Wiederverwerten",
      "Zelle im Gleichgewicht"
    ],
    "voice": "Der wichtigste Fachbegriff ist Autophagie. Das heißt einfach: Zell-Recycling. Stell dir eine Zelle wie eine kleine Werkstatt vor. Kaputte oder alte Teile werden eingesammelt, zerlegt und brauchbare Bausteine wiederverwendet. Das ist kein Detox-Zauber, sondern normale Zellpflege."
  },
  {
    "image": "pexels/spermidin-v1/08-breakfast.jpg",
    "secondaryImage": "pexels/spermidin-v1/05-mushrooms.jpg",
    "eyebrow": "Lösung im Alltag",
    "title": "Erst Lebensmittel, dann Kapseln",
    "subtitle": "Weizenkeime, Soja, Pilze, Hülsenfrüchte und gereifter Käse liefern Spermidin natürlicherweise.",
    "mode": "foods",
    "accent": "gold",
    "bullets": [
      "Weizenkeime",
      "Soja und Hülsenfrüchte",
      "Pilze und Käse"
    ],
    "voice": "Die alltagstaugliche Lösung beginnt nicht mit einer Kapsel, sondern mit Essen. Weizenkeime, Soja, Hülsenfrüchte, Pilze und gereifter Käse liefern Spermidin natürlich. Lebensmittel bringen außerdem Eiweiß, Ballaststoffe und Mineralstoffe mit. Das ist meist die bessere Basis."
  },
  {
    "image": "pexels/spermidin-v1/03-healthy-aging.jpg",
    "secondaryImage": "pexels/spermidin-v1/02-microscope.jpg",
    "eyebrow": "Problem",
    "title": "Hype ist kein Beweis",
    "subtitle": "Nur weil ein Mechanismus plausibel klingt, ist ein Nutzen beim Menschen noch nicht bewiesen.",
    "mode": "problemSolution",
    "accent": "slate",
    "bullets": [
      "Zell-Daten spannend",
      "Menschen-Daten vorsichtig",
      "Keine Verjüngungs-Garantie"
    ],
    "sourceIndex": 0,
    "voice": "Das Problem: Aus einem spannenden Mechanismus wird im Internet schnell ein Versprechen. Aber eine Idee aus Zell- oder Tierdaten ist noch kein Beweis beim Menschen. Studien mit echten Menschen müssen zeigen, ob Gedächtnis, Gesundheit oder Lebensdauer wirklich messbar profitieren."
  },
  {
    "image": "pexels/spermidin-v1/04-capsules.jpg",
    "secondaryImage": "pexels/spermidin-v1/01-wheat-germ.jpg",
    "eyebrow": "Studien mit Menschen",
    "title": "Placebo-Vergleiche bremsen den Hype",
    "subtitle": "Mehrere Studien zeigen bisher begrenzte oder minimale Effekte. Das bremst die Werbeversprechen.",
    "mode": "studies",
    "accent": "teal",
    "bullets": [
      "JAMA: kein klarer Gedächtnis-Vorteil",
      "Nutrients: Blutwerte nicht deutlich höher",
      "Nutrition Research: nur kleine Effekte"
    ],
    "sourceIndex": 1,
    "voice": "Was zeigen Studien mit Menschen? Eine Studie über zwölf Monate fand keinen klaren Vorteil bei Gedächtnis oder Biomarkern im Vergleich zu Placebo. Andere Studien fanden trotz Gabe kaum höhere Spermidin-Werte im Blut oder nur kleine Veränderungen. Kurz gesagt: interessant, aber noch nicht stark bewiesen."
  },
  {
    "image": "pexels/spermidin-v1/04-capsules.jpg",
    "secondaryImage": "pexels/spermidin-v1/07-biohacking.jpg",
    "eyebrow": "Problem / Lösung",
    "title": "Mehr Kapseln lösen es nicht",
    "subtitle": "Der Körper reguliert solche Zellstoffe eng. Die Lösung ist nicht automatisch eine höhere Dosis.",
    "mode": "solution",
    "accent": "clay",
    "bullets": [
      "Dosis ist nicht Wirkung",
      "Etikett ist kein Beweis",
      "Ruhig und konservativ"
    ],
    "sourceIndex": 2,
    "voice": "Der nächste Mythos: Mehr Milligramm bedeuten automatisch mehr Wirkung. So einfach ist es nicht. Der Körper reguliert solche Zellstoffe eng. Die Lösung ist deshalb nicht blind höher dosieren, sondern vorsichtig bleiben, Qualität prüfen und keine Heilversprechen glauben."
  },
  {
    "image": "pexels/spermidin-v1/01-wheat-germ.jpg",
    "secondaryImage": "pexels/spermidin-v1/04-capsules.jpg",
    "eyebrow": "Praktische Lösung",
    "title": "Wenn Supplement, dann sauber",
    "subtitle": "Transparente Herkunft, klare Milligramm-Angabe und Laborprüfung sind wichtiger als große Versprechen.",
    "mode": "quality",
    "accent": "green",
    "bullets": [
      "Klare Milligramm-Angabe",
      "Qualität nachvollziehbar",
      "Wenig Zusatzstoffe"
    ],
    "voice": "Wenn du ein Supplement nutzt, dann prüfe es schlicht: Steht die Menge klar drauf? Ist die Herkunft nachvollziehbar? Gibt es Laborprüfung? Sind unnötige Zusätze drin? Und ganz wichtig: Wird ehrlich über Grenzen gesprochen? Gute Aufklärung klingt selten wie Werbung."
  },
  {
    "image": "pexels/spermidin-v1/05-mushrooms.jpg",
    "secondaryImage": "pexels/spermidin-v1/08-breakfast.jpg",
    "eyebrow": "Sicherheit",
    "title": "Vorher abklären, wenn Risiko besteht",
    "subtitle": "Besonders bei Allergien, Schwangerschaft, Erkrankungen oder Medikamenten.",
    "mode": "safety",
    "accent": "clay",
    "bullets": [
      "Weizenallergie beachten",
      "Schwangerschaft und Stillzeit",
      "Medikamente und Erkrankungen"
    ],
    "voice": "Wichtig bleibt Sicherheit. Viele Spermidin-Produkte stammen aus Weizenkeimen. Bei Weizenallergie ist das relevant. In Schwangerschaft und Stillzeit würde ich es nicht empfehlen. Bei Erkrankungen oder Medikamenten bitte vorher fachlich abklären. Ein Supplement ersetzt keine Diagnose."
  },
  {
    "image": "pexels/spermidin-v1/03-healthy-aging.jpg",
    "secondaryImage": "pexels/spermidin-v1/06-soybeans.jpg",
    "eyebrow": "Kurzfazit",
    "title": "Baustein, keine Abkürzung",
    "subtitle": "Spermidin bleibt spannend. Die Basis bleibt aber Ernährung, Bewegung, Schlaf und Stressregulation.",
    "mode": "summary",
    "accent": "gold",
    "bullets": [
      "Einfach verstehen",
      "Belege prüfen",
      "Basis zuerst"
    ],
    "sourceIndex": 3,
    "voice": "Das Fazit: Spermidin ist biologisch spannend. Aber es ist kein verlässlicher Jungbrunnen. Die beste Lösung bleibt langweilig, aber wirksam: gute Ernährung, Bewegung, Schlaf und Stressregulation. Spermidin kann ein kleiner Baustein sein. Keine Abkürzung."
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
    scene['audio'] = f'audio/spermidin-deepdive-normalos/{audio_path.name}'
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
copy_ts = f'''export const spermidinDeepDiveDurationInFrames = {duration_frames};

export const spermidinDeepDiveVoicePlaybackRate = {VOICE_PLAYBACK_RATE};

export const spermidinDeepDiveSources = [
{sources_ts}
] as const;

export const spermidinDeepDiveScenes = [
{scenes_ts}
] as const;
'''
(ROOT / 'src' / 'spermidin-deepdive-copy.ts').write_text(copy_ts, encoding='utf-8')

print(json.dumps({
    'durationFrames': duration_frames,
    'durationSeconds': round(duration_frames / FPS, 2),
    'audioSeconds': round(sum(scene['audioSeconds'] for scene in scene_specs), 2),
    'voice': VOICE_NAME,
    'playbackRate': VOICE_PLAYBACK_RATE,
}, ensure_ascii=False, indent=2))
