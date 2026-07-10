#!/usr/bin/env python3
"""
Callidus A&M – YouTube Automation v2 (KI-Video Edition)
Täglich auf Synology DS218 via Task Scheduler

Neu in v2:
  - KI-Videos via Fal.ai WAN v2.1 Text-to-Video ("WOW"-Qualitaet)
  - KI-Bilder via Fal.ai FLUX.1 [dev] (besser als Pollinations)
  - Cinematische video_prompts per Slide (von Gemini generiert)
  - CTAs: Nexus App (Play Store) + Stress Reset Kurs in Beschreibung

Modi:
  python main_v2.py         – Einmalig ausfuehren
  python main_v2.py --bot   – Dauerhafter Bot-Modus

Kosten: ~$15-25/Monat bei taeglichem Betrieb (Fal.ai pay-as-you-go)
"""

import os, json, random, datetime, subprocess, sys, logging, time, tempfile, shutil, wave, base64, requests, re

# ─── KONFIGURATION ────────────────────────────────────────────────
BASE_DIR       = os.environ.get("CALLIDUS_BASE_DIR", "/volume1/homes/arnold.jedich/callidus_youtube")
GEMINI_API_KEY   = "AIzaSyC95C8aG9m8XHgngbC3GVCOJYuf8Ab1j9A"
GEMINI_API_KEY_2 = "AIzaSyDSANrwcrumxJlcCHxB0tbrKiKbHxMWbdg"
# Automatische Key-Rotation: erschoepft Key 1 (429), wird Key 2 genutzt
GEMINI_KEYS = [k for k in (GEMINI_API_KEY, GEMINI_API_KEY_2) if k]
TELEGRAM_TOKEN = "8664900084:AAFmlplxF_LNZHoAORsXaUniYdsU_whh29k"
TELEGRAM_CHAT  = "5016384420"
CLIENT_SECRETS = f"{BASE_DIR}/client_secrets.json"
TOKEN_FILE     = f"{BASE_DIR}/token.json"
OUTPUT_DIR     = f"{BASE_DIR}/output"
LOGS_DIR       = f"{BASE_DIR}/logs"
FFMPEG         = "/volume1/@appstore/ffmpeg7/bin/ffmpeg"
PEXELS_KEY     = "VlTNWpsRexidsjEpCnhUU4myHPnD74zeJLepNM2NWkgWc5ogrLjEnZ87"
LOGO_PATH      = f"{BASE_DIR}/assets/app_logo.png"
ASSETS_DIR     = f"{BASE_DIR}/assets"

# ─── FIREBASE / CALLIDUS TV ───────────────────────────────────────
SERVICE_ACCOUNT_FILE = f"{BASE_DIR}/service-account.json"
FIRESTORE_PROJECT    = "nexus-app-61494"
FIRESTORE_BASE       = f"https://firestore.googleapis.com/v1/projects/{FIRESTORE_PROJECT}/databases/(default)/documents"
CALLIDUS_TV_MAX      = 30   # Maximale Videos in "Callidus TV" – älteste fliegen raus

CROSSFADE_DURATION = 2.4   # Sekunden Crossfade zwischen Bildern
SEGMENT_FADE_DURATION = 0.55  # Weiche Ein-/Ausblendung zwischen Story-Szenen
OVERLAY_BARS       = False  # True = dunkle Balken hinter Texten; False = nur Schatten
IMAGES_PER_SLIDE   = 2     # Weniger Bilder = längere Verweildauer pro Bild
SHORTS_MAX_SEC     = 57    # Max. Laenge fuer YouTube Shorts (unter 60 Sek bleiben)

# Tägliche automatische Ausführung im Bot-Modus
DAILY_HOUR   = 11
DAILY_MINUTE = 0
POSTING_TAGE = {0, 2, 4, 6}  # Montag=0, Mittwoch=2, Freitag=4, Sonntag=6

# ─── KÖRPER-VISUALISIERUNGSSTIL (Fal.ai FLUX / WAN) ───────────────
FLUX_STYLE_PREFIX = (
    "cinematic health story frame, consistent protagonist, expressive human emotion, "
    "premium film lighting, shallow depth of field, polished visual storytelling, "
    "high production value, no text in image - "
)

CINEMATIC_STYLE_PROFILES = [
    {
        "name": "cinematic live action",
        "look": "premium cinematic live-action short film, natural acting, realistic morning light, shallow depth of field, emotionally warm color grade",
        "camera": "handheld intimate close-up, slow dolly movement, expressive reaction shots, smooth transition into the next beat",
    },
    {
        "name": "anime slice of life",
        "look": "high-end Japanese anime slice-of-life film, expressive faces, soft city backgrounds, cinematic sunlight, detailed emotional acting",
        "camera": "dynamic anime camera push-in, gentle parallax, expressive cutaway, energetic but readable motion",
    },
    {
        "name": "warm storybook animation",
        "look": "soft hand-painted animated film look, warm cinematic lighting, gentle textures, cozy human characters, hopeful mood",
        "camera": "smooth storybook camera move, gentle orbit around the character, magical transition from stress to relief",
    },
    {
        "name": "graphic novel drama",
        "look": "cinematic graphic novel drama, bold rim light, inked contours, dramatic shadows, expressive urban lifestyle panels",
        "camera": "dynamic comic-panel push-in, diagonal composition, fast visual beat, strong before-and-after contrast",
    },
    {
        "name": "stylized 3D animation",
        "look": "stylized high-quality 3D animated short film, charming human character, polished materials, vibrant but tasteful colors",
        "camera": "hero shot to close-up, smooth orbit, clear emotional cause-and-effect motion through the scene",
    },
]

CINEMATIC_BEATS = [
    "opening: protagonist wakes up exhausted and confused",
    "bad morning: small unlucky moments pile up",
    "low point: frustration becomes visible without melodrama",
    "discovery: protagonist notices a simple health impulse or supplement",
    "turning point: a calm ritual begins and hope returns",
    "energy shift: posture, light and movement become lighter",
    "social payoff: protagonist reconnects with people and laughs",
    "brand bridge: healthy lifestyle feels realistic and achievable",
    "resolution: transition to Callidus health knowledge, website or Nexus app",
]

NEGATIVE_VIDEO_PROMPT = (
    "no text, no subtitles, no logos, no watermark, no UI, no deformed anatomy, "
    "no random extra characters, no stock footage, no medical gore, no surgery, "
    "no horror, no exaggerated miracle cure, no before-after body transformation"
)

def make_cinematic_video_prompt(base_prompt, slide_index, total_slides, aspect_ratio, episode_style_index=None, character_bible=""):
    """Erweitert den Story-Slide-Prompt zu einem filmischen Fal/WAN-Shot."""
    base = (base_prompt or "").strip()
    if not base:
        base = "cinematic scene from a health story with the same protagonist"

    is_cta = slide_index == total_slides - 1
    profile_idx = episode_style_index if episode_style_index is not None else slide_index
    profile = CINEMATIC_STYLE_PROFILES[profile_idx % len(CINEMATIC_STYLE_PROFILES)]
    beat = CINEMATIC_BEATS[min(slide_index, len(CINEMATIC_BEATS) - 1)]

    if is_cta:
        profile = {
            "name": "premium tech health cinematic",
            "look": "premium cinematic health technology commercial, warm natural light, elegant medical UI glow, realistic smartphone",
            "camera": "slow dolly-in from soft microscopic particles to a smartphone health app screen, hopeful reveal",
        }
        beat = "resolution: connect the body insight to the Callidus health app or website"

    character_lock = (
        f"Character continuity: {character_bible}. Keep exactly the same protagonist, same face, hairstyle, age, body type and outfit in every shot. "
        if character_bible else
        "Character continuity: keep exactly the same protagonist, same face, hairstyle, age, body type and outfit in every shot. "
    )

    return (
        f"{character_lock}{base}. Visual style: {profile['look']}. Story beat: {beat}. "
        f"Camera direction: {profile['camera']}. "
        "Make it a single coherent 5-second cinematic shot with visible motion, clear beginning-middle-end, "
        "depth of field, volumetric lighting, subtle particles, smooth realistic motion, emotionally engaging but medically accurate. "
        "Natural human anatomy and lens perspective, correct body proportions, no squeezed or stretched face/body, true composition for the target aspect ratio. "
        f"Frame for {aspect_ratio}. "
        f"Negative prompt: {NEGATIVE_VIDEO_PROMPT}."
    )

def get_episode_style_index(seed_text):
    return sum(ord(ch) for ch in seed_text or "") % len(CINEMATIC_STYLE_PROFILES)

# ─── WOCHENTAGS-KUNSTSTIL (nicht realistisch!) ───────────────────
# Mo=0, Mi=2, Fr=4, So=6  (entspricht POSTING_TAGE)
WEEKDAY_ART_STYLE = {
    0: {  # Montag – 3D Animation Cartoon
        "label": "3D Animation Cartoon",
        "prefix": ("stylized 3D animated cartoon movie still, Pixar-like rendering, "
                   "charming stylized characters, soft global illumination, vibrant playful colors, "
                   "smooth polished materials, NOT photorealistic, no real photo, "),
        "profile_idx": 4,  # stylized 3D animation
    },
    2: {  # Mittwoch – Studio-Ghibli Cartoon
        "label": "Ghibli Cartoon",
        "prefix": ("Studio Ghibli style hand-painted anime film still, soft watercolor backgrounds, "
                   "gentle warm natural light, expressive friendly characters, painterly textures, "
                   "whimsical cozy mood, NOT photorealistic, no real photo, "),
        "profile_idx": 2,  # warm storybook animation
    },
    4: {  # Freitag – Comic
        "label": "Comic",
        "prefix": ("western comic book and graphic novel art, bold black ink outlines, "
                   "halftone shading, dynamic comic panel composition, flat saturated colors, "
                   "energetic poses, NOT photorealistic, no real photo, "),
        "profile_idx": 3,  # graphic novel drama
    },
    6: {  # Sonntag – Anime
        "label": "Anime",
        "prefix": ("modern Japanese anime style, clean cel shading, expressive large eyes, "
                   "detailed anime backgrounds, cinematic anime lighting and color grade, "
                   "slice-of-life mood, NOT photorealistic, no real photo, "),
        "profile_idx": 1,  # anime slice of life
    },
}

# ─── FESTER KUNSTSTIL: 1970er-Retro-Comic (YouTube Main-Bot) ─────
COMIC_1970S_STYLE = {
    "label": "1970er Retro-Comic",
    "prefix": ("vintage 1970s comic book illustration, retro Bronze Age comic art style, "
               "bold hand-inked outlines, Ben-Day halftone dots, slightly faded warm retro color palette "
               "(mustard yellow, burnt orange, teal, brown), dramatic comic paneling, "
               "screen-print texture, grainy aged paper look, expressive characters, "
               "NOT photorealistic, no real photo, no modern 3D render, "),
    "profile_idx": 3,  # graphic novel drama (passt am besten zu Comic)
}

def todays_art_style():
    """Fester Kunststil fuer den YouTube-Main-Bot: 1970er Retro-Comic."""
    return COMIC_1970S_STYLE

# ─── CALLIDUS-KATEGORIEN (fuer abwechslungsreiche Tagesgeschichten) ─
CALLIDUS_KATEGORIEN = [
    "Nahrungsergaenzung & Supplements (Magnesium, Vitamin D, Omega-3, Zink, B-Vitamine)",
    "Schlaf & Regeneration",
    "Stressbewaeltigung & Nervensystem-Balance",
    "Ernaehrung & Darmgesundheit",
    "Bewegung & Energie im Alltag",
    "Immunsystem natuerlich staerken",
    "Mentale Klarheit, Fokus & Konzentration",
    "Naturheilkunde & pflanzliche Helfer (Adaptogene, Heilkraeuter)",
    "Hormonbalance & hormonelles Wohlbefinden",
    "Hydration, Elektrolyte & Mineralstoffe",
    "Achtsamkeit, Atemarbeit & innere Ruhe",
    "Langlebigkeit & gesundes Altern",
]

