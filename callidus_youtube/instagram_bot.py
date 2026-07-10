#!/usr/bin/env python3
"""
Callidus A&M – Instagram Reels Automation mit Telegram-Freigabe
Täglich auf Synology DS218 via Task Scheduler

Modi:
  python instagram_bot.py         – Einmalig ausführen
  python instagram_bot.py --bot   – Dauerhafter Bot-Modus
"""

import os, json, random, datetime, subprocess, sys, logging, time, tempfile, shutil, wave, base64, requests, re

def _strip_emojis(text):
    """Entfernt Emojis und Sonderzeichen die TTS/PIL nicht verarbeiten kann."""
    emoji_pattern = re.compile(
        "[\U00010000-\U0010ffff"
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub("", text).strip()

# ─── KONFIGURATION ────────────────────────────────────────────────
# CALLIDUS_INSTAGRAM_VERSION_MARKER=GROWTH_CTA_KARAOKE_OFF_2026_06_11
BASE_DIR         = "/volume1/homes/arnold.jedich/callidus_youtube"
GEMINI_API_KEY   = "AIzaSyC95C8aG9m8XHgngbC3GVCOJYuf8Ab1j9A"
GEMINI_API_KEY_2 = "AIzaSyDSANrwcrumxJlcCHxB0tbrKiKbHxMWbdg"
# Automatische Key-Rotation: erschoepft Key 1 (429), wird Key 2 genutzt
GEMINI_KEYS = [k for k in (GEMINI_API_KEY, GEMINI_API_KEY_2) if k]
TELEGRAM_TOKEN   = "8647940478:AAEqm1FccdLe0f2udC49GrBlKPAjVCf3SiY"
TELEGRAM_CHAT    = "5016384420"
OUTPUT_DIR       = f"{BASE_DIR}/output_instagram"
LOGS_DIR         = f"{BASE_DIR}/logs"
FFMPEG           = "/volume1/@appstore/ffmpeg7/bin/ffmpeg"
PEXELS_KEY       = "VlTNWpsRexidsjEpCnhUU4myHPnD74zeJLepNM2NWkgWc5ogrLjEnZ87"
LOGO_PATH        = f"{BASE_DIR}/assets/app_logo.png"
ASSETS_DIR       = f"{BASE_DIR}/assets"

# Instagram
INSTAGRAM_APP_ID     = "4355065591477669"
INSTAGRAM_APP_SECRET = "003054f4614467bc4567edcd8e3ac5d2"
INSTAGRAM_ACCOUNT_ID = "17841451302683238"
INSTAGRAM_TOKEN_FILE = f"{BASE_DIR}/instagram_token.json"

# Long-Lived Token (60 Tage gültig, wird automatisch erneuert)
INSTAGRAM_LONG_TOKEN = "EAA946LmNtaUBQ2vLIDrRbqR1d5bXVX4qlocQlyjV1Rx8ioitbVcoLKPpZAB0cY3yO2ZADVpNKZAZCBSGUDhJZB1BrNmx2OZCMxXLJFimBE6ZAPBzJQ8xe5K8d6awA729ZCnyDFeRnVhJFYlxYTHkW0YSZBlyVu4IbAoFbWS2p4RgRNphcjTeeTZA9Rhk052pZC6UUF0KaqAfVjRQPFbhFeO"

CROSSFADE_DURATION = 1.5
IMAGES_PER_SLIDE   = 3
AI_IMAGES_FIRST    = True   # KI-Bilder (Pollinations) als Primaerquelle, Pexels nur Fallback
KEN_BURNS          = True   # Langsamer Zoom/Schwenk auf KI-Bildern (Video-Variante, kostenlos)
USE_FAL_AI_VIDEO   = False  # Echte KI-Videos via Fal.ai (KOSTENPFLICHTIG) – standardmaessig AUS

# Automatische Ausführung – Shorts Mo/Mi/Fr um 18:00 Uhr
DAILY_HOUR   = 18
DAILY_MINUTE = 0
POSTING_TAGE = {0, 2, 4}  # Montag=0, Mittwoch=2, Freitag=4

# Overlay-Balken pro Modus
OVERLAY_BARS_IMAGES = False  # Text direkt aufs Bild (moderner Look)
OVERLAY_BARS_VIDEOS = False  # kein Balken – nur Titel/Branding/CTA, keine Karaoke-Untertitel

# Fal.ai KI-Video (Image-to-Video) – nur genutzt wenn USE_FAL_AI_VIDEO=True
FAL_API_KEY = ""  # Fal.ai bleibt AUS: keine kostenpflichtige Video-Generierung im V1-Bot

# ─── KI-BILD KUNSTSTILE (rotierend pro Woche) ─────────────────────
ART_STYLES = [
    {"label": "Anime",         "prefix": ("modern Japanese anime style, clean cel shading, expressive characters, "
                                          "cinematic anime lighting, NOT photorealistic, no real photo, ")},
    {"label": "Ghibli",        "prefix": ("Studio Ghibli style hand-painted film still, soft watercolor backgrounds, "
                                          "warm light, expressive friendly characters, NOT photorealistic, no real photo, ")},
    {"label": "Comic",         "prefix": ("western comic book art, bold black ink outlines, halftone shading, "
                                          "dynamic composition, flat saturated colors, NOT photorealistic, no real photo, ")},
    {"label": "3D Cartoon",    "prefix": ("stylized 3D animated cartoon movie still, Pixar-like rendering, "
                                          "charming characters, vibrant playful colors, NOT photorealistic, no real photo, ")},
    {"label": "Flat Editorial","prefix": ("modern flat vector editorial illustration, bold geometric shapes, "
                                          "limited harmonious palette, clean composition, NOT photorealistic, no real photo, ")},
]

def todays_art_style():
    week = datetime.date.today().isocalendar()[1]
    return ART_STYLES[week % len(ART_STYLES)]

# ─── SATIRE-THEMEN (Momus-Stil, identisch zum Langvideo main.py) ──
# Moderne (Un-)Gewohnheiten / Mythen, die erst ironisch gefeiert und
# danach wissenschaftlich aufgeklaert werden. Rotiert pro Tag.
SATIRE_THEMEN = [
    "Dauerstress als Statussymbol – Warum Erschoepfung angeblich Erfolg beweist",
    "Schlaf ist fuer Schwaeche – Das Maerchen vom produktiven Wenigschlaefer",
    "Multitasking – Die hohe Kunst, alles gleichzeitig schlecht zu machen",
    "Zucker als Treibstoff – Warum die Achterbahn im Blut so 'effizient' ist",
    "Doomscrolling am Abend – Blaues Licht als gemuetliches Betthupferl",
    "Sitzen ist das neue Stehen – Der bequeme Weg in die Steifheit",
    "Koffein statt Pause – Wie man den Akku 'auflaedt', indem man ihn leert",
    "Soziale Isolation 2.0 – Warum echte Menschen nur im Weg stehen",
    "Crash-Diaeten – Der schnellste Weg, dem Koerper Misstrauen beizubringen",
    "Dehydration light – Kaffee zaehlt doch auch als Wasser, oder?",
    "Atemlos durch den Tag – Warum flaches Atmen so schoen effizient ist",
    "Dauer-Optimierung – Selbstoptimierung bis zum Zusammenbruch",
    "Snacken statt essen – Die Kunst, nie wirklich satt zu sein",
    "Vergleich auf Social Media – Das Hobby, sich systematisch kleinzumachen",
    "Spaetes Essen – Warum die Mitternachts-Pizza angeblich harmlos ist",
    "Always-on – Erreichbarkeit rund um die Uhr als Tugend verkauft",
    "Magnesiummangel ignorieren – Zucken, Kraempfe und andere 'Macken'",
    "Sonnenangst – Warum wir das Vitamin-D-Sonnenlicht lieber meiden",
    "Perfektionismus – Der elegante Weg, niemals fertig zu werden",
    "Alkohol zum Entspannen – Der 'Schlaftrunk', der den Schlaf zerstoert",
    "Kalte Duschen vermeiden – Komfort als hoechstes Lebensziel",
    "Gruebeln im Bett – Das Gehirn als nachtaktiver Problemverwalter",
    "Fast Food als Belohnung – Wie man sich fuer Stress mit Stress belohnt",
    "Bewegungsmangel – Warum der Koerper das Rosten angeblich gar nicht merkt",
    "Dauerablenkung – Konzentration ist sowieso ueberbewertet",
    "Einsamkeit als Freiheit – Warum das 'Wir' angeblich nur stoert",
    "Verdraengte Gefuehle – Emotionen wegdruecken als Effizienz-Hack",
    "Energy-Drinks – Fluessige Motivation mit Ablaufdatum",
]

def todays_satire_thema():
    """Waehlt das Satire-Thema des Tages (rotiert per Datum)."""
    return SATIRE_THEMEN[datetime.date.today().toordinal() % len(SATIRE_THEMEN)]


# ─── WÖCHENTLICHES THEMEN-SYSTEM ──────────────────────────────────
# Jede Woche eine Kategorie, jeden Tag ein neuer Aspekt
WOCHEN_THEMEN = [
    {
        "kategorie": "Wasser & Hydration",
        "intro": "Diese Woche: Alles über Wasser – das unterschätzte Lebenselixier!",
        "tage": [
            "Wasser – Wie viel brauchst du wirklich täglich?",
            "Wasser – Mythen die du über Trinken glaubst",
            "Wasser – Morgens nüchtern: Was passiert in deinem Körper?",
            "Wasser – Leitungswasser vs. Mineralwasser: Was ist besser?",
            "Wasser – Dehydrierung: Diese Symptome kennst du nicht",
            "Wasser – Mit diesen Tricks trinkst du mehr ohne es zu merken",
            "Wasser – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Schlaf & Regeneration",
        "intro": "Diese Woche: Schlaf – die unterschätzte Superpower deines Körpers!",
        "tage": [
            "Schlaf – Was passiert wirklich während du schläfst?",
            "Schlaf – Diese Mythen kosten dich deine Erholung",
            "Schlaf – Die perfekte Schlafdauer: Was sagt die Wissenschaft?",
            "Schlaf – Warum du vor Mitternacht schlafen solltest",
            "Schlaf – Tipps für besseren Schlaf sofort umsetzbar",
            "Schlaf – Wie Ernährung deinen Schlaf beeinflusst",
            "Schlaf – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Darmgesundheit",
        "intro": "Diese Woche: Dein Darm – das unterschätzte zweite Gehirn!",
        "tage": [
            "Darm – Warum dein Darm dein zweites Gehirn ist",
            "Darm – Diese Lebensmittel zerstören deine Darmflora",
            "Darm – Probiotika: Was wirklich hilft und was nicht",
            "Darm – Wie der Darm deine Stimmung steuert",
            "Darm – Blähungen & Co: Ursachen die du nicht kennst",
            "Darm – Die besten Lebensmittel für eine gesunde Darmflora",
            "Darm – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Stressabbau & Achtsamkeit",
        "intro": "Diese Woche: Stress – was er wirklich mit dir macht und wie du ihn besiegst!",
        "tage": [
            "Stress – Was chronischer Stress mit deinem Körper macht",
            "Stress – Cortisol: Das Hormon das dich krank macht",
            "Stress – Atemübungen die sofort wirken",
            "Stress – Warum Meditation keine Esoterik ist",
            "Stress – Diese alltäglichen Dinge erhöhen deinen Stress",
            "Stress – Naturheilkunde gegen Stress: Was wirklich hilft",
            "Stress – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Ernährung & Mikronährstoffe",
        "intro": "Diese Woche: Ernährung – die Wahrheit über das was du isst!",
        "tage": [
            "Ernährung – Mikronährstoffe: Was die meisten Menschen fehlt",
            "Ernährung – Vitamin D: Die stille Epidemie",
            "Ernährung – Zucker: Was er wirklich in deinem Körper anrichtet",
            "Ernährung – Superfoods: Hype oder Wahrheit?",
            "Ernährung – Intervallfasten: Was sagt die Wissenschaft?",
            "Ernährung – Diese 5 Lebensmittel solltest du täglich essen",
            "Ernährung – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Bewegung & Sport",
        "intro": "Diese Woche: Bewegung – warum weniger oft mehr ist!",
        "tage": [
            "Bewegung – Warum Sitzen das neue Rauchen ist",
            "Bewegung – Wie viel Sport ist wirklich gesund?",
            "Bewegung – NEAT: Die unterschätzte Kalorienfalle",
            "Bewegung – Kraft oder Ausdauer: Was ist besser für die Gesundheit?",
            "Bewegung – Bewegung und Gehirn: Der unterschätzte Zusammenhang",
            "Bewegung – Einfache Übungen für jeden Tag ohne Gym",
            "Bewegung – Fazit & Aha-Momente der Woche",
        ]
    },
    {
        "kategorie": "Mentale Stärke & Resilienz",
        "intro": "Diese Woche: Mentale Stärke – wie du unzerbrechlich wirst!",
        "tage": [
            "Resilienz – Was mentale Stärke wirklich bedeutet",
            "Resilienz – Growth Mindset: Die Wissenschaft dahinter",
            "Resilienz – Warum Scheitern dich stärker macht",
            "Resilienz – Diese Gewohnheiten machen dich mental stärker",
            "Resilienz – Wie du negative Gedanken stoppst",
            "Resilienz – Dankbarkeit: Die einfachste Superpower",
            "Resilienz – Fazit & Aha-Momente der Woche",
        ]
    },
]

def get_wochen_thema():
    """Gibt Kategorie und Tages-Thema basierend auf aktuellem Datum zurück."""
    heute     = datetime.date.today()
    # Welche Woche im Jahr (mit Offset +2 damit anders als YT Bot)
    woche_nr  = (heute.toordinal() + 2) // 7
    wochen_idx = woche_nr % len(WOCHEN_THEMEN)
    woche      = WOCHEN_THEMEN[wochen_idx]
    # Welcher Wochentag (0=Mo, 6=So)
    wochentag  = heute.weekday()
    tag_idx    = min(wochentag, len(woche["tage"]) - 1)
    return woche["kategorie"], woche["tage"][tag_idx], woche["intro"]



# ─── LOGGING ──────────────────────────────────────────────────────
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
logging.basicConfig(
    filename=f"{LOGS_DIR}/instagram_workflow.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ─── TOKEN VERWALTUNG ─────────────────────────────────────────────
def get_instagram_token():
    """Gibt gueltigen Token zurueck, erneuert automatisch wenn noetig."""
    # Gespeicherten Token prüfen
    if os.path.exists(INSTAGRAM_TOKEN_FILE):
        with open(INSTAGRAM_TOKEN_FILE) as f:
            data = json.load(f)
        token   = data.get("token", "")
        expires = data.get("expires", 0)

        # Token bereits abgelaufen → direkt neuen INSTAGRAM_LONG_TOKEN nutzen
        if expires < time.time():
            log.warning("Gespeicherter Token bereits abgelaufen – nutze neuen Token aus Konfiguration")
            tg_send("⚠️ Alter Instagram Token abgelaufen – lade neuen Token...")
            _save_token(INSTAGRAM_LONG_TOKEN, 5183420)
            return INSTAGRAM_LONG_TOKEN

        # Noch mehr als 7 Tage gültig?
        if expires > time.time() + (7 * 24 * 3600):
            log.info(f"Token gueltig noch {int((expires - time.time()) / 86400)} Tage")
            return token

        # Ablauf naht (< 7 Tage) – erneuern
        log.info("Token laeuft bald ab – erneuere...")
        tg_send("🔄 Instagram Token wird erneuert...")
        renewed = _exchange_token(token)
        if renewed:
            tg_send("✅ Instagram Token erneuert!")
            return renewed

    # Long-Lived Token speichern (erste Ausführung oder nach Reset)
    log.info("Speichere Long-Lived Token...")
    _save_token(INSTAGRAM_LONG_TOKEN, 5183420)
    return INSTAGRAM_LONG_TOKEN

def _save_token(token, expires_in):
    """Speichert Token mit Ablaufdatum."""
    with open(INSTAGRAM_TOKEN_FILE, "w") as f:
        json.dump({
            "token":   token,
            "expires": time.time() + expires_in,
            "created": datetime.datetime.now().isoformat()
        }, f)
    log.info(f"Token gespeichert, gueltig ca. {expires_in//86400} Tage")

def _exchange_token(token):
    """Erneuert Long-Lived Token (innerhalb 60 Tage moeglich)."""
    try:
        r = requests.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type":        "fb_exchange_token",
                "client_id":         INSTAGRAM_APP_ID,
                "client_secret":     INSTAGRAM_APP_SECRET,
                "fb_exchange_token": token,
            },
            timeout=30
        )
        data = r.json()
        if "access_token" in data:
            new_token  = data["access_token"]
            expires_in = data.get("expires_in", 5184000)
            _save_token(new_token, expires_in)
            return new_token
        else:
            log.warning(f"Token-Exchange fehlgeschlagen: {data}")
            tg_send(f"⚠️ Token-Erneuerung fehlgeschlagen!\nBitte neuen Token generieren.\n{data}")
            return token
    except Exception as e:
        log.error(f"Token-Exchange Fehler: {e}")
        return token




def tg_send(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": TELEGRAM_CHAT, "text": text, "parse_mode": "HTML"})

def tg_send_approval(video_path, titel):
    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Freigeben & Posten",  "callback_data": "approve"},
            {"text": "❌ Ablehnen & Neu",      "callback_data": "reject"}
        ]]
    }
    # Dateigroesse pruefen (Telegram-Limit: 50 MB)
    try:
        size_mb = os.path.getsize(video_path) / (1024 * 1024)
        log.info(f"Reel-Dateigröße: {size_mb:.1f} MB")
    except Exception:
        size_mb = 0

    # Video senden falls <= 48 MB
    if size_mb <= 48:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
            with open(video_path, "rb") as f:
                r = requests.post(url, data={
                    "chat_id":      TELEGRAM_CHAT,
                    "caption":      f"📸 <b>Instagram Reel Vorschau!</b>\n\n📌 <b>{titel}</b>\n\nFreigeben?",
                    "parse_mode":   "HTML",
                    "reply_markup": json.dumps(keyboard)
                }, files={"video": f}, timeout=180)
            resp = r.json()
            if resp.get("ok"):
                log.info("Telegram: Reel-Vorschau mit Buttons gesendet")
                return resp.get("result", {}).get("message_id")
            else:
                log.warning(f"Telegram sendVideo fehlgeschlagen: {resp}")
        except Exception as e:
            log.warning(f"Telegram sendVideo Exception: {e}")

    # Fallback: Text-Nachricht mit Buttons
    log.warning(f"Video zu groß ({size_mb:.1f} MB) oder Upload fehlgeschlagen – sende nur Buttons")
    url2 = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    r2 = requests.post(url2, json={
        "chat_id":      TELEGRAM_CHAT,
        "text":         f"📸 <b>Reel bereit!</b> ({size_mb:.1f} MB – zu groß für Vorschau)\n\n📌 <b>{titel}</b>\n\nFreigeben?",
        "parse_mode":   "HTML",
        "reply_markup": keyboard
    }, timeout=30)
    return r2.json().get("result", {}).get("message_id")

def tg_get_last_update_id():
    """Liefert die NEUESTE Update-ID (offset=-1 = letztes Update). limit=1 wuerde
    faelschlich das aelteste pending Update liefern → Befehle/Klicks gingen verloren."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    try:
        r = requests.get(url, params={"offset": -1, "timeout": 0}, timeout=15)
        updates = r.json().get("result", [])
        return updates[-1]["update_id"] if updates else 0
    except Exception as e:
        log.warning(f"tg_get_last_update_id Fehler: {e}")
        return 0

def acquire_singleton_lock(name):
    """Stellt sicher, dass nur EINE Instanz dieses Bots laeuft. Mehrere Instanzen
    wuerden sich am selben Telegram-Token die Updates 'stehlen' (409-Conflict) –
    dann gehen Buttons und /jetzt-Befehle verloren. flock wird beim Prozessende
    automatisch freigegeben (auch bei Absturz)."""
    try:
        import fcntl
        lock_path = f"{BASE_DIR}/.{name}.lock"
        fh = open(lock_path, "w")
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fh.write(str(os.getpid())); fh.flush()
        log.info(f"Singleton-Lock erworben: {lock_path}")
        return fh  # offen halten = Lock halten
    except Exception as e:
        log.error(f"Andere Instanz laeuft bereits ({e}) – beende diese Instanz.")
        sys.exit(0)

def tg_wait_for_approval(timeout=3600):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    last_update = tg_get_last_update_id()
    tg_send("⏳ Warte auf Freigabe... (Timeout: 1 Stunde)")
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
                    tg_send("✅ <b>Freigegeben!</b> Reel wird hochgeladen...")
                    return True
                elif data == "reject":
                    tg_send("❌ <b>Abgelehnt.</b> Morgen neues Reel.")
                    return False
        time.sleep(5)
    tg_send("⏰ <b>Timeout!</b> Reel wird NICHT gepostet.")
    return False

# ─── GEMINI: SCRIPT ───────────────────────────────────────────────
def generate_script(thema, kategorie="", intro=""):
    wochen_kontext = ""
    if kategorie:
        wochen_kontext = f"""
WOCHENSERIE: Diese Woche behandeln wir das Thema "{kategorie}".
Heutiger Aspekt: "{thema}"
Erwähne am Anfang kurz dass dies Teil der Wochenserie ist (z.B. "Diese Woche: {kategorie}!")
"""

    heute_iso = datetime.date.today().isoformat()
    prompt = f"""Du bist Chef-Autor des Satire-Magazins "Momus" von callidus A&M (ganzheitliche Gesundheit).
Erstelle ein Instagram-Reels-Script (Short, bis 60 Sek) zum Thema: "{thema}"
{wochen_kontext}
DER MOMUS-STIL = SATIRE + ANSCHLIESSENDE AUFKLAERUNG (komprimiert auf Short-Laenge):

TEIL 1 – SATIRE (Slides 1-3): Beissende, ironische Lobrede auf das FALSCHE Verhalten.
- Haltung: ein zynischer "Effizienz-Coach", der die schlechte Gewohnheit als geniales Upgrade verkauft.
- Anrede in TEIL 1: distanziertes "Sie". Trockener Humor, Uebertreibung, scheinheilige Ratschlaege.
- Lobe genau das, was schadet. Intelligent und augenzwinkernd, nie platt oder beleidigend.

TEIL 2 – AUFKLAERUNG (Slides 4-6): Harter Schnitt zur Wahrheit.
- Wechsel auf warmes, direktes "du". Ein echter Fakt mit Zahl/Mechanismus + positive Motivation.

WICHTIG – ABWECHSLUNG (Seed {heute_iso}):
- Variiere Einstieg und Stimmung STARK von Short zu Short – NICHT immer derselbe Ton (nicht immer "traurig/muede"). Mal frech, mal absurd, mal als fingierte Werbung, mal als Mini-Szene.

FORMALE VORGABEN:
- GENAU 7 Slides, Sprechtext max 18 Woerter pro Slide.
- "text" = kurzer Bildschirm-Titel (max 4-5 Woerter).
- bildsuche = englischer Bildprompt, der zur Szene passt (Figur/Handlung).

SLIDE-DRAMATURGIE:
- Slide 1 (SATIRE-HOOK): ironische, provokante Eroeffnung, die das schlechte Verhalten feiert.
- Slide 2 (SATIRE): warum es angeblich so klug/modern/effizient ist.
- Slide 3 (SATIRE-SPITZE): absurde "Vorteile" zuspitzen.
- Slide 4 (DER BRUCH): ehrliche Frage, die das Lachen ins Nachdenken kippt.
- Slide 5 (AUFKLAERUNG): was WIRKLICH im Koerper passiert – ein Fakt mit Zahl.
- Slide 6 (GUTE NACHRICHT + LOOP): positive Wahrheit + Motivation, schliesst an Slide 1 an.
- Slide 7 (CTA): KLARER sichtbarer Produkt-CTA. Wähle EINEN passenden Pfad und nenne ihn ausdrücklich: "NEXUS App", "Stress Reset Kurs" oder "Callidus Empfehlungen". Der Zuschauer soll den Unterschied sofort sehen. Keine Heilversprechen, keine aggressive Werbung.

JSON Format:
{{
  "titel": "Kurzer, leicht ironischer Titel mit 1 Emoji",
  "beschreibung": "Kurze Instagram Caption (Satire-Teaser) mit Hashtags",
  "tags": ["tag1","tag2","tag3","tag4","tag5"],
  "slides": [
    {{"text": "Satire-Hook", "sprechtext": "SATIRE (Sie-Ton): ironische Eroeffnung, schlechtes Verhalten feiern - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "So clever", "sprechtext": "SATIRE: warum es angeblich klug ist - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "Premium", "sprechtext": "SATIRE-SPITZE: absurde Vorteile zuspitzen - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "Aber...", "sprechtext": "BRUCH: ehrliche Frage, Lachen kippt in Nachdenken - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "Die Wahrheit", "sprechtext": "AUFKLAERUNG (du-Ton): was wirklich passiert, ein Fakt mit Zahl - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "Gute Nachricht", "sprechtext": "GUTE NACHRICHT + LOOP: positive Wahrheit + Motivation, schliesst an Slide 1 an - max 18 Woerter", "bildsuche": "English search term"}},
    {{"text": "NEXUS TESTEN", "sprechtext": "Willst du daraus einen Plan machen? Öffne NEXUS oder den Stress Reset auf callidus-am.de.", "bildsuche": "health app personal plan wellness lifestyle"}}
  ]
}}
Nur JSON, kein Markdown! Verwende INNERHALB der Texte fuer woertliche Zitate/Ironie deutsche Anfuehrungszeichen „so" – NIEMALS gerade " Zeichen (die zerstoeren das JSON)."""

    # REST API direkt – Key-Rotation + Modell-Fallback bei Rate-Limit
    _models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
    _resp = None
    _success = False
    for _ki, _key in enumerate(GEMINI_KEYS):
        for _model in _models:
            _url  = (f"https://generativelanguage.googleapis.com/v1beta/models/"
                     f"{_model}:generateContent?key={_key}")
            for attempt in range(3):
                try:
                    _resp = requests.post(_url,
                                          json={"contents": [{"parts": [{"text": prompt}]}],
                                                "generationConfig": {"responseMimeType": "application/json"}},
                                          timeout=(15, 180))
                except requests.exceptions.Timeout:
                    log.warning(f"Key{_ki+1}/{_model}: Timeout (Versuch {attempt+1}/3)")
                    time.sleep(20)
                    continue
                if _resp.status_code == 429:
                    log.warning(f"Key{_ki+1}/{_model} 429 (Versuch {attempt+1}/3)")
                    time.sleep(30 * (2 ** attempt))
                    continue
                if not _resp.ok:
                    log.warning(f"Key{_ki+1}/{_model} HTTP {_resp.status_code}: {_resp.text[:150]} – naechstes Modell")
                    break
                _success = True
                break
            if _success:
                log.info(f"Script-Generierung via Key{_ki+1}/{_model} erfolgreich")
                break
        if _success:
            break
        log.warning(f"Key{_ki+1} fuer alle Modelle blockiert – naechster Key")
    if not _success:
        raise Exception("Gemini API: Alle Keys & Modelle blockiert – Tageskontingent erschoepft?")
    raw  = _resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    import re as _re
    raw  = raw.strip()
    raw  = _re.sub(r'^```(?:json)?\s*', '', raw)
    raw  = _re.sub(r'\s*```$', '', raw)
    raw  = raw.strip()
    # Nur den JSON-Block behalten (erstes { bis letztes })
    _i, _j = raw.find('{'), raw.rfind('}')
    if _i != -1 and _j != -1 and _j > _i:
        raw = raw[_i:_j + 1]
    raw  = _re.sub(r',\s*([}\]])', r'\1', raw)  # trailing commas
    data = None
    for _attempt in (raw, _re.sub(r'[\r\n]+', ' ', raw)):
        try:
            data = json.loads(_attempt)
            break
        except json.JSONDecodeError as _e:
            log.warning(f"JSON-Parse-Versuch fehlgeschlagen: {_e}")
    if data is None:
        log.error(f"JSON nicht parsebar. Rohdaten (300): {raw[:300]}")
        raise Exception("Gemini-Script: JSON nicht parsebar")
    log.info(f"Script: {data['titel']}")
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
    _tts_models = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
    last_error = None
    for _ki, _key in enumerate(GEMINI_KEYS):
      for _model in _tts_models:
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{_model}:generateContent?key={_key}")
        for attempt in range(4):
            try:
                resp = requests.post(url, json=payload, timeout=(10, 120))
                if not resp.ok:
                    log.warning(f"TTS Key{_ki+1}/{_model} HTTP {resp.status_code}: {resp.text[:200]}")
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
                    params  = wf.getparams()
                    frames  = wf.readframes(wf.getnframes())
                with wave.open(output_path, "wb") as wf:
                    wf.setparams(params)
                    wf.writeframes(frames + pause_bytes)

                log.info(f"Audio: {output_path} (via Key{_ki+1}/{_model})")
                return
            except requests.exceptions.Timeout:
                last_error = "Timeout nach 120s"
                log.warning(f"TTS Key{_ki+1}/{_model} Timeout (Versuch {attempt+1}/4) – 15s...")
                time.sleep(15)
            except requests.exceptions.HTTPError as e:
                last_error = str(e)
                if getattr(resp, "status_code", 0) == 429:
                    _w = 60 * (2 ** attempt)
                    log.warning(f"TTS Key{_ki+1}/{_model} 429 – warte {_w}s (Versuch {attempt+1}/4)...")
                    time.sleep(_w)
                else:
                    log.warning(f"TTS Key{_ki+1}/{_model} HTTP-Fehler: {e} – 10s...")
                    time.sleep(10)
            except Exception as e:
                last_error = str(e)
                log.warning(f"TTS Key{_ki+1}/{_model} Fehler (Versuch {attempt+1}/4): {e} – 10s...")
                time.sleep(10)
        log.warning(f"TTS Key{_ki+1}/{_model} blockiert – naechstes Modell/Key")
    raise Exception(f"TTS fehlgeschlagen (alle Keys & Modelle). Fehler: {last_error}")

# ─── BILDER ───────────────────────────────────────────────────────
def fetch_pexels_images(query, output_paths):
    if not PEXELS_KEY:
        return []
    headers = {"Authorization": PEXELS_KEY}
    r = requests.get(
        "https://api.pexels.com/v1/search",
        headers=headers,
        params={"query": query, "per_page": 15, "orientation": "portrait"},
        timeout=15
    )
    photos = r.json().get("photos", [])
    if not photos:
        return []
    pool     = photos[:min(8, len(photos))]
    selected = random.sample(pool, min(len(output_paths), len(pool)))
    saved = []
    for path, photo in zip(output_paths, selected):
        img_data = requests.get(photo["src"]["large2x"], timeout=30).content
        with open(path, "wb") as f:
            f.write(img_data)
        saved.append(path)
    return saved

def fetch_pexels_video(query, output_path):
    """Holt einen Portrait-Videoclip von Pexels (gleicher API-Key)."""
    if not PEXELS_KEY:
        return None
    headers = {"Authorization": PEXELS_KEY}
    try:
        r = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers,
            params={"query": query, "per_page": 10, "orientation": "portrait"},
            timeout=15
        )
        videos = r.json().get("videos", [])
        if not videos:
            return None
        pool = videos[:5]
        random.shuffle(pool)
        for video in pool:
            for vf in video.get("video_files", []):
                if vf.get("height", 0) >= vf.get("width", 1) and vf.get("height", 0) >= 480:
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

def generate_ai_image(prompt, output_path):
    """Generiert KI-Bild via Pollinations.ai (kostenlos, kein API-Key noetig)."""
    try:
        encoded = requests.utils.quote(prompt)
        url = (f"https://image.pollinations.ai/prompt/{encoded}"
               f"?width=1080&height=1920&nologo=true&model=flux")
        r = requests.get(url, timeout=90)
        if r.status_code == 200 and len(r.content) > 5000:
            with open(output_path, "wb") as f:
                f.write(r.content)
            log.info(f"KI-Bild: {prompt[:40]}")
            return output_path
    except Exception as e:
        log.warning(f"Pollinations Fehler: {e}")
    return None

def generate_ai_video(image_path, output_path):
    """
    Animiert ein Bild zu einem ~4-Sek.-Video via fal.ai/fast-svd-lcm (Image-to-Video).
    Benoetigt: pip3.9 install fal-client + FAL_API_KEY in Config gesetzt.
    Kosten: ~$0.01 pro Clip.
    """
    if not FAL_API_KEY:
        return False
    try:
        import os as _os
        _os.environ["FAL_KEY"] = FAL_API_KEY
        import fal_client  # pip3.9 install fal-client

        # 1. Bild auf catbox.moe hochladen → öffentliche URL
        with open(image_path, "rb") as f:
            r = requests.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": ("img.jpg", f, "image/jpeg")},
                timeout=60
            )
        img_url = r.text.strip()
        if not img_url.startswith("https://"):
            log.warning(f"KI-Video: Catbox Upload fehlgeschlagen: {r.text[:100]}")
            return False

        # 2. Fal.ai: Bild animieren (SVD LCM – schnell und guenstig)
        result = fal_client.run(
            "fal-ai/fast-svd-lcm",
            arguments={
                "image_url":         img_url,
                "motion_bucket_id":  100,   # 0=statisch, 255=viel Bewegung
                "fps":               25,
                "num_frames":        14,    # ~0.56 Sek @ 25fps × loops
                "cond_aug":          0.02,
            }
        )
        video_url = result.get("video", {}).get("url")
        if not video_url:
            log.warning(f"KI-Video: kein URL in Fal.ai-Antwort: {result}")
            return False

        # 3. Video runterladen
        vr = requests.get(video_url, timeout=120)
        if vr.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(vr.content)
            log.info(f"KI-Video OK: {os.path.basename(output_path)}")
            return True
        else:
            log.warning(f"KI-Video Download fehlgeschlagen: {vr.status_code}")
            return False
    except ImportError:
        log.warning("KI-Video: fal-client nicht installiert. pip3.9 install fal-client")
        return False
    except Exception as e:
        log.warning(f"KI-Video Fehler: {e}")
        return False


def _ffmpeg_esc(text):
    """Escaped Sonderzeichen fuer FFmpeg drawtext-Filter."""
    return (text.replace("\\", "\\\\")
                .replace("'",  "\\'")
                .replace(":",  "\\:")
                .replace("[",  "\\[")
                .replace("]",  "\\]"))

def _wrap_text(text, max_chars=32):
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
        wrapped  = _wrap_text(subtitle_text[:120], 32)
        esc_text = _ffmpeg_esc(wrapped)
        parts.append("drawbox=x=0:y=h-230:w=iw:h=230:color=black@0.65:t=fill")
        parts.append(
            f"drawtext=text='{esc_text}':fontfile='{font_path}':fontsize=38"
            f":fontcolor=white:bordercolor=black:borderw=2"
            f":x=(w-text_w)/2:y=h-210:line_spacing=10"
        )
    if cta_text:
        esc_cta = _ffmpeg_esc(cta_text)
        if not subtitle_text:
            parts.append("drawbox=x=0:y=h-80:w=iw:h=80:color=black@0.65:t=fill")
        parts.append(
            f"drawtext=text='{esc_cta}':fontfile='{font_path}':fontsize=46"
            f":fontcolor=#FFD700:bordercolor=black:borderw=3"
            f":x=(w-text_w)/2:y=h-52"
        )
    return ",".join(parts)

_drawtext_ok   = None
_pil_font_path = None

def _get_pil_font_path():
    """Font-Pfad fuer PIL (unabhaengig von FFmpeg drawtext)."""
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
    cached = f"{ASSETS_DIR}/font.ttf"
    try:
        os.makedirs(ASSETS_DIR, exist_ok=True)
        r = requests.get(
            "https://raw.githubusercontent.com/owncloud/docs/master/fonts/dejavu-sans-bold.ttf",
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
        f"{ASSETS_DIR}/font.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/volume1/@appstore/ffmpeg7/lib/fonts/DejaVuSans.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return fp

    # Font herunterladen falls nicht vorhanden
    cached = f"{ASSETS_DIR}/font.ttf"
    try:
        os.makedirs(ASSETS_DIR, exist_ok=True)
        r = requests.get(
            "https://raw.githubusercontent.com/owncloud/docs/master/fonts/dejavu-sans-bold.ttf",
            timeout=30
        )
        with open(cached, "wb") as f:
            f.write(r.content)
        return cached
    except Exception as e:
        log.warning(f"Font-Download fehlgeschlagen: {e}")
        return None

def _make_text_overlay_png(display_text, subtitle_text, cta_text, output_path,
                            width=1080, height=1920, show_bars=True):
    """
    Erzeugt transparentes RGBA-PNG mit Titel oben + Untertitel/CTA unten.
    show_bars=True:  schwarze Balken hinter Text (besser lesbar auf Videos)
    show_bars=False: kein Balken, Text mit starkem Schatten (moderner Look)
    """
    from PIL import Image, ImageDraw, ImageFont
    img  = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    fp   = _get_pil_font_path()
    cx   = width // 2

    WHITE      = (255, 255, 255, 255)
    GOLD       = (200, 169, 110, 255)
    YELLOW     = (255, 220, 0,   255)
    BLACK_SOFT = (20,  20,  20,  200)

    title_sz = int(width * 0.052)
    url_sz   = int(width * 0.028)
    sub_sz   = int(width * 0.038)
    cta_sz   = int(width * 0.040)

    def load_font(sz):
        try:
            return ImageFont.truetype(fp, sz) if fp else ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()

    font_title = load_font(title_sz)
    font_url   = load_font(url_sz)
    font_sub   = load_font(sub_sz)
    font_cta   = load_font(cta_sz)

    # Schatten-Offsets: mehr Richtungen wenn kein Balken (bessere Lesbarkeit)
    shadow_offsets = (
        [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2),(-3,0),(3,0),(0,-3),(0,3)]
        if not show_bars else
        [(-2,0),(2,0),(0,-2),(0,2)]
    )

    # ── Titel oben ───────────────────────────────────────────────────
    if display_text:
        top_offset = 160  # Abstand von oben – Kameralinse freilassen
        bar_h = 180
        if show_bars:
            draw.rectangle([0, top_offset, width, top_offset + bar_h], fill=(0, 0, 0, 128))
        words = display_text.split()
        lines, line = [], []
        for w in words:
            line.append(w)
            if len(" ".join(line)) > 16:
                lines.append(" ".join(line[:-1]))
                line = [w]
        if line:
            lines.append(" ".join(line))
        lines = lines[:2]
        line_h  = title_sz + 10
        total_h = len(lines) * line_h
        y_start = top_offset + (bar_h - total_h) // 2 + title_sz // 2
        for i2, l in enumerate(lines):
            y = y_start + i2 * line_h
            for dx, dy in shadow_offsets:
                draw.text((cx+dx, y+dy), l, fill=BLACK_SOFT, font=font_title, anchor="mm")
            draw.text((cx, y), l, fill=WHITE, font=font_title, anchor="mm")

    # ── Untertitel + CTA unten ───────────────────────────────────────
    has_sub = bool(subtitle_text or cta_text)
    sub_h   = int(height * 0.13) if has_sub else 0
    if has_sub:
        if show_bars:
            draw.rectangle([0, height-sub_h, width, height], fill=(0, 0, 0, 175))
        # URL oberhalb der Untertitel-Bar
        url_y = height - sub_h - int(height * 0.03)
        for dx, dy in shadow_offsets[:4]:
            draw.text((cx+dx, url_y+dy), "callidus-am.de", fill=BLACK_SOFT, font=font_url, anchor="mm")
        draw.text((cx, url_y), "callidus-am.de", fill=GOLD, font=font_url, anchor="mm")
        if subtitle_text:
            sub_words = subtitle_text.split()
            sub_lines, sub_line = [], []
            for w in sub_words:
                sub_line.append(w)
                if len(" ".join(sub_line)) > 28:
                    sub_lines.append(" ".join(sub_line[:-1]))
                    sub_line = [w]
            if sub_line:
                sub_lines.append(" ".join(sub_line))
            sub_lines = sub_lines[:2]
            y_sub = height - sub_h + sub_sz
            for sl in sub_lines:
                for dx, dy in shadow_offsets[:4]:
                    draw.text((cx+dx, y_sub+dy), sl, fill=BLACK_SOFT, font=font_sub, anchor="mm")
                draw.text((cx, y_sub), sl, fill=WHITE, font=font_sub, anchor="mm")
                y_sub += sub_sz + 8
        if cta_text:
            cta_y = height - int(cta_sz * 0.6)
            for dx, dy in shadow_offsets[:4]:
                draw.text((cx+dx, cta_y+dy), cta_text, fill=BLACK_SOFT, font=font_cta, anchor="mm")
            draw.text((cx, cta_y), cta_text, fill=YELLOW, font=font_cta, anchor="mm")

    img.save(output_path, "PNG")


# ─── KARAOKE-UNTERTITEL ────────────────────────────────────────────
KARAOKE_WORDS_PER_CHUNK = 3

def _make_karaoke_frame_png(words, hl_start, hl_end, output_path, W=1080, H=1920):
    """Transparentes PNG: ganzer Sprechtext sichtbar, Wörter [hl_start:hl_end] in Gelb."""
    from PIL import Image as _KI, ImageDraw as _KD, ImageFont as _KF
    img  = _KI.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = _KD.Draw(img)

    fp = _get_pil_font_path()
    font_sz = int(W * 0.038)
    try:
        font = _KF.truetype(fp, font_sz) if fp else _KF.load_default()
    except Exception:
        font = _KF.load_default()

    # Wörter in Zeilen wrappen (max ~20 Zeichen je Zeile)
    max_chars = 20
    lines_w, lines_i = [], []
    cur_w, cur_i = [], []
    g = 0
    for w in words:
        cur_w.append(w)
        cur_i.append(g)
        g += 1
        if len(" ".join(cur_w)) > max_chars:
            lines_w.append(cur_w[:-1])
            lines_i.append(cur_i[:-1])
            cur_w = [cur_w[-1]]
            cur_i = [cur_i[-1]]
    if cur_w:
        lines_w.append(cur_w)
        lines_i.append(cur_i)

    line_h  = font_sz + 10
    y_start = int(H * 0.62)

    YELLOW    = (255, 210,   0, 255)
    WHITE_DIM = (200, 200, 200, 160)
    SHADOW    = ( 10,  10,  10, 220)
    shadows   = [(2, 2), (-2, 2), (2, -2), (-2, -2)]

    for li, (lw, li_ids) in enumerate(zip(lines_w, lines_i)):
        y        = y_start + li * line_h
        line_str = " ".join(lw)
        try:
            line_px = draw.textlength(line_str, font=font)
        except Exception:
            line_px = len(line_str) * font_sz * 0.6
        x = int((W - line_px) // 2)

        for wi, (word, gidx) in enumerate(zip(lw, li_ids)):
            color = YELLOW if hl_start <= gidx < hl_end else WHITE_DIM
            space = " " if wi < len(lw) - 1 else ""
            for dx, dy in shadows:
                draw.text((x + dx, y + dy), word, fill=SHADOW, font=font, anchor="lt")
            draw.text((x, y), word, fill=color, font=font, anchor="lt")
            try:
                x += int(draw.textlength(word + space, font=font))
            except Exception:
                x += int((len(word) + len(space)) * font_sz * 0.6)

    img.save(output_path, "PNG")


def _build_karaoke_pngs(sprechtext, audio_duration, work_dir, prefix, W=1080, H=1920):
    """Erstellt Karaoke-Overlay-PNGs (je KARAOKE_WORDS_PER_CHUNK Wörter hervorgehoben).
    Returns: list of (png_path, start_t, end_t)
    """
    words = sprechtext.split()
    if not words or audio_duration <= 0:
        return []
    time_per_word = audio_duration / max(len(words), 1)
    pieces = []
    for i in range(0, len(words), KARAOKE_WORDS_PER_CHUNK):
        hl_end   = min(i + KARAOKE_WORDS_PER_CHUNK, len(words))
        start_t  = i * time_per_word
        end_t    = hl_end * time_per_word
        png_path = os.path.join(work_dir, f"{prefix}_kar{i:03d}.png")
        _make_karaoke_frame_png(words, i, hl_end, png_path, W, H)
        pieces.append((png_path, start_t, end_t))
    return pieces


def render_text_on_image(img_pil, text, fmt="shorts", subtitle_text="", cta_text="",
                         show_bars=True):
    """Rendert Text + Branding + optionalen Untertitel/CTA via PIL.
    show_bars=True:  dunkle Balken hinter Text
    show_bars=False: kein Balken, stärkerer Schatten
    """
    from PIL import ImageDraw, ImageFont, Image

    size      = img_pil.size
    cx        = size[0] // 2
    cy        = size[1] // 2
    font_path = _get_pil_font_path()   # PIL-Font (nicht FFmpeg drawtext!)
    has_sub   = bool(subtitle_text or cta_text)
    sub_h     = int(size[1] * 0.13) if has_sub else 0

    # Dunkles Overlay (immer – leichte Aufhellung/Abdunklung des Hintergrunds)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    od      = ImageDraw.Draw(overlay)
    od.rectangle([0, 0, size[0], size[1]], fill=(0, 0, 0, 80))
    img_pil = Image.alpha_composite(img_pil.convert("RGBA"), overlay).convert("RGB")
    draw    = ImageDraw.Draw(img_pil)

    # Schatten-Offsets: mehr Richtungen wenn kein Balken
    shadow_offsets = (
        [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2),(-3,0),(3,0),(0,-3),(0,3)]
        if not show_bars else
        [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2)]
    )

    GOLD       = (200, 169, 110)
    WHITE      = (255, 255, 255)
    YELLOW     = (255, 220, 0)
    BLACK_SOFT = (20,  20,  20)

    big_size   = int(size[0] * 0.075)
    url_size   = int(size[0] * 0.028)
    sub_size   = int(size[0] * 0.038)
    cta_size   = int(size[0] * 0.040)
    max_chars  = 12

    def load_font(sz):
        try:
            return ImageFont.truetype(font_path, sz) if font_path else ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()

    font_big = load_font(big_size)
    font_url = load_font(url_size)
    font_sub = load_font(sub_size)
    font_cta = load_font(cta_size)

    # ── Haupttext (Slide-Titel) ──────────────────────────────────────
    words = text.split()
    lines, line = [], []
    for w in words:
        line.append(w)
        if len(" ".join(line)) > max_chars:
            lines.append(" ".join(line[:-1]))
            line = [w]
    if line:
        lines.append(" ".join(line))

    line_h  = big_size + 12
    total_h = len(lines) * line_h
    y_start = cy - total_h // 2

    for i, l in enumerate(lines):
        for dx, dy in shadow_offsets:
            draw.text((cx+dx, y_start + i*line_h + dy), l, fill=BLACK_SOFT, font=font_big, anchor="mm")
        draw.text((cx, y_start + i*line_h), l, fill=WHITE, font=font_big, anchor="mm")

    # ── callidus-am.de (oberhalb Untertitel-Bereich) ─────────────────
    brand_y = size[1] - sub_h - int(size[1] * 0.04)
    for dx, dy in shadow_offsets[:4]:
        draw.text((cx+dx, brand_y+dy), "callidus-am.de", fill=BLACK_SOFT, font=font_url, anchor="mm")
    draw.text((cx, brand_y), "callidus-am.de", fill=GOLD, font=font_url, anchor="mm")

    # ── Untertitel-Bereich ────────────────────────────────────────────
    if has_sub:
        if show_bars:
            sub_overlay = Image.new("RGBA", size, (0, 0, 0, 0))
            sod = ImageDraw.Draw(sub_overlay)
            sod.rectangle([0, size[1]-sub_h, size[0], size[1]], fill=(0, 0, 0, 175))
            img_pil = Image.alpha_composite(img_pil.convert("RGBA"), sub_overlay).convert("RGB")
            draw    = ImageDraw.Draw(img_pil)

        if subtitle_text:
            sub_words = subtitle_text.split()
            sub_lines, sub_line = [], []
            for w in sub_words:
                sub_line.append(w)
                if len(" ".join(sub_line)) > 28:
                    sub_lines.append(" ".join(sub_line[:-1]))
                    sub_line = [w]
            if sub_line:
                sub_lines.append(" ".join(sub_line))
            sub_lines = sub_lines[:2]

            y_sub = size[1] - sub_h + sub_size
            for sl in sub_lines:
                for dx, dy in shadow_offsets[:4]:
                    draw.text((cx+dx, y_sub+dy), sl, fill=BLACK_SOFT, font=font_sub, anchor="mm")
                draw.text((cx, y_sub), sl, fill=WHITE, font=font_sub, anchor="mm")
                y_sub += sub_size + 8

        if cta_text:
            cta_y = size[1] - int(cta_size * 0.6)
            for dx, dy in shadow_offsets[:4]:
                draw.text((cx+dx, cta_y+dy), cta_text, fill=BLACK_SOFT, font=font_cta, anchor="mm")
            draw.text((cx, cta_y), cta_text, fill=YELLOW, font=font_cta, anchor="mm")

    return img_pil

def create_slide_image(text, output_path, slide_num):
    from PIL import Image, ImageDraw

    size = (1080, 1920)
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
    img = render_text_on_image(img, text)
    img.save(output_path, quality=95)

# ─── CROSSFADE SEGMENT ────────────────────────────────────────────
def _kenburns_vf(duration, idx, W=1080, H=1920):
    """Ken-Burns-zoompan (langsamer Zoom/Schwenk) fuer ein Standbild → Video-Look.
    Richtung variiert pro idx. Hochskalieren vor zoompan vermeidet Jitter."""
    frames = max(1, int(round(duration * 25)))
    up_w, up_h = int(W * 1.5), int(H * 1.5)
    variant = idx % 4
    if variant == 0:
        z = "z='min(zoom+0.0009,1.20)'"; x = "x='iw/2-(iw/zoom/2)'"; y = "y='ih/2-(ih/zoom/2)'"
    elif variant == 1:
        z = "z='if(eq(on,1),1.20,max(1.001,zoom-0.0009))'"; x = "x='iw/2-(iw/zoom/2)'"; y = "y='ih/2-(ih/zoom/2)'"
    elif variant == 2:
        z = "z='min(zoom+0.0008,1.18)'"; x = "x='iw/2-(iw/zoom/2)'"; y = f"y='(ih-ih/zoom)*on/{frames}'"
    else:
        z = "z='min(zoom+0.0008,1.18)'"; x = f"x='(iw-iw/zoom)*on/{frames}'"; y = "y='ih/2-(ih/zoom/2)'"
    return (f"scale={up_w}:{up_h}:force_original_aspect_ratio=increase,"
            f"crop={up_w}:{up_h},"
            f"zoompan={z}:{x}:{y}:d={frames}:s={W}x{H}:fps=25,setsar=1,format=yuv420p")


def build_segment_with_crossfade(image_paths, audio_path, seg_out, crossfade=1.5,
                                  subtitle_text="", cta_text="", karaoke_pngs=None):
    """Einfache Cuts – schnell und NAS-freundlich. Mit optionalem Karaoke-Untertitel."""
    import wave as wavemod, contextlib

    with contextlib.closing(wavemod.open(audio_path, 'r')) as wf:
        total_duration = wf.getnframes() / float(wf.getframerate())

    n          = len(image_paths)
    img_dur    = total_duration / n
    scale_crop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
    font_path  = _get_font_path()
    sub_vf     = _build_subtitle_vf(subtitle_text, font_path, cta_text)

    if n == 1:
        if karaoke_pngs:
            # Karaoke über Single-Image via filter_complex
            kar_inputs = []
            for _png, _, _ in karaoke_pngs:
                kar_inputs += ["-i", _png]
            fc  = (f"[0:v]{scale_crop},format=yuv420p[vid]")
            _prev = "vid"
            for _ki, (_png, _st, _et) in enumerate(karaoke_pngs):
                _ii  = 2 + _ki
                _nxt = f"vk{_ki}"
                fc += (f";[{_ii}:v]scale=1080:1920[kar{_ki}]"
                       f";[{_prev}][kar{_ki}]overlay=0:0"
                       f":enable='between(t,{_st:.3f},{_et:.3f})'[{_nxt}]")
                _prev = _nxt
            fc += f";[{_prev}]format=yuv420p[vout]"
            cmd = [FFMPEG, "-y",
                   "-loop", "1", "-t", str(total_duration), "-i", image_paths[0],
                   "-i", audio_path] + kar_inputs + [
                   "-filter_complex", fc,
                   "-map", "[vout]", "-map", "1:a:0",
                   "-c:v", "libx264", "-preset", "ultrafast",
                   "-c:a", "aac", "-b:a", "128k",
                   "-shortest", seg_out]
        else:
            vf = f"{scale_crop},format=yuv420p"
            if sub_vf:
                vf += "," + sub_vf
            cmd = [FFMPEG, "-y",
                   "-loop", "1", "-t", str(total_duration), "-i", image_paths[0],
                   "-i", audio_path,
                   "-vf", vf,
                   "-c:v", "libx264", "-preset", "ultrafast",
                   "-c:a", "aac", "-b:a", "128k",
                   "-shortest", seg_out]
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            raise Exception(f"FFmpeg Fehler: {result.stderr.decode(errors='replace')[-800:]}")
        return

    # Jeden Bild-Clip einzeln erstellen (mit Ken-Burns-Bewegung fuer Video-Look)
    clip_paths = []
    for idx, img_path in enumerate(image_paths):
        clip_out = seg_out + f"_clip{idx}.mp4"
        clip_vf  = _kenburns_vf(img_dur, idx) if KEN_BURNS else f"{scale_crop},fps=25,format=yuv420p"
        cmd = [FFMPEG, "-y",
               "-loop", "1", "-t", str(img_dur), "-i", img_path,
               "-vf", clip_vf,
               "-c:v", "libx264", "-preset", "ultrafast",
               "-pix_fmt", "yuv420p", "-r", "25",
               "-an", clip_out]
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            raise Exception(f"Clip {idx} Fehler: {result.stderr.decode(errors='replace')[-800:]}")
        clip_paths.append(clip_out)

    # Concat → video_only
    concat_file = seg_out + "_concat.txt"
    with open(concat_file, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")

    video_only = seg_out + "_video.mp4"
    vf_concat  = "fps=25,format=yuv420p"
    if sub_vf and not karaoke_pngs:
        vf_concat += "," + sub_vf
    cmd = [FFMPEG, "-y",
           "-f", "concat", "-safe", "0", "-i", concat_file,
           "-vf", vf_concat,
           "-c:v", "libx264", "-preset", "ultrafast",
           "-pix_fmt", "yuv420p", "-r", "25",
           video_only]
    result = subprocess.run(cmd, capture_output=True, timeout=600)
    if result.returncode != 0:
        raise Exception(f"Concat Fehler: {result.stderr.decode(errors='replace')[-800:]}")

    if karaoke_pngs:
        # Karaoke-Overlays auf video_only anwenden, dann Audio hinzufügen
        kar_inputs = []
        for _png, _, _ in karaoke_pngs:
            kar_inputs += ["-i", _png]
        fc  = "[0:v]format=yuv420p[vid]"
        _prev = "vid"
        for _ki, (_png, _st, _et) in enumerate(karaoke_pngs):
            _ii  = 1 + _ki
            _nxt = f"vk{_ki}"
            fc += (f";[{_ii}:v]scale=1080:1920[kar{_ki}]"
                   f";[{_prev}][kar{_ki}]overlay=0:0"
                   f":enable='between(t,{_st:.3f},{_et:.3f})'[{_nxt}]")
            _prev = _nxt
        fc += f";[{_prev}]format=yuv420p[vout]"
        video_karaoke = seg_out + "_vkar.mp4"
        cmd = [FFMPEG, "-y", "-i", video_only] + kar_inputs + [
               "-filter_complex", fc,
               "-map", "[vout]",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-pix_fmt", "yuv420p", "-r", "25",
               video_karaoke]
        result = subprocess.run(cmd, capture_output=True, timeout=600)
        if result.returncode != 0:
            raise Exception(f"Karaoke-Overlay Fehler: {result.stderr.decode(errors='replace')[-800:]}")
        # Audio zum karaoke-Video
        cmd = [FFMPEG, "-y",
               "-i", video_karaoke, "-i", audio_path,
               "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
               "-shortest", seg_out]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        for p in clip_paths + [concat_file, video_only, video_karaoke]:
            try: os.remove(p)
            except: pass
        for _png, _, _ in karaoke_pngs:
            try: os.remove(_png)
            except: pass
    else:
        cmd = [FFMPEG, "-y",
               "-i", video_only, "-i", audio_path,
               "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
               "-shortest", seg_out]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        for p in clip_paths + [concat_file, video_only]:
            try: os.remove(p)
            except: pass

    if result.returncode != 0:
        raise Exception(f"FFmpeg Audio-Merge Fehler: {result.stderr.decode(errors='replace')[-800:]}")

def build_segment_from_video(video_clip, audio_path, seg_out,
                              display_text, subtitle_text="", cta_text="",
                              show_bars=True):
    """Erstellt Reel-Segment aus Pexels-Videoclip mit Titel, Untertitel, CTA."""
    import contextlib, wave as wavemod
    with contextlib.closing(wavemod.open(audio_path, 'r')) as wf:
        duration = wf.getnframes() / float(wf.getframerate())

    font_path  = _get_font_path()   # None wenn kein drawtext
    scale_crop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"

    if font_path:
        # ── Pfad A: FFmpeg drawtext verfuegbar ──────────────────────
        fp       = font_path
        vf_parts = [scale_crop, "format=yuv420p"]
        vf_parts.append("drawbox=x=0:y=0:w=iw:h=180:color=black@0.50:t=fill")
        title_esc = _ffmpeg_esc(display_text[:40])
        vf_parts.append(
            f"drawtext=text='{title_esc}':fontfile='{fp}':fontsize=56"
            f":fontcolor=white:bordercolor=black:borderw=3"
            f":x=(w-text_w)/2:y=80:line_spacing=10"
        )
        vf_parts.append(
            f"drawtext=text='callidus-am.de':fontfile='{fp}':fontsize=28"
            f":fontcolor=#c8a96e:bordercolor=black:borderw=2"
            f":x=(w-text_w)/2:y=150"
        )
        sub_vf = _build_subtitle_vf(subtitle_text, fp, cta_text)
        if sub_vf:
            vf_parts.append(sub_vf)
        vf  = ",".join(vf_parts)
        cmd = [FFMPEG, "-y",
               "-stream_loop", "-1", "-i", video_clip,
               "-i", audio_path,
               "-map", "0:v:0", "-map", "1:a:0",
               "-vf", vf,
               "-fps_mode", "cfr", "-r", "25",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration), "-shortest", seg_out]
    else:
        # ── Pfad B: PIL-Overlay PNG + Karaoke-Untertitel ────────────
        overlay_png = seg_out + "_ov.png"
        # Basis-Overlay: Titel + Brand (KEIN Untertitel → via Karaoke)
        _make_text_overlay_png(display_text, "", cta_text, overlay_png,
                               show_bars=show_bars)

        # Audio-Dauer für Karaoke-Timing
        import contextlib as _cl, wave as _wv
        with _cl.closing(_wv.open(audio_path, 'r')) as _wf:
            _audio_dur = _wf.getnframes() / float(_wf.getframerate())

        # Karaoke-PNGs erstellen (Wörter je 3 hervorheben)
        _kar_prefix = os.path.basename(seg_out).replace(".mp4", "")
        karaoke_pieces = _build_karaoke_pngs(
            subtitle_text, _audio_dur,
            os.path.dirname(seg_out), _kar_prefix)

        # Inputs: [0]=video, [1]=audio, [2]=base_overlay, [3..N]=karaoke
        kar_inputs = []
        for _png, _, _ in karaoke_pieces:
            kar_inputs += ["-i", _png]

        # Filter-Chain mit timed Karaoke-Overlays
        fc  = (f"[0:v]{scale_crop},format=yuv420p[vid];"
               f"[2:v]scale=1080:1920[ov];"
               f"[vid][ov]overlay=0:0[v0]")
        _prev = "v0"
        for _ki, (_png, _st, _et) in enumerate(karaoke_pieces):
            _ii  = 3 + _ki
            _nxt = f"vk{_ki}"
            fc += (f";[{_ii}:v]scale=1080:1920[kar{_ki}]"
                   f";[{_prev}][kar{_ki}]overlay=0:0"
                   f":enable='between(t,{_st:.3f},{_et:.3f})'[{_nxt}]")
            _prev = _nxt
        fc += f";[{_prev}]format=yuv420p[vout]"

        cmd = [FFMPEG, "-y",
               "-stream_loop", "-1", "-i", video_clip,
               "-i", audio_path,
               "-i", overlay_png] + kar_inputs + [
               "-filter_complex", fc,
               "-map", "[vout]", "-map", "1:a:0",
               "-fps_mode", "cfr", "-r", "25",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration), "-shortest", seg_out]

    result = subprocess.run(cmd, capture_output=True, timeout=600)
    # Karaoke-Temp-Dateien aufräumen (nur in Pfad B vorhanden)
    try:
        for _png, _, _ in karaoke_pieces:
            try: os.remove(_png)
            except: pass
        if os.path.exists(overlay_png):
            try: os.remove(overlay_png)
            except: pass
    except NameError:
        pass  # PATH A wurde verwendet, keine karaoke_pieces/overlay_png

    if result.returncode != 0:
        err = result.stderr.decode(errors="replace")
        log.error(f"FFmpeg Video-Segment stderr:\n{err}")
        raise Exception(f"Video-Segment Fehler: {err[-800:]}")
    log.info(f"Video-Segment OK: {os.path.basename(seg_out)}")

# ─── LOGO OUTRO ───────────────────────────────────────────────────
def create_logo_outro(work_dir):
    from PIL import Image, ImageDraw, ImageFont

    size = (1080, 1920)
    img  = Image.new("RGB", size, color=(10, 30, 15))
    draw = ImageDraw.Draw(img)
    for y in range(size[1]):
        t  = y / size[1]
        draw.line([(0, y), (size[0], y)],
                  fill=(int(10+(25-10)*t), int(30+(65-30)*t), int(15+(30-15)*t)))

    cx = size[0] // 2
    cy = size[1] // 2

    logo_bottom = cy
    if os.path.exists(LOGO_PATH):
        try:
            logo  = Image.open(LOGO_PATH).convert("RGBA")
            logo.thumbnail((int(size[0]*0.30), int(size[1]*0.20)), Image.LANCZOS)
            lx          = (size[0] - logo.width) // 2
            ly          = cy - logo.height - int(size[1]*0.05)
            img         = img.convert("RGBA")
            img.paste(logo, (lx, ly), logo)
            img         = img.convert("RGB")
            draw        = ImageDraw.Draw(img)
            logo_bottom = ly + logo.height
        except Exception as e:
            log.warning(f"Logo-Fehler: {e}")

    font_path  = _get_pil_font_path()   # PIL-Font (nicht FFmpeg drawtext)
    big_size   = int(size[0] * 0.055)
    small_size = int(size[0] * 0.034)
    try:
        font_big   = ImageFont.truetype(font_path, big_size)   if font_path else ImageFont.load_default()
        font_small = ImageFont.truetype(font_path, small_size) if font_path else ImageFont.load_default()
    except Exception:
        font_big = font_small = ImageFont.load_default()

    gap = int(size[1] * 0.015)
    y2  = logo_bottom + gap + big_size // 2
    y3  = y2 + small_size + gap

    draw.text((cx, y2), "NEXUS • Stress Reset • Empfehlungen", fill=(120, 180, 130), font=font_small, anchor="mm")
    draw.text((cx, y3), "callidus-am.de", fill=(200, 169, 110), font=font_small, anchor="mm")

    # Produkt-CTA statt generischem Folgen/Liken
    y4 = y3 + small_size + gap * 2
    y5 = y4 + small_size + gap
    draw.text((cx, y4), "NEXUS App testen", fill=(255, 220, 60), font=font_small, anchor="mm")
    draw.text((cx, y5), "Stress Reset & Empfehlungen", fill=(200, 200, 200), font=font_small, anchor="mm")

    draw.line([(80, size[1]-60), (size[0]-80, size[1]-60)], fill=(200, 169, 110), width=2)

    img_path = f"{work_dir}/outro.jpg"
    img.save(img_path, quality=95)

    silence_path   = f"{work_dir}/silence.wav"
    silence_frames = 24000 * 4
    with wave.open(silence_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b'\x00\x00' * silence_frames)

    vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p,fade=out:st=2:d=2"
    outro_out = f"{work_dir}/seg_outro.mp4"
    cmd = [FFMPEG, "-y",
           "-loop", "1", "-i", img_path, "-i", silence_path,
           "-vf", vf, "-af", "afade=out:st=2:d=2",
           "-c:v", "libx264", "-preset", "ultrafast",
           "-c:a", "aac", "-b:a", "128k",
           "-t", "4", outro_out]
    result = subprocess.run(cmd, capture_output=True, timeout=60)
    if result.returncode != 0:
        log.warning(f"Outro Fehler: {result.stderr.decode()[:200]}")
        return None
    return outro_out

# ─── HINTERGRUNDMUSIK ─────────────────────────────────────────────
def mix_background_music(video_path, final_out):
    import glob, re

    # Blocklist: bekannte copyright-problematische Songs (case-insensitive substring match)
    BLOCKED_MUSIC = ["carvine", "piano reflections", "we are era", "leberch"]
    music_files = [f for f in glob.glob(f"{ASSETS_DIR}/*.mp3")
                   if os.path.getsize(f) > 10000
                   and not os.path.basename(f).startswith("_")
                   and not any(b in os.path.basename(f).lower() for b in BLOCKED_MUSIC)]
    if not music_files:
        log.warning("Keine unblockierte Musikdatei gefunden – Video ohne Musik")
        shutil.copy(video_path, final_out)
        return

    music  = random.choice(music_files)
    result = subprocess.run([FFMPEG, "-i", video_path], capture_output=True)
    m      = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr.decode())
    if not m:
        shutil.copy(video_path, final_out)
        return

    h, mi, s    = m.groups()
    total       = int(h)*3600 + int(mi)*60 + float(s)
    fade_out_st = max(0, total - 3.0)
    af          = f"volume=0.20,afade=t=in:st=0:d=3,afade=t=out:st={fade_out_st:.1f}:d=3"

    cmd = [FFMPEG, "-y",
           "-i", video_path,
           "-stream_loop", "-1", "-i", music,
           "-filter_complex",
           f"[1:a]{af}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=3[aout]",
           "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
           "-movflags", "+faststart",
           "-shortest", final_out]
    result = subprocess.run(cmd, capture_output=True, timeout=300)
    if result.returncode != 0:
        shutil.copy(video_path, final_out)
    else:
        log.info(f"Musik gemischt: {os.path.basename(music)}")

# ─── VIDEO BAUEN ──────────────────────────────────────────────────
def build_video(script, work_dir, mode="video"):
    """
    mode='images': nur Bilder (kein Pexels-Video, kein KI-Video), kein Balken
    mode='video':  Pexels-Video + KI-Video + Balken (volle Variante)
    """
    slides       = script["slides"]
    target       = (1080, 1920)
    total_slides = len(slides)
    show_bars    = OVERLAY_BARS_IMAGES if mode == "images" else OVERLAY_BARS_VIDEOS

    from PIL import Image as PILImage

    for i, slide in enumerate(slides):
        sprechtext   = _strip_emojis(slide.get("sprechtext", slide.get("text", "")))
        audio_path   = f"{work_dir}/audio_{i:02d}.wav"
        generate_audio(sprechtext, audio_path)

        # Audiodauer fuer dynamische Bildanzahl
        import contextlib as _cl, wave as _wv
        with _cl.closing(_wv.open(audio_path, 'r')) as _wf:
            audio_dur = _wf.getnframes() / float(_wf.getframerate())
        num_imgs = max(2, min(8, int(audio_dur / 5)))

        display_text = _strip_emojis(slide.get("titel", slide.get("text", sprechtext[:30])))
        bildsuche    = slide.get("bildsuche", "health wellness nature")
        seg_out      = f"{work_dir}/seg_{i:02d}.mp4"

        # CTA auf letztem Content-Slide
        is_last = (i == total_slides - 1)
        cta      = "NEXUS • STRESS RESET • EMPFEHLUNGEN" if is_last else ""

        saved_imgs = []

        # ── 1. KI-Bilder via Pollinations als PRIMAERQUELLE ────────
        # Mehrere Bilder pro Slide im Wochen-Kunststil → spaeter Ken-Burns-Bewegung.
        if AI_IMAGES_FIRST:
            art  = todays_art_style()
            n_ai = min(num_imgs, IMAGES_PER_SLIDE)
            for j in range(n_ai):
                ai_prompt = (f"{art['prefix']}{bildsuche}, vertical composition, "
                             f"clear focal subject, expressive, cinematic, "
                             f"seed{i}{j}{datetime.date.today().toordinal()}")
                ai_img = f"{work_dir}/slide_{i:02d}_ai{j}.jpg"
                if generate_ai_image(ai_prompt, ai_img):
                    saved_imgs.append(ai_img)
            if saved_imgs:
                log.info(f"Segment {i}: {len(saved_imgs)} KI-Bilder ({art['label']}) generiert")

        # ── 2. Echtes KI-Video via Fal.ai (nur wenn explizit aktiviert, KOSTEN) ─
        if not saved_imgs and mode == "video" and USE_FAL_AI_VIDEO:
            ai_img_for_video = f"{work_dir}/slide_{i:02d}_ai_for_video.jpg"
            ai_video_clip    = f"{work_dir}/clip_{i:02d}_ai.mp4"
            ai_prompt_v      = f"{bildsuche} wellness health cinematic"
            if (generate_ai_image(ai_prompt_v, ai_img_for_video)
                    and generate_ai_video(ai_img_for_video, ai_video_clip)):
                try:
                    build_segment_from_video(ai_video_clip, audio_path, seg_out,
                                             display_text, "", cta,
                                             show_bars=show_bars)
                    log.info(f"Segment {i} (KI-Video) OK")
                    continue
                except Exception as e:
                    log.warning(f"Segment {i}: KI-Video fehlgeschlagen ({e}), weiter mit Bildern")

        # ── 3. Pexels (Video, dann Bilder) nur als FALLBACK ────────
        if not saved_imgs and mode == "video":
            video_clip = f"{work_dir}/clip_{i:02d}.mp4"
            if fetch_pexels_video(bildsuche, video_clip):
                try:
                    build_segment_from_video(video_clip, audio_path, seg_out,
                                             display_text, "", cta,
                                             show_bars=show_bars)
                    log.info(f"Segment {i} (Pexels Video, Fallback) OK")
                    continue
                except Exception as e:
                    log.warning(f"Segment {i}: Pexels-Video fehlgeschlagen ({e}), weiter")

        if not saved_imgs:
            img_paths_raw = [f"{work_dir}/slide_{i:02d}_img{j}.jpg" for j in range(num_imgs)]
            saved_imgs    = fetch_pexels_images(bildsuche, img_paths_raw)

        # ── 5. Gradient-Fallback ───────────────────────────────────
        if not saved_imgs:
            fallback = f"{work_dir}/slide_{i:02d}_img0.jpg"
            create_slide_image(display_text, fallback, i)
            saved_imgs = [fallback]

        # Bilder aufbereiten + PIL Titel/Untertitel/CTA-Overlay
        final_imgs = []
        for j, img_path in enumerate(saved_imgs):
            pil          = PILImage.open(img_path).convert("RGB")
            src_w, src_h = pil.size
            tgt_w, tgt_h = target
            scale        = max(tgt_w / src_w, tgt_h / src_h)
            new_w, new_h = int(src_w * scale), int(src_h * scale)
            pil          = pil.resize((new_w, new_h), PILImage.LANCZOS)
            left         = (new_w - tgt_w) // 2
            top          = (new_h - tgt_h) // 2
            pil          = pil.crop((left, top, left + tgt_w, top + tgt_h))
            img_cta      = cta if j == len(saved_imgs) - 1 else ""
            pil          = render_text_on_image(pil, display_text, fmt="shorts",
                                                subtitle_text="",
                                                cta_text=img_cta,
                                                show_bars=show_bars)
            out          = f"{work_dir}/slide_{i:02d}_final{j}.jpg"
            pil.save(out, quality=95)
            final_imgs.append(out)

        # Karaoke/Mitlese-Untertitel deaktiviert: keine Volltext-Overlays mehr.
        _kar_pngs_cf = []
        build_segment_with_crossfade(
            final_imgs, audio_path, seg_out, CROSSFADE_DURATION,
            subtitle_text="", cta_text=cta,
            karaoke_pngs=_kar_pngs_cf
        )
        log.info(f"Segment {i} (Bild, mode={mode}) OK")

    outro_path = create_logo_outro(work_dir)

    concat_file = f"{work_dir}/concat.txt"
    with open(concat_file, "w") as f:
        for i in range(len(slides)):
            f.write(f"file '{work_dir}/seg_{i:02d}.mp4'\n")
        if outro_path:
            f.write(f"file '{outro_path}'\n")

    raw_out = f"{work_dir}/raw_video.mp4"
    cmd     = [FFMPEG, "-y", "-f", "concat", "-safe", "0",
               "-i", concat_file,
               "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
               "-r", "25", "-movflags", "+faststart",
               "-c:a", "aac", raw_out]
    subprocess.run(cmd, check=True, capture_output=True, timeout=600)

    final_out = f"{OUTPUT_DIR}/reel_{datetime.date.today().isoformat()}.mp4"
    mix_background_music(raw_out, final_out)

    log.info(f"Reel fertig: {final_out}")
    return final_out

# ─── INSTAGRAM UPLOAD ─────────────────────────────────────────────

# ─── YOUTUBE UPLOAD ───────────────────────────────────────────────
YOUTUBE_TOKEN_FILE  = f"{BASE_DIR}/token.json"

def upload_youtube(video_path, script):
    """Laedt Video als YouTube Short hoch."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload

        if not os.path.exists(YOUTUBE_TOKEN_FILE):
            log.warning("YouTube token.json nicht gefunden")
            return None

        SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
        creds  = Credentials.from_authorized_user_file(YOUTUBE_TOKEN_FILE, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(YOUTUBE_TOKEN_FILE, "w") as f:
                f.write(creds.to_json())

        youtube = build("youtube", "v3", credentials=creds)
        beschreibung = (
            script["beschreibung"]
            + "\n\n---"
            + "\n🌿 callidus A&M – Ganzheitliche Gesundheit"
            + "\n📱 NEXUS App: https://www.callidus-am.de/nexus-app/"
            + "\n🧘 Stress Reset Kurs: https://www.callidus-am.de/stress-reset-kurs/"
            + "\n🛒 Transparente Empfehlungen: https://www.callidus-am.de/unsere-empfehlungen/"
            + "\n\nAnzeige/Affiliate-Hinweis: Auf Empfehlungsseiten können Affiliate-Links stehen. Keine Mehrkosten für dich."
            + "\n\n👉 Kanal abonnieren fuer taeglich Gesundheitstipps!"
        )
        tags  = script.get("tags", []) + ["Gesundheit", "callidus", "Shorts"]
        body  = {
            "snippet": {
                "title":       script["titel"][:100],
                "description": beschreibung[:5000],
                "tags":        tags[:30],
                "categoryId":  "26",
            },
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}
        }
        media   = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/mp4")
        request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        while response is None:
            _, response = request.next_chunk()
        url = f"https://youtu.be/{response['id']}"
        log.info(f"YouTube: {url}")
        return url
    except Exception as e:
        log.error(f"YouTube Fehler: {e}", exc_info=True)
        return None


def host_video_on_catbox(video_path):
    """Lädt Video auf catbox.moe hoch – gibt öffentliche URL zurück."""
    tg_send("☁️ Lade Video auf temporären Server...")
    try:
        with open(video_path, "rb") as f:
            r = requests.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": ("reel.mp4", f, "video/mp4")},
                timeout=300
            )
        url = r.text.strip()
        if url.startswith("https://"):
            log.info(f"Catbox URL: {url}")
            return url
        else:
            log.error(f"Catbox Fehler: {r.text}")
            return None
    except Exception as e:
        log.error(f"Catbox Upload Fehler: {e}")
        return None

def upload_instagram_reel(video_path, script):
    try:
        TOKEN = get_instagram_token()

        caption = (
            script["beschreibung"][:2000]
            + "\n\n🌿 callidus A&M – Ganzheitliche Gesundheit"
            + "\n📱 NEXUS App: https://www.callidus-am.de/nexus-app/"
            + "\n🧘 Stress Reset: https://www.callidus-am.de/stress-reset-kurs/"
            + "\n🌐 Empfehlungen: https://www.callidus-am.de/unsere-empfehlungen/"
            + "\n\n#Gesundheit #StressReset #NEXUSApp #Wohlbefinden #callidus #Reels #LifeHack #AhaMoment"
        )

        # Video öffentlich hosten (Instagram braucht eine URL)
        video_url = host_video_on_catbox(video_path)
        if not video_url:
            tg_send("❌ Video-Hosting fehlgeschlagen")
            return None

        tg_send("📤 Sende an Instagram API...")
        log.info(f"Catbox URL: {video_url}")

        # Schritt 1: Media Container erstellen (API v21.0)
        container_r = requests.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_ACCOUNT_ID}/media",
            data={
                "access_token":  TOKEN,
                "media_type":    "REELS",
                "video_url":     video_url,
                "caption":       caption[:2200],
                "share_to_feed": "true",
            },
            timeout=(10, 30)
        )
        container_data = container_r.json()
        log.info(f"Instagram Container: {container_data}")

        if "id" not in container_data:
            tg_send(f"❌ Container-Fehler: {container_data}")
            return None

        container_id = container_data["id"]

        # Schritt 2: Warten bis Instagram das Video verarbeitet hat
        tg_send("⏳ Instagram verarbeitet Video (ca. 1-2 Min)...")
        for attempt in range(24):
            time.sleep(10)
            status_r = requests.get(
                f"https://graph.facebook.com/v21.0/{container_id}",
                params={"fields": "status_code", "access_token": TOKEN}
            )
            status = status_r.json().get("status_code", "UNKNOWN")
            log.info(f"Status ({attempt+1}): {status}")
            if status == "FINISHED":
                break
            if status == "ERROR":
                # Fehler-Details vom Container abfragen
                err_r    = requests.get(
                    f"https://graph.facebook.com/v21.0/{container_id}",
                    params={"fields": "status_code,status", "access_token": TOKEN},
                    timeout=15
                )
                err_info = err_r.json().get("status", "unbekannt")
                log.error(f"Instagram Container Fehler: {err_r.json()}")
                tg_send(f"❌ Instagram Verarbeitung fehlgeschlagen\nDetail: {err_info}")
                return None

        # Schritt 3: Veröffentlichen
        pub_r = requests.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_ACCOUNT_ID}/media_publish",
            data={
                "access_token": TOKEN,
                "creation_id":  container_id,
            },
            timeout=(10, 30)
        )
        pub_data = pub_r.json()
        log.info(f"Publish: {pub_data}")

        media_id = pub_data.get("id", "")
        if media_id:
            url = f"https://www.instagram.com/p/{media_id}/"
            log.info(f"Reel live: {url}")
            return url
        else:
            tg_send(f"⚠️ Publish Antwort: {pub_data}")
            return None

    except Exception as e:
        log.error(f"Instagram Fehler: {e}", exc_info=True)
        tg_send(f"❌ Instagram Fehler: {str(e)[:300]}")
        return None


