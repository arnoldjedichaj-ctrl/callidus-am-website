#!/usr/bin/env python3
"""
Callidus A&M – Instagram Reels Automation v2 (KI-Video Edition)
Täglich auf Synology DS218 via Task Scheduler

Neu in v2:
  - KI-Videos via Fal.ai WAN v2.1 Text-to-Video ("WOW"-Qualitaet)
  - KI-Bilder via Fal.ai FLUX.1 [dev] (besser als Pollinations)
  - Wechselnde CTAs: Nexus App (Play Store) <-> Stress Reset Kurs
  - Cinematische video_prompts per Slide (von Gemini generiert)

Modi:
  python instagram_bot_v2.py         – Einmalig ausfuehren
  python instagram_bot_v2.py --bot   – Dauerhafter Bot-Modus

Kosten: ~$15-25/Monat bei taeglichem Betrieb (Fal.ai pay-as-you-go)
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
BASE_DIR         = os.environ.get("CALLIDUS_BASE_DIR", "/volume1/homes/arnold.jedich/callidus_youtube")
GEMINI_API_KEY   = "AIzaSyC95C8aG9m8XHgngbC3GVCOJYuf8Ab1j9A"
GEMINI_API_KEY_2 = "AIzaSyDSANrwcrumxJlcCHxB0tbrKiKbHxMWbdg"
# Automatische Key-Rotation: erschoepft Key 1 (429), wird Key 2 genutzt
GEMINI_KEYS = [k for k in (GEMINI_API_KEY, GEMINI_API_KEY_2) if k]
TELEGRAM_TOKEN   = "8681107127:AAFRU1t4Vhyh6B7siWrWJsz3DtQ1_q1FKzs"
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

CROSSFADE_DURATION = 2.4
SEGMENT_FADE_DURATION = 0.45
IMAGES_PER_SLIDE   = 3

# Tägliche automatische Ausführung
DAILY_HOUR   = 12   # Morgens: Bild-Variante (nur Bilder, kein Balken)
DAILY_MINUTE = 0
DAILY_HOUR_2   = 17   # Nachmittags: Video-Variante (Pexels-Videos + KI-Videos)
DAILY_MINUTE_2 = 0
POSTING_TAGE = {0, 2, 4, 6}  # Montag=0, Mittwoch=2, Freitag=4, Sonntag=6

# Overlay-Balken pro Modus
OVERLAY_BARS_IMAGES = False  # Morgen: Text direkt aufs Bild (moderner Look)
OVERLAY_BARS_VIDEOS = False  # Nachmittag: kein Balken – Karaoke-Untertitel ersetzt Subtitle

# Fal.ai KI-Video (Image-to-Video)
FAL_API_KEY = "2a668e17-e2d5-4623-a78b-b88e10cb9186:b9930c36a3037688090788fea7ae845a"   # https://fal.ai → API Keys


# ─── KÖRPER-VISUALISIERUNGSSTIL (Fal.ai FLUX / WAN) ───────────────
# Wird automatisch allen FLUX-Bildprompts vorangestellt
FLUX_STYLE_PREFIX = (
    "cinematic health story frame, consistent protagonist, expressive human emotion, "
    "premium film lighting, shallow depth of field, polished visual storytelling, "
    "high production value, no text in image - "
)

# ─── WÖCHENTLICHES THEMEN-SYSTEM ──────────────────────────────────
# Jede Woche ein Story-Pool: kleine Gesundheitsgeschichten aus dem Alltag.
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

# Beats fuers FAKTEN-FORMAT: Hook → Spannung → Aufloesung (Commercial-Dramaturgie)
CINEMATIC_BEATS = [
    "hook: a striking visual question mark - dramatic macro or unexpected detail that stops the scroll",
    "tension: revealing b-roll builds curiosity, the viewer senses something important",
    "tension: deeper into the mechanism - abstract body/nature visuals, rising intensity",
    "tension: evidence stacks up, precise and scientific-looking imagery",
    "tension: the picture is almost complete, light shifts warmer",
    "tension: final beat before the reveal, focused and suspenseful",
    "reveal approach: everything converges toward the answer",
    "reveal: the satisfying payoff shot - clarity, warm premium light",
    "recommendation: elegant premium product-context scene with warm inviting glow",
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
        base = "premium commercial health b-roll scene"

    is_cta = slide_index == total_slides - 1
    profile_idx = episode_style_index if episode_style_index is not None else slide_index
    profile = CINEMATIC_STYLE_PROFILES[profile_idx % len(CINEMATIC_STYLE_PROFILES)]
    beat = CINEMATIC_BEATS[min(slide_index, len(CINEMATIC_BEATS) - 1)]

    if is_cta:
        profile = {
            "name": "premium recommendation reveal",
            "look": "elegant premium wellness product-context scene, warm golden studio light, luxurious minimalist composition",
            "camera": "slow macro dolly-in with soft depth of field, inviting final reveal",
        }
        beat = "recommendation: elegant premium product-context scene with warm inviting glow"

    # Fakten-Format: keine durchgehende Hauptfigur mehr noetig
    character_lock = (
        f"Character continuity: {character_bible}. Keep exactly the same protagonist in every shot. "
        if character_bible else
        "Consistent premium commercial look and color grade across all shots. "
    )

    return (
        f"{character_lock}{base}. Visual style: {profile['look']}. Story beat: {beat}. "
        f"Camera direction: {profile['camera']}. "
        "Make it a single coherent 5-second cinematic shot with visible motion, clear beginning-middle-end, "
        "depth of field, volumetric lighting, subtle particles, smooth realistic motion, emotionally engaging but medically accurate. "
        "Natural human anatomy and lens perspective, correct body proportions, no squeezed or stretched face/body, true vertical portrait composition. "
        f"Frame for {aspect_ratio}. "
        f"Negative prompt: {NEGATIVE_VIDEO_PROMPT}."
    )

def get_episode_style_index(seed_text):
    return sum(ord(ch) for ch in seed_text or "") % len(CINEMATIC_STYLE_PROFILES)

def get_episode_style_text(style_index):
    profile = CINEMATIC_STYLE_PROFILES[style_index % len(CINEMATIC_STYLE_PROFILES)]
    return f"{profile['name']}, {profile['look']}"

# ─── WOCHENTAGS-TON & -STIL (Story nicht immer traurig!) ──────────
# Mo=0, Mi=2, Fr=4, So=6  (entspricht POSTING_TAGE)
WEEKDAY_TONE = {
    0: {  # Montag – INSPIRIEREND
        "label": "inspirierend",
        "style_idx": 4,  # stylized 3D animation
        "regie": ("INSPIRIERENDER TON: Erzaehle eine motivierende Aufbruchs-Geschichte. "
                  "Die Figur fasst Mut, ueberwindet eine kleine Huerde und waechst daran. "
                  "Energiegeladen, kraftvoll, Gaensehaut-Moment am Ende. KEINE Tristesse."),
        "struktur": ("- Slide 1: Figur steht vor einer Herausforderung, will etwas veraendern.\n"
                     "- Slide 2: Erster mutiger Schritt, kleine Unsicherheit.\n"
                     "- Slide 3: Dranbleiben trotz Zweifel.\n"
                     "- Slide 4: Der Gesundheitsimpuls gibt ihr Kraft/Klarheit.\n"
                     "- Slide 5: Sichtbarer Fortschritt, wachsendes Selbstvertrauen.\n"
                     "- Slide 6: Stolzer, kraftvoller Moment - sie hat es geschafft."),
    },
    2: {  # Mittwoch – LUSTIG
        "label": "lustig",
        "style_idx": 1,  # anime slice of life
        "regie": ("HUMORVOLLER TON: Erzaehle die Geschichte mit Augenzwinkern und Situationskomik. "
                  "Sympathische Missgeschicke, charmanter Witz, Selbstironie. "
                  "Am Ende loest sich alles froehlich auf. Leicht und unterhaltsam."),
        "struktur": ("- Slide 1: Komisch-chaotischer Start, Figur nimmt sich selbst nicht zu ernst.\n"
                     "- Slide 2: Ein witziges Missgeschick im Alltag.\n"
                     "- Slide 3: Noch ein Lacher, Figur kapituliert humorvoll.\n"
                     "- Slide 4: Sie entdeckt den Gesundheitsimpuls (mit Schmunzeln).\n"
                     "- Slide 5: Es wirkt - sie staunt selbst, kleiner Gag.\n"
                     "- Slide 6: Froehliches, lustiges Happy End mit Freunden."),
    },
    4: {  # Freitag – AUFKLAEREND
        "label": "aufklaerend",
        "style_idx": 0,  # cinematic live action
        "regie": ("AUFKLAERENDER TON: Vermittle ein konkretes Gesundheits-Aha. "
                  "Die Figur lernt etwas Ueberraschendes ueber ihren Koerper/eine Routine. "
                  "Klar, fundiert, glaubwuerdig - aber als Geschichte, nicht als Vortrag."),
        "struktur": ("- Slide 1: Figur hat ein alltaegliches Problem, kennt die Ursache nicht.\n"
                     "- Slide 2: Sie wundert sich, sucht nach dem Warum.\n"
                     "- Slide 3: Aha-Moment: eine ueberraschende Erklaerung/Fakt.\n"
                     "- Slide 4: Sie wendet das neue Wissen konkret an.\n"
                     "- Slide 5: Sichtbare Verbesserung, sie versteht den Zusammenhang.\n"
                     "- Slide 6: Zufrieden teilt sie die Erkenntnis mit anderen."),
    },
    6: {  # Sonntag – ERFREULICH / WARMHERZIG
        "label": "erfreulich",
        "style_idx": 2,  # warm storybook animation
        "regie": ("WARMHERZIGER TON: Eine ruhige, herzerwaermende Wohlfuehl-Geschichte. "
                  "Sanft, dankbar, verbindend, hoffnungsvoll. Gibt ein gutes, warmes Gefuehl. "
                  "Keine Dramatik - einfach schoen und menschlich."),
        "struktur": ("- Slide 1: Ruhiger, schoener Moment im Leben der Figur.\n"
                     "- Slide 2: Eine kleine Sehnsucht nach mehr Wohlbefinden.\n"
                     "- Slide 3: Sie goennt sich bewusst etwas Gutes.\n"
                     "- Slide 4: Der Gesundheitsimpuls als liebevolles Ritual.\n"
                     "- Slide 5: Warme, wohlige Veraenderung, Dankbarkeit.\n"
                     "- Slide 6: Geteilte Freude, Naehe, herzliches Lebensgefuehl."),
    },
}

def todays_tone():
    """Liefert Ton + visuellen Stil fuer heute (nach Wochentag). Fallback: inspirierend."""
    wd = datetime.date.today().weekday()
    return WEEKDAY_TONE.get(wd, WEEKDAY_TONE[0])

# ─── WOCHENTAGS-KUNSTSTIL (nicht realistisch! identisch zu main_v2) ─
WEEKDAY_ART_STYLE = {
    0: {"label": "3D Animation Cartoon",
        "prefix": ("stylized 3D animated cartoon movie still, Pixar-like rendering, charming stylized "
                   "characters, soft global illumination, vibrant playful colors, smooth polished materials, "
                   "NOT photorealistic, no real photo, ")},
    2: {"label": "Ghibli Cartoon",
        "prefix": ("Studio Ghibli style hand-painted anime film still, soft watercolor backgrounds, gentle "
                   "warm natural light, expressive friendly characters, painterly textures, whimsical cozy mood, "
                   "NOT photorealistic, no real photo, ")},
    4: {"label": "Comic",
        "prefix": ("western comic book and graphic novel art, bold black ink outlines, halftone shading, "
                   "dynamic comic panel composition, flat saturated colors, energetic poses, "
                   "NOT photorealistic, no real photo, ")},
    6: {"label": "Anime",
        "prefix": ("modern Japanese anime style, clean cel shading, expressive large eyes, detailed anime "
                   "backgrounds, cinematic anime lighting and color grade, slice-of-life mood, "
                   "NOT photorealistic, no real photo, ")},
}

# ─── FESTER STIL: High-Budget Commercial (Shorts) – Werbespot-Look ─
CINEMATIC_MOVIE_STYLE = {
    "label": "High-Budget Commercial",
    "prefix": ("premium high-budget commercial film, shot on RED camera, dramatic studio lighting, "
               "macro detail cinematography, slow-motion b-roll aesthetics, rich cinematic color grade, "
               "photorealistic, luxurious product-commercial composition, crisp 8k detail, "
               "advertising campaign quality, "),
}

def todays_art_style():
    """Fester Stil fuer den Shorts-Bot: High-Budget-Commercial-Look."""
    return CINEMATIC_MOVIE_STYLE

def make_character_reference_prompt(character_bible, style_index):
    _art = todays_art_style()
    return (
        f"{_art['prefix']}"
        f"Vertical 9:16 character reference portrait for a health story. "
        f"{character_bible}. Consistent art style: {_art['label']}. "
        "Medium shot, correct face and body proportions, normal lens perspective, "
        "comfortable headroom, no squeezed face, no stretched body, no warped hands, no text, no logo, no watermark. "
        "Warm Callidus color mood: deep green, soft cream, muted gold accents, clean composition."
    )

def make_scene_keyframe_prompt(cinematic_video_prompt, character_bible, style_index):
    _art = todays_art_style()
    return (
        f"{_art['prefix']}"
        f"Vertical 9:16 keyframe for image-to-video. Use the exact same protagonist: {character_bible}. "
        f"Keep identical face, hairstyle, age, body type, outfit colors and accessory. Consistent art style: {_art['label']}. "
        f"Scene: {cinematic_video_prompt}. "
        "Compose as a natural medium shot or medium close-up with headroom. "
        "Correct proportions, no squeezed or compressed body, no stretched face, no fisheye, no text, no subtitles, no watermark."
    )

WOCHEN_THEMEN = [
    {
        "kategorie": "Morgen-Chaos",
        "intro": "Diese Woche: Kleine Gesundheitsgeschichten aus dem Alltag.",
        "tage": [
            "Junger Mann wacht erschoepft auf, der Morgen geht schief, Magnesium wird zum ruhigen Wendepunkt.",
            "Junge Frau verschlaeft, ist gestresst, Vitamin C und Wasser geben ihr einen frischen Neustart.",
            "Bueroarbeiter ist fahrig vom Kaffee, Elektrolyte und Pause bringen ihn zurueck in Balance.",
            "Studentin ist unkonzentriert, Atemroutine und Spaziergang machen den Tag leichter.",
            "Vater ist muede und gereizt, Omega-3-Routine und Kochen mit Freunden bringen Freude.",
            "Kreative Frau steckt im Wintertief, Vitamin D Routine und Sonnenlicht oeffnen den Tag.",
            "Sportliche Frau hat schwere Beine, Magnesium und sanfte Bewegung fuehren zu neuer Leichtigkeit.",
        ]
    },
    {
        "kategorie": "Alltags-Wendepunkte",
        "intro": "Diese Woche: Vom Tiefpunkt zur kleinen gesunden Routine.",
        "tage": [
            "Ein chaotischer Pendler verliert fast die Nerven, Wasser und Mineralien retten den Nachmittag.",
            "Eine junge Mutter ist erschoepft, eine kurze Abendroutine bringt ihr ein echtes Lachen zurueck.",
            "Ein Selbststaendiger vergisst Pausen, merkt den Kopfdruck und findet Ruhe durch Atem und Magnesium.",
            "Eine Freundin sagt Treffen ab, findet mit Spaziergang und Vitamin C doch noch Energie fuer Menschen.",
            "Ein Mann fuehlt sich sozial leer, startet mit Schlafroutine und wacht am naechsten Tag heller auf.",
            "Eine Frau hat einen schlechten Arbeitstag, entdeckt die Nexus App und baut eine kleine Routine ein.",
            "Ein junger Mann stolpert durch Regen und Stress, am Ende lacht er mit Freunden im warmen Licht.",
        ]
    },
    {
        "kategorie": "Geist & Fokus",
        "intro": "Diese Woche: Kleine Storys rund um Kopf, Ruhe und Fokus.",
        "tage": [
            "Studentin kreist gedanklich vor einer Pruefung, legt das Handy weg, atmet ruhig und findet Fokus.",
            "Junger Mann overthinkt jede Nachricht, macht eine Pause und lacht spaeter entspannt mit Freunden.",
            "Kreative Frau verliert sich im Stress, ein Spaziergang bringt ihre Ideen und Leichtigkeit zurueck.",
            "Bueroarbeiter starrt leer auf den Bildschirm, Atemroutine und Wasser machen den Kopf wieder klar.",
            "Eine Freundin ist innerlich unruhig, schreibt drei Gedanken auf und trifft den Abend gelassener.",
            "Ein Vater wacht nachts oft auf, baut eine ruhige Abendroutine und startet weicher in den Morgen.",
            "Eine junge Frau scrollt zu lange, legt das Handy weg und findet wieder echte Naehe.",
        ]
    },
    {
        "kategorie": "Sport & Energie",
        "intro": "Diese Woche: Kleine Storys ueber Bewegung, Regeneration und Energie.",
        "tage": [
            "Hobbylaeufer bricht frustriert ab, entdeckt Regeneration und Protein und laeuft spaeter mit Freude.",
            "Sportliche Frau hat schwere Beine, Magnesium und sanfte Bewegung fuehren zu neuer Leichtigkeit.",
            "Junger Mann sitzt den ganzen Tag, ein Mobility-Block macht den Abend ploetzlich lebendig.",
            "Eine Frau traut sich nicht ins Training, startet klein und lacht spaeter ueber ihren Mut.",
            "Ein Team ist nach Arbeit platt, ein kurzer Spaziergang veraendert die Stimmung sichtbar.",
            "Student vergisst zu trinken, Elektrolyte und Pause bringen Energie vor dem Training zurueck.",
            "Eine aeltere Frau beginnt mit zehn Minuten Bewegung und trifft wieder Menschen draussen.",
        ]
    },
    {
        "kategorie": "Ernaehrung & Alltag",
        "intro": "Diese Woche: Kleine Storys ueber Essen, Routinen und echte Energie.",
        "tage": [
            "Junge Mutter snackt nur Suesses, bekommt ein Tief und findet durch eine einfache Mahlzeit neue Energie.",
            "Bueroarbeiter vergisst Fruehstueck, wird fahrig und entdeckt eine kleine Proteinroutine.",
            "Ein Paar streitet hungrig nach der Arbeit, kocht gemeinsam und der Abend wird warm.",
            "Student lebt von Kaffee, Wasser und Elektrolyte machen den Nachmittag ruhiger.",
            "Eine Frau fuehlt sich schwer nach Fastfood, waehlt am naechsten Tag leichter und geht raus.",
            "Junger Mann nimmt Vitamin C mit Wasser und macht daraus einen hellen Morgenanker.",
            "Freunde planen Pizza, bauen Salat und Spaziergang dazu und lachen ueber Balance statt Verzicht.",
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


# ─── AFFILIATE-PRODUKTE (kuratiert von callidus-am.de/unsere-empfehlungen) ─
# 1 Produkt pro Video in Rotation; der Video-Inhalt passt thematisch zum Produkt.
# "winkel" = inhaltlicher Aufhaenger fuer das Fakten-Video (KEINE Heilversprechen!).
AFFILIATE_PRODUKTE = [
    {"name": "Magnesiumbisglycinat",        "kategorie": "Magnesium",          "winkel": "Schlafqualitaet, Muskelentspannung, Nervensystem",   "link": "https://amzn.to/4uhyy2w"},
    {"name": "NORSAN Omega-3",              "kategorie": "Omega-3-Fettsaeuren", "winkel": "Gehirnleistung, Herz, Zellmembranen",               "link": "https://amzn.to/4uSiPXP"},
    {"name": "Vitamin D3+K2 Tropfen",       "kategorie": "Vitamin D3 und K2",  "winkel": "Immunsystem, Knochen, Stimmung im Winter",           "link": "https://amzn.to/3P917jH"},
    {"name": "Natuerliches Vitamin C",      "kategorie": "Vitamin C",          "winkel": "Immunsystem, Kollagenbildung, Zellschutz",           "link": "https://amzn.to/3OWT6hJ"},
    {"name": "Ashwagandha",                 "kategorie": "Adaptogene",         "winkel": "Stressregulation, Cortisol, innere Ruhe",            "link": "https://amzn.to/4wnoOFw"},
    {"name": "Zink",                        "kategorie": "Zink",               "winkel": "Immunabwehr, Haut, Hormonbalance",                   "link": "https://amzn.to/4ufOz9x"},
    {"name": "Coenzym Q10",                 "kategorie": "Q10",                "winkel": "Zellenergie, Mitochondrien, Muedigkeit",             "link": "https://amzn.to/4wnlJVY"},
    {"name": "Aktiver Vitamin-B-Komplex",   "kategorie": "B-Vitamine",         "winkel": "Nerven, Energiestoffwechsel, Konzentration",         "link": "https://amzn.to/4ud3WPI"},
    {"name": "Probiona Probiotika-Komplex", "kategorie": "Probiotika",         "winkel": "Darmflora, Verdauung, Darm-Hirn-Achse",              "link": "https://amzn.to/4tHPNcv"},
    {"name": "Bio Akazienfaser Pulver",     "kategorie": "Ballaststoffe",      "winkel": "Darmgesundheit, Saettigung, Blutzucker",             "link": "https://amzn.to/3R8qGSA"},
    {"name": "Kollagen Hydrolysat",         "kategorie": "Kollagen",           "winkel": "Haut, Gelenke, Bindegewebe",                         "link": "https://coachcecil.de/r?id=v8lmb7"},
    {"name": "JARMINO Bio Knochenbruehe",   "kategorie": "Knochenbruehe",      "winkel": "Darm, Kollagen, traditionelle Naehrstoffe",          "link": "https://amzn.to/4twegkJ"},
    {"name": "Kreatin Monohydrat",          "kategorie": "Kreatin",            "winkel": "Muskelkraft, Gehirnleistung, Zellenergie",           "link": "https://amzn.to/4ntbxHq"},
    {"name": "Bio Hanfprotein",             "kategorie": "Pflanzenprotein",    "winkel": "Muskelerhalt, Aminosaeuren, Saettigung",             "link": "https://amzn.to/493J8BW"},
    {"name": "Kurkuma Pulver Bio",          "kategorie": "Kurkuma",            "winkel": "Entzuendungsbalance, Gelenke, Verdauung",            "link": "https://amzn.to/494D6RD"},
    {"name": "Shilajit Original Himalaya",  "kategorie": "Shilajit",           "winkel": "Mineralstoffe, Vitalitaet, Ausdauer",                "link": "https://amzn.to/43fvt7e"},
    {"name": "Mariendistel-Extrakt",        "kategorie": "Mariendistel",       "winkel": "Leber, Entgiftungsorgane, Regeneration",             "link": "https://amzn.to/4udqIah"},
    {"name": "Bio Reishi",                  "kategorie": "Vitalpilze",         "winkel": "Entspannung, Schlaf, Immunmodulation",               "link": "https://amzn.to/4d9CIne"},
    {"name": "BIO Cordyceps",               "kategorie": "Cordyceps",          "winkel": "Energie, Ausdauer, Atmung",                          "link": "https://amzn.to/4tHk4rU"},
    {"name": "Spermidin",                   "kategorie": "Spermidin",          "winkel": "Autophagie, Zellerneuerung, Langlebigkeit",          "link": "https://amzn.to/3PnvOle"},
    {"name": "MoleQlar NMN",                "kategorie": "NMN",                "winkel": "NAD+-Spiegel, Zellenergie, gesundes Altern",         "link": "https://amzn.to/4uejh2N"},
    {"name": "MoleQlar Fisetin",            "kategorie": "Fisetin",            "winkel": "Zellalterung, Senolytika, Longevity-Forschung",      "link": "https://amzn.to/4tCefvK"},
    {"name": "Bio Gerstengras Pulver",      "kategorie": "Gerstengras",        "winkel": "Mikronaehrstoffe, Saeure-Basen-Haushalt",            "link": "https://amzn.to/3PpqMVa"},
    {"name": "Zeremonieller Matcha",        "kategorie": "Matcha",             "winkel": "Fokus, L-Theanin, sanfte Energie",                   "link": "https://amzn.to/4ntHEqq"},
    {"name": "BIO Yerba Mate Set",          "kategorie": "Yerba Mate",         "winkel": "Wachheit ohne Kaffee-Crash, Antioxidantien",         "link": "https://amzn.to/4nvytG1"},
    {"name": "Bergblut Ingwer-Kurkuma-Shot","kategorie": "Ingwer-Shots",       "winkel": "Immunsystem, Morgenroutine, Schaerfe-Kick",          "link": "https://amzn.to/4tCnPPe"},
    {"name": "ShaktiMat Akupressurmatte",   "kategorie": "Akupressur",         "winkel": "Verspannungen, Entspannung, Schlafritual",           "link": "https://amzn.to/4wo9g4v"},
    {"name": "Akroma Gewichtsdecke",        "kategorie": "Gewichtsdecken",     "winkel": "Tiefschlaf, Beruhigung des Nervensystems",           "link": "https://amzn.to/4fjnBJi"},
    {"name": "Beurer TL 30 Tageslichtlampe","kategorie": "Tageslichtlampen",   "winkel": "Wintermuedigkeit, zirkadianer Rhythmus, Stimmung",   "link": "https://amzn.to/4nAmQ0D"},
    {"name": "Blackroll Faszienrolle",      "kategorie": "Faszientraining",    "winkel": "Regeneration, Beweglichkeit, Verspannungen",         "link": "https://amzn.to/4udsOXH"},
    {"name": "Massagepistole",              "kategorie": "Massage-Tools",      "winkel": "Muskelregeneration, Durchblutung",                   "link": "https://amzn.to/4eQeQ9p"},
    {"name": "6-Minuten-Tagebuch",          "kategorie": "Journaling",         "winkel": "Mentale Gesundheit, Dankbarkeit, Schlafhygiene",     "link": "https://amzn.to/4wxrf8w"},
    {"name": "Tibetische Klangschale",      "kategorie": "Klangtherapie",      "winkel": "Meditation, Stressabbau, Abendritual",               "link": "https://amzn.to/4eQedg3"},
    {"name": "ALPEN HERZ Zirbenwuerfel",    "kategorie": "Zirbenholz",         "winkel": "Schlafumgebung, natuerliche Aromen",                 "link": "https://amzn.to/42Dh5pe"},
]

def todays_affiliate_product():
    """Produkt des Tages (Rotation ueber Posting-Tage)."""
    return AFFILIATE_PRODUKTE[datetime.date.today().toordinal() % len(AFFILIATE_PRODUKTE)]


# ─── CALLIDUS CTA-SYSTEM (v2) ──────────────────────────────────────
# Wechselt wöchentlich zwischen Nexus App und Stress Reset Kurs
CALLIDUS_CTAS = {
    "nexus_app": {
        "sprechtext": "Die Nexus App ist jetzt kostenlos im Play Store! Dein persoenlicher KI-Gesundheitscoach fuer Koerper und Geist. Einfach nach Callidus Nexus App suchen oder Link in der Bio!",
        "cta_text":   "Nexus App – jetzt kostenlos!",
        "bildsuche":  "health app smartphone technology wellness"
    },
    "stress_reset": {
        "sprechtext": "Chronischer Stress kostet dich deine Gesundheit. Der Stress Reset Kurs auf callidus-am.de hilft dir in 4 Wochen, Stress dauerhaft zu reduzieren. Link in der Bio!",
        "cta_text":   "Stress Reset Kurs",
        "bildsuche":  "calm nature meditation peace wellness"
    }
}

def get_cta_fuer_heute():
    """Gibt den CTA der aktuellen Woche zurück (wechselt wöchentlich)."""
    woche = datetime.date.today().toordinal() // 7
    return CALLIDUS_CTAS["nexus_app"] if woche % 2 == 0 else CALLIDUS_CTAS["stress_reset"]



# ─── LOGGING ──────────────────────────────────────────────────────
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
logging.basicConfig(
    filename=f"{LOGS_DIR}/instagram_v2_workflow.log",
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
    # offset=-1 liefert das WIRKLICH letzte Update (limit=1 allein gaebe das aelteste!)
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    try:
        r = requests.get(url, params={"offset": -1, "limit": 1, "timeout": 0}, timeout=15)
        updates = r.json().get("result", [])
        return updates[-1]["update_id"] if updates else 0
    except Exception as e:
        log.warning(f"tg_get_last_update_id Fehler: {e}")
        return 0

def tg_wait_for_approval(timeout=3600, approval_msg_id=None, baseline_update_id=None):
    """Wartet auf Button-Klick. baseline_update_id VOR dem Senden der Vorschau erfassen,
    damit auch sofortige Klicks nicht verloren gehen. approval_msg_id ordnet den Klick
    eindeutig UNSERER Vorschau-Nachricht zu (alte/fremde Buttons werden ignoriert)."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    last_update = baseline_update_id if baseline_update_id is not None else tg_get_last_update_id()
    tg_send("⏳ Warte auf Freigabe... (Timeout: 1 Stunde)")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, params={"offset": last_update + 1, "timeout": 30},
                             timeout=(15, 45))
        except Exception as e:
            log.warning(f"Approval-Polling Fehler: {e}")
            time.sleep(5)
            continue
        if r.status_code == 409:
            # Zweiter Prozess pollt denselben Bot-Token und stiehlt die Klicks!
            log.warning("Telegram 409: anderer Prozess pollt getUpdates – Klicks gehen evtl. verloren!")
            time.sleep(5)
            continue
        updates = r.json().get("result", [])
        for update in updates:
            last_update = update["update_id"]
            if "callback_query" not in update:
                continue
            cb          = update["callback_query"]
            data        = cb.get("data", "")
            callback_id = cb.get("id")
            cb_msg_id   = cb.get("message", {}).get("message_id")
            # Klick gehoert zu einer ALTEN Vorschau? → Spinner beenden, weiter warten
            if approval_msg_id is not None and cb_msg_id != approval_msg_id:
                requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/answerCallbackQuery",
                              json={"callback_query_id": callback_id,
                                    "text": "Veraltete Vorschau – bitte die neueste nutzen."})
                continue
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/answerCallbackQuery",
                          json={"callback_query_id": callback_id})
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
    # FAKTEN-FORMAT: Inhalt dreht sich um das Affiliate-Produkt des Tages
    # (thema/kategorie/intro aus dem alten Story-System werden ignoriert)
    produkt = todays_affiliate_product()

    prompt = f"""Du bist Wissenschaftsjournalist und Werbe-Regisseur fuer "callidus A&M" (Gesundheitswissen).
Erstelle ein Instagram Reel im FAKTEN-FORMAT (kein Storytelling, KEINE fiktive Hauptfigur!) zum Thema: "{produkt['kategorie']}".
Inhaltlicher Fokus: {produkt['winkel']}.

FORMAT-REGELN (KNALLHARTE FAKTEN):
- Slide 1 (HOOK): Eine PROVOKANTE Frage oder Schock-Aussage zum Thema, die sofort stoppt.
  Beispiele fuer den Ton: "Warum ignorieren 80% der Deutschen das wichtigste Mineral ihres Koerpers?" /
  "Dein Gehirn schrumpft - und niemand sagt dir warum." Die Antwort wird NICHT verraten!
- Slides 2-7 (SPANNUNG): Ueberraschende, wenig bekannte Fakten zum Thema - Dinge, die kaum jemand weiss.
  Jeder Slide ein Aha-Moment. Konkrete Zahlen, Studienerkenntnisse, Mechanismen im Koerper.
  Baue die Spannung Richtung Aufloesung auf: jeder Fakt bringt den Zuschauer naeher zur Antwort der Hook-Frage.
- Slide 8 (AUFLOESUNG): Die klare Antwort auf die Hook-Frage. Jetzt ergibt alles Sinn.
  Natuerliche Ueberleitung: warum {produkt['kategorie']} hier relevant ist.
- Slide 9 (CTA): Empfehlung. Sprechtext EXAKT: "Unsere Empfehlung dazu findest du in der Beschreibung. Mehr gepruefte Empfehlungen auf callidus-am.de."

WICHTIG:
- DEUTSCHE UMLAUTE PFLICHT: Schreibe in allen deutschen Texten (titel, sprechtext, beschreibung)
  IMMER echte Umlaute ä, ö, ü, Ä, Ö, Ü und ß. NIEMALS Umschreibungen wie ae, oe, ue.
- KEINE HEILVERSPRECHEN (deutsches Heilmittelwerbegesetz!): Keine Aussagen wie "heilt", "bekaempft Krankheit X",
  "macht gesund". Erlaubt: "traegt bei", "unterstuetzt", "spielt eine Rolle bei", "die Forschung zeigt Zusammenhaenge".
- Fakten muessen stimmen: nur etablierte, wissenschaftlich belegte Aussagen. Lieber ein solider Fakt als eine steile These.
- Sprechtext 30-40 Woerter pro Slide. Kurze, knackige Saetze. Direkte Ansprache "du/dein".
- GENAU 9 Slides.

VIDEO_PROMPT REGIE (HIGH-BUDGET COMMERCIAL):
Fuer jeden Slide einen englischen "video_prompt" - eine Szene wie aus einem teuren Werbespot:
Makroaufnahmen (Zutaten, Wassertropfen, Kristalle, Zellstrukturen abstrakt), edle Slow-Motion-B-Roll,
Lifestyle-Momente (Haende, Morgenlicht, Kueche, Natur), Labor-Aesthetik.
Jeder Prompt: subject, action, camera movement (slow dolly, macro push-in, orbit), lighting (dramatic, golden hour, studio).
KEINE durchgehende Person noetig - jede Szene darf eigenstaendig sein. Fotorealistisch, KEIN Cartoon.
Keine Texteinblendungen, keine Logos im Bild. Maximal 60 Woerter pro Prompt.

BILDSUCHE:
"bildsuche" = kurze englische Szenen-Keywords, z.B. "macro shot magnesium crystals dark background", "morning light kitchen glass water slow motion".

JSON Format:
{{
  "titel": "Provokanter kurzer Titel ohne Emoji (die Hook-Frage in Kurzform)",
  "character_bible": "",
  "beschreibung": "Kurze Instagram Caption: die Hook-Frage + 1 Satz Neugier + Hashtags. Ohne Heilversprechen, ohne Link (wird automatisch ergaenzt).",
  "tags": ["gesundheit","wissen","{produkt['kategorie'].lower().replace(' ', '')}","callidus","facts"],
  "slides": [
    {{"text": "Hook",       "sprechtext": "30-40 Woerter: provokante Frage/Schock-Aussage, Antwort NICHT verraten.", "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fakt 1",     "sprechtext": "30-40 Woerter: erster ueberraschender Fakt.",                             "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fakt 2",     "sprechtext": "30-40 Woerter: naechster Aha-Fakt, Spannung steigt.",                     "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fakt 3",     "sprechtext": "30-40 Woerter: Mechanismus im Koerper, kaum bekannt.",                    "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fakt 4",     "sprechtext": "30-40 Woerter: konkrete Zahl/Studie, die ueberrascht.",                   "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fakt 5",     "sprechtext": "30-40 Woerter: der Fakt, der am naechsten zur Aufloesung fuehrt.",        "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Fast da",    "sprechtext": "30-40 Woerter: letzter Spannungsaufbau direkt vor der Antwort.",          "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Aufloesung", "sprechtext": "30-40 Woerter: DIE Antwort auf die Hook-Frage + Bezug zu {produkt['kategorie']}.", "bildsuche": "scene keywords", "video_prompt": "..."}},
    {{"text": "Empfehlung", "sprechtext": "Unsere Empfehlung dazu findest du in der Beschreibung. Mehr gepruefte Empfehlungen auf callidus-am.de.", "bildsuche": "premium product presentation studio light", "video_prompt": "..."}}
  ]
}}
Nur JSON, kein Markdown!"""

    # REST API direkt – Key-Rotation + Modell-Fallback bei Rate-Limit
    _models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
    _resp = None
    _success = False
    for _ki, _key in enumerate(GEMINI_KEYS):
        for _model in _models:
            _url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{_model}:generateContent?key={_key}")
            for _attempt in range(3):
                try:
                    _resp = requests.post(_url,
                                          json={"contents": [{"parts": [{"text": prompt}]}]},
                                          timeout=(15, 120))
                except requests.exceptions.Timeout:
                    log.warning(f"Key{_ki+1}/{_model}: Timeout (Versuch {_attempt+1}/3)")
                    time.sleep(20)
                    continue
                if _resp.status_code == 429:
                    log.warning(f"Key{_ki+1}/{_model} 429 (Versuch {_attempt+1}/3)")
                    time.sleep(30 * (2 ** _attempt))
                    continue
                if not _resp.ok:
                    log.warning(f"Key{_ki+1}/{_model} HTTP {_resp.status_code}: {_resp.text[:150]} – naechstes Modell")
                    break
                _success = True
                break
            if _success:
                log.info(f"Script via Key{_ki+1}/{_model} OK")
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
    raw  = _re.sub(r',\s*([}\]])', r'\1', raw)
    raw  = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as _e:
        log.warning(f"JSON-Fehler: {_e} – bereinige und wiederhole")
        raw2 = _re.sub(r'\r?\n', ' ', raw)
        raw2 = _re.sub(r',\s*([}\]])', r'\1', raw2)
        data = json.loads(raw2)

    # Affiliate-Block programmatisch anhaengen (Link nie der KI ueberlassen)
    # inkl. Werbekennzeichnung (rechtlich Pflicht in DE)
    data["beschreibung"] = (
        data.get("beschreibung", "").strip()
        + f"\n\n🛒 Unsere Empfehlung: {produkt['name']}\n{produkt['link']}\n"
        + "(Werbung | Affiliate-Link – dir entstehen keine Mehrkosten)\n"
        + "Alle geprüften Empfehlungen: https://callidus-am.de/unsere-empfehlungen/"
    )
    data["_produkt"] = produkt  # fuer Logging/Telegram

    log.info(f"Script: {data['titel']} ({len(data.get('slides', []))} Slides) | Produkt: {produkt['name']}")
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
                    log.warning(f"TTS {_model} HTTP {resp.status_code}: {resp.text[:300]}")
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

                log.info(f"Audio: {output_path} (via {_model})")
                return
            except requests.exceptions.Timeout:
                last_error = "Timeout nach 120s"
                log.warning(f"TTS {_model} Timeout (Versuch {attempt+1}/4) – 15s...")
                time.sleep(15)
            except requests.exceptions.HTTPError as e:
                last_error = str(e)
                if resp.status_code == 429:
                    _retry_after = resp.headers.get("Retry-After") or resp.headers.get("retry-after")
                    _tts_waits = [120, 300, 600, 900]
                    if _retry_after:
                        try:
                            _wait = int(_retry_after) + 10
                        except ValueError:
                            _wait = _tts_waits[attempt]
                    else:
                        _wait = _tts_waits[attempt]
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
    generate_silent_audio(output_path, min(20.0, max(4.0, _words / 2.3)))
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