THEMEN = [
    "Ein junger Mann wacht erschoepft auf, hat einen chaotischen Morgen, nimmt abends Magnesium und findet wieder Leichtigkeit.",
    "Eine junge Frau startet gestresst in den Tag, verpasst fast alles, trinkt Vitamin-C-Wasser und erlebt einen sonnigen Neustart.",
    "Ein Vater ist muede und gereizt, stolpert durch den Morgen, beginnt mit Omega-3 und kocht spaeter lachend mit Freunden.",
    "Eine Studentin fuehlt sich leer und unkonzentriert, scheitert an kleinen Aufgaben, macht eine Atemroutine und findet ihren Fokus.",
    "Ein Bueroarbeiter ist nach schlechtem Schlaf neben der Spur, waehlt Melatonin-freundliche Abendruhe und wacht klarer auf.",
    "Eine sportliche Frau hat schwere Beine und keine Energie, achtet auf Protein und Magnesium und trainiert wieder mit Freude.",
    "Ein junger Mann lebt nur von Kaffee, wird nervoes und fahrig, entdeckt Elektrolyte und erlebt einen ruhigen Nachmittag.",
    "Eine kreative Frau hat Wintertief und zieht sich zurueck, nimmt Vitamin D bewusst in ihre Routine und trifft wieder Freunde.",
    "Ein Paar ist vom Alltag erschoepft, baut einen kleinen Abendspaziergang ein und findet wieder gute Laune.",
    "Ein Selbststaendiger vergisst Pausen, bekommt Kopfdruck, trinkt Wasser mit Mineralien und endet entspannt im Park.",
    "Eine Studentin kreist gedanklich vor einer Pruefung, legt das Handy weg, macht Atemuebungen und findet innere Ruhe.",
    "Ein Hobbylaeufer bricht sein Training frustriert ab, entdeckt Regeneration und Protein und laeuft spaeter mit Freude.",
    "Eine junge Mutter isst nebenbei nur Suesses, bekommt ein Nachmittagstief und findet durch eine einfache Mahlzeit neue Energie.",
    "Ein Entwickler sitzt zu lange am Schreibtisch, sein Ruecken meldet sich, ein kurzer Mobility-Block macht den Abend leichter.",
    "Eine aeltere Frau fuehlt sich im Winter antriebslos, beginnt mit Sonnenlicht-Spaziergaengen und trifft wieder ihre Nachbarin.",
    "Ein Freundeskreis ist gereizt nach einer langen Woche, kocht gemeinsam gesund und der Abend wird warm und lustig.",
]
# ─── LOGGING ─────────────────────────────────────────────────────
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
logging.basicConfig(
    filename=f"{LOGS_DIR}/youtube_v2_workflow.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ─── TELEGRAM ────────────────────────────────────────────────────
def tg_send(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": TELEGRAM_CHAT, "text": text, "parse_mode": "HTML"})

def tg_send_approval(video_path, titel):
    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Freigeben & Hochladen", "callback_data": "approve"},
            {"text": "❌ Ablehnen & Neu",        "callback_data": "reject"}
        ]]
    }
    # Dateigroesse pruefen (Telegram-Limit: 50 MB)
    try:
        size_mb = os.path.getsize(video_path) / (1024 * 1024)
        log.info(f"Video-Dateigröße: {size_mb:.1f} MB")
    except Exception:
        size_mb = 0

    # Video senden falls <= 48 MB
    if size_mb <= 48:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
            with open(video_path, "rb") as f:
                r = requests.post(url, data={
                    "chat_id":      TELEGRAM_CHAT,
                    "caption":      f"🎬 <b>Vorschau bereit!</b>\n\n📌 <b>{titel}</b>\n\nBitte prüfen und entscheiden:",
                    "parse_mode":   "HTML",
                    "reply_markup": json.dumps(keyboard)
                }, files={"video": f}, timeout=180)
            resp = r.json()
            if resp.get("ok"):
                log.info("Telegram: Video-Vorschau mit Buttons gesendet")
                return resp.get("result", {}).get("message_id")
            else:
                log.warning(f"Telegram sendVideo fehlgeschlagen: {resp}")
        except Exception as e:
            log.warning(f"Telegram sendVideo Exception: {e}")

    # Fallback: Text-Nachricht mit Buttons (kein Video, aber Buttons funktionieren)
    log.warning(f"Video zu groß ({size_mb:.1f} MB) oder Upload fehlgeschlagen – sende nur Buttons")
    url2 = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    r2 = requests.post(url2, json={
        "chat_id":      TELEGRAM_CHAT,
        "text":         f"🎬 <b>Video bereit!</b> ({size_mb:.1f} MB – zu groß für Vorschau)\n\n📌 <b>{titel}</b>\n\nBitte entscheiden:",
        "parse_mode":   "HTML",
        "reply_markup": keyboard
    }, timeout=30)
    return r2.json().get("result", {}).get("message_id")

def tg_get_last_update_id():
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    r = requests.get(url, params={"limit": 1})
    updates = r.json().get("result", [])
    return updates[-1]["update_id"] if updates else 0

def tg_wait_for_approval(timeout=3600):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    last_update = tg_get_last_update_id()
    tg_send("⏳ Warte auf deine Entscheidung... (Timeout: 1 Stunde)")
    start = time.time()
    while time.time() - start < timeout:
        r = requests.get(url, params={"offset": last_update + 1, "timeout": 30})
        updates = r.json().get("result", [])
        for update in updates:
            last_update = update["update_id"]
            if "callback_query" in update:
                data        = update["callback_query"]["data"]
                callback_id = update["callback_query"]["id"]
                requests.post(
                    f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/answerCallbackQuery",
                    json={"callback_query_id": callback_id}
                )
                if data == "approve":
                    tg_send("✅ <b>Freigegeben!</b> Video wird jetzt hochgeladen...")
                    return True
                elif data == "reject":
                    tg_send("❌ <b>Abgelehnt.</b> Morgen wird ein neues Video generiert.")
                    return False
        time.sleep(5)
    tg_send("⏰ <b>Timeout!</b> Kein Feedback erhalten. Video wird NICHT hochgeladen.")
    return False

# ─── GEMINI: SCRIPT GENERIEREN ───────────────────────────────────
def generate_script(thema, fmt="long"):
    _art = todays_art_style()
    prompt = f"""Du bist Drehbuchautor und Regisseur fuer "callidus A&M" (ganzheitliche Gesundheit, Wohlbefinden, Naturheilkunde, alltagstaugliche Routinen).
Erstelle ein filmisches YouTube Story-Video von circa 10 Minuten aus dieser Story-Idee: "{thema}"

ZIEL:
Kein trockenes Erklaervideo, kein Anatomie-Vortrag. Erzaehle eine kleine, fesselnde Geschichte wie einen Kurzfilm mit echtem Spannungsbogen.
Die Geschichte soll NICHT immer nach demselben Muster ablaufen. Variiere Stimmung und Aufbau je nach Thema:
mal inspirierend und motivierend, mal aufklaerend und lehrreich, mal warmherzig und erfreulich, mal mit einem kleinen Augenzwinkern.
Eine Hauptfigur erlebt einen nachvollziehbaren Alltag, entdeckt einen einfachen Gesundheitsimpuls passend zum Thema und findet realistisch zu mehr Leichtigkeit, Energie oder Klarheit.

WICHTIG:
- DEUTSCHE UMLAUTE PFLICHT: Schreibe in allen deutschen Texten (titel, sprechtext, motivationstext, beschreibung)
  IMMER echte Umlaute ä, ö, ü, Ä, Ö, Ü und ß. NIEMALS Umschreibungen wie ae, oe, ue oder ss verwenden.
  Beispiele: "Erschöpfung" (nicht "Erschoepfung"), "für" (nicht "fuer"), "über" (nicht "ueber").
- Keine Heilversprechen. Nicht behaupten, dass ein Mittel Krankheiten heilt.
- Der Wandel darf positiv wirken, aber plausibel: ruhiger, klarer, besser gelaunt, mehr Energie, sozialer.
- Callidus soll als Gesundheitswissen/Orientierung auftauchen, nicht als harte Werbung.
- Die Hauptfigur bleibt ueber ALLE Slides konsistent: Alter, Kleidung, Frisur, Stimmung, Umgebung.
- Erstelle ein Feld "character_bible": sehr konkrete englische Beschreibung der Hauptfigur
  (age, gender, hair, face, outfit, colors, one accessory). Wiederhole diese Beschreibung in jedem video_prompt exakt.
- Variiere die Hauptfigur von Video zu Video deutlich (Alter, Geschlecht, Beruf, Lebenssituation).
- Die Geschichte muss auch ohne gesprochenen Text logisch erkennbar sein. Klare visuelle Ursache-Wirkung.
- GENAU 18 Slides, je ca. 30-35 Sekunden (Gesamtlaenge ca. 10 Minuten). Das ist PFLICHT - exakt 18 Eintraege im slides-Array.
- Sprechtext pro Slide: 80-110 Woerter, erzaehlerisch, warm, filmisch, abwechslungsreich.
- motivationstext: kurzer Satz max 70 Zeichen, keine Emojis.

STORYBOGEN ueber 18 Slides (frei je nach Thema/Stimmung anpassen, NICHT immer "schlechter Morgen"):
- Slides 1-3: Einstieg. Figur und Alltagssituation einfuehren, Thema/Frage spannend aufwerfen.
- Slides 4-6: Vertiefung. Warum ist das Thema relevant? Erste ueberraschende Einsicht.
- Slides 7-9: Wendepunkt. Der Gesundheitsimpuls/Naturheil-Ansatz taucht natuerlich auf.
- Slides 10-12: Umsetzung. Ruhiges Ritual, konkrete Anwendung, erste spuerbare Veraenderung.
- Slides 13-15: Vertiefendes Wissen + sichtbare positive Entwicklung im Alltag.
- Slides 16-17: Payoff. Lebensfreude, soziale Waerme, neues Lebensgefuehl.
- Slide 18: Sanfte Aufloesung mit callidus-am.de und Nexus App als Ort fuer mehr Gesundheitswissen.

VIDEO_PROMPT REGIE:
Fuer jeden Slide einen englischen "video_prompt" (eine konkrete Filmszene, keine medizinische Innenansicht).
Jeder Prompt MUSS mit diesem Bildstil beginnen: "{_art['prefix']}"
Danach: gleiche Hauptfigur (kurze Beschreibung), Ort, Handlung, Emotion, Kamerabewegung, Licht, sichtbare Bewegung.
Keine Texteinblendungen, keine Logos, keine Untertitel im Bild. Maximal 65 Woerter pro video_prompt.
WICHTIG: Der gesamte Film ist im Stil "{_art['label']}" - durchgehend, NICHT fotorealistisch.

BILDSUCHE:
"bildsuche" beschreibt die Szene als Stichworte, z.B. "young woman kitchen herbal tea morning", "friends hiking forest sunlight", "calm breathing exercise living room".

JSON Format (slides gekuerzt dargestellt - du lieferst GENAU 18 vollstaendige Slides):
{{
  "titel": "Filmischer Titel ohne Emoji",
  "character_bible": "same 28-year-old woman, shoulder-length brown hair, warm calm face, beige knit sweater, blue jeans, small gold necklace",
  "beschreibung": "YouTube Beschreibung 2-3 Saetze mit Hinweis auf callidus-am.de und Nexus App, ohne Heilversprechen.",
  "tags": ["gesundheit","wohlbefinden","routine","callidus","nexus"],
  "slides": [
    {{"titel": "Einstieg", "sprechtext": "... 80-110 Woerter ...", "bildsuche": "scene keywords", "motivationstext": "Kurzer Satz max 70 Zeichen", "video_prompt": "{_art['prefix']}..."}},
    {{"titel": "...", "sprechtext": "...", "bildsuche": "...", "motivationstext": "...", "video_prompt": "{_art['prefix']}..."}},
    "... insgesamt GENAU 18 Slides, gleiche Struktur, Slide 18 = Callidus-Aufloesung mit callidus-am.de + Nexus App ..."
  ]
}}
Liefere wirklich alle 18 Slides voll ausgeschrieben. Nur JSON, kein Markdown!"""

    # REST API direkt – Key-Rotation + Modell-Fallback bei Rate-Limit
    _models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
    _resp = None
    _success = False
    for _ki, _key in enumerate(GEMINI_KEYS):
        for _model in _models:
            _url  = (f"https://generativelanguage.googleapis.com/v1beta/models/"
                     f"{_model}:generateContent?key={_key}")
            for _attempt in range(3):
                try:
                    _resp = requests.post(_url,
                                          json={"contents": [{"parts": [{"text": prompt}]}]},
                                          timeout=(15, 180))
                except requests.exceptions.Timeout:
                    log.warning(f"Key{_ki+1}/{_model}: Timeout (Versuch {_attempt+1}/3)")
                    time.sleep(20)
                    continue
                if _resp.status_code == 429:
                    log.warning(f"Key{_ki+1}/{_model} 429 (Versuch {_attempt+1}/3)")
                    time.sleep(30 * (2 ** _attempt))
                    continue
                if not _resp.ok:
                    # 404/400 etc. -> Modell nicht verfuegbar, naechstes Modell probieren (nicht abbrechen)
                    log.warning(f"Key{_ki+1}/{_model} HTTP {_resp.status_code}: {_resp.text[:150]} – naechstes Modell")
                    break
                _success = True
                break
            if _success:
                log.info(f"Script-Generierung via Key{_ki+1}/{_model} erfolgreich")
                break
        if _success:
            break
        log.warning(f"Key{_ki+1} fuer alle Modelle blockiert – versuche naechsten Key")
    if not _success:
        raise Exception("Gemini API: Alle Keys & Modelle blockiert – Tageskontingent erschoepft?")
    raw  = _resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    import re as _re
    raw  = raw.strip()
    raw  = _re.sub(r'^```(?:json)?\s*', '', raw)
    raw  = _re.sub(r'\s*```$', '', raw)
    raw  = _re.sub(r',\s*([}\]])', r'\1', raw)  # trailing commas
    raw  = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as _e:
        log.warning(f"JSON-Fehler: {_e} – bereinige und wiederhole")
        raw2 = _re.sub(r'\r?\n', ' ', raw)
        raw2 = _re.sub(r',\s*([}\]])', r'\1', raw2)
        data = json.loads(raw2)
    log.info(f"Script: {data['titel']} ({len(data.get('slides', []))} Slides)")
    return data

