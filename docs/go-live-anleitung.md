# Go-Live-Anleitung: callidus-am.de auf GitHub Pages

Stand: 2026-05-10

Diese Anleitung fuehrt Sie Schritt fuer Schritt durch den Domain-Umzug von
IONOS MyWebsite NOW zu GitHub Pages, **ohne** dass Sie die Domain oder die
E-Mail-Adresse `info@callidus-am.de` verlieren.

---

## Was bereits vorbereitet wurde

In dieser Codebasis sind ab jetzt vorhanden:

- `public/CNAME` mit `www.callidus-am.de`
- `public/robots.txt` (mit Verweis auf Sitemap)
- `public/favicon.svg` und `public/site.webmanifest`
- `src/pages/404.astro` (eigene Fehlerseite)
- Open-Graph- und Twitter-Card-Meta-Tags in `src/layouts/BaseLayout.astro`
- JSON-LD strukturierte Daten (Organization, WebSite, Article)
- Cookie-Banner mit Consent-Speicherung in `localStorage`
- Brevo-Newsletter-iframe direkt auf der Startseite (laedt erst nach Consent)
- GitHub Actions Workflow `.github/workflows/deploy.yml`
- Erweiterte Sitemap-Konfiguration mit Prioritaeten und Filtern

---

## Schritt 1: Lokal bauen und testen

```bash
npm install
npm run dev      # dev-Server unter http://127.0.0.1:4321
npm run build    # Produktions-Build im Ordner dist/
npm run preview  # Vorschau der gebauten Seite
```

Pruefen Sie, dass alle Seiten laden, die Bilder erscheinen, der Cookie-Banner
beim ersten Aufruf erscheint und das Newsletter-Formular nach Klick auf "Formular
laden" sichtbar wird.

---

## Schritt 2: GitHub-Repository einrichten

1. Auf <https://github.com> ein **neues Repository** anlegen, z. B. `callidus-am-website`.
2. Im lokalen Projektordner einmalig:

   ```bash
   git init
   git add .
   git commit -m "Initialer Stand"
   git branch -M main
   git remote add origin git@github.com:DEIN-USER/callidus-am-website.git
   git push -u origin main
   ```

3. Im Repository auf GitHub: **Settings → Pages**
   - Source: **GitHub Actions**
   - Custom domain: `www.callidus-am.de` (wird gleich gesetzt)
   - Enforce HTTPS: aktivieren (sobald verfuegbar, ggf. erst nach DNS-Switch)

Sobald der erste Push laeuft, baut der Workflow `.github/workflows/deploy.yml`
die Seite und veroeffentlicht sie unter `DEIN-USER.github.io/callidus-am-website/`.

---

## Schritt 3: DNS bei IONOS umstellen

Wichtig: Vorher **NICHT** das Webbaukasten-Paket kuendigen.

Login bei IONOS → **Domains & SSL** → `callidus-am.de` → **DNS**

Eintraege bearbeiten:

| Typ   | Hostname | Wert / Ziel                     | TTL |
|-------|----------|---------------------------------|-----|
| A     | @        | 185.199.108.153                 | 1h  |
| A     | @        | 185.199.109.153                 | 1h  |
| A     | @        | 185.199.110.153                 | 1h  |
| A     | @        | 185.199.111.153                 | 1h  |
| AAAA  | @        | 2606:50c0:8000::153             | 1h  |
| AAAA  | @        | 2606:50c0:8001::153             | 1h  |
| AAAA  | @        | 2606:50c0:8002::153             | 1h  |
| AAAA  | @        | 2606:50c0:8003::153             | 1h  |
| CNAME | www      | DEIN-USER.github.io.            | 1h  |

**Wichtig:** Beim CNAME den Punkt am Ende lassen.

Bestehende **MX-Eintraege** (fuer `info@callidus-am.de`) **NICHT** anfassen.
Diese muessen erhalten bleiben, sonst funktioniert die E-Mail nicht mehr.
Auch `TXT`-Eintraege (SPF, DKIM, DMARC) bleiben unveraendert.

DNS-Aenderung dauert in der Regel 15 Minuten bis 24 Stunden bis sie weltweit
greift.

---

## Schritt 4: Verifizierung in GitHub Pages

In GitHub: **Settings → Pages** → Custom domain auf `www.callidus-am.de` setzen
und speichern. GitHub prueft den DNS und stellt automatisch ein
Let's-Encrypt-SSL-Zertifikat aus (kann 5–60 Minuten dauern).

