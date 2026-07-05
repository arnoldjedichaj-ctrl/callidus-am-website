# Character Sheets: Callis Gesundheits-Kompass

Stand: 2026-07-05

Diese Mappe ist die feste visuelle Grundlage fuer Band 1 und spaetere Baende.
Sie soll verhindern, dass Mira, Noah und Calli von Bild zu Bild anders aussehen.

## Erstellte Dateien

- Mira: `public/assets/media/character-sheets/mira-character-sheet.png`
- Noah: `public/assets/media/character-sheets/noah-character-sheet.png`
- Calli: `public/assets/media/character-sheets/calli-character-sheet.png`
- Druckuebersicht: `public/assets/documents/callis-character-sheets.html`

## Wie die Aquarellbilder erstellt wurden

Die Bilder wurden als KI-generierte Rasterbilder mit dem eingebauten `image_gen`
Werkzeug erstellt. Es sind also keine echten handgemalten Aquarelle, sondern
digitale Bilder im Stil von Aquarell, Gouache und Buntstift.

Der Stil wurde in den Prompts so festgelegt:

- weiche Aquarell- und Gouache-Flaechen
- sichtbare Papierkoernung
- feine Buntstift-Kanten
- warme Kinderbuchfarben: Creme, Olive, Mint, Koralle, sanftes Blau, Gold
- freundliche Figuren, keine harten medizinischen Innenansichten
- keine Schrift im Bild, damit keine falsch geschriebenen KI-Texte entstehen

Die erzeugten Originale liegen zusaetzlich unter:

`C:\Users\marga\.codex\generated_images\019f2e86-569f-7c90-986d-33e68d8b2f30`

Die Projektkopien liegen unter:

`public/assets/media/character-sheets/`

## Master-Prompt fuer neue Bilder

Diesen Block bei neuen Illustrationen immer mitgeben:

```text
Style/medium: soft watercolor, gouache and colored pencil children's book illustration, warm storybook look, textured paper grain, hand-painted edges, delicate pencil linework.
Color palette: warm cream paper background, olive green, mint, coral, soft blue, muted gold, natural denim blue.
Lighting/mood: gentle daylight, warm, friendly, trustworthy, playful but not silly.
Constraints: use the provided character sheet as strict reference; keep face, outfit, proportions, hair, colors and silhouette consistent; no text, no letters, no logos, no watermark, no scary anatomy, no medical horror, no shame-based body language.
```

## Arbeitsregel

Bei jedem neuen Bild:

1. Erst das passende Character-Sheet als Referenz verwenden.
2. Nur Pose, Szene, Blickrichtung und Handlung veraendern.
3. Gesicht, Outfit, Haare, Farben und Proportionen nicht neu erfinden.
4. Kein Text direkt im Bild erzeugen. Text spaeter im Layout setzen.
5. Wenn ein Bild fuer Amazon/KDP verwendet wird: KI-generierte Inhalte beim Veroeffentlichen entsprechend angeben.
