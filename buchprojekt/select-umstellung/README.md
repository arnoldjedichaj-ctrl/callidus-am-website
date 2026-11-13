# Calli-Reihe: Umstellung auf Kindle + KDP Select (vorbereitet 09.11.2026)

Ziel: alle 6 deutschen Bände als Kindle-E-Book in KDP Select, damit sie in Kindle
Unlimited / Kindle+ gelesen werden (Bezahlung je gelesener KENP-Seite) und Gratis-Tage
sowie Countdown Deals möglich werden. Taschenbücher bleiben unverändert.

**Erwartung realistisch halten:** KENP-Satz DE laut Oktober-Abrechnung ~0,003 € je Seite.
Ein Bilderbuch zählt bei Amazon grob 40–80 KENP-Seiten → **ca. 0,12–0,25 € je komplett
gelesenem Band**. Der Nutzen liegt in Reichweite und Rezensionschancen, nicht in den Cent.

## Was fertig ist

| Was | Wo |
|---|---|
| Kindle-EPUB Band 2–6 (umfließend, Bilder 700 px, 2,8–3,7 MB, XML geprüft) | `kinderbuch-bandN/Callis-Kompass-BandN-Kindle.epub` |
| Generator dafür | `tools/build_epub_de.py N` |
| Kindle-Cover Band 2–6 (1600×2560, liegt schon vor) | `kinderbuch-bandN/cover-bandN-ebook.png` |
| A+-Bilder Band 2, 3, 4, 6 (Header 970×600 + 4× 600×600) | `../marketing/amazon-aplus/bandN-*.jpg` |
| Generator dafür | `../marketing/amazon-aplus/build_aplus_de.py` |
| Gekürzte Leseproben Band 1–6 (6 statt 14 Seiten, ~8 % des Textes, Hinweis auf Amazon/KU) | `select-umstellung/leseproben/` |
| Generator dafür | `tools/kuerze_leseproben.py` |

Band 1 hat seine Kindle-Ausgabe schon (B0HL744S4R), nur ohne Select.

Nicht übernommen: Die Band-1-Kindle-Ausgabe hat eine Seite „Danke fürs Mitlesen“ mit
Bewertungsbitte. Laut `CLAUDE.md` ist die Rezensionsbitte nur in Auslieferungsmails
zulässig, deshalb fehlt die Seite in Band 2–6 bewusst.

## Reihenfolge (wichtig: erst Digistore aus, dann Select an)

Select verlangt ab Aufnahme Exklusivität der **digitalen** Fassung. Solange das PDF über
Digistore verkauft wird, wäre jeder Select-Band ein Verstoß.

1. **Digistore24 (Inhaber, eigener Login):** Produkte 709550, 709996, 710152, 710833,
   710837, 711028 auf „nicht verkaufbar“ stellen. Bisherige Käufer behalten ihren Download.
2. **Website (Claude, nach Freigabe):**
   - `src/pages/kinderbuch/index.astro`: Digistore-Buttons raus, Amazon-Button wird
     Hauptbutton („Taschenbuch & Kindle bei Amazon“), Preis-Anzeige 9,90 € entfernen.
   - Gekürzte Leseproben aus `select-umstellung/leseproben/` 1:1 über
     `public/assets/kinderbuch/` kopieren (gleiche Dateinamen, Pfade bleiben).
   - `src/pages/affiliate-kinderbuch.astro` (Digistore-Partnerprogramm) abschalten oder
     auf Amazon-Partnerlinks umbauen.
   - VAL-Einlösung für Kinderbücher (`createKinderbuchRedemption`, `KINDERBUCH_PRODUCTS`
     in `functions/index.js` Z. 967 ff.) läuft über Digistore-Gutscheine → Einlöse-Panel
     auf `/kinderbuch/` ausblenden. Function nur einzeln deployen (siehe `CLAUDE.md`).
   - Achtung: Branch `feature/lead-conversion` liegt hinter `main` → Änderung auf frischem
     Branch von `main` machen.
3. **KDP Band 1:** Bücherregal → Kindle-Ausgabe Band 1 → „KDP Select“ → anmelden.
4. **KDP Band 2–6 Kindle anlegen:** im Bücherregal beim Taschenbuch „+ Kindle-E-Book
   erstellen“ (übernimmt Titel, Serie, Autor, Beschreibung, Stichwörter). Dann:

