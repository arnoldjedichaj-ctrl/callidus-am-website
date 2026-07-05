# Bildproduktion — Aquarell-Stil (verbindlich)

Stand: 05.07.2026 · Bildstil entschieden: warmes Aquarell/Gouache/Buntstift.
**Die Character Sheets sind die einzige visuelle Wahrheit** — bei Abweichungen zwischen
Textbeschreibungen und Sheets gelten immer die Sheets.

## 1. Verbindliche Grundlagen

| Was | Datei |
|---|---|
| Calli (Turnaround, Emotionen, Palette) | `public/assets/media/character-sheets/calli-character-sheet.png` |
| Mira (Turnaround, Ausdrücke, Palette) | `public/assets/media/character-sheets/mira-character-sheet.png` |
| Noah (Turnaround, Ausdrücke, Palette) | `public/assets/media/character-sheets/noah-character-sheet.png` |
| Druckübersicht | `public/assets/documents/callis-character-sheets.html` |
| Stil-Referenz-Szenen | `public/assets/media/gesundheitskompass-kids-*.png` (Cover, Schlaf, Essen) |

Original-Generate zusätzlich unter: `C:\Users\marga\.codex\generated_images\019f2e86-569f-7c90-986d-33e68d8b2f30`

**Werkzeug:** KI-Bildgenerierung (`image_gen`, Codex-Session). Die Bilder sind digitale
Bilder im Stil von Aquarell/Gouache/Buntstift — bei KDP als KI-generiert deklarieren.

## 2. Die Figuren (wie auf den Sheets)

- **Calli** — antiker Messing-Taschenkompass mit Öse oben; mint-grünes Ziffernblatt als
  Gesicht mit großen Kulleraugen, rosigen Wangen und breitem Lächeln; die rot-goldene
  Kompassnadel sitzt senkrecht auf dem Ziffernblatt (über der Nase); dünne Messing-Ärmchen
  und -Beinchen. KEIN Nadel-Hut, KEINE Schrift auf dem Ziffernblatt.
- **Mira** — Mädchen mit warmbrauner Haut, dunkelbraunem Lockenhaar als Knoten mit goldenem
  Haargummi; koralle-weiß geringeltes Langarmshirt unter blauer Latzhose (Beine umgekrempelt);
  rote Sneaker; braune Umhängetasche.
- **Noah** — Junge mit heller, sommersprossiger Haut und rot-orangem Wuschelhaar;
  grün-weiß geringeltes Langarmshirt unter blauer Latzhose (Beine umgekrempelt);
  türkis-grüne Sneaker; bastelt gern (Schraubenzieher/Roboter auf dem Sheet).

## 3. Master-Prompt (immer wörtlich mitgeben)

```
Style/medium: soft watercolor, gouache and colored pencil children's book illustration, warm storybook look, textured paper grain, hand-painted edges, delicate pencil linework.
Color palette: warm cream paper background, olive green, mint, coral, soft blue, muted gold, natural denim blue.
Lighting/mood: gentle daylight, warm, friendly, trustworthy, playful but not silly.
Constraints: use the provided character sheet as strict reference; keep face, outfit, proportions, hair, colors and silhouette consistent; no text, no letters, no logos, no watermark, no scary anatomy, no medical horror, no shame-based body language.
```

## 4. Arbeitsregel (bei jedem neuen Bild)

1. Passende Character Sheets als Referenz anhängen (alle Figuren, die in der Szene vorkommen).
2. Nur Pose, Szene, Blickrichtung und Handlung verändern.
3. Gesicht, Outfit, Haare, Farben und Proportionen NICHT neu erfinden.
4. Keinen Text im Bild erzeugen — Schriftzüge (KNURR!, Urkunde, Sprechblasen) später als
   Vektor-Overlay im Layout setzen.
5. Pro Szene 3–4 Varianten generieren, beste wählen; Gesichter und Hände kritisch prüfen.
6. Bei KDP-Nutzung: KI-generierte Inhalte beim Veröffentlichen angeben.

## 5. Szenen-Prompts Band 1 (an Master-Prompt anhängen; Sheets als Referenz)