Sobald gruener Haken und "Enforce HTTPS" verfuegbar ist: aktivieren.

Test:
- `https://www.callidus-am.de` → neue Seite
- `https://callidus-am.de` → leitet auf `www.` um (GitHub macht das automatisch)

---

## Schritt 5: SEO-Tools eintragen

1. **Google Search Console** unter <https://search.google.com/search-console>:
   - Property `https://www.callidus-am.de` hinzufuegen
   - Verifizierung ueber DNS-TXT-Record (bei IONOS hinzufuegen)
   - Sitemap einreichen: `https://www.callidus-am.de/sitemap-index.xml`
   - URL-Pruefung: 5–10 wichtige alte URLs einzeln auf "Indexierung beantragen"

2. **Bing Webmaster Tools**: gleiches Spiel.

3. **Plausible / Matomo / Umami** als datenschutzfreundliche Analytics-Loesung
   einrichten (optional). Vermeiden Sie Google Analytics, das wuerde wieder
   Cookie-Banner mit Consent-Pflicht ausloesen.

---

## Schritt 6: Erst JETZT bei IONOS kuendigen

Pruefen Sie zwei Wochen lang:

- Alle 31 Artikel sind erreichbar
- Bilder werden geladen
- Newsletter-Formular funktioniert (Test-Anmeldung machen)
- Stress-Reset-PDFs lassen sich herunterladen
- E-Mail an `info@callidus-am.de` kommt an
- Google indexiert die neue Seite (in der Search Console pruefen)

Wenn alles laeuft: Bei IONOS im Kundenmenue
**Vertraege & Pakete** → das **MyWebsite NOW** Paket kuendigen.

**NICHT kuendigen:** Domain-Paket und E-Mail-Postfach.

Falls IONOS Web-Hosting und Domain als Bundle anbietet: bei der
Kuendigung explizit darauf hinweisen, dass nur der Webbaukasten gekuendigt
werden soll, Domain und Mail erhalten bleiben muessen. Notfalls vorher auf
das reine **Domain-Paket** (z. B. "Domain Light") downgraden.

---

## Wartung im Alltag

### Neuen Artikel hinzufuegen

1. Eintrag in `src/data/inventory.json`:

   ```json
   {
     "url": "https://www.callidus-am.de/MEIN-NEUER-SLUG/",
     "slug": "mein-neuer-slug",
     "title": "Titel der Seite | callidus A&M",
     "description": "Meta-Beschreibung 150-160 Zeichen.",
     "h1": [],
     "h2": [],
     "imageCount": 1,
     "images": [],
     "status": "ok"
   }
   ```

2. Eintrag in `src/data/articles.json`:

   ```json
   {
     "slug": "mein-neuer-slug",
     "path": "/mein-neuer-slug/",
     "title": "Voller Titel",
     "description": "Meta-Beschreibung",
     "image": "/assets/original/IRGENDEIN-BILD.png",
     "readingTime": 4,
     "blocks": [
       { "type": "heading", "level": 2, "text": "Eine Ueberschrift" },
       { "type": "paragraph", "text": "Erster Absatz." },
       { "type": "list", "items": ["Punkt 1", "Punkt 2"] }
     ]
   }
   ```

3. `git commit && git push` → automatisches Deployment.

### Affiliate-Link aendern

Datei: `src/data/recommendations.json`. Im jeweiligen Produktblock das Feld
`"url"` aendern, committen, pushen. Beispiel: `"url": "https://amzn.to/NEU"`.

### Bilder

Alles unter `public/assets/` wird live ausgeliefert. Neue Bilder dort ablegen
und im Code mit `/assets/...` referenzieren.

---

## Bekannte Einschraenkungen GitHub Pages

- Keine echten 301-Redirects auf Server-Ebene. Wenn Sie alte URLs aendern,
  bauen Sie Weiterleitungen mit `<meta http-equiv="refresh">` oder lassen die
  alten URLs einfach erhalten (besser fuer SEO).
- Keine serverseitige Logik (kein PHP, kein Login-Bereich). Fuer
  Bezahlinhalte wie den Stress-Reset-Kursbereich wird weiterhin Digistore24
  bzw. ein externer Mitgliederbereich benoetigt.
- Repository sollte unter 1 GB bleiben. Aktuell ca. 50 MB Bilder, also
  voellig unkritisch.