# ─── HAUPTWORKFLOW ────────────────────────────────────────────────
def run_workflow(mode="video", force=False):
    """
    mode='images': nur Bilder (kein Balken)
    mode='video':  volle Variante (mit Karaoke-Untertiteln)
    force=True:    Wochentag-Check ueberspringen (manuelles /jetzt)
    """
    # Wochentag-Check (Mo/Mi/Fr) – mit force=True (manuelles /jetzt) umgehbar
    if not force and datetime.date.today().weekday() not in POSTING_TAGE:
        log.info(f"Kein Posting-Tag heute – beende.")
        tg_send(f"⏭️ Heute kein Short-Tag. Naechster Run: Mo/Mi/Fr um {DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr.\n(Mit /jetzt trotzdem sofort starten.)")
        return
    log.info("=" * 50)
    art = todays_art_style()
    log.info(f"Instagram Short Workflow gestartet (Momus-Stil, {art['label']})")
    tg_send(f"📸 <b>Callidus Short Workflow gestartet!</b>\n🎨 Kunststil: {art['label']} | Stil: Satire + Aufklaerung")

    thema = todays_satire_thema()
    log.info(f"Satire-Thema: {thema}")
    tg_send(f"📌 <b>Thema:</b> {thema}\n🎬 Instagram Reel + YouTube Short")

    work_dir = tempfile.mkdtemp(dir=BASE_DIR)
    try:
        tg_send("✍️ Generiere Script (Satire → Aufklaerung)...")
        script = generate_script(thema)
        tg_send(f"📝 <b>Titel:</b> {script['titel']}\n\n⏳ Erstelle Video (ca. 5-8 Min)...")

        video_path = build_video(script, work_dir, mode=mode)
        tg_send("🎬 Video erstellt! Sende Vorschau...")

        tg_send_approval(video_path, script["titel"])
        approved = tg_wait_for_approval(timeout=3600)

        if approved:
            results = []

            # Instagram Upload
            tg_send("📸 Lade auf Instagram hoch...")
            ig_url = upload_instagram_reel(video_path, script)
            if ig_url:
                results.append(f"✅ Instagram: {ig_url}")
            else:
                results.append("⚠️ Instagram: Upload unklar")

            # YouTube Upload
            tg_send("📺 Lade auf YouTube hoch...")
            yt_url = upload_youtube(video_path, script)
            if yt_url:
                results.append(f"✅ YouTube: {yt_url}")
            else:
                results.append("⚠️ YouTube: Fehlgeschlagen")

            tg_send(
                f"🎉 <b>Fertig!</b>\n"
                f"📌 {script['titel']}\n\n"
                + "\n".join(results)
            )
            log.info("Workflow abgeschlossen")
        else:
            log.info("Reel abgelehnt")

    except Exception as e:
        log.error(f"Fehler: {e}", exc_info=True)
        tg_send(f"❌ <b>Fehler:</b>\n{str(e)[:500]}")
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

