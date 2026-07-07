# Callis Gesundheits-Kompass — Veröffentlichungs-Leitfaden

## ⭐ AKTUELLER STAND (07.07.2026) — Neusatz fertig, das sind die gültigen Dateien

Alle in `buchprojekt/kinderbuch-band1/` (Neusatz im Layout-System A/C/D/E, 8,5×11 Zoll + Beschnitt):

| Datei | Zweck |
|---|---|
| `Callis-Kompass-Band1-Website.pdf` (25 MB) | **Digistore24-Download**: Cover + alle 71 Seiten, web-optimierte Bilder |
| `Callis-Kompass-Band1-KDP-Innenteil.pdf` (144 MB) | **Amazon-Taschenbuch Innenteil**: volle Auflösung, ohne Cover, mit Beschnitt (8,625×11,25 in) |
| `Callis-Kompass-Band1-KDP-Umschlag.pdf` (8 MB) | **Amazon-Umschlag**: Rückseite + Rücken (0,169 in für 72 S. Premium-Farbe) + Front, Barcode-Freifläche |
| `band1-website.html` / `band1-kdp-print.html` / `band1-kdp-umschlag.html` | Quelldateien (Neudruck: headless Edge `--print-to-pdf`) |
| `layout-testseiten-standalone.html` | freigegebene Layout-Muster (A=Story, C=Schlau, D=Mach-mit, E=Eltern) |

**Wichtig bei Seitenzahl-Änderung:** Rückenbreite im Umschlag neu rechnen
(Seiten × 0,002347 in bei Premium-Farbe) und Umschlag-PDF neu erzeugen.
**Vor KDP-Upload:** Druckvorschau im KDP-Previewer prüfen (Ränder/Beschnitt), KI-Bilder deklarieren.
Ältere Dateien (`callis-kompass-band1-arbeitsfassung/-kdp-inhalt`) sind überholt — nur noch Quelle des Textes.


Stand: Juli 2026 · Projekt: callidus KIDS Buchserie · Konzept konsolidiert am 05.07.2026

## 1. Das Konzept (zusammengeführt)