# ─── GEMINI TTS ───────────────────────────────────────────────────
def generate_audio(text, output_path):
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Aoede"}}}
        }
    }
    # TTS-Modelle mit Fallback (flash zuerst, dann pro)
    _tts_models = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
    last_error = None
    for _ki, _key in enumerate(GEMINI_KEYS):
      for _model in _tts_models:
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{_model}:generateContent?key={_key}")
        for attempt in range(4):
            try:
                resp = requests.post(url, json=payload, timeout=(10, 120))
                resp.raise_for_status()
                audio_b64   = resp.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                audio_bytes = base64.b64decode(audio_b64)
                with wave.open(output_path, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(audio_bytes)

                # 1.5 Sek Pause anhängen
                pause_frames = int(24000 * 1.5)
                pause_bytes  = b'\x00\x00' * pause_frames
                with wave.open(output_path, "rb") as wf:
                    params = wf.getparams()
                    frames = wf.readframes(wf.getnframes())
                with wave.open(output_path, "wb") as wf:
                    wf.setparams(params)
                    wf.writeframes(frames + pause_bytes)

                log.info(f"Audio: {output_path} (via {_model})")
                return
            except requests.exceptions.Timeout:
                last_error = "Timeout nach 120s"
                log.warning(f"TTS {_model} Timeout (Versuch {attempt+1}/4) – 15s...")
                time.sleep(15)
            except requests.exceptions.HTTPError as e:
                last_error = str(e)
                if resp.status_code == 429:
                    _wait = 60 * (2 ** attempt)  # 60→120→240→480s
                    log.warning(f"TTS {_model} 429 – warte {_wait}s (Versuch {attempt+1}/4)...")
                    time.sleep(_wait)
                else:
                    log.warning(f"TTS {_model} HTTP-Fehler (Versuch {attempt+1}/4): {e} – 10s...")
                    time.sleep(10)
            except Exception as e:
                last_error = str(e)
                log.warning(f"TTS {_model} Fehler (Versuch {attempt+1}/4): {e} – 10s...")
                time.sleep(10)
        log.warning(f"TTS {_model} nach 4 Versuchen blockiert – versuche naechstes Modell")
    # Letzter Ausweg: stilles Audio statt kompletter Workflow-Abbruch
    log.error(f"TTS komplett fehlgeschlagen ({last_error}) – nutze stilles Audio fuer diesen Slide")
    _words = max(1, len(text.split()))
    generate_silent_audio(output_path, min(35.0, max(6.0, _words / 2.3)))
    return

def generate_silent_audio(output_path, duration_sec):
    frames = int(24000 * max(1.0, float(duration_sec)))
    with wave.open(output_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b"\x00\x00" * frames)
    log.info(f"Stummes Story-Audio: {output_path} ({duration_sec:.1f}s)")

# ─── BILDER ───────────────────────────────────────────────────────
def fetch_pexels_images(query, output_paths, orientation="landscape"):
    """Holt mehrere verschiedene Bilder von Pexels fuer einen Slide."""
    if not PEXELS_KEY:
        return []
    headers = {"Authorization": PEXELS_KEY}
    r = requests.get(
        "https://api.pexels.com/v1/search",
        headers=headers,
        params={"query": query, "per_page": 15, "orientation": orientation},
        timeout=15
    )
    photos = r.json().get("photos", [])
    if not photos:
        return []

    # Verschiedene Bilder auswaehlen (nicht immer dieselben)
    count    = min(len(output_paths), len(photos))
    selected = photos[:count] if len(photos) >= count else photos
    # Leichte Zufaelligkeit: aus den ersten 8 auswaehlen
    pool     = photos[:min(8, len(photos))]
    selected = random.sample(pool, min(count, len(pool)))

    saved = []
    for path, photo in zip(output_paths, selected):
        try:
            img_url = photo["src"]["large2x"]
            r2 = requests.get(img_url, timeout=30)
            if r2.status_code == 200 and len(r2.content) > 1000:
                with open(path, "wb") as f:
                    f.write(r2.content)
                saved.append(path)
            else:
                log.warning(f"Pexels Bild ungültig ({r2.status_code}, {len(r2.content)} bytes): {img_url}")
        except Exception as e:
            log.warning(f"Pexels Bild Download Fehler: {e}")
    return saved

def fetch_pexels_video(query, output_path, orientation="portrait"):
    """Holt einen Videoclip von Pexels (gleicher API-Key)."""
    if not PEXELS_KEY:
        return None
    headers = {"Authorization": PEXELS_KEY}
    try:
        r = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers,
            params={"query": query, "per_page": 10, "orientation": orientation},
            timeout=15
        )
        videos = r.json().get("videos", [])
        if not videos:
            return None
        pool = videos[:5]
        random.shuffle(pool)
        for video in pool:
            for vf in video.get("video_files", []):
                if orientation == "portrait":
                    ok = vf.get("height", 0) >= vf.get("width", 1) and vf.get("height", 0) >= 480
                else:
                    ok = vf.get("width", 0) >= vf.get("height", 1) and vf.get("width", 0) >= 640
                if ok:
                    r2 = requests.get(vf["link"], timeout=90, stream=True)
                    if r2.status_code == 200:
                        with open(output_path, "wb") as f:
                            for chunk in r2.iter_content(8192):
                                f.write(chunk)
                        log.info(f"Pexels Video: {query}")
                        return output_path
        return None
    except Exception as e:
        log.warning(f"Pexels Video Fehler: {e}")
        return None

def fetch_pexels_videos_multi(query, work_dir, prefix, count=3, exclude_ids=None):
    """Holt bis zu count verschiedene Landscape-Videoclips von Pexels (kein Loop noetig)."""
    if exclude_ids is None:
        exclude_ids = set()
    if not PEXELS_KEY:
        return []
    headers = {"Authorization": PEXELS_KEY}
    try:
        r = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers,
            params={"query": query, "per_page": 30, "orientation": "landscape"},
            timeout=15
        )
        videos = r.json().get("videos", [])
        if not videos:
            return []
        pool = videos[:20]
        random.shuffle(pool)
        results = []
        for video in pool:
            if len(results) >= count:
                break
            vid_id = video.get("id")
            if vid_id in exclude_ids:
                continue  # bereits in anderem Segment verwendet
            for vf in video.get("video_files", []):
                w = vf.get("width", 0)
                h = vf.get("height", 0)
                if w >= h and w >= 640:  # Nur Landscape-Clips
                    out_path = f"{work_dir}/{prefix}_{len(results)}.mp4"
                    try:
                        r2 = requests.get(vf["link"], timeout=90, stream=True)
                        if r2.status_code == 200:
                            with open(out_path, "wb") as f:
                                for chunk in r2.iter_content(8192):
                                    f.write(chunk)
                            results.append(out_path)
                            exclude_ids.add(vid_id)
                            log.info(f"Pexels Multi-Video {len(results)}/{count}: {query}")
                            break
                    except Exception as e:
                        log.warning(f"Pexels Multi-Video Download Fehler: {e}")
        return results
    except Exception as e:
        log.warning(f"fetch_pexels_videos_multi Fehler: {e}")
        return []

def generate_ai_image(prompt, output_path, width=1920, height=1080):
    """Generiert KI-Bild via Pollinations.ai (kostenlos, kein API-Key)."""
    try:
        encoded = requests.utils.quote(prompt)
        url = (f"https://image.pollinations.ai/prompt/{encoded}"
               f"?width={width}&height={height}&nologo=true&model=flux")
        r = requests.get(url, timeout=90)
        if r.status_code == 200 and len(r.content) > 5000:
            with open(output_path, "wb") as f:
                f.write(r.content)
            log.info(f"KI-Bild: {prompt[:40]}")
            return output_path
    except Exception as e:
        log.warning(f"Pollinations Fehler: {e}")
    return None

# ─── KI-VIDEO & KI-BILD (v2) ──────────────────────────────────────
try:
    import sys as _sys
    _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from fal_client import generate_ai_image_flux, generate_ai_video_wan
    log.info("fal_client importiert (v2 KI-Funktionen aktiv)")
except ImportError as _e:
    log.warning(f"fal_client nicht gefunden: {_e} – KI-Video/Bild deaktiviert")
    def generate_ai_image_flux(prompt, output_path, width=1920, height=1080):
        return None
    def generate_ai_video_wan(prompt, output_path, aspect_ratio="16:9"):
        return None

# KI-Video Qualitaet:
# economy = 3 WAN-Clips, profi = 5 WAN-Clips, max = alle 9 Slides.
# Auf der NAS optional steuerbar mit: export CALLIDUS_VIDEO_QUALITY=profi
VIDEO_QUALITY_PRESET = os.environ.get("CALLIDUS_VIDEO_QUALITY", "economy").lower()
KI_VIDEO_MAX_BY_PRESET = {"economy": 3, "profi": 5, "max": 99}
KI_VIDEO_MAX = KI_VIDEO_MAX_BY_PRESET.get(VIDEO_QUALITY_PRESET, 3)
NARRATION_ENABLED = os.environ.get("CALLIDUS_NARRATION", "1").lower() in ("1", "true", "yes", "on")
STORY_SLIDE_SECONDS = float(os.environ.get("CALLIDUS_STORY_SLIDE_SECONDS", "32"))

def _key_slide_indices(total_slides):
    """Dynamische Schluesselszenen (funktioniert fuer 9 oder 18+ Slides):
    Hook (Anfang), Wendepunkt (~45%), grosser Payoff (~85%)."""
    if total_slides <= 1:
        return {0}
    hook    = 0
    wende   = max(1, round((total_slides - 1) * 0.45))
    payoff  = max(wende + 1, round((total_slides - 1) * 0.85))
    return {hook, wende, payoff}

def should_generate_wan_clip(slide_index, total_slides, generated_count):
    if generated_count >= KI_VIDEO_MAX:
        return False
    if VIDEO_QUALITY_PRESET == "max":
        return True
    return slide_index in _key_slide_indices(total_slides)


def _ffmpeg_esc(text):
    """Escaped Sonderzeichen fuer FFmpeg drawtext-Filter."""
    return (text.replace("\\", "\\\\")
                .replace("'",  "\\'")
                .replace(":",  "\\:")
                .replace("[",  "\\[")
                .replace("]",  "\\]"))

def _wrap_text(text, max_chars=40):
    """Bricht Text fuer FFmpeg drawtext um (\\n als Zeilenumbruch)."""
    words = text.split()
    lines, cur = [], []
    for w in words:
        if len(" ".join(cur + [w])) <= max_chars:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return r"\n".join(lines)

def _build_subtitle_vf(subtitle_text, font_path, cta_text=""):
    """Erstellt drawbox+drawtext Filter-String fuer Untertitel + optionalen CTA."""
    if not font_path or (not subtitle_text and not cta_text):
        return ""
    parts = []
    if subtitle_text:
        wrapped  = _wrap_text(subtitle_text[:120], 40)
        esc_text = _ffmpeg_esc(wrapped)
        parts.append("drawbox=x=0:y=h-180:w=iw:h=180:color=black@0.65:t=fill")
        parts.append(
            f"drawtext=text='{esc_text}':fontfile='{font_path}':fontsize=34"
            f":fontcolor=white:bordercolor=black:borderw=2"
            f":x=(w-text_w)/2:y=h-160:line_spacing=10"
        )
    if cta_text:
        esc_cta = _ffmpeg_esc(cta_text)
        if not subtitle_text:
            parts.append("drawbox=x=0:y=h-70:w=iw:h=70:color=black@0.65:t=fill")
        parts.append(
            f"drawtext=text='{esc_cta}':fontfile='{font_path}':fontsize=38"
            f":fontcolor=#FFD700:bordercolor=black:borderw=3"
            f":x=(w-text_w)/2:y=h-50"
        )
    return ",".join(parts)

_drawtext_ok   = None  # Gecachtes Ergebnis der drawtext-Verfuegbarkeitspruefung
_pil_font_path = None  # Gecachter PIL-Font-Pfad

def _get_pil_font_path():
    """Gibt Font-Pfad fuer PIL-Rendering zurueck (unabhaengig von FFmpeg drawtext)."""
    global _pil_font_path
    if _pil_font_path:
        return _pil_font_path
    candidates = [
        f"{ASSETS_DIR}/font.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/volume1/@appstore/ffmpeg7/lib/fonts/DejaVuSans.ttf",
    ]
    for fp in candidates:
        if os.path.exists(fp):
            _pil_font_path = fp
            return fp
    # Font herunterladen
    cached = f"{ASSETS_DIR}/font.ttf"
    try:
        os.makedirs(ASSETS_DIR, exist_ok=True)
        r = requests.get(
            "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf",
            timeout=30
        )
        with open(cached, "wb") as f:
            f.write(r.content)
        _pil_font_path = cached
        return cached
    except Exception as e:
        log.warning(f"PIL Font-Download fehlgeschlagen: {e}")
        return None