| Feld | Wert |
|---|---|
| Autor | Arnold Jedich |
| Beschreibung, Stichwörter | vom Taschenbuch übernehmen |
| Lesealter | 5 bis 8 |
| Primärer Shop | **Amazon.de** (Voreinstellung ist .com!) |
| Kategorien | wie Band 1: Kinderbücher > Wissenschaft & Natur > Anatomie & Physiologie; Band 5 besser Kinderbücher > Gefühle; Band 2 Ernährung, Band 4 Schlafenszeit, falls angeboten |
| KI-Angabe | Texte: gesamtes Werk, umfangreiche Bearbeitung (Claude). Bilder: viele KI-Bilder, umfangreiche Bearbeitung (OpenAI Codex). Übersetzung: keine |
| DRM | kein DRM (wie Band 1) |
| Manuskript | `Callis-Kompass-BandN-Kindle.epub` |
| Cover | `cover-bandN-ebook.png` |
| Barrierefreiheit | Alle informativen Bilder haben Alt-Texte |
| **KDP Select** | **Ja, anmelden** |
| Preis | 4,99 € (wie Band 1), 70 % Tantieme |

   Bekannte Stolperfallen (aus Band 1): Serien-Assistent übernimmt Kategorien, Lesealter
   und Primärshop **nicht**; DRM-Checkbox nur per `input.click()`; Preisfelder nach dem
   Tippen gegenprüfen.
5. **A+ (Amazon.de):** für Band 2, 3, 4, 6 neu anlegen (Texte unten), auf Taschenbuch
   **und** Kindle-ASIN anwenden. Bei Band 1 und 5 die Kindle-ASINs ergänzen; bei Band 5
   fehlt in der Vergleichstabelle noch die Spalte Band 6.
6. **Kindle Unlimited sichtbar machen:** nach Freischaltung Website-Text „auch in Kindle
   Unlimited“ ergänzen.

## A+-Texte Band 2, 3, 4, 6

Gleiche Struktur wie Band 5 (`../marketing/amazon-aplus/README-band5.md`).
**Keinen Geviertstrich „—“ verwenden**, nur Werte einfügen, nie das Feldlabel mit.

Modul 1 Überschrift (alle): `Eine Reihe, die Kindern hilft, sich selbst zu verstehen`
Modul 2 Überschrift (alle): `Was in jedem Band steckt`
Modul 3: Vergleichstabelle identisch zu Band 1/5 mit allen sechs Spalten, beworbenen Band
per „Spalte markieren“ hervorheben. Die Tabelle enthält die ASINs der Taschenbücher:
B0H8LT17P1, B0H8LNXT7Y, B0H8LV792N, B0H8LPLT81, B0H8FN6CHN, B0H8PYQL3D.

### Band 2: Das Zucker-Monster
- Header `band2-header-970x600.jpg`, zweite Überschrift `Band 2: Das Zucker-Monster`
- Fließtext: `Was gibt Kraft für den ganzen Vormittag? Warum ist Schlecki nach dem Zucker-Flummi so müde? Mira und Noah entdecken mit Calli den Regenbogen-Teller, die Gemüse-Bande und das Satt-Signal. Ganz ohne Verbote, denn kein Essen ist ein Bösewicht.`

| Bild | Überschrift | Text |
|---|---|---|
| `band2-a-vorlesen-600.jpg` | Eine Geschichte zum Vorlesen | Sieben kurze Kapitel vom Frühstücks-Motor bis zum Wochen-Teller, erzählt mit Humor und ohne erhobenen Zeigefinger. |
| `band2-b-schlauseiten-600.jpg` | Callis Schlau-Seiten | Kindgerecht erklärt: Was macht der Bauch mit dem Essen, und warum ist Wasser der beste Durstlöscher? |
| `band2-c-mitmachen-600.jpg` | Mach-mit-Missionen | Von der Regenbogen-Jagd bis zum Probier-Mut. Kleine Übungen für den Familientisch. |
| `band2-d-urkunde-600.jpg` | Urkunde zum Teller-Helden | Am Ende wartet die Urkunde zum Ausschneiden. Für alle, die bunt essen und auf ihren Bauch hören. |

### Band 3: Der Zappelmotor
- Header `band3-header-970x600.jpg`, zweite Überschrift `Band 3: Der Zappelmotor`
- Fließtext: `Wenn die Beine nicht stillhalten wollen, braucht der Zappelmotor Auslauf. Flitz, der Gute-Laune-Funke, zeigt Mira und Noah, was Bewegung mit Herz, Muskeln und Laune macht. Und warum Pausen genauso wichtig sind.`