- **Serie:** „Callis Gesundheits-Kompass" — 6 geplante Bände, je ein Thema pro Band
- **Zielgruppe:** Vorlesekinder 5–8 (Amazon Reading Age 5–8), Eltern lesen vor
- **Figuren:** Calli (sprechender Kompass, Name von „callidus"), Mira und Noah
- **Format:** Bilderbuch — **Bild auf jeder Seite**, 40–64 Seiten, quadratisch 8,5 × 8,5 Zoll
- **Feste Elemente pro Band:** Wusstest-du-schon-Boxen, Mach-mit-Missionen,
  Callis Lachmuskel-Training (Witze), Kompass-Check-Quiz am Ende, Urkunde zum Ausschneiden
- **Bildstil:** ENTSCHIEDEN (05.07.2026): warmes Aquarell — Details, Charakter-Sheet und
  alle Bild-Prompts in `BILDPRODUKTION-AQUARELL.md`; die flachen SVGs dienen nur noch
  für Website/Marketing/Text-Overlays

### Die 6 Bände
1. **Hör auf deinen Körper** (Körpersignale) — MVP fertig
2. **Das Zucker-Monster** (Essen & Trinken: Schlecki, Gemüse-Bande, Regenbogen-Teller)
3. **Der Zappelmotor** (Bewegung & Energie)
4. **Die Schlaf-Werkstatt** (Schlaf & Träume)
5. **Das Gefühls-Wetter** (Gefühle)
6. **Die Abwehr-Polizei** (Hygiene, Schutz, Arztbesuch)

## 2. Vertriebskonzept

| Kanal | Format | Abwicklung | Status |
|---|---|---|---|
| callidus-am.de (`/kinderbuch/`) | PDF-eBook (farbig) | Digistore24 (bereits im Einsatz) | Landingpage fertig, Kauf-Button Platzhalter |
| Amazon KDP | Taschenbuch (Print-on-Demand) | KDP-Konto | nach Fertigstellung Band 1 |
| Amazon KDP | Kindle-eBook (Fixed Layout) | KDP-Konto | nach Fertigstellung Band 1 |

**Buchpreisbindung (DE):** Endpreis muss auf allen Kanälen identisch sein. Vorschlag: eBook 7,99 €.

**KDP Select NICHT aktivieren**, solange das eBook auch über callidus-am.de verkauft wird
(Select verlangt Kindle-Exklusivität).

**KI-Hinweis:** KDP verlangt beim Einstellen die Angabe, ob Inhalte KI-generiert sind
(Text/Bilder). Wahrheitsgemäß deklarieren.

## 3. Amazon-KDP-Bedingungen (recherchiert)

### Taschenbuch-Bilderbuch (Hauptformat für Band 1)
- **Trim:** 8,5 × 8,5 Zoll (beliebtestes Kinderbuch-Format auf KDP)
- **Bilder:** mindestens 300 dpi, alle Schriften/Bilder eingebettet
- **Bleed:** Bilder auf jeder Seite bis zum Rand ⇒ **druckfertiges PDF Pflicht**,
  Seitenformat = Trim + 3,2 mm Breite + 6,4 mm Höhe (0.125"/0.25")
- **Cover:** ein PDF mit Rückseite + Rücken + Front, + 3,2 mm Bleed außen; alternativ Cover Creator
- **Papier:** Glanzpapier-Option für Kinderbücher üblich; Druckkosten werden von der Tantieme abgezogen

### Kindle-eBook
- Bilderbücher als **Fixed-Layout** erstellen: Kindle Create oder Kindle Kids' Book Creator
- Cover separat: JPG, 2560 × 1600 px (1,6:1), RGB
- Altersgruppe **5–8** beim Einstellen angeben (steuert Kinder-Kategorien)
- Tantiemen: 70 % bei 2,99–9,99 € (abzgl. Lieferkosten), sonst 35 %; ASIN automatisch, kein ISBN nötig

Quellen:
- [So veröffentlichen Sie Ihr Kinderbuch (KDP)](https://kdp.amazon.com/de_DE/how-to-publish-childrens-books)
- [Richtlinien für das Einreichen von Taschenbüchern](https://kdp.amazon.com/de_DE/help/topic/G201857950)
- [Format, Beschnitt und Ränder](https://kdp.amazon.com/de_DE/help/topic/GVBQ3CMEQW3W2VL6)
- [Bilder im Taschenbuch formatieren](https://kdp.amazon.com/de_DE/help/topic/G202169030)

## 4. KDP-Metadaten Band 1 (Vorschlag)

- **Titel:** Callis Gesundheits-Kompass
- **Untertitel:** Band 1: Hör auf deinen Körper — Vorlesebuch über Körpersignale für Kinder von 5 bis 8
- **Serie:** Callis Gesundheits-Kompass, Band 1 (KDP-Serienfunktion nutzen!)
- **Autor/Verlag:** callidus A&M (oder Klarname + callidus A&M als Imprint)
- **7 Keywords:** Vorlesebuch ab 5, Kinderbuch Gesundheit, Körper erklärt für Kinder,
  Körpersignale Kinder, gesunde Gewohnheiten Kinder, Bilderbuch ab 5 Junge Mädchen, Vorlesegeschichten Familie
- **Kategorien:** Kinderbücher > Sachbücher > Körper & Gesundheit; Kinderbücher > Bilderbücher
- **Altersgruppe:** 5–8 · **Preis:** eBook 7,99 €, Taschenbuch nach Druckkosten kalkulieren (~12,99 €)

## 5. Schritt-für-Schritt bis zur Veröffentlichung

1. ~~MVP freigeben~~ ✓ (Konzept, Figuren, Aquarell-Stil bestätigt am 05.07.2026)
2. ~~Band 1 komplett schreiben~~ ✓ **Text fertig:** `buchprojekt/band1-vollversion.html`
   (13 Signal-Kapitel, Quiz, Urkunde, Elternseite ≈ 40 Druckseiten). ACHTUNG: Vollversion
   liegt bewusst NICHT unter `public/` — öffentlich bleiben nur 10-Seiten-MVP + Leseprobe.
3. ~~Bilder produzieren~~ ✓ (05.07.2026): alle 13 Szenen generiert (Codex `image_gen`,
   Character-Sheet-treu) und in Vollversion + öffentliches MVP eingebaut. eBook-Cover mit
   Titel-Overlay: `buchprojekt/cover-band1-ebook.png` (1600×2560, KDP-Format).
   **Produkt-PDF fertig:** `buchprojekt/Callis-Gesundheits-Kompass-Band1-eBook.pdf` (53 MB,
   volle Auflösung — das ist die Digistore24-Download-Datei). Leseprobe neu: 2,1 MB.
   Web-Performance: öffentliche Seiten nutzen 900px-JPGs unter
   `public/assets/media/kinderbuch-scenes/web/`.
4. **Medizinisch-pädagogische Prüfung** + Testvorlesen mit 5–8-Jährigen.
5. **Impressum** mit ladungsfähiger Anschrift (Pflicht in DE).
6. **Print-PDF bauen** (8,5×8,5 + Bleed) + Cover-PDF; Kindle-Version via Kindle Create.
7. **KDP-Konto:** Steuerinterview, Bankverbindung; Buch einstellen (Serie anlegen, Altersgruppe,
   KI-Deklaration), Previewer prüfen, veröffentlichen (bis 72 h Prüfung).
8. **Website:** Digistore24-Produkt anlegen, Kauf-Button auf `/kinderbuch/` aktivieren.
9. **Bände 2–6** im Halbjahres-Rhythmus; Textmaterial für Band 2–4 liegt bereits im
   `Calli-Material-Manuskript.docx`.

## 6. Projektdateien

- `public/assets/kinderbuch/callis-kompass-band1-mvp.html` — **Band-1-MVP: komplettes
  Bilderbuch-Muster** (10 Seiten mit Bild auf jeder Seite, Boxen, Quiz, Produktionsplan, Bildprompts)
- `public/assets/kinderbuch/leseprobe.pdf` — dasselbe als PDF (14 MB — vor Livegang Bilder komprimieren)
- `buchprojekt/Calli-Material-Manuskript.docx` — Textmaterial (ehem. „Kalle"-Manuskript):
  ausgearbeitete Kapitel zu Körper-Team, Zucker-Monster, Zappelmotor, Schlaf → Rohstoff für Bände 1–4
- `buchprojekt/illustrationen/` — flache SVG-Entwürfe (Calli-Figur für Web/Marke; Buch nutzt Aquarell-Stil)
- `public/assets/media/gesundheitskompass-kids-*.png` — 3 Aquarell-Konzeptbilder (Stil-Referenz)
- `src/pages/kinderbuch/index.astro` — Landingpage (Serie, Band 1, Leseprobe, Kaufwege)
- `/gesundheitsbuch-kinder/` → 301-Redirect auf `/kinderbuch/`
