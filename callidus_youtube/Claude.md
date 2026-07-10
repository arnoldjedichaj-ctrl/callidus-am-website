# Callidus A&M – Social Media Bot Kontext

## Projekt-Übersicht
Automatisierter Social-Media-Bot auf Synology DS218+ NAS.
Erstellt Videos im **Momus-Stil (Satire + anschliessende Aufklärung)** und postet
auf Instagram und YouTube. Freigabe-Workflow läuft über Telegram.

## Aktiver Zeitplan (V1)
| Wann | Format | Datei | Plattformen |
|------|--------|-------|-------------|
| **Mo / Mi / Fr 18:00** | Short 9:16 (~45-60s) | `instagram_bot.py` | Instagram Reel + YouTube Short |
| **Sonntag 10:00** | Langvideo 16:9 (4-5 Min) | `main.py` | YouTube + Custom-Thumbnail + Callidus TV (Nexus App) |

> **V2-Bots (`main_v2.py`, `instagram_bot_v2.py`) sind deaktiviert.** Das neue System
> wurde komplett in die V1-Bots integriert. V2 nutzte kostenpflichtige Fal.ai-KI-Videos.

## NAS-Pfade
```
BASE_DIR:     /volume1/homes/arnold.jedich/callidus_youtube/
SCRIPT_IG:    .../instagram_bot.py   (Shorts, Mo/Mi/Fr 18:00)
SCRIPT_YT:    .../main.py            (Langvideo, So 10:00)
OUTPUT_IG:    .../output_instagram/
OUTPUT_YT:    .../output/
LOGS:         .../logs/
ASSETS:       .../assets/
SERVICE_ACC:  .../service-account.json   (Callidus TV / Firestore)
FFMPEG:       /volume1/@appstore/ffmpeg7/bin/ffmpeg
PYTHON:       python3.9
```

## Inhaltsstil – Momus (Satire + Aufklärung)
Vorbild: die Momus-Artikel der Website (`callidus-am-website`, Firestore `articles`).
- **Teil 1 – Satire:** zynischer „Effizienz-Coach" im **Sie-Ton**, der die schlechte
  Gewohnheit ironisch als geniales Upgrade feiert.
- **Bruch:** ehrliche Übergangsfrage, die das Lachen ins Nachdenken kippt.
- **Teil 2 – Aufklärung:** warmer **Du-Ton**, echte Wissenschaft (Zahlen, Mechanismen),
  positive Motivation + erster Schritt.
- **Abwechslung:** Datum-Seed + Prompt-Anweisung → variierende Einstiege/Stimmungen
  (nicht immer „traurig"). Themenliste = satiretaugliche Modern-Life-(Un-)Gewohnheiten.

## Bild-/Video-Konzept
- **KI-Bilder zuerst** (Pollinations.ai / FLUX, kostenlos) als Primärquelle.
  Pexels-Stock nur noch als Fallback. Flag: `AI_IMAGES_FIRST = True`.
- **Ken-Burns-Bewegung (zoompan)** auf den KI-Bildern → „Video-Variante" ohne Kosten.
  Flag: `KEN_BURNS = True`. Helper: `_kenburns_vf(...)`.
- **Kunststil rotiert wöchentlich** (`ART_STYLES` / `todays_art_style()`):
  Anime / Ghibli / Comic / 3D-Cartoon / Flat-Editorial – nicht fotorealistisch.
- Echte KI-Videos via Fal.ai bleiben AUS (`USE_FAL_AI_VIDEO = False`, kostenpflichtig).

## Thumbnail (nur Langvideo)
- `build_thumbnail()`: KI-Hintergrund (Wochen-Kunststil) + plakativer Satire-Titel
  (`thumbnail_text`) + Logo, 1280x720 JPG (< 2 MB).
- `set_youtube_thumbnail(video_id, path)`: Upload via `youtube.thumbnails().set()`.
  Benötigt verifizierten YouTube-Kanal (gegeben).

## Callidus TV (Nexus App)
- `save_to_callidus_tv()` schreibt das Langvideo in Firestore-Collection `videos`
  (Projekt `nexus-app-61494`, Kategorie „Callidus TV"), hält max. `CALLIDUS_TV_MAX = 30`.
- Auth via `_firestore_token()` aus `service-account.json` (liegt auf der NAS).

## Telegram-Bots
| Bot | Token (gekürzt) | Aufgabe |
|-----|-----------------|---------|
| Langvideo | `8532341668…` | main.py – So 10:00 |
| Short | `8647940478…` | instagram_bot.py – Mo/Mi/Fr 18:00 |
| ~~V2~~ | ~~`8664900084…`~~ | deaktiviert |

Befehle je Bot: `/jetzt` (sofort erstellen), `/status`, `/hilfe`.

## Deployment
`deploy_to_nas.bat` (SCP/SSH auf 192.168.178.200:54122) – deployt V1-Dateien + Musik,
stoppt V2, startet V1-Watchdogs neu.
**Einmalig im DSM-Aufgabenplaner:** V2-Watchdogs deaktivieren, V1-Watchdogs aktiv lassen.

## Technischer Stack
- Python 3.9, FFmpeg 7 (Synology), Gemini (Script + TTS, Key-Rotation)
- Pollinations.ai (KI-Bilder, primär), Pexels (Fallback)
- Telegram (Freigabe), Google OAuth2 (YouTube), Instagram Graph API, Firestore (Callidus TV)

## Bekannte Eigenheiten / Fixes
- NAS langsam: `-preset ultrafast`, Segmente via concat statt xfade.
- Ken-Burns nutzt zoompan mit leichtem Upscale (1.5x) gegen Jitter; bei Performance-
  Problemen `KEN_BURNS = False` setzen.
- YouTube OAuth: Web-Client (nicht Desktop) wegen „oob"-Abschaffung.
- Instagram Token: erneuert sich automatisch wenn < 7 Tage gültig.
- TTS: Gemini Flash TTS, Stimme „Aoede". Karaoke-Untertitel bei Shorts.
