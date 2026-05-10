# Migrationsplan: callidus-am.de von IONOS/MyWebsite NOW zu GitHub Pages

Stand: 2026-05-09

## Kurzfazit

Der Umzug ist technisch gut machbar. Die aktuelle Website laeuft unter WordPress/MyWebsite NOW und liefert eine offene Sitemap:

- `https://www.callidus-am.de/wp-sitemap.xml`
- `https://www.callidus-am.de/wp-sitemap-posts-page-1.xml`

Die WordPress-JSON-API ist deaktiviert, daher sollte die Migration ueber Sitemap + HTML-Crawl erfolgen. Bilder liegen oeffentlich unter `wp-content/uploads/go-x/...` und koennen technisch kopiert werden, sofern die Rechte an den Bildern geklaert sind.

Empfehlung fuer den Neuaufbau: Astro als statische Website mit Markdown/MDX-Inhalten, Deployment ueber GitHub Pages und eigener Domain `callidus-am.de`.

## Aktuelle Hauptnavigation

- Home
- Ueber uns
- Ratgeber
  - Zukunft der Gesundheit
  - Koerper & Ernaehrung
  - Sport & Energie
  - Geist & Seele
- Unsere Empfehlungen
  - Zukunft der Gesundheit
  - Koerper & Ernaehrung
  - Sport & Energie
  - Geist & Seele
- Nachhaltigkeit
- Impressum
- Datenschutz
- Lexicon Vitae

## Gefundene Seiten und Inhalte

Die Sitemap nennt 57 URLs. Diese sollten vor dem Domainwechsel in die neue Seite uebernommen oder bewusst aussortiert werden.

### Kernseiten

- `/` - Startseite
- `/uber-uns/` - Ueber uns
- `/ratgeber/` - Ratgeber-Uebersicht
- `/ratgeber/geist-and-seele/` - Kategorie Geist & Seele
- `/ratgeber/korper-and-ernahrung/` - Kategorie Koerper & Ernaehrung
- `/ratgeber/sport-and-energie/` - Kategorie Sport & Energie
- `/ratgeber/zukunft-der-gesundheit/` - Kategorie Zukunft der Gesundheit
- `/unsere-empfehlungen/` - Empfehlungen-Uebersicht
- `/unsere-empfehlungen/geist-and-seele-1/` - Empfehlungen Geist & Seele
- `/unsere-empfehlungen/korper-and-ernahrung/` - Empfehlungen Koerper & Ernaehrung
- `/unsere-empfehlungen/sport-and-energie/` - Empfehlungen Sport & Energie
- `/unsere-empfehlungen/zukunft-der-gesundheit/` - Empfehlungen Zukunft der Gesundheit
- `/nachhaltigkeit/` - Nachhaltigkeit
- `/lexicon-vitae/` - Lexicon Vitae
- `/impressum/` - Impressum
- `/datenschutz/` - Datenschutz
- `/nutzungsbedingungen/` - Nutzungsbedingungen

### Ratgeber-/Blogartikel

- `/10-minuten-morgen-workout/`
- `/3-atemtechniken-fur-mehr-energie/`
- `/ashwagandha/`
- `/biologische-verjungung/`
- `/blockchain-ihre-gesundheit/`
- `/darmgesundheit-mit-akazienfaser/`
- `/das-diktat-ihrer-gedanken/`
- `/das-protokoll-zur-neuro-resilienz/`
- `/der-digitale-detox/`
- `/der-energie-reset/`
- `/der-ganzheitliche-bodybuilding-plan/`
- `/der-innere-akku/`
- `/der-schlaf-reset/`
- `/der-unsichtbare-teller/`
- `/die-biologische-uhr-verlangsamen/`
- `/die-kraft-der-dankbarkeit/`
- `/die-kraft-des-magnesiums/`
- `/die-kunst-des-mentalen-resets/`
- `/die-personalisierte-revolution/`
- `/digitale-alchemie/`
- `/gehen-als-training/`
- `/gesundheit-im-familien-alltag/`
- `/ihr-digitaler-gesundheits-butler/`
- `/jenseits-der-pille/`
- `/metformin-vs-spermidin/`
- `/protein-wissen-fur-kraftaufbau/`
- `/sport-als-stress-killer/`
- `/vitamin-a-wachter-der-sehkraft/`
- `/vitamin-c-mythen/`
- `/vitamin-d-das-sonnenhormon/`
- `/vitamin-e-der-zellschutzer/`

### Funnel-, Download- und Kursseiten

- `/bitte-bestaetigen/`
- `/download/`
- `/reset-hub/`
- `/stress-reset-kurs/`
- `/kurs-mitgliederbereich/`
- `/modul-4/`
- `/modul-5/`
- `/nexus-app/`
- `/nachhaltigkeit-text/`

Diese Seiten sollten gesondert bewertet werden. Einige wirken wie Newsletter-, Kurs-, Download- oder versteckte Landingpages. Sie muessen nicht zwingend in die Hauptnavigation, koennen aber fuer bestehende Links und E-Mail-Funnel wichtig sein.

## Bildstrategie

Technisch:

- Viele Bilder sind direkt erreichbar, z. B. unter `https://www.callidus-am.de/wp-content/uploads/go-x/u/.../image-1366x1366.png`.
- Mindestens ein Artikelbild wurde mit HTTP 200 bestaetigt.
- Die Startseite und Kategorie-Seiten verwenden mehrere Bilder; Artikel verwenden meist Logo + ein Hauptbild.
- Die Bildnamen sind generisch (`image.png`, `image.jpg`), deshalb sollten wir beim Kopieren sinnvolle neue Dateinamen vergeben.

Rechtlich/praktisch:

