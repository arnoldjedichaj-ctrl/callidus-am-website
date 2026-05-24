# Seiten bei Google zur Indexierung anstossen

Schnellanleitung, wie Sie einzelne Seiten in der Google Search Console
zur prioritaeren Indexierung schicken koennen.

## Wann nutzen?

- Nach einem groesseren Inhalts-Update auf einer wichtigen Seite
- Wenn eine neue Seite/ein neuer Artikel rein soll
- Wenn Google das alte Favicon/Vorschaubild noch in den Suchergebnissen zeigt

Fuer normale Inhalte uebernimmt das die Sitemap automatisch — diese Liste
ist nur fuer "Beschleunigung" einzelner Seiten.

## Schritte

1. Search Console oeffnen:
   <https://search.google.com/search-console?resource_id=sc-domain%3Acallidus-am.de>

2. Oben in der Suchleiste die **vollstaendige URL** eintragen, z. B.:

   ```
   https://www.callidus-am.de/die-kraft-des-magnesiums/
   ```

   und **Enter** druecken.

3. **~20 Sekunden warten** — Google prueft die URL und zeigt:
   - "URL ist auf Google" (gruener Haken) = schon indexiert
   - "URL ist nicht auf Google" (graues i) = noch nicht

4. Rechts neben **"Seite geaendert?"** auf **"INDEXIERUNG BEANTRAGEN"** klicken.

5. **Noch ~20 Sekunden warten** — Google macht einen Live-Test.

6. Es erscheint das gruene Modal: **"Indexierung wurde beantragt"** —
   die URL ist in der bevorzugten Crawling-Warteschlange.

7. **"Schliessen"** klicken, mit der naechsten URL weitermachen.

## Empfohlene URLs fuer Re-Indexierung

Diese URLs sind die wichtigsten Einstiegsseiten und sollten regelmaessig
einen Push bekommen, vor allem nach Aenderungen an Logo, Branding oder
Seitenstruktur:

### Hub-Seiten (immer wichtig)
- <https://www.callidus-am.de/>
- <https://www.callidus-am.de/ratgeber/>
- <https://www.callidus-am.de/unsere-empfehlungen/>
- <https://www.callidus-am.de/uber-uns/>

### Produkt- & Conversion-Seiten
- <https://www.callidus-am.de/stress-reset-kurs/>
- <https://www.callidus-am.de/nexus-app/>
- <https://www.callidus-am.de/handbuch/>

### Top-Artikel
- <https://www.callidus-am.de/3-atemtechniken-fur-mehr-energie/>
- <https://www.callidus-am.de/die-kraft-des-magnesiums/>
- <https://www.callidus-am.de/vitamin-d-das-sonnenhormon/>
- <https://www.callidus-am.de/darmgesundheit-mit-akazienfaser/>
- <https://www.callidus-am.de/ashwagandha/>
- <https://www.callidus-am.de/der-schlaf-reset/>
- <https://www.callidus-am.de/die-biologische-uhr-verlangsamen/>
- <https://www.callidus-am.de/sport-als-stress-killer/>

## Limits & Tipps

- **Tageslimit:** Google laesst etwa **10–12 Anfragen pro Tag** zu.
  Bei mehr kommt eine Quota-Warnung — am naechsten Tag weiter.
- **Mehrfach beantragen bringt nichts:** Die Reihung in der Warteschlange
  aendert sich dadurch nicht.
- **Geduld:** Vom Antrag bis zur tatsaechlichen Indexierung dauert es
  von wenigen Stunden bis ein paar Tagen.
- **Sitemap pflegen:** Wir liefern automatisch
  <https://www.callidus-am.de/sitemap-index.xml> aus — Google geht da
  regelmaessig durch. Wenn Sie also nur einen neuen Artikel pushen,
  reicht das fuer normale Indexierung.

## Wenn Google das alte Logo / Favicon noch zeigt

Favicons und Social-Sharing-Bilder werden von Google sehr lange gecacht
(Wochen bis Monate). Beschleuniger:

1. Startseite per Indexierung beantragen (oben in der Liste).
2. **Facebook Sharing Debugger** aufrufen
   (<https://developers.facebook.com/tools/debug/>), URL eingeben,
   "Erneut crawlen". Das aktualisiert die Vorschau bei Facebook,
   WhatsApp, LinkedIn.
3. Geduld — bei Google kann der Logo-Wechsel in der Suche durchaus
   2–6 Wochen dauern, auch wenn die Seite indexiert ist.