def _get_font_path():
    global _drawtext_ok
    # Einmalig pruefen ob FFmpeg drawtext unterstuetzt (braucht libfreetype)
    if _drawtext_ok is None:
        try:
            r = subprocess.run([FFMPEG, "-filters"], capture_output=True, timeout=10)
            _drawtext_ok = b"drawtext" in r.stdout
            if not _drawtext_ok:
                log.warning("FFmpeg hat kein drawtext (kein libfreetype) – Text-Overlays via FFmpeg deaktiviert")
        except Exception:
            _drawtext_ok = False
    if not _drawtext_ok:
        return None

    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/volume1/@appstore/ffmpeg7/lib/fonts/DejaVuSans.ttf",
        f"{ASSETS_DIR}/font.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return fp

    # Kein Font gefunden – DejaVuSans-Bold von GitHub herunterladen und cachen
    cached = f"{ASSETS_DIR}/font.ttf"
    try:
        os.makedirs(ASSETS_DIR, exist_ok=True)
        log.info("Lade Font herunter...")
        r = requests.get(
            "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf",
            timeout=30
        )
        with open(cached, "wb") as f:
            f.write(r.content)
        log.info(f"Font gespeichert: {cached}")
        return cached
    except Exception as e:
        log.warning(f"Font-Download fehlgeschlagen: {e}")
        return None

def _make_text_overlay_png(display_text, subtitle_text, cta_text, output_path,
                            fmt="landscape", show_bars=True):
    """
    Erzeugt transparentes RGBA-PNG – 3-Zonen-Layout:
      OBEN   – Titel  (title_sz, Schatten)
      MITTE  – Mitlese-Text / subtitle_text (Pill-Hintergrund, zentriert)
      UNTEN  – callidus-am.de + CTA
    fmt="landscape": 1920x1080  |  fmt="shorts": 1080x1920
    """
    from PIL import Image, ImageDraw, ImageFont
    if fmt == "shorts":
        width, height   = 1080, 1920
        max_title_chars = 16
        max_read_chars  = 22
    else:  # landscape
        width, height   = 1920, 1080
        max_title_chars = 28
        max_read_chars  = 40

    img  = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    fp   = _get_pil_font_path()
    cx   = width // 2
    cy   = height // 2

    WHITE      = (255, 255, 255, 255)
    GOLD       = (200, 169, 110, 255)
    YELLOW     = (255, 220, 0,   255)
    BLACK_SOFT = (20,  20,  20,  200)

    title_sz = int(width * 0.044)
    read_sz  = int(width * 0.030)
    url_sz   = int(width * 0.022)
    cta_sz   = int(width * 0.030)

    def load_font(sz):
        try:
            return ImageFont.truetype(fp, sz) if fp else ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()

    font_title = load_font(title_sz)
    font_read  = load_font(read_sz)
    font_url   = load_font(url_sz)
    font_cta   = load_font(cta_sz)

    shadow_offsets = [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2),
                      (-3,0),(3,0),(0,-3),(0,3)]

    # ── OBEN: Titel ───────────────────────────────────────────────────
    if display_text:
        words = display_text.split()
        lines, line = [], []
        for w in words:
            line.append(w)
            if len(" ".join(line)) > max_title_chars:
                lines.append(" ".join(line[:-1]))
                line = [w]
        if line:
            lines.append(" ".join(line))
        lines  = lines[:2]
        line_h = title_sz + 10
        title_top = int(height * 0.08) + title_sz // 2
        for i2, l in enumerate(lines):
            y = title_top + i2 * line_h
            for dx, dy in shadow_offsets:
                draw.text((cx+dx, y+dy), l, fill=BLACK_SOFT, font=font_title, anchor="mm")
            draw.text((cx, y), l, fill=WHITE, font=font_title, anchor="mm")

    # ── MITTE: Mitlese-Text ───────────────────────────────────────────
    if subtitle_text:
        sub_words = subtitle_text.split()
        read_lines, cur = [], []
        for w in sub_words:
            cur.append(w)
            if len(" ".join(cur)) > max_read_chars:
                read_lines.append(" ".join(cur[:-1]))
                cur = [w]
        if cur:
            read_lines.append(" ".join(cur))
        read_lines = read_lines[:4]

        read_spacing = 10
        total_read_h = len(read_lines) * read_sz + max(0, len(read_lines)-1) * read_spacing
        y_read_start = cy - total_read_h // 2

        for i2, rl in enumerate(read_lines):
            y = y_read_start + i2 * (read_sz + read_spacing)
            for dx, dy in shadow_offsets[:4]:
                draw.text((cx+dx, y+dy), rl, fill=BLACK_SOFT, font=font_read, anchor="mm")
            draw.text((cx, y), rl, fill=WHITE, font=font_read, anchor="mm")

    # ── UNTEN: callidus-am.de + CTA ──────────────────────────────────
    url_y = height - int(height * 0.05)
    for dx, dy in shadow_offsets[:4]:
        draw.text((cx+dx, url_y+dy), "callidus-am.de", fill=BLACK_SOFT, font=font_url, anchor="mm")
    draw.text((cx, url_y), "callidus-am.de", fill=GOLD, font=font_url, anchor="mm")

    if cta_text:
        cta_y = height - int(height * 0.09)
        for dx, dy in shadow_offsets[:4]:
            draw.text((cx+dx, cta_y+dy), cta_text, fill=BLACK_SOFT, font=font_cta, anchor="mm")
        draw.text((cx, cta_y), cta_text, fill=YELLOW, font=font_cta, anchor="mm")

    img.save(output_path, "PNG")

def _make_motivationstext_overlay_png(text, output_path, fmt, W, H):
    """Transparentes PNG mit NUR dem Motivationstext in der Mitte (kein Titel, kein Brand)."""
    from PIL import Image as PILImg2, ImageDraw as PILDraw2, ImageFont as PILFont2
    img  = PILImg2.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = PILDraw2.Draw(img)
    cx, cy = W // 2, H // 2

    read_sz = int(W * 0.055) if fmt != "shorts" else int(W * 0.060)
    fp = _get_pil_font_path()
    try:
        font_read = PILFont2.truetype(fp, read_sz) if fp else PILFont2.load_default()
    except Exception:
        font_read = PILFont2.load_default()

    max_read_chars = 40 if fmt == "landscape" else 22
    words = text.split()
    lines, cur = [], []
    for w in words:
        cur.append(w)
        if len(" ".join(cur)) > max_read_chars:
            lines.append(" ".join(cur[:-1]))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    lines = lines[:4]

    spacing  = 10
    total_h  = len(lines) * read_sz + max(0, len(lines) - 1) * spacing
    y_start  = cy - total_h // 2

    WHITE      = (255, 255, 255, 255)
    BLACK_SOFT = (20,  20,  20,  200)
    shadows    = [(2, 2), (-2, 2), (2, -2), (-2, -2)]

    for i2, line in enumerate(lines):
        y = y_start + i2 * (read_sz + spacing)
        for dx, dy in shadows:
            draw.text((cx + dx, y + dy), line, fill=BLACK_SOFT, font=font_read, anchor="mm")
        draw.text((cx, y), line, fill=WHITE, font=font_read, anchor="mm")

    img.save(output_path, "PNG")

def render_text_on_image(img_pil, text, titel, fmt, subtitle_text="", cta_text="",
                          show_bars=True):
    """
    3-Zonen-Layout:
      OBEN   – Slide-Titel (gross, Schatten)
      MITTE  – Mitlese-Text / subtitle_text (mittel, Pill-Hintergrund)
      UNTEN  – callidus-am.de + CTA (klein, gold)
    show_bars: wird fuer Schatten-Staerke genutzt (Balken gibt es nicht mehr)
    """
    from PIL import ImageDraw, ImageFont, Image

    size      = img_pil.size
    cx        = size[0] // 2
    cy        = size[1] // 2
    font_path = _get_pil_font_path()

    # Leichtes Abdunkeln des Hintergrunds
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    od      = ImageDraw.Draw(overlay)
    od.rectangle([0, 0, size[0], size[1]], fill=(0, 0, 0, 55))
    img_pil = Image.alpha_composite(img_pil.convert("RGBA"), overlay).convert("RGB")
    draw    = ImageDraw.Draw(img_pil)

    GOLD       = (200, 169, 110)
    WHITE      = (255, 255, 255)
    YELLOW     = (255, 220, 0)
    BLACK_SOFT = (20,  20,  20)

    big_size  = int(size[0] * 0.075)
    read_sz   = int(size[0] * 0.032)
    url_size  = int(size[0] * 0.028)
    cta_size  = int(size[0] * 0.032)
    max_chars = 12 if fmt == "shorts" else 18
    max_read  = 22 if fmt == "shorts" else 40

    shadow_offsets = [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2),
                      (-3,0),(3,0),(0,-3),(0,3)]

    def load_font(sz):
        try:
            return ImageFont.truetype(font_path, sz) if font_path else ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()

    font_big  = load_font(big_size)
    font_read = load_font(read_sz)
    font_url  = load_font(url_size)
    font_cta  = load_font(cta_size)

    # ── OBEN: Slide-Titel ────────────────────────────────────────────
    words = text.split()
    lines, line = [], []
    for w in words:
        line.append(w)
        if len(" ".join(line)) > max_chars:
            lines.append(" ".join(line[:-1]))
            line = [w]
    if line:
        lines.append(" ".join(line))
    lines = lines[:2]

    title_top = int(size[1] * 0.09)   # 9% vom oberen Rand
    line_h    = big_size + 12
    for i, l in enumerate(lines):
        y = title_top + i * line_h
        for dx, dy in shadow_offsets:
            draw.text((cx+dx, y+dy), l, fill=BLACK_SOFT, font=font_big, anchor="mm")
        draw.text((cx, y), l, fill=WHITE, font=font_big, anchor="mm")

    # ── MITTE: Mitlese-Text ──────────────────────────────────────────
    if subtitle_text:
        sub_words = subtitle_text.split()
        read_lines, cur = [], []
        for w in sub_words:
            cur.append(w)
            if len(" ".join(cur)) > max_read:
                read_lines.append(" ".join(cur[:-1]))
                cur = [w]
        if cur:
            read_lines.append(" ".join(cur))
        read_lines = read_lines[:4]  # Max 4 Zeilen

        read_spacing  = 10
        total_read_h  = len(read_lines) * read_sz + max(0, len(read_lines)-1) * read_spacing
        y_read_start  = cy - total_read_h // 2

        for i, rl in enumerate(read_lines):
            y = y_read_start + i * (read_sz + read_spacing)
            for dx, dy in shadow_offsets[:4]:
                draw.text((cx+dx, y+dy), rl, fill=BLACK_SOFT, font=font_read, anchor="mm")
            draw.text((cx, y), rl, fill=WHITE, font=font_read, anchor="mm")

    # ── UNTEN: callidus-am.de + CTA ──────────────────────────────────
    brand_y = size[1] - int(size[1] * 0.05)
    for dx, dy in shadow_offsets[:4]:
        draw.text((cx+dx, brand_y+dy), "callidus-am.de", fill=BLACK_SOFT, font=font_url, anchor="mm")
    draw.text((cx, brand_y), "callidus-am.de", fill=GOLD, font=font_url, anchor="mm")

    if cta_text:
        cta_y = size[1] - int(size[1] * 0.09)
        for dx, dy in shadow_offsets[:4]:
            draw.text((cx+dx, cta_y+dy), cta_text, fill=BLACK_SOFT, font=font_cta, anchor="mm")
        draw.text((cx, cta_y), cta_text, fill=YELLOW, font=font_cta, anchor="mm")

    return img_pil

def create_slide_image(text, output_path, fmt, slide_num, titel=""):
    """Fallback: Gradient-Slide ohne Pexels-Bild."""
    from PIL import Image, ImageDraw, ImageFont

    size = (1080, 1920) if fmt == "shorts" else (1920, 1080)
    palettes = [
        [(20, 80, 45),  (40, 160, 80)],
        [(15, 60, 80),  (30, 120, 150)],
        [(60, 40, 15),  (140, 90, 30)],
        [(50, 20, 60),  (110, 50, 130)],
        [(20, 60, 60),  (40, 130, 120)],
    ]
    c1, c2 = palettes[slide_num % len(palettes)]
    img    = Image.new("RGB", size, color=c1)
    draw   = ImageDraw.Draw(img)
    for y in range(size[1]):
        t  = y / size[1]
        rc = int(c1[0] + (c2[0]-c1[0])*t)
        gc = int(c1[1] + (c2[1]-c1[1])*t)
        bc = int(c1[2] + (c2[2]-c1[2])*t)
        draw.line([(0, y), (size[0], y)], fill=(rc, gc, bc))

    img = render_text_on_image(img, text, titel, fmt)
    img.save(output_path, quality=95)

