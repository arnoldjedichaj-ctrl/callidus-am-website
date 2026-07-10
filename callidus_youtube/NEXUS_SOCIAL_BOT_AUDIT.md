# NEXUS Social-Bot Audit

Stand: 2026-06-11

## Ausgangslage

- Ziel: NEXUS Premium verkaufen, aktuell 6,99 €/Monat bzw. 69,99 €/Jahr.
- Kostenregel: Solange keine Einnahmen fließen, keine/kaum Zusatzkosten.
- Aktive Bots laufen auf Synology NAS.
- V2-Bots sind deaktiviert, weil Fal.ai-KI-Videos Kosten verursachen können.

## Aktiver Bot-Stand

### Short-Bot

Datei: `instagram_bot.py`

- Zeitplan: Mo / Mi / Fr 18:00
- Erstellt 9:16 Shorts/Reels
- Postet laut Code auf:
  - Instagram Reels
  - YouTube Shorts
- Freigabe via Telegram
- Bildquelle: Pollinations.ai/FLUX zuerst, Pexels als Fallback
- TTS: Gemini Flash TTS
- Stil: Momus-Satire + Aufklärung

### Langvideo-Bot

Datei: `main.py`

- Zeitplan: Sonntag 10:00
- Erstellt 16:9 Langvideo, ca. 4–5 Minuten
- Postet auf YouTube
- Lädt Thumbnail hoch
- Speichert Video zusätzlich in Callidus TV / Nexus App
- Freigabe via Telegram

### V2-Bots

Dateien:

- `main_v2.py`
- `instagram_bot_v2.py`

Status: deaktiviert.

Grund: V2 ist stärker cinematic, nutzt aber Fal.ai / KI-Video und kann laufende Kosten verursachen.

## Technische Prüfung

`python -m py_compile instagram_bot.py main.py main_v2.py instagram_bot_v2.py` lief ohne Syntaxfehler.

## Wichtigste Beobachtung

Die Bots produzieren aktuell primär allgemeinen Gesundheits-/Momus-Content. Das ist gut für Reichweite, aber noch zu indirekt für NEXUS-Umsatz.

Aktuell ist der CTA oft:

- callidus-am.de
- Link in Bio
- Website / Gesundheitswissen

Für Umsatz sollte der CTA stärker Richtung NEXUS gehen, aber ohne platte Werbung.

## Empfehlung: Kein Paid Social Advertising jetzt

Begründung:

1. Noch keine zahlenden Kunden.
2. Keine validierte Kernbotschaft.
3. 6,99 € Abo braucht ca. 430 Monatskunden für 3.000 €/Monat.
4. Paid Ads ohne getestete Hooks verbrennen Budget.
5. Beste kostenlose Ressource ist vorhandene Bot-Produktion.

## Empfohlene Zero-Cost-Strategie

### 1. Content weiter crossposten

Gleiches Video auf YouTube Shorts, Instagram Reels, TikTok und Facebook ist okay für den Start.

Wichtig: Nicht zu früh komplex machen. Erst messen, welche Themen ziehen.

### 2. Jede Woche ein NEXUS-naher Schwerpunkt

Statt nur allgemeiner Gesundheit:

- Woche 1: Stress + Tagesplan
- Woche 2: Ernährung + KI-Rezepte
- Woche 3: Journal + Stimmungsmuster
- Woche 4: Schlaf + 30-Tage-Trends

### 3. CTA weicher, aber klarer

Beispiel:

> Wenn du aus solchen Impulsen einen persönlichen Gesundheitsplan machen willst: NEXUS von Callidus testen.

Oder kurz:

> Mehr Gesundheitswissen + KI-Coach: NEXUS in der Callidus App.

### 4. Bot-Verbesserung ohne Kosten

Priorität:

1. Prompts stärker auf NEXUS-Funktionen ausrichten.
2. Upload-Beschreibungen mit NEXUS-CTA ergänzen.
3. Themenliste um NEXUS Use Cases erweitern.
4. Optional Tracking-CSV/JSON einführen: Datum, Thema, Hook, Plattform, Views, Klicks, Abos.

### 5. V2 bleibt aus

V2 erst wieder aktivieren, wenn:

- erste Einnahmen da sind oder
- ein einzelner Test bewusst budgetiert wird.

## Konkrete nächste Code-Änderungen

Empfohlen, aber noch nicht umgesetzt:

1. In `instagram_bot.py` Slide 7 CTA von nur `callidus-am.de` auf NEXUS erweitern.
2. In `instagram_bot.py` YouTube/Instagram Caption um NEXUS CTA ergänzen.
3. In `main.py` Schluss-Slide stärker auf NEXUS Tagesplan / KI-Coach ausrichten.
4. Gemeinsame Datei `nexus_content_angles.json` anlegen mit Hooks und Use Cases.
5. Optional `content_performance.csv` vorbereiten für manuelle Performance-Auswertung.

## Sicherheitsnotiz

In den Bot-Dateien liegen mehrere Tokens/API-Keys direkt im Code. Das funktioniert lokal/NAS, ist aber riskant. Nicht öffentlich committen oder teilen. Mittelfristig besser in `.env`/NAS-Umgebungsvariablen verschieben.