# ─── KI-VIDEO & KI-BILD (v2) ──────────────────────────────────────
# Importiert aus fal_client.py (liegt im gleichen Ordner)
try:
    import sys as _sys
    _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from fal_client import (generate_ai_image_flux, generate_ai_video_wan,
                            generate_ai_video_kling_i2v, generate_ai_video_seedance)
    log.info("fal_client importiert (v2 KI-Funktionen aktiv)")
except ImportError as _e:
    log.warning(f"fal_client nicht gefunden: {_e} – KI-Video/Bild deaktiviert")
    def generate_ai_image_flux(prompt, output_path, width=1080, height=1920):
        return None
    def generate_ai_video_wan(prompt, output_path, aspect_ratio="9:16"):
        return None
    def generate_ai_video_kling_i2v(image_path, prompt, output_path, aspect_ratio="9:16", duration="5"):
        return None
    def generate_ai_video_seedance(prompt, output_path, aspect_ratio="9:16", duration=5):
        return None

# KI-Video Qualitaet:
# economy = 3 WAN-Clips, profi = 4 WAN-Clips, max = alle 7 Slides.
# Auf der NAS optional steuerbar mit: export CALLIDUS_VIDEO_QUALITY=profi
# Fuer Story-Shorts ist "max" Standard: alle 7 Szenen sollen bewegte WAN-Clips werden.
VIDEO_QUALITY_PRESET = os.environ.get("CALLIDUS_VIDEO_QUALITY", "economy").lower()
KI_VIDEO_MAX_BY_PRESET = {"economy": 3, "profi": 4, "max": 99}
KI_VIDEO_MAX = KI_VIDEO_MAX_BY_PRESET.get(VIDEO_QUALITY_PRESET, 3)
NARRATION_ENABLED = os.environ.get("CALLIDUS_NARRATION", "1").lower() in ("1", "true", "yes", "on")
STORY_SLIDE_SECONDS = float(os.environ.get("CALLIDUS_STORY_SLIDE_SECONDS", "7.5"))
STORY_RENDER_MODE = os.environ.get("CALLIDUS_STORY_RENDER_MODE", "reference_i2v").lower()