# ─── CROSSFADE VIDEO AUS MEHREREN BILDERN ────────────────────────
def build_segment_with_crossfade(image_paths, audio_path, seg_out, fmt, crossfade=1.5,
                                  subtitle_text="", cta_text="", motivationstext_png=""):
    """Erstellt ein Segment aus mehreren Bildern mit Crossfade + Untertitel + CTA."""
    import wave as wavemod, contextlib

    with contextlib.closing(wavemod.open(audio_path, 'r')) as wf:
        total_duration = wf.getnframes() / float(wf.getframerate())

    n          = len(image_paths)
    img_dur    = total_duration / n
    font_path  = _get_font_path()
    sub_vf     = _build_subtitle_vf(subtitle_text, font_path, cta_text)

    if fmt == "shorts":
        W, H       = 1080, 1920
        scale_crop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
    else:
        W, H       = 1920, 1080
        scale_crop = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1"

    if n == 1:
        if motivationstext_png:
            # Motivationstext-Overlay als filter_complex mit zeitlicher Begrenzung
            fc = (f"[0:v]{scale_crop},format=yuv420p[vid];"
                  f"[1:v]scale={W}:{H}[mot];"
                  f"[vid][mot]overlay=0:0:enable='between(t,0,6)',format=yuv420p[vout]")
            cmd = [FFMPEG, "-y",
                   "-loop", "1", "-t", str(total_duration), "-i", image_paths[0],
                   "-i", motivationstext_png,
                   "-i", audio_path,
                   "-filter_complex", fc,
                   "-map", "[vout]", "-map", "2:a:0",
                   "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
                   "-c:a", "aac", "-b:a", "128k",
                   "-shortest", seg_out]
        else:
            kb_frames  = max(1, int(total_duration * 25))
            bigW, bigH = int(W * 1.25) // 2 * 2, int(H * 1.25) // 2 * 2
            vf = (f"scale={bigW}:{bigH}:force_original_aspect_ratio=increase,"
                  f"crop={bigW}:{bigH},"
                  f"zoompan=z='min(zoom+0.0005,1.16)':d={kb_frames}:"
                  f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                  f"s={W}x{H}:fps=25,format=yuv420p")
            if sub_vf:
                vf += "," + sub_vf
            cmd = [FFMPEG, "-y",
                   "-loop", "1", "-t", str(total_duration), "-i", image_paths[0],
                   "-i", audio_path,
                   "-vf", vf,
                   "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
                   "-c:a", "aac", "-b:a", "128k",
                   "-shortest", seg_out]
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            raise Exception(f"FFmpeg Fehler: {result.stderr.decode(errors='replace')[-800:]}")
        return

    # Mehrere Bilder: zuerst einzelne Clips erstellen, dann mit xfade zusammenfuegen
    clip_paths = []
    for idx, img_path in enumerate(image_paths):
        clip_out = seg_out + f"_clip{idx}.mp4"
        # Letztes Bild etwas laenger fuer Crossfade-Puffer
        dur = img_dur + (crossfade if idx < n-1 else 0)
        # Ken-Burns: sanfter Zoom (abwechselnd rein/raus) gegen statischen Look
        kb_frames = max(1, int(dur * 25))
        bigW, bigH = int(W * 1.25) // 2 * 2, int(H * 1.25) // 2 * 2
        if idx % 2 == 0:   # langsam reinzoomen
            z_expr = "min(zoom+0.0006,1.18)"
        else:              # langsam rauszoomen
            z_expr = "if(eq(on,0),1.18,max(zoom-0.0006,1.0))"
        vf = (f"scale={bigW}:{bigH}:force_original_aspect_ratio=increase,"
              f"crop={bigW}:{bigH},"
              f"zoompan=z='{z_expr}':d={kb_frames}:"
              f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
              f"s={W}x{H}:fps=25,format=yuv420p")
        cmd = [FFMPEG, "-y",
               "-loop", "1", "-t", str(dur), "-i", img_path,
               "-vf", vf,
               "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
               "-pix_fmt", "yuv420p", "-r", "25",
               "-video_track_timescale", "12800",
               "-an", clip_out]
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            raise Exception(f"FFmpeg Clip {idx} Fehler: {result.stderr.decode(errors='replace')[-800:]}")
        clip_paths.append(clip_out)

    # xfade Filter aufbauen
    # [0][1]xfade=...[v01]; [v01][2]xfade=...[v012] ...
    filter_parts = []
    inputs       = []
    for p in clip_paths:
        inputs += ["-i", p]

    prev_label = "0:v"
    offset     = img_dur  # Zeitpunkt des ersten Uebergangs
    for idx in range(1, n):
        out_label = f"v{idx}"
        filter_parts.append(
            f"[{prev_label}][{idx}:v]xfade=transition=fade:duration={crossfade}:offset={offset:.2f}[{out_label}]"
        )
        prev_label = out_label
        offset    += img_dur

    filter_complex = ";".join(filter_parts)
    video_only     = seg_out + "_video.mp4"

    # xfade + optionaler Untertitel in einem Schritt
    vf_out = f"[{prev_label}]"
    if sub_vf:
        filter_complex += f";{vf_out}format=yuv420p,{sub_vf}[vout]"
        map_label = "[vout]"
    else:
        map_label = f"[{prev_label}]"

    # Timed Motivationstext-Overlay (nur erste 4 Sekunden)
    if motivationstext_png:
        mot_idx = len(clip_paths)
        inputs += ["-i", motivationstext_png]
        if map_label != "[vout]":
            filter_complex += f";[{prev_label}]format=yuv420p[base_cf]"
            filter_complex += f";[{mot_idx}:v]scale={W}:{H}[mot_cf]"
            filter_complex += f";[base_cf][mot_cf]overlay=0:0:enable='between(t,0,6)'[vout]"
        else:
            filter_complex = filter_complex.replace("[vout]", "[vout_sub]", 1)
            filter_complex += f";[{mot_idx}:v]scale={W}:{H}[mot_cf]"
            filter_complex += f";[vout_sub][mot_cf]overlay=0:0:enable='between(t,0,6)'[vout]"
        map_label = "[vout]"

    cmd = [FFMPEG, "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", map_label,
        "-c:v", "libx264", "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-r", "25",
        "-video_track_timescale", "12800",
        "-t", str(total_duration),
        video_only
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=600)
    if result.returncode != 0:
        raise Exception(f"FFmpeg xfade Fehler: {result.stderr.decode(errors='replace')[-800:]}")

    # Audio hinzufuegen
    cmd = [FFMPEG, "-y",
           "-i", video_only,
           "-i", audio_path,
           "-c:v", "copy",
           "-c:a", "aac", "-b:a", "128k",
           "-shortest", seg_out]
    result = subprocess.run(cmd, capture_output=True, timeout=300)
    if result.returncode != 0:
        raise Exception(f"FFmpeg Audio-Merge Fehler: {result.stderr.decode(errors='replace')[-800:]}")

    # Temp-Dateien aufraeumen
    for p in clip_paths + [video_only]:
        try:
            os.remove(p)
        except Exception:
            pass

def build_segment_from_video(video_clip, audio_path, seg_out, fmt,
                              display_text, subtitle_text="", cta_text="",
                              show_bars=True):
    """Erstellt Segment aus Pexels-Videoclip mit Titel, Untertitel, CTA.
    Pfad A: FFmpeg drawtext (wenn libfreetype verfuegbar)
    Pfad B: PIL-Overlay PNG (Fallback fuer NAS ohne libfreetype)
    """
    import contextlib, wave as wavemod
    with contextlib.closing(wavemod.open(audio_path, 'r')) as wf:
        duration = wf.getnframes() / float(wf.getframerate())

    font_path = _get_font_path()
    if fmt == "shorts":
        scale_crop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
        ov_w, ov_h = 1080, 1920
    else:
        scale_crop = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1"
        ov_w, ov_h = 1920, 1080

    if font_path:
        # ── Pfad A: FFmpeg drawtext ────────────────────────────────────
        fp        = font_path
        vf_parts  = [scale_crop, "format=yuv420p"]
        vf_parts.append("drawbox=x=0:y=0:w=iw:h=160:color=black@0.50:t=fill")
        title_esc = _ffmpeg_esc(display_text[:50])
        vf_parts.append(
            f"drawtext=text='{title_esc}':fontfile='{fp}':fontsize=48"
            f":fontcolor=white:bordercolor=black:borderw=3"
            f":x=(w-text_w)/2:y=70:line_spacing=10"
        )
        vf_parts.append(
            f"drawtext=text='callidus-am.de':fontfile='{fp}':fontsize=26"
            f":fontcolor=#c8a96e:bordercolor=black:borderw=2"
            f":x=(w-text_w)/2:y=135"
        )
        sub_vf = _build_subtitle_vf(subtitle_text, fp, cta_text)
        if sub_vf:
            vf_parts.append(sub_vf)
        vf  = ",".join(vf_parts)
        cmd = [FFMPEG, "-y",
               "-stream_loop", "-1", "-i", video_clip,
               "-i", audio_path,
               "-map", "0:v:0",
               "-map", "1:a:0",
               "-vf", vf,
               "-fps_mode", "cfr", "-r", "25",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration),
               "-shortest", seg_out]
    else:
        # ── Pfad B: PIL-Overlay PNG (kein libfreetype auf NAS) ─────────
        overlay_png = seg_out + "_ov.png"
        _make_text_overlay_png(display_text, subtitle_text, cta_text, overlay_png,
                               fmt=fmt, show_bars=show_bars)
        fc = (f"[0:v]{scale_crop},format=yuv420p[vid];"
              f"[2:v]scale={ov_w}:{ov_h}[ov];"
              f"[vid][ov]overlay=0:0,format=yuv420p[vout]")
        cmd = [FFMPEG, "-y",
               "-stream_loop", "-1", "-i", video_clip,
               "-i", audio_path,
               "-i", overlay_png,
               "-filter_complex", fc,
               "-map", "[vout]", "-map", "1:a:0",
               "-fps_mode", "cfr", "-r", "25",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration), "-shortest", seg_out]

    result = subprocess.run(cmd, capture_output=True, timeout=600)
    if result.returncode != 0:
        err = result.stderr.decode(errors="replace")
        log.error(f"FFmpeg Video-Segment stderr:\n{err}")
        raise Exception(f"Video-Segment Fehler: {err[-800:]}")

    # Overlay-PNG aufräumen (Pfad B)
    if not font_path:
        try:
            os.remove(seg_out + "_ov.png")
        except Exception:
            pass
    log.info(f"Video-Segment OK: {os.path.basename(seg_out)}")

def _get_video_duration(video_path):
    """Ermittelt Videodauer via ffmpeg -i + stderr Duration-Regex. Gibt float oder None zurueck."""
    try:
        result = subprocess.run([FFMPEG, "-i", video_path], capture_output=True, timeout=10)
        m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr.decode(errors="replace"))
        if m:
            h, mi, s = m.groups()
            return int(h)*3600 + int(mi)*60 + float(s)
    except Exception as e:
        log.warning(f"_get_video_duration Fehler ({os.path.basename(video_path)}): {e}")
    return None

def apply_soft_segment_fade(input_path, output_path, fade_duration=SEGMENT_FADE_DURATION):
    """Macht Szenenwechsel weicher, bevor die fertigen Story-Segmente verbunden werden."""
    duration = _get_video_duration(input_path)
    if not duration or duration <= fade_duration * 2:
        shutil.copy(input_path, output_path)
        return output_path

    fade_out_start = max(0, duration - fade_duration)
    vf = (
        f"fade=t=in:st=0:d={fade_duration},"
        f"fade=t=out:st={fade_out_start:.3f}:d={fade_duration},"
        "format=yuv420p"
    )
    af = (
        f"afade=t=in:st=0:d={fade_duration},"
        f"afade=t=out:st={fade_out_start:.3f}:d={fade_duration}"
    )
    cmd = [
        FFMPEG, "-y", "-i", input_path,
        "-vf", vf, "-af", af,
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=600)
    if result.returncode != 0:
        log.warning(f"Segment-Fade fehlgeschlagen, nutze Original: {result.stderr.decode(errors='replace')[-500:]}")
        shutil.copy(input_path, output_path)
    return output_path

