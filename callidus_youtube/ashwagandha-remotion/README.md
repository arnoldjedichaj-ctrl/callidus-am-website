# Ashwagandha Affiliate Short

30-Sekunden-Remotion-Short fuer das Amazon-Affiliate-Produkt "Bio Ashwagandha Pulver 500 g vom Achterhof".

## Inhalt

- 9:16 Vertical Video, 1080 x 1920
- Deutsche Voiceover-Datei unter `public/audio/voiceover.wav`
- Hintergrundmusik unter `public/audio/background.mp3`
- Animierte Produkt-Illustration statt gescrapter Amazon-Bilder
- On-Screen-Copy mit vorsichtigem Disclaimer ohne Heilversprechen

## Befehle

```bash
npm install
npm run studio
npm run still
npm run render
```

Unter PowerShell kann bei deaktivierter Script-Ausfuehrung `npm.cmd` statt `npm` noetig sein.

## Asset-Hinweis

Die erste Version nutzt eine Remotion-Illustration, weil Amazon-Bilder nicht ungeprueft aus der Produktseite kopiert werden sollten. Fuer die finale Anzeige koennen freigegebene Amazon-Partnerbilder oder eigene Produktfotos in `public/` abgelegt und in `src/video.tsx` eingebunden werden.
