# callidus A&M Website Migration

Separates Migrationsprojekt für `https://www.callidus-am.de/`.

## Stand

- 57 Seiten aus der Sitemap gecrawlt.
- 80 Bilder lokal gesichert.
- Astro-Projektgerüst angelegt.
- Startseite, Ratgeber-Übersicht und dynamische Legacy-Seiten erstellt.
- 31 Artikel strukturiert extrahiert.
- 65 Affiliate-/Produktempfehlungen strukturiert extrahiert.
- Audio-/Medienintegration für Artikel vorbereitet.

## Wichtige Ordner

- `source/content-html/` - gesicherte Original-HTML-Dateien
- `source/assets/original/` - gesicherte Originalbilder
- `source/data/inventory.json` - Seiteninventar
- `src/` - neue Website
- `public/assets/original/` - Bilder für die lokale Vorschau

## Wichtige Befehle

- `npm run dev -- --port 4321` - lokale Vorschau
- `npm run build` - statische Website bauen
- `npm run extract:articles` - Artikel aus Original-HTML neu extrahieren
- `npm run extract:recommendations` - Affiliate-/Empfehlungsdaten neu extrahieren
- `npm run download:media` - Audio-/Mediendateien lokal sichern