def build_dynamic_segment(video_clips, image_paths, audio_path, seg_out, fmt,
                           display_text, subtitle_text="", cta_text=""):
    """
    Baut ein Segment aus abwechselnden Video-Clips und Bildern.
    - Kein Loop: jeder Clip wird mit zufaelligem Startpunkt abgespielt.
    - Texte auf Videos via PIL-Overlay PNG.
    - Interleaving: [v0, i0, v1, i1, v2, i2, ...]
    """
    import contextlib, wave as wavemod
    with contextlib.closing(wavemod.open(audio_path, 'r')) as wf:
        audio_dur = wf.getnframes() / float(wf.getframerate())

    if fmt == "shorts":
        W, H       = 1080, 1920
        scale_crop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
    else:
        W, H       = 1920, 1080
        scale_crop = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1"

    # Pieces abwechselnd zusammenstellen: [video, bild, video, bild, ...]
    pieces = []
    vi, ii = 0, 0
    while vi < len(video_clips) or ii < len(image_paths):
        if vi < len(video_clips):
            pieces.append(("video", video_clips[vi]))
            vi += 1
        if ii < len(image_paths):
            pieces.append(("image", image_paths[ii]))
            ii += 1
    if not pieces:
        raise Exception("build_dynamic_segment: keine Pieces verfuegbar")

    piece_dur = audio_dur / len(pieces)

    # Basis-Overlay (Titel + Brand, KEIN Motivationstext) fuer alle Video-Pieces
    overlay_png = seg_out + "_ov.png"
    _make_text_overlay_png(display_text, "", cta_text, overlay_png,
                           fmt=fmt, show_bars=OVERLAY_BARS)

    # Separates Motivationstext-Overlay (nur 1. Piece, erste 4 Sekunden)
    mot_png  = seg_out + "_mot.png"
    show_mot = bool(subtitle_text)
    if show_mot:
        _make_motivationstext_overlay_png(subtitle_text, mot_png, fmt, W, H)

    piece_files = []
    for idx, (ptype, ppath) in enumerate(pieces):
        piece_out = seg_out + f"_piece{idx}.mp4"
        try:
            if ptype == "video":
                vid_dur   = _get_video_duration(ppath) or piece_dur
                max_start = max(0.0, vid_dur - piece_dur - 0.5)
                start_t   = random.uniform(0, max_start) if max_start > 0 else 0.0

                if vid_dur < piece_dur:
                    # Clip kuerzer als gewuenscht → tpad (letztes Frame einfrieren)
                    extra = piece_dur - vid_dur + 1.0
                    if idx == 0 and show_mot:
                        fc = (f"[0:v]{scale_crop},"
                              f"tpad=stop_mode=clone:stop_duration={extra:.2f},"
                              f"format=yuv420p[vid];"
                              f"[1:v]scale={W}:{H}[ov];"
                              f"[2:v]scale={W}:{H}[mot];"
                              f"[vid][ov]overlay=0:0[v1];"
                              f"[v1][mot]overlay=0:0:enable='between(t,0,6)',format=yuv420p[vout]")
                        cmd = [FFMPEG, "-y",
                               "-i", ppath, "-i", overlay_png, "-i", mot_png,
                               "-filter_complex", fc,
                               "-map", "[vout]",
                               "-fps_mode", "cfr", "-r", "25",
                               "-c:v", "libx264", "-preset", "ultrafast",
                               "-an", "-t", str(piece_dur), piece_out]
                    else:
                        fc = (f"[0:v]{scale_crop},"
                              f"tpad=stop_mode=clone:stop_duration={extra:.2f},"
                              f"format=yuv420p[vid];"
                              f"[1:v]scale={W}:{H}[ov];"
                              f"[vid][ov]overlay=0:0,format=yuv420p[vout]")
                        cmd = [FFMPEG, "-y",
                               "-i", ppath, "-i", overlay_png,
                               "-filter_complex", fc,
                               "-map", "[vout]",
                               "-fps_mode", "cfr", "-r", "25",
                               "-c:v", "libx264", "-preset", "ultrafast",
                               "-an", "-t", str(piece_dur), piece_out]
                else:
                    # Normaler Clip mit zufaelligem Startpunkt
                    if idx == 0 and show_mot:
                        fc = (f"[0:v]{scale_crop},format=yuv420p[vid];"
                              f"[1:v]scale={W}:{H}[ov];"
                              f"[2:v]scale={W}:{H}[mot];"
                              f"[vid][ov]overlay=0:0[v1];"
                              f"[v1][mot]overlay=0:0:enable='between(t,0,6)',format=yuv420p[vout]")
                        cmd = [FFMPEG, "-y",
                               "-ss", f"{start_t:.2f}", "-t", f"{piece_dur + 0.5:.2f}",
                               "-i", ppath, "-i", overlay_png, "-i", mot_png,
                               "-filter_complex", fc,
                               "-map", "[vout]",
                               "-fps_mode", "cfr", "-r", "25",
                               "-c:v", "libx264", "-preset", "ultrafast",
                               "-an", "-t", str(piece_dur), piece_out]
                    else:
                        fc = (f"[0:v]{scale_crop},format=yuv420p[vid];"
                              f"[1:v]scale={W}:{H}[ov];"
                              f"[vid][ov]overlay=0:0,format=yuv420p[vout]")
                        cmd = [FFMPEG, "-y",
                               "-ss", f"{start_t:.2f}", "-t", f"{piece_dur + 0.5:.2f}",
                               "-i", ppath, "-i", overlay_png,
                               "-filter_complex", fc,
                               "-map", "[vout]",
                               "-fps_mode", "cfr", "-r", "25",
                               "-c:v", "libx264", "-preset", "ultrafast",
                               "-an", "-t", str(piece_dur), piece_out]
            else:
                # Bild-Piece: Titel ist bereits via PIL eingebrannt – kein overlay_png!
                # Nur Motivationstext-Overlay (timed, erstes Piece)
                if idx == 0 and show_mot:
                    fc = (f"[0:v]{scale_crop},format=yuv420p[vid];"
                          f"[1:v]scale={W}:{H}[mot];"
                          f"[vid][mot]overlay=0:0:enable='between(t,0,6)',format=yuv420p[vout]")
                    cmd = [FFMPEG, "-y",
                           "-loop", "1", "-t", f"{piece_dur + 0.5:.2f}",
                           "-i", ppath, "-i", mot_png,
                           "-filter_complex", fc,
                           "-map", "[vout]",
                           "-fps_mode", "cfr", "-r", "25",
                           "-c:v", "libx264", "-preset", "ultrafast",
                           "-an", "-t", str(piece_dur), piece_out]
                else:
                    fc = (f"[0:v]{scale_crop},format=yuv420p[vout]")
                    cmd = [FFMPEG, "-y",
                           "-loop", "1", "-t", f"{piece_dur + 0.5:.2f}",
                           "-i", ppath,
                           "-vf", fc,
                           "-fps_mode", "cfr", "-r", "25",
                           "-c:v", "libx264", "-preset", "ultrafast",
                           "-an", "-t", str(piece_dur), piece_out]

            result = subprocess.run(cmd, capture_output=True, timeout=300)
            if result.returncode != 0:
                err = result.stderr.decode(errors="replace")[-400:]
                log.warning(f"Piece {idx} ({ptype}) fehlgeschlagen: {err}")
                continue
            piece_files.append(piece_out)
            log.info(f"Piece {idx} ({ptype}) OK ({piece_dur:.1f}s)")
        except Exception as e:
            log.warning(f"Piece {idx} ({ptype}) Exception: {e}")

    if not piece_files:
        raise Exception("build_dynamic_segment: alle Pieces fehlgeschlagen")

    # Concat-Demuxer: Pieces zusammenfuehren (Video ohne Audio)
    concat_file = seg_out + "_concat.txt"
    with open(concat_file, "w") as f:
        for pf in piece_files:
            f.write(f"file '{pf}'\n")

    video_only = seg_out + "_vidonly.mp4"
    cmd = [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
           "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
           "-r", "25", "-an", video_only]
    result = subprocess.run(cmd, capture_output=True, timeout=300)
    if result.returncode != 0:
        raise Exception(f"Concat fehlgeschlagen: {result.stderr.decode(errors='replace')[-400:]}")

    # Audio hinzufuegen
    cmd = [FFMPEG, "-y",
           "-i", video_only, "-i", audio_path,
           "-map", "0:v:0", "-map", "1:a:0",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
           "-shortest", seg_out]
    result = subprocess.run(cmd, capture_output=True, timeout=300)
    if result.returncode != 0:
        raise Exception(f"Audio-Mix fehlgeschlagen: {result.stderr.decode(errors='replace')[-400:]}")

    # Temp-Dateien aufraumen
    cleanup = piece_files + [concat_file, video_only, overlay_png]
    if show_mot:
        cleanup.append(mot_png)
    for p in cleanup:
        try:
            os.remove(p)
        except Exception:
            pass

    n_vids = sum(1 for pt, _ in pieces if pt == "video")
    n_imgs = sum(1 for pt, _ in pieces if pt == "image")
    log.info(f"Dynamic Segment OK: {n_vids} Videos + {n_imgs} Bilder, {audio_dur:.1f}s")

# ─── LOGO-OUTRO ───────────────────────────────────────────────────
def create_logo_outro(work_dir, fmt):
    """Erstellt ein Logo-Outro-Segment (4 Sek.) mit Fade-out."""
    from PIL import Image, ImageDraw, ImageFont

    size = (1080, 1920) if fmt == "shorts" else (1920, 1080)
    img  = Image.new("RGB", size, color=(10, 30, 15))
    draw = ImageDraw.Draw(img)
    for y in range(size[1]):
        t  = y / size[1]
        rc = int(10 + (25-10)*t)
        gc = int(30 + (65-30)*t)
        bc = int(15 + (30-15)*t)
        draw.line([(0, y), (size[0], y)], fill=(rc, gc, bc))

    cx = size[0] // 2
    cy = size[1] // 2

    # Callidus Brand Colors (Outro)
    GOLD        = (200, 169, 110)
    LIGHT_GREEN = (160, 210, 160)
    MID_GREEN   = (120, 180, 130)

    # Logo einbetten – vertikal zentriert leicht oberhalb der Mitte
    logo_bottom = cy
    if os.path.exists(LOGO_PATH):
        try:
            logo  = Image.open(LOGO_PATH).convert("RGBA")
            max_w = int(size[0] * 0.30)
            max_h = int(size[1] * 0.20)
            logo.thumbnail((max_w, max_h), Image.LANCZOS)
            lx          = (size[0] - logo.width) // 2
            ly          = cy - logo.height - int(size[1] * 0.05)
            img         = img.convert("RGBA")
            img.paste(logo, (lx, ly), logo)
            img         = img.convert("RGB")
            draw        = ImageDraw.Draw(img)
            logo_bottom = ly + logo.height
        except Exception as e:
            log.warning(f"Logo-Fehler: {e}")

    font_path  = _get_pil_font_path()   # PIL-Font (nicht FFmpeg)
    big_size   = int(size[0] * 0.055)
    small_size = int(size[0] * 0.034)
    try:
        font_big   = ImageFont.truetype(font_path, big_size)   if font_path else ImageFont.load_default()
        font_small = ImageFont.truetype(font_path, small_size) if font_path else ImageFont.load_default()
    except Exception:
        font_big = font_small = ImageFont.load_default()

    # Text direkt unter dem Logo mit sauberem Abstand
    gap = int(size[1] * 0.015)
    y2  = logo_bottom + gap + big_size // 2
    y3  = y2 + small_size + gap

    draw.text((cx, y2), "Ganzheitliche Gesundheit", fill=MID_GREEN,   font=font_small, anchor="mm")
    draw.text((cx, y3), "callidus-am.de",           fill=GOLD,        font=font_small, anchor="mm")
    draw.line([(80, size[1]-60), (size[0]-80, size[1]-60)], fill=GOLD, width=2)

    img_path = f"{work_dir}/outro.jpg"
    img.save(img_path, quality=95)

    # 4 Sekunden Stille
    silence_path   = f"{work_dir}/silence.wav"
    silence_frames = 24000 * 4
    with wave.open(silence_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b'\x00\x00' * silence_frames)

    if fmt == "shorts":
        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p,fade=out:st=2:d=2"
    else:
        vf = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,format=yuv420p,fade=out:st=2:d=2"

    outro_out = f"{work_dir}/seg_outro.mp4"
    cmd = [FFMPEG, "-y",
           "-loop", "1", "-i", img_path,
           "-i", silence_path,
           "-vf", vf,
           "-af", "afade=out:st=2:d=2",
           "-c:v", "libx264", "-preset", "ultrafast",
           "-c:a", "aac", "-b:a", "128k",
           "-t", "4",
           outro_out]
    result = subprocess.run(cmd, capture_output=True, timeout=60)
    if result.returncode != 0:
        log.warning(f"Outro Fehler: {result.stderr.decode()[:200]}")
        return None
    log.info("Logo-Outro erstellt")
    return outro_out

# ─── HINTERGRUNDMUSIK MISCHEN ─────────────────────────────────────
def mix_background_music(video_path, final_out):
    """Mischt zufaellige Hintergrundmusik mit Fade-in/out unter das Video."""
    import glob, re

    # Blocklist: bekannte copyright-problematische Songs (case-insensitive substring match)
    BLOCKED_MUSIC = ["carvine", "piano reflections", "we are era", "leberch"]
    music_files = [f for f in glob.glob(f"{ASSETS_DIR}/*.mp3")
                   if os.path.getsize(f) > 10000
                   and not os.path.basename(f).startswith("_")
                   and not any(b in os.path.basename(f).lower() for b in BLOCKED_MUSIC)]
    if not music_files:
        log.info("Keine Musikdatei gefunden – ohne Musik")
        shutil.copy(video_path, final_out)
        return

    music = random.choice(music_files)
    log.info(f"Musik: {os.path.basename(music)}")

    # Videodauer ermitteln
    result = subprocess.run([FFMPEG, "-i", video_path], capture_output=True)
    m      = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr.decode())
    if not m:
        shutil.copy(video_path, final_out)
        return

    h, mi, s    = m.groups()
    total       = int(h)*3600 + int(mi)*60 + float(s)
    fade_out_st = max(0, total - 3.0)

    music_volume = 0.18 if NARRATION_ENABLED else 0.30
    af  = f"volume={music_volume},afade=t=in:st=0:d=3,afade=t=out:st={fade_out_st:.1f}:d=3"
    cmd = [FFMPEG, "-y",
           "-i", video_path,
           "-stream_loop", "-1", "-i", music,
           "-filter_complex",
           f"[1:a]{af}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=3[aout]",
           "-map", "0:v",
           "-map", "[aout]",
           "-c:v", "copy",
           "-c:a", "aac", "-b:a", "192k",
           "-shortest", final_out]
    result = subprocess.run(cmd, capture_output=True, timeout=900)
    if result.returncode != 0:
        log.warning(f"Musik-Mix Fehler: {result.stderr.decode()[:300]} – ohne Musik")
        shutil.copy(video_path, final_out)
    else:
        log.info("Hintergrundmusik gemischt")