# ─── BOT-MODUS ────────────────────────────────────────────────────
def bot_mode():
    log.info("Instagram Bot gestartet")
    _singleton_lock = acquire_singleton_lock("callidus_instagram")  # nur 1 Instanz
    tg_send(
        "📸 <b>Callidus Short-Bot gestartet!</b>\n\n"
        f"📅 <b>Mo / Mi / Fr um {DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr</b> – Short (Satire+Aufklaerung)\n"
        "🎬 Instagram Reel + YouTube Short\n\n"
        "Befehle:\n"
        "/jetzt – Short sofort erstellen\n"
        "/status – Bot-Status\n"
        "/hilfe – Hilfe"
    )

    url_base           = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"
    last_update        = tg_get_last_update_id()
    last_daily_run     = None   # 18:00 Short
    workflow_running   = False

    while True:
        try:
            r = requests.get(
                f"{url_base}/getUpdates",
                params={"offset": last_update + 1, "timeout": 10,
                        "allowed_updates": json.dumps(["message", "callback_query"])},
                timeout=25
            )
            if r.status_code == 409:
                log.error("Telegram 409 Conflict: Eine ZWEITE Bot-Instanz pollt denselben Token! "
                          "Bitte alle instagram_bot.py-Prozesse beenden und nur einen starten.")
                time.sleep(15)
                continue
            r.raise_for_status()

            for update in r.json().get("result", []):
                last_update = update["update_id"]
                if "message" not in update:
                    continue
                msg     = update["message"]
                text    = msg.get("text", "").strip().lower()
                chat_id = str(msg["chat"]["id"])
                if chat_id != TELEGRAM_CHAT:
                    continue

                log.info(f"Befehl: '{text}'")

                if text in ("/jetzt", "jetzt"):
                    if workflow_running:
                        tg_send("⚠️ Workflow laeuft bereits!")
                    else:
                        tg_send("▶️ <b>Manueller Start!</b>")
                        workflow_running = True
                        try:
                            run_workflow(mode="video", force=True)
                        finally:
                            workflow_running = False
                            last_update = tg_get_last_update_id()

                elif text in ("/status", "status"):
                    now      = datetime.datetime.now()
                    next_run = now.replace(hour=DAILY_HOUR, minute=DAILY_MINUTE, second=0, microsecond=0)
                    if next_run <= now:
                        next_run += datetime.timedelta(days=1)
                    for _ in range(8):
                        if next_run.weekday() in POSTING_TAGE:
                            break
                        next_run += datetime.timedelta(days=1)
                    tg_send(
                        f"✅ <b>Short-Bot aktiv</b>\n"
                        f"🕐 {now.strftime('%d.%m.%Y %H:%M')}\n"
                        f"📅 Naechster Run: {next_run.strftime('%d.%m. %H:%M Uhr')}\n"
                        f"🔄 Laeuft: {'Ja ⏳' if workflow_running else 'Nein'}"
                    )

                elif text in ("/hilfe", "/help", "/start", "hilfe"):
                    tg_send(
                        "📖 <b>Short-Bot – Befehle</b>\n\n"
                        "/jetzt – Short sofort erstellen\n"
                        "/status – Bot-Status\n"
                        "/hilfe – Diese Hilfe\n\n"
                        f"⏰ Auto-Run: Mo/Mi/Fr um {DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr\n"
                        "📸 Format: Short 9:16 (Satire+Aufklaerung) → Instagram + YouTube"
                    )

            # Wöchentlicher Auto-Run – Short Mo/Mi/Fr um 18:00
            now   = datetime.datetime.now()
            today = now.date()

            if (now.hour == DAILY_HOUR and now.minute == DAILY_MINUTE
                    and now.weekday() in POSTING_TAGE
                    and last_daily_run != today and not workflow_running):
                last_daily_run   = today
                workflow_running = True
                tg_send(f"⏰ <b>Short-Start</b> ({DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr)")
                try:
                    run_workflow(mode="video")
                finally:
                    workflow_running = False
                    last_update = tg_get_last_update_id()

        except requests.exceptions.Timeout:
            log.warning("Timeout – weiter...")
        except requests.exceptions.ConnectionError as e:
            log.warning(f"Verbindungsfehler: {e} – warte 30s")
            time.sleep(30)
        except Exception as e:
            log.error(f"Bot-Fehler: {e}", exc_info=True)
            time.sleep(10)

        time.sleep(2)

# ─── EINSTIEGSPUNKT ───────────────────────────────────────────────
def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--bot":
        while True:
            try:
                bot_mode()
            except Exception as e:
                log.error(f"Bot abgestuerzt: {e} – Neustart in 30s")
                tg_send(f"🔄 Instagram Bot Neustart nach Fehler: {str(e)[:200]}")
                time.sleep(30)
    elif len(sys.argv) > 1 and sys.argv[1] == "images":
        run_workflow(mode="images")
    else:
        run_workflow(mode="video")

if __name__ == "__main__":
    main()