def _key_slide_indices(total_slides):
    """Dynamische Schluesselszenen: Hook (Anfang), Wendepunkt (~45%), Payoff (~85%)."""
    if total_slides <= 1:
        return {0}
    hook   = 0
    wende  = max(1, round((total_slides - 1) * 0.45))
    payoff = max(wende + 1, round((total_slides - 1) * 0.85))
    return {hook, wende, payoff}

def should_generate_wan_clip(slide_index, total_slides, generated_count):
    if generated_count >= KI_VIDEO_MAX:
        return False
    if VIDEO_QUALITY_PRESET == "max":
        return True
    return slide_index in _key_slide_indices(total_slides)

def create_character_reference_image(script, work_dir, style_index):
    character_bible = script.get("character_bible", "").strip()
    if not character_bible:
        return None
    ref_path = f"{work_dir}/character_reference.jpg"
    prompt = make_character_reference_prompt(character_bible, style_index)
    if generate_ai_image_flux(prompt, ref_path, 1080, 1920):
        log.info("Character-Reference erzeugt")
        return ref_path
    log.warning("Character-Reference konnte nicht erzeugt werden")
    return None

def build_reference_i2v_segment(cinematic_video_prompt, character_bible, style_index,
                                work_dir, slide_index, audio_path, seg_out,
                                display_text, sprechtext, cta, show_bars):
    keyframe = f"{work_dir}/slide_{slide_index:02d}_keyframe.jpg"
    clip     = f"{work_dir}/clip_{slide_index:02d}_ref_i2v.mp4"
    prompt   = make_scene_keyframe_prompt(cinematic_video_prompt, character_bible, style_index)
    if not generate_ai_image_flux(prompt, keyframe, 1080, 1920):
        return False
    if not generate_ai_video_kling_i2v(keyframe, cinematic_video_prompt, clip, aspect_ratio="9:16", duration="5"):
        return False
    build_segment_from_video(clip, audio_path, seg_out,
                             display_text, sprechtext, cta,
                             show_bars=show_bars)
    log.info(f"Segment {slide_index} (Reference I2V) OK")
    return True


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
        # (Watermark "callidus-am.de" entfernt – Branding nur noch im Outro)
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
            cta_y = height - int(height * 0.16)   # hoeher gesetzt (war ganz unten am Rand)
            for dx, dy in shadow_offsets[:4]:
                draw.text((cx+dx, cta_y+dy), cta_text, fill=BLACK_SOFT, font=font_cta, anchor="mm")
            draw.text((cx, cta_y), cta_text, fill=YELLOW, font=font_cta, anchor="mm")

    img.save(output_path, "PNG")