# ─── VIDEO BAUEN ─────────────────────────────────────────────────
def build_video(script, fmt, work_dir):
    slides       = script["slides"]
    orientation  = "portrait" if fmt == "shorts" else "landscape"
    target       = (1080, 1920) if fmt == "shorts" else (1920, 1080)
    total_slides  = len(slides)
    _used_vid_ids = set()  # Deduplizierung: kein Pexels-Video zweimal
    character_bible = script.get("character_bible", "")

    from PIL import Image as PILImage

    ki_video_count = 0  # Budget-Tracker: max KI_VIDEO_MAX WAN-Clips pro Video

    for i, slide in enumerate(slides):
        sprechtext   = slide.get("sprechtext", slide.get("text", ""))
        audio_path   = f"{work_dir}/audio_{i:02d}.wav"
        if NARRATION_ENABLED:
            generate_audio(sprechtext, audio_path)
        else:
            generate_silent_audio(audio_path, STORY_SLIDE_SECONDS)

        # Audiodauer bestimmen fuer dynamische Bildanzahl
        import contextlib as _cl, wave as _wv
        with _cl.closing(_wv.open(audio_path, 'r')) as _wf:
            audio_dur = _wf.getnframes() / float(_wf.getframerate())
        # 1 Bild alle 5 Sek., min 2, max 8
        num_imgs = max(2, min(8, int(audio_dur / 5)))

        display_text    = slide.get("titel", slide.get("text", sprechtext[:40]))
        titel_text      = slide.get("titel", "")
        bildsuche       = slide.get("bildsuche", "health wellness nature")
        video_prompt    = slide.get("video_prompt", "")
        wan_ratio       = "9:16" if fmt == "shorts" else "16:9"
        _day_style      = todays_art_style()
        episode_style_index = _day_style["profile_idx"]   # Wochentags-Stil erzwingen
        cinematic_video_prompt = _day_style["prefix"] + make_cinematic_video_prompt(
            video_prompt, i, total_slides, wan_ratio, episode_style_index, character_bible
        )
        motivationstext = slide.get("motivationstext", "")
        seg_out         = f"{work_dir}/seg_{i:02d}.mp4"

        # CTA auf letztem Content-Slide
        is_last = (i == total_slides - 1)
        cta      = "Jetzt Abonnieren & Liken!" if is_last else ""

        # Motivationstext-PNG fuer Crossfade-Fallback (timed overlay)
        mot_png_cf = ""
        if motivationstext:
            mot_png_cf = f"{work_dir}/mot_{i:02d}.png"
            _make_motivationstext_overlay_png(motivationstext, mot_png_cf, fmt,
                                              target[0], target[1])

        # Hilfsfunktion: Bilder auf Zielformat skalieren + Text einbrennen
        def _render_images(img_list):
            rendered = []
            for j, img_path in enumerate(img_list):
                try:
                    if not os.path.isfile(img_path) or os.path.getsize(img_path) < 1000:
                        log.warning(f"Bild übersprungen (fehlt/leer): {img_path}")
                        continue
                    pil          = PILImage.open(img_path).convert("RGB")
                    src_w, src_h = pil.size
                    tgt_w, tgt_h = target
                    scale        = max(tgt_w / src_w, tgt_h / src_h)
                    new_w        = int(src_w * scale)
                    new_h        = int(src_h * scale)
                    pil          = pil.resize((new_w, new_h), PILImage.LANCZOS)
                    left         = (new_w - tgt_w) // 2
                    top          = (new_h - tgt_h) // 2
                    pil          = pil.crop((left, top, left + tgt_w, top + tgt_h))
                    img_cta      = cta if j == len(img_list) - 1 else ""
                    pil          = render_text_on_image(pil, display_text, titel_text, fmt,
                                                        subtitle_text="",
                                                        cta_text=img_cta,
                                                        show_bars=OVERLAY_BARS)
                    out          = f"{work_dir}/slide_{i:02d}_final{j}.jpg"
                    pil.save(out, quality=95)
                    rendered.append(out)
                except Exception as e:
                    log.warning(f"Bild rendern fehlgeschlagen ({img_path}): {e}")
            return rendered

        # ── 1. Fal.ai WAN KI-Video (Hero-Clip, Budget: KI_VIDEO_MAX) ─
        if video_prompt and should_generate_wan_clip(i, total_slides, ki_video_count):
            wan_out = f"{work_dir}/wan_{i:02d}.mp4"
            # YouTube Long-Form = Landscape 16:9; Shorts = Portrait 9:16
            ki_clip = generate_ai_video_wan(cinematic_video_prompt, wan_out, aspect_ratio=wan_ratio)
            if ki_clip:
                ki_video_count += 1
                log.info(f"Segment {i}: WAN KI-Video ({ki_video_count}/{KI_VIDEO_MAX})")
                try:
                    build_dynamic_segment([ki_clip], [], audio_path, seg_out, fmt,
                                          display_text,
                                          subtitle_text=motivationstext,
                                          cta_text=cta)
                    log.info(f"Segment {i} (WAN KI-Video) OK")
                    continue
                except Exception as e:
                    log.warning(f"Segment {i}: WAN Dynamic fehlgeschlagen ({e})")

        # ── 2. KEINE Pexels-Stockvideos mehr (nur KI im Tagesstil) ─
        video_clips = []

        # ── 3. Fal.ai FLUX KI-Bild (primäre & einzige Bildquelle) ─
        # Tagesstil-Prefix erzwingt nicht-fotorealistischen Look (Squishing-Fix: exakte Zielaufloesung)
        flux_prompt = (_day_style["prefix"]
                       + (cinematic_video_prompt if video_prompt
                          else f"{bildsuche}, health lifestyle story scene"))
        flux_img    = f"{work_dir}/slide_{i:02d}_flux.jpg"
        flux_w, flux_h = target
        flux_result = generate_ai_image_flux(flux_prompt, flux_img, flux_w, flux_h)
        if flux_result:
            log.info(f"Segment {i}: FLUX KI-Bild genutzt ({_day_style['label']})")

        # ── 4. KEINE Pexels-Stockbilder mehr ──────────────────────
        # Bilder-Liste: nur FLUX (KI, exakte Aufloesung = kein Squishing)
        saved_imgs = ([flux_img] if flux_result else [])

        # ── 5. Dynamic Segment (Video/Bild-Mix) ───────────────────
        if video_clips or saved_imgs:
            final_imgs = _render_images(saved_imgs)
            try:
                build_dynamic_segment(video_clips, final_imgs, audio_path, seg_out, fmt,
                                      display_text,
                                      subtitle_text=motivationstext,
                                      cta_text=cta)
                log.info(f"Segment {i} (Dynamic: {len(video_clips)} Videos + "
                         f"{len(final_imgs)} Bilder) OK")
                continue
            except Exception as e:
                log.warning(f"Segment {i}: Dynamic fehlgeschlagen ({e}), Crossfade-Fallback")
                if final_imgs:
                    try:
                        build_segment_with_crossfade(
                            final_imgs, audio_path, seg_out, fmt,
                            crossfade=CROSSFADE_DURATION,
                            subtitle_text="", cta_text=cta,
                            motivationstext_png=mot_png_cf
                        )
                        log.info(f"Segment {i} (Crossfade Fallback, {len(final_imgs)} Bilder) OK")
                        continue
                    except Exception as e2:
                        log.warning(f"Segment {i}: Crossfade auch fehlgeschlagen ({e2})")

        # ── 6. Pollinations.ai als letzter Fallback (im Tagesstil) ─
        ai_prompt = f"{_day_style['prefix']}{character_bible}, {bildsuche}, health story scene, same protagonist"
        ai_w, ai_h = target
        ai_img = f"{work_dir}/slide_{i:02d}_ai.jpg"
        if generate_ai_image(ai_prompt, ai_img, ai_w, ai_h):
            saved_imgs = [ai_img]
            log.info(f"Segment {i}: Pollinations KI-Bild genutzt")

        # ── 7. Gradient-Fallback ──────────────────────────────────
        if not saved_imgs:
            fallback = f"{work_dir}/slide_{i:02d}_img0.jpg"
            create_slide_image(display_text, fallback, fmt, i, titel_text)
            saved_imgs = [fallback]

        final_imgs = _render_images(saved_imgs)
        build_segment_with_crossfade(
            final_imgs, audio_path, seg_out, fmt,
            crossfade=CROSSFADE_DURATION,
            subtitle_text="", cta_text=cta,
            motivationstext_png=mot_png_cf
        )
        log.info(f"Segment {i} (Bild-Fallback) OK ({len(final_imgs)} Bilder)")

    # Logo-Outro
    outro_path = create_logo_outro(work_dir, fmt)

    # Alle Segmente zusammenfuegen
    segment_files = []
    for i in range(len(slides)):
        src = f"{work_dir}/seg_{i:02d}.mp4"
        dst = f"{work_dir}/seg_{i:02d}_soft.mp4"
        segment_files.append(apply_soft_segment_fade(src, dst))
    if outro_path:
        segment_files.append(outro_path)

    concat_file = f"{work_dir}/concat.txt"
    with open(concat_file, "w") as f:
        for p in segment_files:
            f.write(f"file '{p}'\n")

    raw_out  = f"{work_dir}/raw_video.mp4"
    # FIX 1: Neu encodieren statt -c copy (verhindert schwarze Frames)
    # Timeout grosszuegig: ~10-Min-Video neu zu encodieren dauert auf der NAS deutlich >600s
    cmd      = [FFMPEG, "-y", "-f", "concat", "-safe", "0",
                "-i", concat_file,
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k",
                raw_out]
    subprocess.run(cmd, check=True, capture_output=True, timeout=2400)

    # Hintergrundmusik mischen
    final_out = f"{OUTPUT_DIR}/video_v2_{datetime.date.today().isoformat()}_{fmt}.mp4"
    mix_background_music(raw_out, final_out)

    log.info(f"Video fertig: {final_out}")
    return final_out

# ─── FIREBASE / CALLIDUS TV ──────────────────────────────────────
def _firestore_token():
    """Erstellt ein kurzlebiges Bearer-Token via Service Account."""
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GRequest
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/datastore"]
    )
    creds.refresh(GRequest())
    return creds.token


def save_to_callidus_tv(video_id, script):
    """
    Schreibt das neue YouTube-Video in die Firestore-Collection 'videos'
    unter der Kategorie 'Callidus TV'.
    Loescht die aeltesten Eintraege, sobald mehr als CALLIDUS_TV_MAX Videos
    in dieser Kategorie vorhanden sind.
    """
    try:
        token   = _firestore_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        order_val = int(time.time())  # Unix-Timestamp = chronologische Reihenfolge

        # ── 1. Neues Dokument anlegen ─────────────────────────────
        doc = {
            "fields": {
                "videoId":     {"stringValue": video_id},
                "title":       {"mapValue": {"fields": {
                    "de": {"stringValue": script["titel"][:100]},
                    "en": {"stringValue": script["titel"][:100]},
                }}},
                "description": {"mapValue": {"fields": {
                    "de": {"stringValue": script.get("beschreibung", "")[:500]},
                    "en": {"stringValue": script.get("beschreibung", "")[:500]},
                }}},
                "category":    {"mapValue": {"fields": {
                    "de": {"stringValue": "Callidus TV"},
                    "en": {"stringValue": "Callidus TV"},
                }}},
                "order":       {"integerValue": str(order_val)},
                "active":      {"booleanValue": True},
                "isPremium":   {"booleanValue": False},
            }
        }
        r = requests.post(
            f"{FIRESTORE_BASE}/videos",
            json=doc, headers=headers, timeout=15
        )
        if r.status_code not in (200, 201):
            log.error(f"Firestore Fehler beim Anlegen: {r.status_code} {r.text[:300]}")
            return False
        log.info(f"Callidus TV: Video {video_id} angelegt (order={order_val})")

        # ── 2. Alle Callidus-TV-Videos abfragen (aelteste zuerst) ─
        query = {
            "structuredQuery": {
                "from":    [{"collectionId": "videos"}],
                "where":   {
                    "fieldFilter": {
                        "field":  {"fieldPath": "category.de"},
                        "op":     "EQUAL",
                        "value":  {"stringValue": "Callidus TV"},
                    }
                },
                "orderBy": [{"field": {"fieldPath": "order"}, "direction": "ASCENDING"}],
            }
        }
        rq   = requests.post(
            f"{FIRESTORE_BASE}:runQuery",
            json=query, headers=headers, timeout=15
        )
        docs = [d for d in rq.json() if "document" in d]
        log.info(f"Callidus TV: {len(docs)} Videos gesamt (Max: {CALLIDUS_TV_MAX})")

        # ── 3. Aelteste loeschen wenn Limit ueberschritten ────────
        if len(docs) > CALLIDUS_TV_MAX:
            zu_loeschen = docs[:len(docs) - CALLIDUS_TV_MAX]
            for d in zu_loeschen:
                doc_name   = d["document"]["name"]
                deleted_id = doc_name.split("/")[-1]
                rd = requests.delete(
                    f"https://firestore.googleapis.com/v1/{doc_name}",
                    headers=headers, timeout=10
                )
                log.info(f"Callidus TV: Aeltestes Video geloescht: {deleted_id} (HTTP {rd.status_code})")

        return True

    except Exception as e:
        log.error(f"save_to_callidus_tv Fehler: {e}", exc_info=True)
        return False