Die 7 noch fehlenden MVP-Szenen. Wichtige Bildelemente 10 % vom Rand fernhalten (Beschnitt).

| Seite | Szene | Referenz-Sheets | Prompt-Zusatz (EN) |
|---|---|---|---|
| 2 | Calli stellt sich vor | Calli | Calli the small antique brass pocket compass with a friendly mint-green dial face, standing on a wooden breakfast table next to a loaf of bread, morning light in a cozy kitchen, steam rising from a mug |
| 6 | KNURR! Bauch-Post | Calli, Noah | Noah laughing at the breakfast table holding his tummy, a small cream-colored envelope with tiny wings flying from his tummy towards Calli the brass compass, a startled cat jumping off a sofa in the background |
| 8 | Durst-Gießkanne | Calli, Mira | Mira watering a drooping potted flower that perks up happily, Calli the brass compass offering her a glass of water, sunny garden terrace, soft green and blue tones |
| 12 | Zappelbeine | alle drei | Mira and Noah joyfully jumping and running across a sunny meadow, Calli the brass compass bouncing behind them, flying autumn leaves, golden afternoon light |
| 14 | Aua & Reparatur-Trupp | Calli, Noah | Noah sitting on garden steps looking at his knee with a large beige plaster, tiny friendly fantasy helper creatures with toolboxes and a magnifying glass climbing on the plaster, Calli the brass compass gently directing them |
| 16 | Gefühls-Wetter | Calli, Mira | Mira sitting at a window looking thoughtful, small floating weather symbols with cute faces above her head (smiling sun, sad rain cloud, grumpy thundercloud), Calli the brass compass holding a tiny umbrella |
| 20 | Urkunde/Finale | alle drei | Calli the brass compass ceremonially handing a blank certificate scroll to proud Mira and Noah in an evening garden, gentle confetti, warm sunset light |

**Neue Szenen der Vollversion** (Text komplett in `buchprojekt/band1-vollversion.html`;
Seitenzahlen dort):

| Seite | Szene | Referenz-Sheets | Prompt-Zusatz (EN) |
|---|---|---|---|
| 8 | HICKS! Schluckauf | Calli, Noah, (Mira) | Noah at the breakfast table with a cocoa mug, mid-hiccup with shoulders raised and a surprised face, Mira giggling, Calli the brass compass doing a startled little jump |
| 10 | Pipi-Post | Calli, Mira | Mira wiggling impatiently from one leg to the other in front of a bathroom door with a small water-drop sign, Calli the brass compass kindly pointing at the door, warm hallway |
| 16 | Kribbelbein | Calli, Noah | Noah standing next to a painting table on one leg, laughing and shaking his other leg, tiny friendly ant dots tingling up the leg, Calli watching amused, cozy children's room |
| 20 | Nies-Turbo | Calli, Mira | Mira mid-sneeze in the garden with her arm over her face sneezing into her elbow, dandelion seeds swirling through the air, Calli the brass compass holding on to a blade of grass |
| 22 | Körper-Thermostat | alle drei | summer scene at a paddling pool: Mira with goosebumps and chattering teeth in the cool water (cool blue tones), Noah sweaty and rosy-cheeked after romping in the sun (warm tones), Calli the brass compass standing between them like a tiny referee |
| 28 | Blinzel-Pause | Calli, Noah | Noah sitting on a rug with a tablet, tiredly rubbing one eye, Calli the brass compass invitingly pointing to an open window with a green view, late afternoon light |

Bereits vorhanden und wiederverwendet: Cover-Szene, Bunter Teller, Schlaf-Werkstatt.
Damit fehlen insgesamt **13 Bilder** (7 aus dem MVP + 6 neue) plus finales Buchcover.

## 6. Technische Vorgaben

- Mind. 3000 × 3000 px generieren (Druck 8,5×8,5 Zoll + Beschnitt bei 300 dpi = 2588 × 2625 px)
- Quadratisch; RGB reicht (KDP konvertiert für den Druck)
- Nutzungsbedingungen des Bild-Tools für kommerzielle Nutzung beachten
- Nach Auswahl: Einbau ins MVP (`public/assets/kinderbuch/callis-kompass-band1-mvp.html`),
  dann Leseprobe-PDF neu erzeugen