# ─── KARAOKE-UNTERTITEL ────────────────────────────────────────────
KARAOKE_WORDS_PER_CHUNK = 1

def _make_karaoke_frame_png(words, hl_start, hl_end, output_path, W=1080, H=1920):
    """Transparentes PNG: ganzer Sprechtext sichtbar, Wörter [hl_start:hl_end] in Gelb."""
    from PIL import Image as _KI, ImageDraw as _KD, ImageFont as _KF
    img  = _KI.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = _KD.Draw(img)

    fp = _get_pil_font_path()
    font_sz = int(W * 0.050)
    try:
        font = _KF.truetype(fp, font_sz) if fp else _KF.load_default()
    except Exception:
        font = _KF.load_default()

    # STABIL: zeige nur die aktuelle Wortgruppe [hl_start:hl_end] fest zentriert.
    # Kein gleitendes Fenster mehr -> Text rutscht nicht, gut mitlesbar.
    phrase = words[hl_start:hl_end]
    if not phrase:
        img.save(output_path, "PNG")
        return
    # In Zeilen zu max 3 Woertern umbrechen
    lines = [" ".join(phrase[k:k+3]) for k in range(0, len(phrase), 3)]

    line_h  = int(font_sz * 1.2)
    GOLD    = (235, 200, 120, 255)
    SHADOW  = (0, 0, 0, 235)
    BOX     = (7, 24, 16, 150)
    shadows = [(3, 3), (-3, 3), (3, -3), (-3, -3), (0, 4)]

    total_h = line_h * len(lines)
    y_start = int(H * 0.66)
    box_y   = y_start - int(font_sz * 0.4)
    box_h   = total_h + int(font_sz * 0.7)
    try:
        draw.rounded_rectangle((int(W * 0.10), box_y, int(W * 0.90), box_y + box_h),
                               radius=24, fill=BOX)
    except Exception:
        draw.rectangle((int(W * 0.10), box_y, int(W * 0.90), box_y + box_h), fill=BOX)

    cx = W // 2
    for li, line_str in enumerate(lines):
        y = y_start + li * line_h
        for dx, dy in shadows:
            draw.text((cx + dx, y + dy), line_str, fill=SHADOW, font=font, anchor="ma")
        draw.text((cx, y), line_str, fill=GOLD, font=font, anchor="ma")

    img.save(output_path, "PNG")
    return

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