# ─── YOUTUBE UPLOAD ───────────────────────────────────────────────
def upload_youtube(video_path, script, fmt):
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
    creds  = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    youtube     = build("youtube", "v3", credentials=creds)
    beschreibung = (
        script["beschreibung"]
        + "\n\n---"
        + "\n🌿 callidus A&M – Ganzheitliche Gesundheit"
        + "\n🌐 Website: https://www.callidus-am.de/"
        + "\n📱 NEXUS App: https://www.callidus-am.de/nexus-app/"
        + "\n🧘 Stress Reset Kurs: https://www.callidus-am.de/stress-reset-kurs/"
        + "\n\n👉 Kanal abonnieren fuer taeglich Gesundheitstipps!"
    )
    tags = script.get("tags", []) + ["Gesundheit", "callidus", "Naturheilkunde", "Wohlbefinden"]

    body = {
        "snippet": {
            "title":           script["titel"][:100],
            "description":     beschreibung[:5000],
            "tags":            tags[:30],
            "categoryId":      "26",
            "defaultLanguage": "de",
        },
        "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}
    }
    if fmt == "shorts":
        body["snippet"]["title"] = script["titel"][:100]

    media    = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/mp4")
    request  = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        _, response = request.next_chunk()

    video_id = response["id"]
    url      = f"https://youtu.be/{video_id}"
    log.info(f"YouTube: {url}")
    return url

# ─── INSTAGRAM REEL UPLOAD ───────────────────────────────────────
def get_instagram_account_id():
    """Ermittelt die Instagram Business Account ID automatisch."""
    global INSTAGRAM_ACCOUNT_ID
    if INSTAGRAM_ACCOUNT_ID:
        return INSTAGRAM_ACCOUNT_ID
    r = requests.get(
        "https://graph.facebook.com/v19.0/me/accounts",
        params={"access_token": INSTAGRAM_TOKEN}
    )
    data = r.json()
    log.info(f"FB Pages: {data}")
    # Versuche direkt die IG User ID
    r2 = requests.get(
        "https://graph.facebook.com/v19.0/me",
        params={"fields": "id,name", "access_token": INSTAGRAM_TOKEN}
    )
    me = r2.json()
    INSTAGRAM_ACCOUNT_ID = me.get("id", "")
    log.info(f"Instagram Account ID: {INSTAGRAM_ACCOUNT_ID}")
    return INSTAGRAM_ACCOUNT_ID

def upload_instagram_reel(video_path, script):
    """Laedt ein Video als Instagram Reel hoch (2-Schritt: Container + Publish)."""
    try:
        account_id = get_instagram_account_id()
        if not account_id:
            tg_send("⚠️ Instagram Account ID nicht gefunden!")
            return None

        caption = (
            script["beschreibung"][:2000]
            + "\n\n🌿 callidus A&M – Ganzheitliche Gesundheit"
            + "\n🌐 callidus-am.de"
            + "\n📱 NEXUS App auf Google Play"
            + "\n\n#Gesundheit #Naturheilkunde #Wohlbefinden #callidus #Shorts"
        )

        # Schritt 1: Video zu einem öffentlich erreichbaren Ort hochladen
        # Da das NAS kein public Server ist, nutzen wir den Instagram resumable upload
        tg_send("📤 Instagram: Lade Video hoch...")

        # Container erstellen mit lokalem Upload
        init_url = f"https://graph.facebook.com/v19.0/{account_id}/reels"
        init_r = requests.post(init_url, data={
            "access_token":  INSTAGRAM_TOKEN,
            "caption":       caption,
            "share_to_feed": "true",
            "upload_type":   "resumable",
        })
        init_data = init_r.json()
        log.info(f"Instagram Init: {init_data}")

        if "video_id" not in init_data or "upload_url" not in init_data:
            tg_send(f"❌ Instagram Container-Fehler: {init_data}")
            return None

        video_id  = init_data["video_id"]
        upload_url = init_data["upload_url"]

        # Schritt 2: Video hochladen
        file_size = os.path.getsize(video_path)
        with open(video_path, "rb") as f:
            upload_r = requests.post(
                upload_url,
                headers={
                    "Authorization":    f"OAuth {INSTAGRAM_TOKEN}",
                    "offset":           "0",
                    "file_size":        str(file_size),
                    "Content-Type":     "application/octet-stream",
                },
                data=f,
                timeout=300
            )
        log.info(f"Instagram Upload: {upload_r.status_code} {upload_r.text[:200]}")

        # Schritt 3: Status prüfen & publishen
        tg_send("⏳ Instagram: Verarbeite Video...")
        for _ in range(20):
            time.sleep(10)
            status_r = requests.get(
                f"https://graph.facebook.com/v19.0/{video_id}",
                params={"fields": "status", "access_token": INSTAGRAM_TOKEN}
            )
            status = status_r.json().get("status", {}).get("video_status", "")
            log.info(f"Instagram Status: {status}")
            if status == "FINISHED":
                break
            if status == "ERROR":
                tg_send("❌ Instagram Video-Verarbeitung fehlgeschlagen")
                return None

        # Schritt 4: Publishen
        pub_r = requests.post(
            f"https://graph.facebook.com/v19.0/{account_id}/reels",
            data={
                "access_token": INSTAGRAM_TOKEN,
                "video_id":     video_id,
                "upload_type":  "resumable",
            }
        )
        pub_data = pub_r.json()
        log.info(f"Instagram Publish: {pub_data}")

        reel_id = pub_data.get("id", "")
        if reel_id:
            url = f"https://www.instagram.com/reels/{reel_id}/"
            log.info(f"Instagram Reel live: {url}")
            return url
        else:
            tg_send(f"⚠️ Instagram Publish unbekannt: {pub_data}")
            return None

    except Exception as e:
        log.error(f"Instagram Fehler: {e}", exc_info=True)
        tg_send(f"⚠️ Instagram Fehler: {str(e)[:300]}")
        return None


def run_workflow(force=False):
    # Wochentag-Check (One-Shot Modus: Mo/Mi/Fr/So) – mit 'force' umgehbar fuer Tests
    if not force and datetime.date.today().weekday() not in POSTING_TAGE:
        log.info(f"Kein Posting-Tag heute – beende.")
        tg_send(f"⏭️ Heute kein V2 Post-Tag. Naechster Run: Mo/Mi/Fr/So um 11:00 Uhr.")
        return
    log.info("=" * 50)
    log.info("Workflow gestartet")
    tg_send("🚀 <b>Callidus YT Workflow v2 gestartet</b>\nKI-Videos (WAN) + FLUX Bilder aktiv...")

    day        = datetime.date.today().toordinal()
    kategorie  = CALLIDUS_KATEGORIEN[day % len(CALLIDUS_KATEGORIEN)]
    heute_iso  = datetime.date.today().isoformat()
    art        = todays_art_style()
    thema = (f"Erfinde eine FRISCHE, einzigartige Mini-Geschichte aus der Callidus-Kategorie: "
             f"'{kategorie}'. Waehle eine NEUE Hauptfigur (variiere Alter, Geschlecht, Beruf, "
             f"Lebenssituation deutlich) und einen konkreten, ueberraschenden Aufhaenger zum Thema. "
             f"Datum-Seed {heute_iso} - heute eine voellig andere Figur, Situation und Stimmung als sonst. "
             f"Die Story darf inspirierend, aufklaerend, warmherzig oder humorvoll sein - passend zum Thema, "
             f"NICHT immer traurig.")
    log.info(f"Kategorie: {kategorie} | Stil: {art['label']}")
    tg_send(f"📋 <b>Kategorie:</b> {kategorie}\n🎨 <b>Stil heute:</b> {art['label']}\n🎬 <b>Format:</b> YouTube Video (~10 Min)")

    work_dir = tempfile.mkdtemp(dir=BASE_DIR)
    try:
        tg_send("✍️ Generiere Script...")
        script = generate_script(thema)
        tg_send(f"📝 <b>Titel:</b> {script['titel']}\n\n⏳ Erstelle Video (ca. 5-10 Min)...")

        video_path = build_video(script, "long", work_dir)
        tg_send("🎬 Video erstellt! Sende Vorschau...")

        tg_send_approval(video_path, script["titel"])
        approved = tg_wait_for_approval(timeout=3600)

        if approved:
            tg_send("📺 Lade auf YouTube hoch...")
            yt_url      = upload_youtube(video_path, script, "long")
            yt_video_id = yt_url.split("/")[-1]
            tg_send(f"✅ <b>YouTube live:</b> {yt_url}\n📌 {script['titel']}")

            # ── Callidus TV: In Nexus App speichern ───────────────
            tg_send("📱 Speichere in Callidus TV (Nexus App)...")
            fb_ok = save_to_callidus_tv(yt_video_id, script)
            if fb_ok:
                tg_send("✅ <b>Callidus TV:</b> Video erscheint jetzt in der Nexus App")
            else:
                tg_send("⚠️ <b>Callidus TV:</b> Firebase-Eintrag fehlgeschlagen\n(YouTube ist trotzdem live)")

            log.info("Workflow erfolgreich abgeschlossen")
        else:
            log.info("Video abgelehnt")

    except Exception as e:
        log.error(f"Fehler: {e}", exc_info=True)
        tg_send(f"❌ <b>Fehler:</b>\n{str(e)[:500]}")
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

# ─── BOT-MODUS ───────────────────────────────────────────────────
def bot_mode():
    log.info("Bot-Modus gestartet")
    tg_send(
        "🤖 <b>Callidus Bot gestartet!</b>\n\n"
        f"📅 Automatisch taeglich um <b>{DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr</b>\n\n"
        "Befehle:\n"
        "/jetzt – Video sofort erstellen\n"
        "/status – Bot-Status anzeigen\n"
        "/hilfe – Hilfe anzeigen"
    )

    url_base         = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"
    last_update      = tg_get_last_update_id()
    last_daily_run   = None
    workflow_running = False

    while True:
        try:
            r = requests.get(
                f"{url_base}/getUpdates",
                params={"offset": last_update + 1, "timeout": 10},
                timeout=25
            )
            r.raise_for_status()
            updates = r.json().get("result", [])

            for update in updates:
                last_update = update["update_id"]
                if "message" not in update:
                    continue
                msg     = update["message"]
                text    = msg.get("text", "").strip().lower()
                chat_id = str(msg["chat"]["id"])
                if chat_id != TELEGRAM_CHAT:
                    continue

                log.info(f"Telegram Befehl empfangen: '{text}' von {chat_id}")

                if text in ("/jetzt", "jetzt"):
                    if workflow_running:
                        tg_send("⚠️ Ein Workflow laeuft bereits! Bitte warten.")
                    else:
                        tg_send("▶️ <b>Manueller Start!</b> Workflow wird gestartet...")
                        workflow_running = True
                        try:
                            run_workflow()
                        finally:
                            workflow_running = False
                            last_update = tg_get_last_update_id()

                elif text in ("/status", "status"):
                    now      = datetime.datetime.now()
                    next_run = now.replace(hour=DAILY_HOUR, minute=DAILY_MINUTE, second=0, microsecond=0)
                    if next_run <= now:
                        next_run += datetime.timedelta(days=1)
                    tg_send(
                        f"✅ <b>Bot aktiv</b>\n"
                        f"🕐 Zeit: {now.strftime('%d.%m.%Y %H:%M')}\n"
                        f"📅 Naechster Auto-Run: {next_run.strftime('%d.%m. um %H:%M Uhr')}\n"
                        f"🔄 Workflow laeuft: {'Ja ⏳' if workflow_running else 'Nein'}"
                    )

                elif text in ("/hilfe", "/help", "/start", "hilfe", "help"):
                    tg_send(
                        "📖 <b>Callidus Bot – Befehle</b>\n\n"
                        "/jetzt – Video sofort erstellen\n"
                        "/status – Bot-Status anzeigen\n"
                        "/hilfe – Diese Hilfe\n\n"
                        f"⏰ Auto-Run taeglich um {DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr\n"
                        f"📺 Format: Shorts → YouTube + Instagram Reel"
                    )

            # Taegliche automatische Ausfuehrung
            now   = datetime.datetime.now()
            today = now.date()
            if (now.hour   == DAILY_HOUR
                    and now.minute == DAILY_MINUTE
                    and now.weekday() in POSTING_TAGE
                    and last_daily_run != today
                    and not workflow_running):
                last_daily_run   = today
                workflow_running = True
                log.info("Taeglicher automatischer Workflow")
                tg_send(f"⏰ <b>Taeglicher Start</b> ({DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr)")
                try:
                    run_workflow()
                finally:
                    workflow_running = False
                    last_update = tg_get_last_update_id()

        except requests.exceptions.Timeout:
            log.warning("Telegram Timeout – weiter...")
        except requests.exceptions.ConnectionError as e:
            log.warning(f"Verbindungsfehler: {e} – warte 30s...")
            time.sleep(30)
        except Exception as e:
            log.error(f"Bot-Schleifenfehler: {e}", exc_info=True)
            time.sleep(10)

        time.sleep(2)

# ─── EINSTIEGSPUNKT ──────────────────────────────────────────────
def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--bot":
        # Auto-Restart falls Bot abstuerzt
        while True:
            try:
                bot_mode()
            except Exception as e:
                log.error(f"Bot abgestuerzt: {e} – Neustart in 30s...")
                tg_send(f"🔄 Bot neu gestartet nach Fehler: {str(e)[:200]}")
                time.sleep(30)
    else:
        _force = len(sys.argv) > 1 and sys.argv[1] in ("force", "test", "--force", "--test")
        run_workflow(force=_force)

if __name__ == "__main__":
    main()