- Wenn die Bilder von dir erstellt oder lizenziert wurden, koennen wir sie verwenden.
- Wenn sie aus dem IONOS-Baukasten, Stock-Bibliotheken oder KI-/Vorlagenpaketen stammen, sollte geprueft werden, ob die Lizenz ausserhalb von IONOS weiter gilt.
- Falls Rechte unklar sind, waere die bessere Loesung: bestehende Bilder vorlaeufig als Platzhalter inventarisieren und fuer den neuen Auftritt eigene, klare Bildwelten erstellen.

Empfohlene Umsetzung:

- Alle erreichbaren Bilder einmalig herunterladen.
- Pro Seite ein Hauptbild bestimmen.
- Bilder in `public/assets/images/` ablegen.
- Dateinamen nach Inhalt vergeben, z. B. `darmgesundheit-akazienfaser.png`.
- Bilder komprimieren und moderne Varianten erzeugen, z. B. WebP/AVIF plus Fallback.
- Alt-Texte aus Seitenthema und Kontext neu schreiben.

## Empfohlene neue Website-Struktur

Ziel: weniger Baukasten-Gefuehl, mehr serioeser Gesundheitsratgeber mit klaren Wegen zu Wissen, Empfehlungen und Vertrauen.

```text
/
/ratgeber/
/ratgeber/geist-seele/
/ratgeber/koerper-ernaehrung/
/ratgeber/sport-energie/
/ratgeber/zukunft-gesundheit/
/artikel/<bestehender-slug>/
/empfehlungen/
/empfehlungen/geist-seele/
/empfehlungen/koerper-ernaehrung/
/empfehlungen/sport-energie/
/empfehlungen/zukunft-gesundheit/
/lexicon-vitae/
/nachhaltigkeit/
/ueber-uns/
/impressum/
/datenschutz/
```

Wichtig: Bestehende URLs sollten moeglichst erhalten bleiben, damit Google-Rankings und externe Links nicht verloren gehen. Schoenere neue Kategorie-Slugs sind moeglich, aber dann brauchen wir Weiterleitungen. Auf GitHub Pages sind echte Server-Redirects nur eingeschraenkt moeglich, daher ist URL-Erhalt meist die bessere Wahl.

## Designrichtung

- Ruhiger, hochwertiger Gesundheits- und Wissensauftritt.
- Startseite mit klarer Positionierung: ganzheitliche Gesundheit, fundiertes Wissen, praktische Umsetzung.
- Bessere Artikelkarten mit Kategorie, Kurzbeschreibung und Lesezeit.
- Kategorie-Seiten als kuratierte Hubs statt langer Baukasten-Bloecke.
- Empfehlungen klarer als Affiliate-/Partner-Empfehlungen kennzeichnen.
- Rechtliche Hinweise und medizinischer Disclaimer sichtbar, aber nicht stoerend.
- Mobile Navigation vereinfachen.
- Typografie verbessern: lesbare Artikelbreite, bessere Zwischenueberschriften, Inhaltsverzeichnis fuer lange Artikel.

## Technische Empfehlung

Astro + GitHub Pages:

- Inhalte als Markdown/MDX.
- Bilder lokal im Repository.
- Automatischer Build ueber GitHub Actions.
- Eigene Domain ueber DNS bei IONOS.
- Sehr schnelle Ladezeiten.
- Kein laufender Server, daher kostenloses Hosting ueber GitHub Pages moeglich.

Alternative:

- Jekyll: direkt von GitHub Pages unterstuetzt, aber weniger flexibel und moderner als Astro.
- Reines HTML/CSS: moeglich, aber bei 50+ Seiten langfristig schlechter wartbar.

## SEO- und Migrationsregeln

- Seitentitel und Meta-Beschreibungen uebernehmen und bereinigen.
- Alle alten Slugs erhalten, wenn moeglich.
- Interne Links nach der Migration automatisch pruefen.
- Sitemap neu generieren.
- `robots.txt` und Canonicals korrekt setzen.
- Open-Graph-Bilder fuer Social Sharing definieren.
- Medizinische Disclaimer pro Artikel oder globaler Footer-Hinweis.
- Affiliate-Transparenzhinweis weiterhin gut sichtbar.

## Risiken und offene Punkte

- Bildrechte muessen geklaert werden, besonders bei IONOS-/Stock-/KI-Baukastenbildern.
- Newsletter-Formular und Download-Funnel funktionieren auf GitHub Pages nur mit externem Dienst, z. B. Brevo, MailerLite, ConvertKit oder Formspree.
- Cookie-Banner ist nur noetig, wenn Tracking, YouTube, externe Newsletter-Skripte oder aehnliche Dienste eingebunden werden.
- Kurs-/Mitgliederbereich ist nicht statisch, falls Login/Zahlung/geschuetzte Inhalte benoetigt werden.
- GitHub Pages ist kostenlos, aber nicht fuer komplexe Shops, sensible Daten oder echte Web-App-Backends gedacht.

## Naechste Arbeitsschritte

1. Inhalte und Bilder crawlen und lokal sichern.
2. Entscheiden, welche Funnel-/Kursseiten bleiben.
3. Astro-Projekt fuer die neue Website anlegen.
4. Content-Modell definieren: Artikel, Kategorie, Empfehlungen, Rechtliches.
5. Die 30+ Ratgeberartikel in Markdown ueberfuehren.
6. Designsystem und erste Seiten bauen: Startseite, Ratgeber, Artikeltemplate.
7. Bilder pruefen, umbenennen, komprimieren und Alt-Texte ergaenzen.
8. SEO pruefen: Titel, Beschreibungen, Canonicals, Sitemap.
9. GitHub Pages Deployment einrichten.
10. IONOS-DNS auf GitHub Pages umstellen, sobald alles getestet ist.