# Karaoke (per-Wort-Untertitel) standardmaessig AUS: die N-fach-Overlay-Kette ist auf
# der schwachen NAS zu langsam (speed ~0.04x -> FFmpeg-Timeout). Mit CALLIDUS_KARAOKE=1 aktivierbar.
KARAOKE_ENABLED = os.environ.get("CALLIDUS_KARAOKE", "0").lower() in ("1", "true", "yes", "on")

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

    big_size   = int(size[0] * 0.055)
    url_size   = int(size[0] * 0.028)
    sub_size   = int(size[0] * 0.038)
    cta_size   = int(size[0] * 0.040)
    max_chars  = 16

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
    y_start = int(size[1] * 0.18)

    for i, l in enumerate(lines):
        for dx, dy in shadow_offsets:
            draw.text((cx+dx, y_start + i*line_h + dy), l, fill=BLACK_SOFT, font=font_big, anchor="mm")
        draw.text((cx, y_start + i*line_h), l, fill=WHITE, font=font_big, anchor="mm")

    # (Watermark "callidus-am.de" entfernt – Branding nur noch im Outro)

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
            cta_y = size[1] - int(size[1] * 0.16)   # hoeher gesetzt (war ganz unten am Rand)
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
                   "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
                   "-c:a", "aac", "-b:a", "128k",
                   "-shortest", seg_out]
        else:
            kb_frames = max(1, int(total_duration * 25))
            vf = ("scale=1350:2400:force_original_aspect_ratio=increase,"
                  "crop=1350:2400,"
                  f"zoompan=z='min(zoom+0.0005,1.16)':d={kb_frames}:"
                  "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                  "s=1080x1920:fps=25,format=yuv420p")
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

    # Jeden Bild-Clip einzeln erstellen
    clip_paths = []
    for idx, img_path in enumerate(image_paths):
        clip_out = seg_out + f"_clip{idx}.mp4"
        kb_frames = max(1, int(img_dur * 25))
        if idx % 2 == 0:
            z_expr = "min(zoom+0.0006,1.18)"
        else:
            z_expr = "if(eq(on,0),1.18,max(zoom-0.0006,1.0))"
        kb_vf = ("scale=1350:2400:force_original_aspect_ratio=increase,"
                 "crop=1350:2400,"
                 f"zoompan=z='{z_expr}':d={kb_frames}:"
                 "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                 "s=1080x1920:fps=25,format=yuv420p")
        cmd = [FFMPEG, "-y",
               "-loop", "1", "-t", str(img_dur), "-i", img_path,
               "-vf", kb_vf,
               "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
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
           "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
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

    # Zeitlupe statt Endlos-Loop: KI-Clip (~5s) auf Audiolaenge strecken, 1x abspielen.
    clip_dur = _get_video_duration(video_clip) or 5.0
    slow     = max(1.0, (duration / clip_dur) * 1.03)   # nur verlangsamen, nie beschleunigen
    setpts   = f"setpts={slow:.3f}*PTS"

    if font_path:
        # ── Pfad A: FFmpeg drawtext verfuegbar ──────────────────────
        fp       = font_path
        vf_parts = [setpts, scale_crop, "format=yuv420p"]
        vf_parts.append("drawbox=x=0:y=0:w=iw:h=180:color=black@0.50:t=fill")
        title_esc = _ffmpeg_esc(display_text[:40])
        vf_parts.append(
            f"drawtext=text='{title_esc}':fontfile='{fp}':fontsize=56"
            f":fontcolor=white:bordercolor=black:borderw=3"
            f":x=(w-text_w)/2:y=80:line_spacing=10"
        )
        # (Watermark "callidus-am.de" entfernt – Branding nur noch im Outro)
        sub_vf = _build_subtitle_vf(subtitle_text, fp, cta_text)
        if sub_vf:
            vf_parts.append(sub_vf)
        vf  = ",".join(vf_parts)
        cmd = [FFMPEG, "-y",
               "-i", video_clip,
               "-i", audio_path,
               "-map", "0:v:0", "-map", "1:a:0",
               "-vf", vf,
               "-fps_mode", "cfr", "-r", "25",
               "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", "-b:a", "128k",
               "-t", str(duration), "-shortest", seg_out]
    else:
        # ── Pfad B: PIL-Overlay PNG (+ optional Karaoke) ────────────
        overlay_png = seg_out + "_ov.png"
        # Basis-Overlay: Titel + Brand + CTA (Untertitel nur wenn Karaoke AUS bleibt: keiner)
        _make_text_overlay_png(display_text, "", cta_text, overlay_png,
                               show_bars=show_bars)

        # Karaoke nur wenn explizit aktiviert (sonst zu langsam auf der NAS)
        if KARAOKE_ENABLED:
            import contextlib as _cl, wave as _wv
            with _cl.closing(_wv.open(audio_path, 'r')) as _wf:
                _audio_dur = _wf.getnframes() / float(_wf.getframerate())
            _kar_prefix = os.path.basename(seg_out).replace(".mp4", "")
            karaoke_pieces = _build_karaoke_pngs(
                subtitle_text, _audio_dur,
                os.path.dirname(seg_out), _kar_prefix)
        else:
            karaoke_pieces = []

        # Inputs: [0]=video, [1]=audio, [2]=base_overlay, [3..N]=karaoke
        kar_inputs = []
        for _png, _, _ in karaoke_pieces:
            kar_inputs += ["-i", _png]

        # Filter-Chain mit timed Karaoke-Overlays (Video in Zeitlupe, 1x)
        fc  = (f"[0:v]{setpts},{scale_crop},format=yuv420p[vid];"
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
               "-i", video_clip,
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
def create_logo_outro(work_dir):
    """Minimalistisches Premium-Outro: dunkler Studio-Hintergrund, Logo mit sanftem
    Glow, nur eine Textzeile (Domain). Animation: Fade-in + langsamer Zoom + Fade-out."""
    from PIL import Image, ImageDraw, ImageFont, ImageFilter

    size = (1080, 1920)
    cx, cy = size[0] // 2, size[1] // 2

    # Dunkler Premium-Hintergrund (Anthrazit, dezenter vertikaler Verlauf – KEIN Gruen)
    img  = Image.new("RGB", size, color=(10, 11, 14))
    draw = ImageDraw.Draw(img)
    for y in range(size[1]):
        t = abs(y - cy) / cy   # 0 in der Mitte, 1 am Rand → Mitte minimal heller
        c = int(22 - 10 * t)
        draw.line([(0, y), (size[0], y)], fill=(c, c + 2, c + 5))

    # Sanfter warmer Glow hinter dem Logo (weich gezeichneter Kreis)
    glow = Image.new("RGB", size, (0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    gr   = int(size[0] * 0.34)
    gd.ellipse([cx - gr, cy - int(size[1]*0.06) - gr, cx + gr, cy - int(size[1]*0.06) + gr],
               fill=(46, 38, 24))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    from PIL import ImageChops
    img  = ImageChops.add(img, glow)   # Glow additiv aufhellen
    draw = ImageDraw.Draw(img)

    # Logo mittig
    logo_bottom = cy
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert("RGBA")
            logo.thumbnail((int(size[0]*0.36), int(size[1]*0.24)), Image.LANCZOS)
            lx = (size[0] - logo.width) // 2
            ly = cy - logo.height // 2 - int(size[1]*0.06)
            base = img.convert("RGBA")
            base.paste(logo, (lx, ly), logo)
            img  = base.convert("RGB")
            draw = ImageDraw.Draw(img)
            logo_bottom = ly + logo.height
        except Exception as e:
            log.warning(f"Logo-Fehler: {e}")

    # Nur EINE Zeile: die Domain (dezent, gold)
    font_path = _get_pil_font_path()
    dom_size  = int(size[0] * 0.045)
    try:
        font_dom = ImageFont.truetype(font_path, dom_size) if font_path else ImageFont.load_default()
    except Exception:
        font_dom = ImageFont.load_default()
    draw.text((cx, logo_bottom + int(size[1] * 0.045)), "callidus-am.de",
              fill=(212, 181, 122), font=font_dom, anchor="mm")

    img_path = f"{work_dir}/outro.jpg"
    img.save(img_path, quality=95)

    silence_path   = f"{work_dir}/silence.wav"
    silence_frames = 24000 * 4
    with wave.open(silence_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b'\x00\x00' * silence_frames)

    # Animation: Fade-in (0.5s) + langsamer Zoom ueber 4s + Fade-out (1.2s)
    kb_frames = 4 * 25
    vf = ("scale=1350:2400:force_original_aspect_ratio=increase,crop=1350:2400,"
          f"zoompan=z='min(zoom+0.0009,1.10)':d={kb_frames}:"
          "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25,"
          "format=yuv420p,fade=in:st=0:d=0.5,fade=out:st=2.8:d=1.2")
    outro_out = f"{work_dir}/seg_outro.mp4"
    cmd = [FFMPEG, "-y",
           "-loop", "1", "-i", img_path, "-i", silence_path,
           "-vf", vf, "-af", "afade=out:st=2:d=2",
           "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
           "-c:a", "aac", "-b:a", "128k",
           "-t", "4", outro_out]
    result = subprocess.run(cmd, capture_output=True, timeout=120)
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
    music_volume = 0.18 if NARRATION_ENABLED else 0.30
    af          = f"volume={music_volume},afade=t=in:st=0:d=3,afade=t=out:st={fade_out_st:.1f}:d=3"

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

# ─── VIDEO BAUEN (v2 – KI-First Pipeline) ─────────────────────────
def build_video(script, work_dir, mode="video"):
    """
    v2: KI-First Pipeline
      Priorität: WAN KI-Video → FLUX KI-Bild → Pexels Video → Pexels Bild → Pollinations → Gradient
      KI-Video-Budget: max KI_VIDEO_MAX Clips pro Video (Kosten-Kontrolle)

    mode='images': nur Bilder (kein Video), schnell & günstig
    mode='video':  KI-Video + Pexels + Balken (volle Variante)
    """
    if mode == "images" and os.environ.get("CALLIDUS_ALLOW_STATIC_IMAGES", "0").lower() not in ("1", "true", "yes", "on"):
        log.info("Images-Modus deaktiviert: Story-Short wird als Video-Modus gebaut.")
        mode = "video"

    slides       = script["slides"]
    target       = (1080, 1920)
    total_slides = len(slides)
    show_bars    = OVERLAY_BARS_IMAGES if mode == "images" else OVERLAY_BARS_VIDEOS
    ki_video_count = 0   # Budget-Zaehler fuer KI-Video-Clips
    character_bible = script.get("character_bible", "")
    episode_style_index = 0   # CINEMATIC live action (fester Movie-Stil, kein Cartoon)
    log.info(f"Stil: {todays_art_style()['label']} "
             f"(Ton: {todays_tone()['label']})")
    character_reference = None
    if STORY_RENDER_MODE == "reference_i2v" and mode == "video":
        character_reference = create_character_reference_image(script, work_dir, episode_style_index)

    from PIL import Image as PILImage

    for i, slide in enumerate(slides):
        sprechtext   = _strip_emojis(slide.get("sprechtext", slide.get("text", "")))
        audio_path   = f"{work_dir}/audio_{i:02d}.wav"
        if NARRATION_ENABLED:
            generate_audio(sprechtext, audio_path)
        else:
            generate_silent_audio(audio_path, STORY_SLIDE_SECONDS)

        # Audiodauer fuer dynamische Bildanzahl
        import contextlib as _cl, wave as _wv
        with _cl.closing(_wv.open(audio_path, 'r')) as _wf:
            audio_dur = _wf.getnframes() / float(_wf.getframerate())
        num_imgs = max(2, min(8, int(audio_dur / 5)))

        display_text = _strip_emojis(slide.get("titel", slide.get("text", sprechtext[:30])))
        bildsuche    = slide.get("bildsuche", "health wellness nature")
        video_prompt = slide.get("video_prompt", "")  # NEU v2: cinematischer KI-Video-Prompt
        _day_style   = todays_art_style()
        cinematic_video_prompt = _day_style["prefix"] + make_cinematic_video_prompt(
            video_prompt, i, total_slides, "9:16", episode_style_index, character_bible
        )
        seg_out      = f"{work_dir}/seg_{i:02d}.mp4"

        # CTA auf letztem Content-Slide
        is_last = (i == total_slides - 1)
        cta      = "Jetzt Folgen & Liken!" if is_last else ""

        saved_imgs = []
        if mode == "video":
            # Nur SCHLUESSELSZENEN (Hook/Wende/Payoff) werden echtes KI-Bewegtvideo.
            # Spart Renderzeit + Fal-Credits; Rest = FLUX-Standbild mit Ken-Burns-Zoom.
            _is_key = bool(video_prompt) and should_generate_wan_clip(i, total_slides, ki_video_count)

            # ── 0. Seedance 1.5 Pro (High-Budget-Commercial, primaer) ──
            if _is_key:
                sd_clip = f"{work_dir}/clip_{i:02d}_seedance.mp4"
                tg_send(f"🎬 Seedance-Clip ({ki_video_count+1}/{KI_VIDEO_MAX}) fuer Slide {i+1}...")
                # 10-Sek-Clips: passen zur Sprechdauer (~15s) mit sanfter 1.5x-Zeitlupe statt 3x-Ruckeln
                if generate_ai_video_seedance(cinematic_video_prompt, sd_clip, aspect_ratio="9:16", duration=10):
                    try:
                        build_segment_from_video(sd_clip, audio_path, seg_out,
                                                 display_text, sprechtext, cta,
                                                 show_bars=show_bars)
                        ki_video_count += 1
                        log.info(f"Segment {i} (Seedance #{ki_video_count}) OK")
                        continue
                    except Exception as e:
                        log.warning(f"Segment {i}: Seedance-Segment fehlgeschlagen ({e}), weiter")

            if _is_key and character_bible and character_reference and STORY_RENDER_MODE == "reference_i2v":
                try:
                    if build_reference_i2v_segment(
                        cinematic_video_prompt, character_bible, episode_style_index,
                        work_dir, i, audio_path, seg_out,
                        display_text, sprechtext, cta, show_bars
                    ):
                        ki_video_count += 1
                        log.info(f"Segment {i} (Reference I2V #{ki_video_count}) OK")
                        continue
                except Exception as e:
                    log.warning(f"Segment {i}: Reference-I2V fehlgeschlagen ({e}), weiter")

            if _is_key:
                wan_clip = f"{work_dir}/clip_{i:02d}_wan.mp4"
                tg_send(f"🎬 KI-Video ({ki_video_count+1}/{KI_VIDEO_MAX}) fuer Slide {i+1}...")
                if generate_ai_video_wan(cinematic_video_prompt, wan_clip, aspect_ratio="9:16"):
                    try:
                        build_segment_from_video(wan_clip, audio_path, seg_out,
                                                 display_text, sprechtext, cta,
                                                 show_bars=show_bars)
                        ki_video_count += 1
                        log.info(f"Segment {i} (WAN KI-Video #{ki_video_count}) OK")
                        continue
                    except Exception as e:
                        log.warning(f"Segment {i}: WAN-Video fehlgeschlagen ({e}), weiter")

        # ── FLUX-Standbild im Tagesstil (Cartoon), Ken-Burns folgt beim Rendern ──
        if not saved_imgs:
            flux_img2    = f"{work_dir}/slide_{i:02d}_flux2.jpg"
            flux_prompt2 = f"{cinematic_video_prompt}, portrait 9:16 aspect ratio"
            if generate_ai_image_flux(flux_prompt2, flux_img2, 1080, 1920):
                saved_imgs = [flux_img2]
                log.info(f"Segment {i}: FLUX Standbild (Tagesstil) genutzt")

        # ── Pollinations.ai als Fallback (im Tagesstil) ────────────
        if not saved_imgs:
            ai_prompt = f"{_day_style['prefix']}{character_bible}, {bildsuche}, health story scene, same protagonist"
            ai_img    = f"{work_dir}/slide_{i:02d}_ai.jpg"
            if generate_ai_image(ai_prompt, ai_img):
                saved_imgs = [ai_img]
                log.info(f"Segment {i}: Pollinations Bild genutzt")

        # ── 8. Gradient-Fallback ───────────────────────────────────
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

        # Karaoke nur wenn explizit aktiviert (sonst zu langsam auf der NAS)
        _kar_pngs_cf = _build_karaoke_pngs(
            sprechtext, audio_dur, work_dir, f"kar_{i:02d}"
        ) if KARAOKE_ENABLED else None
        build_segment_with_crossfade(
            final_imgs, audio_path, seg_out, CROSSFADE_DURATION,
            subtitle_text="", cta_text=cta,
            karaoke_pngs=_kar_pngs_cf
        )
        log.info(f"Segment {i} (Bild, mode={mode}) OK")

    log.info(f"Build-Video: {ki_video_count} KI-Video-Clips generiert")
    outro_path = create_logo_outro(work_dir)

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

    raw_out = f"{work_dir}/raw_video.mp4"
    # Effizientere Kompression + Bitraten-Limit: haelt das Reel unter ~48 MB
    # (sonst Telegram-Vorschau >48MB nicht moeglich + Catbox/Instagram-Upload-Timeout).
    # Reel ist kurz (~80s), daher ist preset "veryfast" zeitlich unproblematisch.
    cmd     = [FFMPEG, "-y", "-f", "concat", "-safe", "0",
               "-i", concat_file,
               "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
               "-maxrate", "4500k", "-bufsize", "9000k",
               "-pix_fmt", "yuv420p",
               "-r", "25", "-movflags", "+faststart",
               "-c:a", "aac", "-b:a", "128k", raw_out]
    subprocess.run(cmd, check=True, capture_output=True, timeout=900)

    final_out = f"{OUTPUT_DIR}/reel_v2_{datetime.date.today().isoformat()}.mp4"
    mix_background_music(raw_out, final_out)

    log.info(f"Reel v2 fertig: {final_out}")
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
            + "\n🌐 https://www.callidus-am.de/"
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
            + "\n🌐 callidus-am.de"
            + "\n\n#Gesundheit #Naturheilkunde #Wohlbefinden #callidus #Reels #LifeHack #AhaMoment"
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
    mode='images': Morgen-Variante (nur Bilder, kein Balken)
    mode='video':  Nachmittag-Variante (Pexels-Videos + KI-Videos, mit Balken)
    force=True:    Wochentag-Check ueberspringen (fuer manuelle Tests)
    """
    # Wochentag-Check (One-Shot Modus: Mo/Mi/Fr/So) – mit 'force' umgehbar
    if not force and datetime.date.today().weekday() not in POSTING_TAGE:
        log.info(f"Kein Posting-Tag heute – beende.")
        tg_send(f"⏭️ Heute kein V2 Post-Tag. Naechster Run: Mo/Mi/Fr/So um 12:00/17:00 Uhr.")
        return
    log.info("=" * 50)
    mode_label = "Bild-Variante" if mode == "images" else "Video-Variante"
    log.info(f"Instagram Workflow gestartet ({mode_label})")
    tg_send(f"📸 <b>Callidus Reel Workflow gestartet!</b>\n🎨 Modus: {mode_label}")

    produkt = todays_affiliate_product()
    log.info(f"Fakten-Format | Produkt des Tages: {produkt['name']} ({produkt['kategorie']})")
    tg_send(f"🧠 <b>Fakten-Format</b>\n🛒 <b>Produkt des Tages:</b> {produkt['name']}\n"
            f"📚 <b>Thema:</b> {produkt['kategorie']} – {produkt['winkel']}\n🎬 Instagram + YouTube")

    work_dir = tempfile.mkdtemp(dir=BASE_DIR)
    try:
        tg_send("✍️ Generiere Fakten-Script (Hook → Spannung → Auflösung)...")
        script = generate_script("")
        tg_send(f"📝 <b>Titel:</b> {script['titel']}\n\n⏳ Erstelle Video (ca. 5-8 Min)...")

        video_path = build_video(script, work_dir, mode=mode)
        tg_send("🎬 Video erstellt! Sende Vorschau...")

        _baseline_upd   = tg_get_last_update_id()   # VOR dem Senden: sofortige Klicks nicht verpassen
        approval_msg_id = tg_send_approval(video_path, script["titel"])
        approved = tg_wait_for_approval(timeout=3600,
                                        approval_msg_id=approval_msg_id,
                                        baseline_update_id=_baseline_upd)

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
    tg_send(
        "📸 <b>Callidus Instagram Bot v2 gestartet!</b>\n\n"
        "🎬 <b>NEU:</b> KI-Videos (WAN) + FLUX Bilder\n"
        f"📅 Morgens <b>{DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr</b> – Bild-Variante\n"
        f"📅 Nachmittags <b>{DAILY_HOUR_2:02d}:{DAILY_MINUTE_2:02d} Uhr</b> – KI-Video-Variante\n\n"
        "Befehle:\n"
        "/jetzt – Reel sofort erstellen (KI-Video-Variante)\n"
        "/status – Bot-Status\n"
        "/hilfe – Hilfe"
    )

    url_base           = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"
    last_update        = tg_get_last_update_id()
    last_daily_run     = None   # 10:00 Bild-Variante
    last_daily_run_2   = None   # 15:00 Video-Variante
    workflow_running   = False

    while True:
        try:
            r = requests.get(
                f"{url_base}/getUpdates",
                params={"offset": last_update + 1, "timeout": 10},
                timeout=25
            )
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
                        f"✅ <b>Instagram Bot aktiv</b>\n"
                        f"🕐 {now.strftime('%d.%m.%Y %H:%M')}\n"
                        f"📅 Naechster Run: {next_run.strftime('%d.%m. %H:%M Uhr')}\n"
                        f"🔄 Laeuft: {'Ja ⏳' if workflow_running else 'Nein'}"
                    )

                elif text in ("/hilfe", "/help", "/start", "hilfe"):
                    tg_send(
                        "📖 <b>Instagram Bot – Befehle</b>\n\n"
                        "/jetzt – Reel sofort erstellen\n"
                        "/status – Bot-Status\n"
                        "/hilfe – Diese Hilfe\n\n"
                        f"⏰ Auto-Run: {DAILY_HOUR:02d}:{DAILY_MINUTE:02d} Uhr taeglich\n"
                        "📸 Format: Reel 9:16 bis 90 Sek"
                    )

            # Täglicher Auto-Run
            now   = datetime.datetime.now()
            today = now.date()

            # ── Morgen-Bild-Variante DEAKTIVIERT: nur noch 1x/Tag (Video) ──
            # (Wunsch: Instagram V2 soll nur einmal taeglich laufen)

            # ── Nachmittag: Video-Variante um DAILY_HOUR_2:DAILY_MINUTE_2 ──
            if (now.hour == DAILY_HOUR_2 and now.minute == DAILY_MINUTE_2
                    and now.weekday() in POSTING_TAGE
                    and last_daily_run_2 != today and not workflow_running):
                last_daily_run_2 = today
                workflow_running = True
                tg_send(f"Taeglicher Start - Video-Variante (mit KI-Video)")
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
        _args  = sys.argv[1:]
        _force = any(a in ("force", "test", "--force", "--test") for a in _args)
        run_workflow(mode="video", force=_force)

if __name__ == "__main__":
    main()