| Bild | Überschrift | Text |
|---|---|---|
| `band3-a-vorlesen-600.jpg` | Eine Geschichte zum Vorlesen | Sieben kurze Kapitel vom Zappelmotor bis zur Tier-Olympiade, perfekt für den Abend. |
| `band3-b-schlauseiten-600.jpg` | Callis Schlau-Seiten | Kindgerecht erklärt: Warum schlägt das Herz schneller, und was machen Muskeln in der Pause? |
| `band3-c-mitmachen-600.jpg` | Mach-mit-Missionen | Von der Kraft-Runde bis zum Ruhe-Atem. Bewegungsideen für drinnen und draußen. |
| `band3-d-urkunde-600.jpg` | Urkunde zum Bewegungs-Helden | Am Ende wartet die Urkunde zum Ausschneiden. Für alle, die toben und ausruhen können. |

### Band 4: Die Schlaf-Werkstatt
- Header `band4-header-970x600.jpg`, zweite Überschrift `Band 4: Die Schlaf-Werkstatt`
- Fließtext: `Noah will nicht ins Bett. Dann zeigt ihm Nino, der Nachtfreund, was nachts alles passiert: In der Nacht-Werkstatt wird repariert, sortiert und gewachsen. Eine Geschichte, die Kindern den Abend leichter macht.`

| Bild | Überschrift | Text |
|---|---|---|
| `band4-a-vorlesen-600.jpg` | Eine Geschichte zum Vorlesen | Sieben ruhige Kapitel vom Traum-Kino bis zur inneren Uhr, gemacht für die Zeit vor dem Einschlafen. |
| `band4-b-schlauseiten-600.jpg` | Callis Schlau-Seiten | Kindgerecht erklärt: Warum wir träumen und wie Licht der inneren Uhr Bescheid gibt. |
| `band4-c-mitmachen-600.jpg` | Mach-mit-Missionen | Vom Gähn-Detektiv bis zur eigenen Startrampe ins Bett. Rituale für einen ruhigen Abend. |
| `band4-d-urkunde-600.jpg` | Urkunde zum Schlaf-Helden | Am Ende wartet die Urkunde zum Ausschneiden. Für alle, die gut ausgeschlafen in den Tag starten. |

### Band 6: Die Abwehr-Polizei
- Header `band6-header-970x600.jpg`, zweite Überschrift `Band 6: Die Abwehr-Polizei`
- Fließtext: `Im Körper patrouilliert eine kleine Polizei. Willi, der Wächter, zeigt Mira und Noah, wie sie Wirbelmacher fernhält, warum Händewaschen hilft und was beim Kranksein passiert. Hygiene ohne Angst, mit viel Mut für den Besuch beim Doktor.`

| Bild | Überschrift | Text |
|---|---|---|
| `band6-a-vorlesen-600.jpg` | Eine Geschichte zum Vorlesen | Sieben kurze Kapitel vom Hände-Helden bis zum besten Freund der Abwehr-Polizei. Das große Finale der Reihe. |
| `band6-b-schlauseiten-600.jpg` | Callis Schlau-Seiten | Kindgerecht erklärt: Wie schützt sich der Körper, und warum helfen Ruhe und Trinken beim Gesundwerden? |
| `band6-c-mitmachen-600.jpg` | Mach-mit-Missionen | Vom Hand-Detektiv bis zu den eigenen Doktor-Fragen. Kleine Übungen gegen große Sorgen. |
| `band6-d-urkunde-600.jpg` | Urkunde zum Abwehr-Helden | Am Ende wartet die Urkunde zum Ausschneiden. Für alle, die ihrer Abwehr-Polizei helfen. |

## Noch offen / zu entscheiden
- Inhaber prüft im Digistore-Backend, ob es nennenswerte PDF-Verkäufe gab.
- Hörprobe `public/audio/kinderbuch/noahs-schlaf-akku.mp3` ist ein anderes Format und von
  Select nicht betroffen.
- 90 Tage nach der Anmeldung auswerten (bei Start Mitte November also Mitte Februar 2027): KENP-Seiten je Band in den
  KDP-Berichten; Select verlängert sich automatisch, Abmeldung jederzeit zum Periodenende.
