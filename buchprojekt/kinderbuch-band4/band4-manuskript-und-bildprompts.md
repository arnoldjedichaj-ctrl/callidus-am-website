# Callis Gesundheits-Kompass · Band 4: Die Schlaf-Werkstatt
## Manuskript & Bildprompts (Schlaf, Träume & die innere Uhr · 5–8 Jahre)

Stand: Juli 2026 · Reihe: callidus KIDS · Umfang ~55–58 Seiten (wie Band 1–3)
Figuren: Calli, Mira, Noah + NEU: Nino, der Nachtfreund

> **Ziel:** Kinder verstehen, warum Schlaf wichtig ist — und verlieren die Angst vor dem Zubettgehen.
> Kernbotschaften: Schlaf ist keine langweilige Pause, sondern Nachtarbeit · nachts repariert, wächst
> und sortiert dein Körper · Träume sind normal (auch komische und gruselige) · Licht und Bildschirme
> vor dem Schlafen machen wach · ein Abendritual ist eine Startrampe in den Schlaf · wer nicht schlafen
> kann, darf reden und Hilfe holen. Kein Druck, keine Scham, keine gruseligen Bilder.

---

## 1. Bildstil & Konsistenz (für Codex — bitte zuerst lesen)

**Gleicher Stil und dieselbe Pipeline wie Band 1–3.** Master-Prompt bei JEDEM Bild wörtlich mitgeben:

```
Style/medium: soft watercolor, gouache and colored pencil children's book illustration, warm storybook look, textured paper grain, hand-painted edges, delicate pencil linework.
Color palette: warm cream paper background, olive green, mint, coral, soft blue, muted gold, natural denim blue.
Lighting/mood: for this book many scenes are evening or night — use cozy warm lamplight and soft moonlight, calm and reassuring, never dark-scary. Playful but gentle.
Constraints: use the provided character sheet as strict reference; keep face, outfit, proportions, hair, colors and silhouette consistent; no text, no letters, no logos, no watermark, no scary anatomy, no medical horror, no shame-based body language, no frightening imagery.
```

**Referenz-Character-Sheets (immer passend anhängen):**
- `public/assets/media/character-sheets/calli-character-sheet.png`
- `public/assets/media/character-sheets/mira-character-sheet.png`
- `public/assets/media/character-sheets/noah-character-sheet.png`
- NEU: `b4-sheet-nino.png` (siehe Abschnitt 2 — zuerst erstellen!)

**WICHTIG – Outfit-Konsistenz (in jeden Prompt schreiben, damit die Figuren serientreu bleiben):**
> Noah has tousled red-orange hair and freckles. Mira has brown curly hair in a bun and freckles.
> In DAYTIME/evening scenes: Noah wears a green-and-white striped long-sleeve shirt with blue denim
> dungarees and green sneakers; Mira wears a coral-and-white striped long-sleeve shirt with blue denim
> dungarees and red sneakers. In BEDTIME/night scenes (in the bedroom): Noah wears soft green pyjamas
> with little stars; Mira wears coral-and-white striped pyjamas. Calli is the small brass pocket compass
> with a mint-green dial face and a red needle.

**Arbeitsregel:** 1) passende Sheets anhängen · 2) nur Pose, Szene, Blick, Handlung ändern · 3) Gesicht,
Haare, Farben, Proportionen NICHT neu erfinden · 4) KEIN Text im Bild · 5) quadratisch, mind. 2048×2048 px ·
6) bei KDP als KI-generiert deklarieren. Speicherort: `public/assets/media/kinderbuch-band4-scenes/`.

---

## 2. NEU: Character-Sheet zuerst erzeugen (Nino)

### `b4-sheet-nino.png` — Nino, der Nachtfreund
```
Character sheet, turnaround (front, side, back) plus three expressions (gently smiling, softly yawning, cozy asleep).
Nino: a small, round, soft and sleepy night friend, about the size of a melon, plush and cuddly. Soft
moon-blue and lavender body with a gentle warm glow (like a nightlight), rosy cheeks, drowsy friendly
half-lidded eyes and a calm little smile. Wears a small pointed nightcap with a tiny gold star on top,
and holds a tiny warm lantern. Calm, cozy, reassuring — the opposite of hyper; think of a gentle
bedtime companion. Muted moon-blue, lavender, cream and soft gold palette, watercolor style, cream
background.
```

---

## 3. Seitenplan mit Text & Bildprompts

> Aufbau wie Band 1–3: großes Bild oben, Text darunter · Schlau-Seiten, Mach-mit-Seiten, Eltern-Seiten
> im Rahmen-Layout · Urkunde zum Ausschneiden. Info-/Eltern-Seiten nutzen Bild-Medaillons/Banner aus
> denselben Szenen.

### COVER — `b4-cover.png`
```
A cozy bedtime scene: Mira and Noah in pyjamas in a warm, softly lit bedroom at night, moon and stars
in the window, snuggling down. Calli the little brass compass sits on the blanket, and Nino — the small
round moon-blue night friend with a nightcap and tiny lantern — glows gently beside them. Warm, calming,
inviting. Reference: Calli, Mira, Noah + Nino sheets.
```

### Titelseite (Widmung, kein Bild)
Für alle Kinder, die abends noch schnell etwas ganz Wichtiges tun müssen — und dabei fast im Stehen einschlafen.
Mit Calli, Mira, Noah — und Nino, dem Nachtfreund.

### Für dich (kein Bild)
Schlafen ist nicht langweilig. Und es ist auch keine verlorene Zeit.
Während du schläfst, arbeitet dein Körper auf Hochtouren: Er repariert, er wächst, er sortiert den Tag.
Und dein Kopf zeigt dir das verrückteste Kino der Welt — kostenlos, jede Nacht, Hauptrolle: du.
In diesem Buch lernst du, was nachts passiert, warum ein Ritual beim Einschlafen hilft und was du tun
kannst, wenn der Schlaf mal nicht kommen will. Ganz ohne Druck.

### Für Eltern und Vorleser (Banner: `b4-s11-startrampe-ritual.png`)
Schlaf gelingt nicht durch Druck, sondern durch Sicherheit und Wiederholung.
Dieses Buch erklärt Kindern in Bildern, warum Schlaf wertvoll ist, und nimmt die Angst vor dem Bett:
vor der Dunkelheit, vor Träumen, vor dem Alleinsein. Es lädt zu ruhigen Abendritualen ein und ermutigt
Kinder, über Sorgen zu sprechen. Ein gutes Ritual ist wie ein Geländer — es hält, ohne zu schieben.

---

## KAPITEL 1 · Schlaf ist kein Pauseknopf

### `b4-s01-bettzeit-protest.png`
Am Abend hatte Noah ein sehr großes Problem. Es hieß: Bettzeit.
„Bettzeit ist unfair", sagte er und gähnte dabei so groß, dass ein kleiner Bus hindurchgepasst hätte.
„Sie kommt immer dann, wenn ich noch etwas ganz Wichtiges tun muss."
„Zum Beispiel?", fragte Calli.
Noah zeigte auf seinen halbfertigen Bauklotz-Turm. „Der braucht noch einen Balkon. Und einen Fahrstuhl."
„Beeindruckend", sagte Calli. „Aber dein Körper hat auch noch etwas vor. Nachts."

**Bildprompt:** *(Outfit: day clothes)*
```
Evening living room, Noah yawning hugely while protesting bedtime, standing by a half-built block tower,
Calli the brass compass beside him. Warm lamplight, cozy. Reference: Noah, Calli sheets.
```

### `b4-s02-nachtschicht-beginnt.png`
„Was hat mein Körper denn vor?", fragte Noah misstrauisch.
„Die Nachtschicht", sagte Calli. „Während du schläfst, wird in dir gearbeitet, aufgeräumt und gebaut."
Das Zimmer wurde langsam dunkler. Nicht gruselig-dunkel. Gemütlich-dunkel.
Und in der Ecke, wo eben noch die Spielkiste stand, begann etwas ganz leise zu leuchten.
„Oh", flüsterte Mira. „Was ist das?"

**Bildprompt:** *(bedtime, pyjamas)*
```
A cozy bedroom slowly getting dimmer at bedtime, Mira and Noah in pyjamas noticing a soft warm glow
starting in the corner, curious and calm. Moonlight through the window, warm nightlight. Reference:
Mira, Noah sheets.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s02-nachtschicht-beginnt.png`)
Schlaf ist Nachtarbeit, kein Pauseknopf.
Während du schläfst, repariert sich dein Körper und wächst.
Dein Gehirn sortiert nachts, was du am Tag erlebt und gelernt hast.
Kinder brauchen viel Schlaf — meist mehr, als sie denken.
Wer gut schläft, ist am nächsten Tag wacher, fröhlicher und kann sich besser konzentrieren.

Callis Satz für dieses Kapitel: Schlaf ist kein Pauseknopf — Schlaf ist Nachtarbeit mit Kuscheldecke.

### Mach-mit „Der Gähn-Detektiv" (Medaillon: `b4-s01-bettzeit-protest.png`)
Beobachte dich am Abend einmal ganz genau.
Wann kommt das erste große Gähnen?
Werden deine Augen schwer?
Wird deine Stimme leiser?
Das sind Müde-Signale — dein Körper sagt: Die Werkstatt möchte bald öffnen.
„Ich habe schon dreimal gegähnt", sagte Noah. „Der Detektiv hat gute Arbeit geleistet", sagte Calli.

### Mini-Elternimpuls (Banner: `b4-s02-nachtschicht-beginnt.png`)
Müdigkeitszeichen (Gähnen, Augenreiben, Quengeligkeit) sind ein guter Anker für die Bettzeit.
Wird das Zeitfenster verpasst, drehen viele Kinder noch einmal auf. Ein ruhiger, ähnlicher Ablauf am
Abend hilft mehr als Ermahnungen. Schlafmenge und Rhythmus sind wichtiger als der perfekte einzelne Abend.

---

## KAPITEL 2 · Die Nacht-Werkstatt

### `b4-s03-nino-erscheint.png`
Aus dem leisen Leuchten wurde ein kleines, rundes Wesen mit Zipfelmütze und einer winzigen Laterne.
Es gähnte freundlich. „Guten Abend. Ich bin Nino. Ich arbeite hier — in der Nacht-Werkstatt."
„Du arbeitest, während wir schlafen?", fragte Mira.
„Genau dann", sagte Nino und lächelte müde. „Am Tag habt ihr das Sagen. In der Nacht bin ich dran."
Calli nickte. „Nino ist der Nachtfreund. Er zeigt euch, was passiert, wenn ihr die Augen zumacht."

**Bildprompt:** *(bedtime, pyjamas)*
```
Nino the small round moon-blue night friend with a nightcap and tiny lantern appears from a soft glow in
the corner of a cozy dark bedroom, gently smiling; Mira and Noah in pyjamas look on in wonder, Calli
beside them. Warm nightlight, magical and calm. Reference: Nino, Mira, Noah, Calli sheets.
```

### `b4-s04-nacht-werkstatt.png`
Nino hob die Laterne, und plötzlich war die Nacht-Werkstatt voller Leben.
Kleine Lichtpunkte sortierten Erinnerungen in Regale. Einer schob einen Wagen mit dem Schild „Morgen
wieder probieren". Ein anderer polierte eine Erinnerung, bis sie glänzte.
„Im Schlaf räumt dein Gehirn auf", flüsterte Nino. „Es sortiert, was du erlebt hast."
„Räumt es auch mein Zimmer auf?", fragte Noah hoffnungsvoll.
„Leider nein", sagte Nino. „Dafür bräuchte dein Gehirn Arme."

**Bildprompt:**
```
A whimsical, cozy "night workshop" inside a dream-glow: tiny friendly light-helpers sorting glowing
memory-orbs onto shelves, one pushing a little cart, one polishing a memory. Nino oversees with the
lantern. Warm, magical, not spooky. Reference: Nino sheet; Mira and Noah watching in pyjamas.
```

### `b4-s05-reparatur-wachstum.png`
„Und was noch?", fragte Mira.
Nino zeigte auf ein kleines aufgeschürftes Knie, an dem winzige Helfer arbeiteten. „Der Reparatur-Trupp.
Kleine Kratzer heilen nachts am besten." Dann zeigte er auf eine Messlatte an der Wand. „Und wusstet
ihr das? Kinder wachsen vor allem im Schlaf."
Noah riss die Augen auf. „Ich werde nachts größer?"
„Ein winziges Stück", sagte Nino. „Nimm das, Wachbleiben."

**Bildprompt:** *(bedtime, pyjamas)*
```
Nino gently showing that at night the body repairs (tiny friendly helpers tending a small plastered
knee) and grows (a height chart on the wall), Noah amazed, Mira smiling, in a cozy bedroom. Warm,
tender, reassuring. Reference: Nino, Noah, Mira sheets.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s04-nacht-werkstatt.png`)
Nachts ist in dir viel los.
Dein Gehirn sortiert Erlebnisse und Gelerntes in „Regale" — deshalb kann man morgens oft mehr.
Kleine Verletzungen heilen im Schlaf besonders gut.
Kinder wachsen vor allem nachts.
Deine Gefühle bekommen im Schlaf Platz, und morgen fühlt sich manches weniger zerknittert an.

Callis Satz für dieses Kapitel: Du verschläfst keine Zeit — du wartest deinen Körper.

### Mach-mit „Drei gute Dinge" (Medaillon: `b4-s05-reparatur-wachstum.png`)
Vor dem Einschlafen nennt jeder drei Dinge vom Tag.
Etwas Schönes.
Etwas Lustiges.
Etwas, das morgen noch einmal probiert werden darf.
So bekommt dein Gehirn schöne Sachen zum Einsortieren.
„Der Apfel war knusprig", sagte Mira. „Mein Turm hatte fast einen Balkon", sagte Noah.

### Mini-Elternimpuls (Banner: `b4-s04-nacht-werkstatt.png`)
Kinder schlafen leichter, wenn der Abend ruhig ausklingt. Ein kurzer Rückblick auf schöne Momente des
Tages (statt auf Streit oder Ermahnungen) beruhigt und schafft Verbindung. Aufregende Spiele, Bildschirme
oder Diskussionen kurz vor dem Schlaf machen dagegen wach. Ruhe ist das beste Einschlafsignal.

---

## KAPITEL 3 · Das Traum-Kino

### `b4-s06-traum-kino.png`
„Und jetzt", sagte Nino und zog einen samtweichen Vorhang beiseite, „kommt mein Lieblingsteil: das Traum-Kino."
Über Noahs Kopf begann ein sanftes Licht zu flackern, und mitten in der Luft erschienen Bilder: ein
fliegendes Fahrrad, ein Hund mit Hut, ein Meer aus Pudding.
„Jede Nacht zeigt dein Kopf dir Filme", sagte Nino. „Kostenlos. Und die Hauptrolle spielst immer du."
Noah strahlte. „Ich will einen Film mit einem Drachen, der Pfannkuchen backt."

**Bildprompt:** *(bedtime, pyjamas)*
```
A magical, cozy "dream cinema" above a sleeping child's head: whimsical floating dream images (a flying
bicycle, a dog in a hat, a sea of pudding), soft glowing light. Nino draws back a velvet curtain like a
tiny usher; Noah asleep smiling. Warm, dreamy, delightful. Reference: Nino, Noah sheets.
```

### `b4-s07-wirbel-traum.png`
Manchmal, sagte Nino, sind Träume ganz schön durcheinander.
Im Traum-Kino ritt Mira plötzlich auf einem riesigen Radiergummi zur Schule, und ihre Lehrerin war eine
freundliche Wolke.
„Warum sind Träume so komisch?", lachte Mira.
„Weil dein Kopf nachts spielt", sagte Nino. „Er mischt alles neu zusammen, was er tagsüber gesammelt
hat. Komische Träume sind völlig normal — und oft ziemlich lustig."

**Bildprompt:**
```
A funny mixed-up dream scene: Mira riding a giant eraser to school, her teacher a friendly cloud, other
silly dream mash-ups floating around. Whimsical, warm, playful dream colours. Reference: Mira sheet
(dream version). Nino watching fondly with the lantern.
```

### `b4-s08-angst-traum.png`
Doch manchmal wird ein Traum auch ein bisschen gruselig.
Einmal schreckte Noah hoch. „Da war ein großer Schatten!"
Nino setzte sich ganz nah zu ihm und machte die Laterne etwas heller. „Das war ein Angst-Traum. Die
gibt es auch. Aber weißt du das Wichtigste? Ein Traum kann nicht aus dem Bett steigen. Er bleibt im Kino."
Noah atmete langsamer. „Und wenn er wiederkommt?"
„Dann darfst du mich rufen — oder Mama", sagte Nino. „Über Träume reden macht sie kleiner."

**Bildprompt:** *(bedtime, pyjamas)*
```
Noah waking a little startled from a bad dream, Nino sitting close and turning the lantern brighter,
comforting and calm; a soft harmless shadow shape fading away; Mira nearby. Reassuring, warm, gentle —
NOT scary. Reference: Nino, Noah, Mira sheets.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s06-traum-kino.png`)
Träume gehören zum Schlaf dazu.
Jeder Mensch träumt — auch wenn man sich morgens oft nicht erinnert.
Träume können schön, komisch oder manchmal auch gruselig sein. Alles davon ist normal.
Ein Traum kann dir nichts tun — er bleibt im Kopf, im „Traum-Kino".
Über einen Angst-Traum zu reden, macht ihn kleiner.

Callis Satz für dieses Kapitel: Träume dürfen alles sein — sie bleiben immer im Kino.

### Mach-mit „Der Traum-Erzähler" (Medaillon: `b4-s07-wirbel-traum.png`)
Erzähl morgens von deinem Traum, wenn du dich erinnerst.
War er schön, komisch oder aufregend?
Male ihn auf, wenn du magst.
Bei einem Angst-Traum: erzähl ihn jemandem, den du magst.
Du wirst sehen — ausgesprochen wird er kleiner.
„In meinem Traum war ein Drache, der Pfannkuchen konnte", sagte Noah. „Guter Film", sagte Calli.

### Mini-Elternimpuls (Banner: `b4-s08-angst-traum.png`)
Albträume sind im Kindesalter häufig und meist harmlos. Hilfreich ist Nähe, ein ruhiger Ton und die
klare Botschaft: „Das war ein Traum, du bist sicher." Über Ängste sprechen zu dürfen, nimmt ihnen die
Macht. Halten Abendinhalte (Geschichten, Videos) ruhig und altersgerecht. Bei häufigen, stark
belastenden Albträumen lohnt sich fachlicher Rat.

---

## KAPITEL 4 · Die innere Uhr

### `b4-s09-innere-uhr.png`
„Woher weiß mein Körper überhaupt, wann Nacht ist?", fragte Mira.
Nino zeigte auf eine kleine, sanft tickende Uhr in seiner Laterne. „Du hast eine innere Uhr. Sie sorgt
dafür, dass du abends müde und morgens wach wirst."
„Und wie stellt sie sich?", fragte Noah.
„Vor allem durch Licht", sagte Nino. „Helles Licht sagt: Tag. Dunkelheit sagt: Zeit zum Schlafen. Deine
innere Uhr hört sehr genau aufs Licht."

**Bildprompt:** *(bedtime, pyjamas)*
```
Nino showing a gentle glowing inner-clock inside his lantern to Mira and Noah, a soft day-and-night motif
(sun and moon) around it. Cozy bedroom, warm nightlight. Calm, wondrous. Reference: Nino, Mira, Noah sheets.
```

### `b4-s10-licht-sagt-wach.png`
Noah wollte noch schnell aufs Tablet schauen. „Nur ganz kurz. Ein Krümel-Kurz."
Nino hob sanft die Hand. „Vorsicht. Helles Licht — vor allem vom Bildschirm — sagt deiner inneren Uhr:
Es ist noch Tag! Dann findet dein Kopf den Aus-Knopf nicht."
Mira stellte sich vor, wie in ihrem Kopf jemand mit einer hellen Trompete durch die Nacht-Werkstatt
marschierte. „Tröööt", sagte sie.
Noah legte das Tablet langsam weg. „Meine Werkstatt mag keine Trompeten."

**Bildprompt:** *(bedtime, pyjamas)*
```
Noah reaching for a glowing tablet in the dim bedroom, Nino gently raising a hand to say "careful"; the
tablet's light shown like a small bright trumpet in a fantasy bubble. Calm, not scolding. Warm night
scene. Reference: Nino, Noah sheets; Mira nearby.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s09-innere-uhr.png`)
Dein Körper hat eine innere Uhr.
Sie macht dich abends müde und morgens wach — und hört dabei genau aufs Licht.
Helles Licht und Bildschirme kurz vor dem Schlaf können wach machen.
Dunkelheit und Ruhe helfen beim Einschlafen.
Wer jeden Tag ungefähr zur gleichen Zeit ins Bett geht, dessen innere Uhr läuft besonders rund.

Callis Satz für dieses Kapitel: Licht sagt Wach — Dunkelheit sagt Gute Nacht.

### Mach-mit „Bildschirm-Sonnenuntergang" (Medaillon: `b4-s10-licht-sagt-wach.png`)
Such dir eine Zeit am Abend aus, ab der die Bildschirme schlafen gehen.
Leg Tablet und Handy an einen festen „Schlafplatz".
Mach danach das Licht ein bisschen dunkler.
Und jetzt merkst du vielleicht: Deine Augen werden von allein schwerer.
„Meine Bildschirme schlafen jetzt im Flur", sagte Noah. „Sehr ordentlich", sagte Nino.

### Mini-Elternimpuls (Banner: `b4-s10-licht-sagt-wach.png`)
Helles Licht und Bildschirme am späten Abend können das Einschlafen erschweren. Hilfreich sind ein fester
Bildschirm-Schluss vor der Bettzeit, gedämpftes Licht am Abend und geräteruhige Schlafzimmer. Regelmäßige
Schlaf- und Aufwachzeiten stabilisieren die innere Uhr — auch am Wochenende möglichst ähnlich.

---

## KAPITEL 5 · Die Startrampe ins Bett

### `b4-s11-startrampe-ritual.png`
„Wie kommt man denn gut ins Bett?", fragte Mira.
„Mit einer Startrampe", sagte Nino und legte drei Karten auf die Decke.
Karte eins: Zähne putzen. Karte zwei: Licht dunkler. Karte drei: Geschichte hören.
„Wenn die Reihenfolge jeden Abend ähnlich ist, merkt dein Körper: Ah, jetzt geht es Richtung Schlaf.
Die Startrampe bringt dich sanft nach oben — bis der Schlaf dich übernimmt."

**Bildprompt:** *(bedtime, pyjamas)*
```
Nino laying three simple bedtime "ritual cards" (toothbrush, dimming light, storybook — picture symbols
only, no text) on a child's blanket; Mira and Noah in pyjamas following along. Cozy bedroom, warm
nightlight. Reference: Nino, Mira, Noah sheets.
```

### `b4-s12-gute-nacht-geschichte.png`
Mira kuschelte sich ins Kissen, während Noah eine Geschichte vorgelesen bekam.
Die Stimme wurde leiser, die Sätze langsamer, und das Zimmer wurde warm und weich wie eine Höhle.
„Eine Geschichte ist ein guter Schlaf-Anfang", flüsterte Nino. „Sie nimmt deine Gedanken an die Hand
und führt sie langsam zur Werkstatt-Tür."
Noah blinzelte schwer. „Erzähl weiter…", murmelte er. Doch da war er schon fast weg.

**Bildprompt:** *(bedtime, pyjamas)*
```
A cozy bedtime reading scene: Mira snuggled into her pillow, Noah being read a story, a warm bedside
lamp, the room soft and cave-like; Nino glowing gently, Calli on the blanket. Warm, drowsy, tender.
Reference: Mira, Noah, Nino, Calli sheets.
```

### `b4-s13-hoehle-dunkel-kuehl.png`
„Warum ist mein Zimmer zum Schlafen am besten?", murmelte Noah schon halb im Traum.
„Weil dein Körper eine gemütliche Höhle mag", sagte Nino leise. „Kühl, dunkel und ruhig — so schläft es
sich am schönsten."
Er zog die Decke etwas höher, machte die Laterne ganz klein und setzte sich an den Bettrand.
„Gute Nacht, ihr zwei", flüsterte er. „Die Werkstatt hat jetzt geöffnet."

**Bildprompt:** *(bedtime, pyjamas)*
```
A peaceful bedroom at night: Noah and Mira drifting to sleep in a cool, dark, quiet "cozy cave" room,
blanket tucked up, Nino dimming his lantern and sitting gently at the bedside. Moonlight, deeply calm and
safe. Reference: Noah, Mira, Nino sheets.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s12-gute-nacht-geschichte.png`)
Ein Abendritual hilft beim Einschlafen.
Immer eine ähnliche Reihenfolge (z. B. Zähne, Licht dunkler, Geschichte) sagt deinem Körper: Jetzt kommt Schlaf.
Ein kühles, dunkles, ruhiges Zimmer ist am besten zum Schlafen.
Vorlesen oder ein ruhiges Lied sind ein guter Schlaf-Anfang.
Wenn du nicht müde bist, darfst du trotzdem ruhen — Ruhen ist die kleine Schwester vom Schlaf.

Callis Satz für dieses Kapitel: Ein gutes Ritual ist eine Startrampe in den Schlaf.

### Mach-mit „Bau deine Startrampe" (Medaillon: `b4-s11-startrampe-ritual.png`)
Male oder schreibe deine Abend-Reihenfolge auf.
Zum Beispiel: Abendessen, Zähne, Geschichte, Kuscheln, Licht aus.
Häng den Plan neben dein Bett.
Probiere ihn eine Woche lang aus.
Beobachte wie ein Forscher: Schläfst du schneller ein? Bist du morgens fitter?
„Meine Startrampe hat fünf Stufen", sagte Mira. „Dann kann nichts mehr schiefgehen", sagte Nino.

### Mini-Elternimpuls (Banner: `b4-s13-hoehle-dunkel-kuehl.png`)
Wiederkehrende, ruhige Abendrituale sind einer der stärksten Einschlafhelfer. Hilfreich sind eine feste
Reihenfolge, gedämpftes Licht, ein kühles, dunkles, ruhiges Zimmer und ausreichend Zeit. Vorlesen
verbindet und beruhigt. Ein Ritual soll tragen, nicht unter Druck setzen — kleine Abweichungen sind okay.

---

## KAPITEL 6 · Wenn Schlaf schwierig ist

### `b4-s14-kopf-voll.png`
Nicht jede Nacht kommt der Schlaf sofort.
Einmal lag Mira wach. „Mein Kopf ist noch ganz laut", flüsterte sie. „Da drehen sich lauter Gedanken."
Nino nickte verständnisvoll. „Das kennt jeder. Manchmal ist die Werkstatt-Tür noch nicht ganz zu."
„Und was mache ich dann?"
„Du musst nicht allein damit liegen", sagte Nino. „Das ist das Allerwichtigste."

**Bildprompt:** *(bedtime, pyjamas)*
```
Mira lying awake at night, a few gentle swirling "thought" shapes above her head (harmless, dreamy),
looking a little restless; Nino beside her, understanding. Warm nightlight, cozy, reassuring. Reference:
Mira, Nino sheets.
```

### `b4-s15-reden-hilft.png`
Mira ging zu ihren Eltern. „Ich kann nicht schlafen. Mein Kopf ist voll."
Ihre Mama setzte sich ans Bett und hörte einfach zu.
„Starke Kinder müssen nicht alles allein schaffen", sagte Nino leise. „Sätze wie ‚Ich kann nicht
schlafen' oder ‚Ich hab Angst' sind keine falschen Sätze. Es sind Hilfe-Sätze."
Nach dem Reden fühlte sich Miras Kopf schon viel leiser an.

**Bildprompt:** *(bedtime, pyjamas)*
```
Mira in pyjamas talking to a caring parent sitting on the edge of the bed, being listened to warmly;
Nino glowing softly nearby. Tender, safe, reassuring bedtime scene, warm lamplight. Reference: Mira,
Nino sheets.
```

### `b4-s16-ruhe-atem-nacht.png`
„Und wenn niemand wach ist?", fragte Noah.
„Dann hilft der Ruhe-Atem", sagte Nino und machte es vor. „Einatmen — die Schultern werden weich.
Ausatmen — der Bauch darf loslassen. Noch einmal, ganz langsam."
Er machte seine Laterne mit jedem Ausatmen ein bisschen dunkler.
Mira atmete mit. Ihre Gedanken wurden langsamer, wie ein Karussell, das austrudelt.
„So", flüsterte Nino. „Jetzt kann der Schlaf hereinkommen."

**Bildprompt:** *(bedtime, pyjamas)*
```
Nino modelling slow calm breathing at the bedside, dimming his lantern with each breath; Mira breathing
along, her swirling thoughts slowing like a winding-down carousel. Deeply peaceful, warm, safe night
scene. Reference: Nino, Mira sheets.
```

### Schlau-Seite „Wusstest du schon?" (Medaillon: `b4-s15-reden-hilft.png`)
Manchmal kommt der Schlaf nicht sofort — das ist normal.
Ein voller Kopf, Sorgen oder Angst können wach halten.
Du darfst reden: „Ich kann nicht schlafen" oder „Ich hab Angst" sind Hilfe-Sätze, keine falschen Sätze.
Ruhiges, langsames Atmen hilft, die Gedanken leiser zu machen.
Starke Kinder müssen nicht alles allein schaffen.

Callis Satz für dieses Kapitel: Wenn der Schlaf nicht kommt, bist du nicht allein damit.

### Mach-mit „Der Gedanken-Ausatmer" (Medaillon: `b4-s16-ruhe-atem-nacht.png`)
Leg dich bequem hin.
Atme langsam ein und zähl bis vier.
Atme langsam aus und stell dir vor, ein lauter Gedanke schwebt mit hinaus.
Mach das ein paarmal.
Wenn etwas dich sehr beschäftigt: Sag es morgen jemandem, den du magst.
„Ein Gedanke ist rausgeflogen", sagte Mira. „Und noch einer", sagte Nino. „Gute Reise."

### Mini-Elternimpuls (Banner: `b4-s14-kopf-voll.png`)
Einschlafprobleme, Grübeln und Ängste sind bei Kindern häufig. Wichtiger als schnelle Lösungen ist das
Gefühl von Sicherheit: zuhören, dableiben, ruhig bleiben. Feste Rituale, gedämpftes Licht und die
Erlaubnis, über Sorgen zu sprechen, helfen. Bei anhaltenden oder stark belastenden Schlafproblemen,
großen Ängsten oder auffälliger Tagesmüdigkeit sollte fachlicher Rat eingeholt werden.

---

## KAPITEL 7 · Der Schlaf-Wochen-Kompass

### `b4-s17-schlaf-karten.png`
Am Sonntag legte Calli sieben ruhige Karten auf den Tisch.
„Der Schlaf-Wochen-Kompass", sagte er. „Keine Regeln. Nur kleine Ideen für gute Nächte."
Auf den Karten stand nichts Kompliziertes: zur ähnlichen Zeit ins Bett, Bildschirme früher aus, Zimmer
dunkel und kühl, Abendritual, drei gute Dinge, über Sorgen reden, morgens ähnlich aufstehen.
Mira nahm die Ritual-Karte. Noah nahm die Bildschirm-Sonnenuntergang-Karte. Nino nickte zu jeder einzeln.

**Bildprompt:** *(evening, day clothes)*
```
Calli laying seven calm "sleep week" cards (picture symbols only, no text) on a table in the evening;
Mira and Noah choosing, Nino glowing gently nearby. Warm, cozy evening light. Reference: Calli, Mira,
Noah, Nino sheets.
```

### `b4-s18-kleine-schritte.png`
In der Woche probierten alle ihre Karte aus.
Mira hielt jeden Abend die gleiche Startrampe ein. Noah schickte die Bildschirme pünktlich schlafen.
Und einmal, als ein Angst-Traum kam, weckte Noah einfach seine Eltern — und schlief danach ruhig weiter.
„Habt ihr gemerkt?", fragte Calli. „Keiner musste alles perfekt machen."
„Nur ein bisschen ruhiger als vorher", sagte Mira. „Genau", sagte Nino.

**Bildprompt:** *(bedtime, pyjamas)*
```
A warm montage-feel single scene of good sleep habits: Mira following her bedtime routine, Noah putting
devices to "sleep", a calm night; Nino present with the lantern. Cozy, gentle, reassuring. Reference:
Mira, Noah, Nino sheets.
```

### `b4-s19-guter-morgen.png`
Am Ende der Woche wachten alle auf — und die Sonne schien ins Zimmer.
Noah streckte sich. „Ich bin richtig ausgeschlafen. Und mein Turm hat heute Nacht bestimmt Kraft
getankt." Mira lachte. „Türme schlafen nicht." „Meiner schon", sagte Noah.
„Merkt ihr?", fragte Calli. „Gut geschlafen fühlt sich der Morgen leichter an."
Nino gähnte glücklich. „Schicht beendet. Bis heute Abend."

**Bildprompt:** *(morning, day clothes)*
```
Bright cheerful morning: Noah and Mira waking up well-rested and stretching as sunshine fills the
bedroom; Nino sleepily waving goodbye as his glow fades, Calli cheerful. Fresh, warm morning light.
Reference: Noah, Mira, Nino, Calli sheets.
```

### `b4-s20-finale.png`
Am Abend saßen alle noch einen Moment zusammen im warmen Lampenlicht.
„Ihr habt viel gelernt", sagte Calli. „Was denn?", fragte Noah.
Mira zählte auf: „Schlaf ist keine Pause, sondern Nachtarbeit. Träume sind normal. Licht macht wach.
Ein Ritual hilft. Und wenn der Schlaf nicht kommt, darf ich reden."
„Damit seid ihr offiziell", sagte Calli feierlich. „Schlaf-Helden."
Nino lächelte müde und hob die Laterne. „Meine ruhigsten Helden."

**Bildprompt:** *(bedtime, pyjamas)*
```
A warm, tender bedtime gathering: Mira, Noah, Calli and Nino together in soft lamplight, cozy and
content at the end of the day. Calm, celebratory, safe. Reference: Mira, Noah, Calli, Nino sheets.
```

### Kompass-Check (Quiz, im Rahmen, kein Bild)
🧭 Der große Schlaf-Check:
1. Was ist Schlaf? (a) verlorene Zeit (b) Nachtarbeit für deinen Körper (c) ein Pauseknopf
2. Was macht dein Gehirn nachts? (a) nichts (b) es sortiert den Tag in Regale (c) es schaut fern
3. Kann ein Traum dir wehtun? (a) ja (b) nein, er bleibt im Traum-Kino (c) nur mittwochs
4. Was sagt helles Licht deiner inneren Uhr? (a) „Es ist noch Tag!" (b) „Gute Nacht" (c) gar nichts
5. Was hilft beim Einschlafen? (a) ein aufregendes Video (b) ein ruhiges Abendritual (c) helles Licht
6. Was tust du, wenn du nicht schlafen kannst? (a) allein wach liegen (b) reden und ruhig atmen (c) aufstehen und toben

Auflösung: 1b · 2b · 3b · 4a · 5b · 6b — Schlaf-Held / Schlaf-Heldin!

### Urkunde zum Ausschneiden (im Rahmen, kein Bild)
URKUNDE · für einen echten Schlaf-Helden / eine echte Schlaf-Heldin
(Dein Name) __________
hat mit Calli und Nino gelernt: Schlaf ist Nachtarbeit, Träume sind normal, Licht macht wach, ein Ritual
hilft — und wer nicht schlafen kann, darf reden und Hilfe holen.
Datum ________  ·  Calli, dein Kompass

---

## Rückteil (Eltern & Anhang — wie Band 1–3)

### Elternseite: Schlaf ohne Kampf (Rahmen, kein Bild)
Schlaf lässt sich nicht erzwingen — aber vorbereiten. Kinder schlafen leichter, wenn der Abend ruhig
ausklingt und Sicherheit vermittelt. Hilfreich sind feste Zeiten, ein wiederkehrendes Ritual, gedämpftes
Licht, ein kühles, dunkles Zimmer und die Erlaubnis, über Sorgen und Ängste zu sprechen. Druck, lange
Diskussionen oder Bildschirme kurz vor dem Schlaf wirken eher gegenteilig.

### Elternseite: Gute Sätze am Abend (Rahmen, kein Bild)
Statt „Jetzt wird endlich geschlafen" helfen oft ruhige Sätze: „Was war heute schön?" · „Wo im Körper
merkst du die Müdigkeit?" · „Möchtest du über etwas reden?" · „Ich bin in der Nähe." Diese Sätze machen
kein Kind sofort müde, aber sie schaffen Ruhe und Verbindung — und die sind die beste Einschlafhilfe.

### Quellen kindgerecht erklärt (Rahmen, kein Bild)
Woher wissen Erwachsene das? Forscherinnen und Forscher beobachten und vergleichen, wie Schlaf Kindern
guttut: warum der Körper nachts repariert und wächst, warum das Gehirn im Schlaf sortiert, wie Licht die
innere Uhr steuert und warum Rituale und ausreichend Schlaf für Stimmung und Konzentration wichtig sind.

### Quellen für Erwachsene (Rahmen, kein Bild)
Vor der Veröffentlichung fachlich gegenlesen lassen. Startpunkte: CDC/AAP-Schlafempfehlungen für Kinder,
Empfehlungen zu altersgerechten Schlafdauern, kinderärztliche Empfehlungen zu Schlafhygiene und
Bildschirmzeit am Abend. Die Quellen werden in der finalen Ausgabe kompakt angegeben.

### Über callidus (Rahmen, kein Bild)
callidus macht Gesundheitswissen verständlich — klar, freundlich, alltagstauglich. Für Erwachsene gibt
es Gesundheitswissen, Checks und digitale Angebote. Callis Gesundheits-Kompass übersetzt diese Haltung
für Familien: mit weniger Druck, mehr Neugier und einem Kompass, der ehrlich stolz auf eine ruhige Nacht ist.

### Was als Nächstes kommt (Rahmen, kein Bild)
Band 1: Hör auf deinen Körper — Körpersignale.
Band 2: Das Zucker-Monster — Essen, Trinken und Energie.
Band 3: Der Zappelmotor — Bewegung, Pausen und Gute-Laune-Funken.
Band 4: Die Schlaf-Werkstatt — Schlaf, Träume und die innere Uhr. (dieses Buch)
Band 5: Das Gefühls-Wetter — Gefühle, Mut und Hilfe holen.

### Impressum und Rechte (Rahmen, kein Bild)
Callis Gesundheits-Kompass · Band 4: Die Schlaf-Werkstatt · Reihe: callidus KIDS · 1. Auflage 2026
Text, Konzept & Herausgabe: callidus A&M
Illustrationen: Digitale Aquarell-Illustrationen, KI-gestützt erstellt und redaktionell überarbeitet,
auf Basis fester Character-Sheets.
Verantwortlich i. S. d. Presserechts: callidus A&M · Arnold Jedich (Geschäftsführer) · Gerstenstraße 12
· 86356 Neusäß · Deutschland · Kontakt: Telefon 0179 7007772 · info@callidus-am.de · www.callidus-am.de
© 2026 callidus A&M. Alle Rechte vorbehalten.
Dieses Buch vermittelt allgemeines Gesundheitswissen für Familien und ersetzt keine ärztliche Beratung.

### KI- und Fachhinweis (Rahmen, kein Bild)
Ein Teil der Bildproduktion entsteht mit KI-gestützten Bildwerkzeugen und wird vor Veröffentlichung
geprüft, überarbeitet und bei Amazon KDP entsprechend deklariert. Die Texte vermitteln allgemeines
Gesundheitswissen und ersetzen keine ärztliche Beratung, Diagnose oder Behandlung.

### `b4-s21-nino-deckt-zu.png`
Als alle schliefen, ging Nino noch einmal leise durchs Zimmer.
Er zog eine Decke gerade, rückte ein Kuscheltier zurecht und lächelte.
Die Nacht-Werkstatt summte leise vor sich hin: reparieren, wachsen, sortieren, träumen.
„Gut gemacht, ihr zwei", flüsterte Nino. „Schlaft schön. Ich pass auf die Werkstatt auf."
Und die Laterne leuchtete warm wie ein kleines, freundliches Nachtlicht.

**Bildprompt:** *(night, pyjamas, asleep)*
```
Nino quietly tending the sleeping children at night — straightening a blanket, tucking in a plush toy —
his lantern glowing warm like a friendly nightlight; Mira and Noah sound asleep, Calli resting on the
blanket. Deeply peaceful, tender, safe. Reference: Nino, Mira, Noah, Calli sheets.
```

### `b4-s22-calli-schlaeft.png`
Auch Calli klappte seine Nadel ein. Nicht ganz. Nur ein bisschen.
Denn ein guter Kompass schläft nie völlig ein. Er ruht nur. Für morgen.
Und falls du heute Nacht nicht gleich einschläfst, dann weißt du jetzt:
Das ist keine verlorene Zeit. Deine Werkstatt öffnet gleich. Und wenn etwas dich wachhält, darfst du reden.
Ganz leise sagen Calli und Nino zusammen: „Gute Nacht. Erst zur Ruhe kommen — dann öffnet der Schlaf."

**Bildprompt:** *(night)*
```
Calli the little brass compass and Nino resting together on a small cushion in warm nightlight, needle
and lantern glowing softly, both half asleep. Warm, tender closing image. Reference: Calli, Nino sheets.
```

---

## 4. Umfang & Bildprompt-Liste

**Umfang:** Frontteil 3 Seiten · 7 Kapitel · Quiz + Urkunde · Rückteil 8 Seiten · 2 Schluss-Bildseiten
→ **≈ 55–58 Innenseiten** (wie Band 1–3).

**Zum Abarbeiten für Codex:** erst das Nino-Sheet, dann Cover, dann 22 Szenen. Master-Prompt (Abschnitt 1)
immer voranstellen, passende Sheets anhängen, Outfit-Regel beachten (Tag = Latzhose, Nacht = Schlafanzug).
Speicherort: `public/assets/media/kinderbuch-band4-scenes/`.

| # | Datei | Referenz-Sheets | Szene |
|---|---|---|---|
| Sheet | `b4-sheet-nino.png` | (neu erstellen) | Nino |
| Cover | `b4-cover.png` | Calli, Mira, Noah, Nino | Bettszene mit Nino |
| 1 | `b4-s01-bettzeit-protest.png` | Noah, Calli | Tag/Abend |
| 2 | `b4-s02-nachtschicht-beginnt.png` | Mira, Noah | Nacht |
| 3 | `b4-s03-nino-erscheint.png` | Nino, Mira, Noah, Calli | Nacht |
| 4 | `b4-s04-nacht-werkstatt.png` | Nino, Mira, Noah | Nacht |
| 5 | `b4-s05-reparatur-wachstum.png` | Nino, Noah, Mira | Nacht |
| 6 | `b4-s06-traum-kino.png` | Nino, Noah | Nacht |
| 7 | `b4-s07-wirbel-traum.png` | Mira, Nino | Traum |
| 8 | `b4-s08-angst-traum.png` | Nino, Noah, Mira | Nacht |
| 9 | `b4-s09-innere-uhr.png` | Nino, Mira, Noah | Nacht |
| 10 | `b4-s10-licht-sagt-wach.png` | Nino, Noah, Mira | Nacht |
| 11 | `b4-s11-startrampe-ritual.png` | Nino, Mira, Noah | Nacht |
| 12 | `b4-s12-gute-nacht-geschichte.png` | Mira, Noah, Nino, Calli | Nacht |
| 13 | `b4-s13-hoehle-dunkel-kuehl.png` | Noah, Mira, Nino | Nacht |
| 14 | `b4-s14-kopf-voll.png` | Mira, Nino | Nacht |
| 15 | `b4-s15-reden-hilft.png` | Mira, Nino (+ Elternteil) | Nacht |
| 16 | `b4-s16-ruhe-atem-nacht.png` | Nino, Mira | Nacht |
| 17 | `b4-s17-schlaf-karten.png` | Calli, Mira, Noah, Nino | Abend |
| 18 | `b4-s18-kleine-schritte.png` | Mira, Noah, Nino | Nacht |
| 19 | `b4-s19-guter-morgen.png` | Noah, Mira, Nino, Calli | Morgen |
| 20 | `b4-s20-finale.png` | Mira, Noah, Calli, Nino | Nacht |
| 21 | `b4-s21-nino-deckt-zu.png` | Nino, Mira, Noah, Calli | Nacht |
| 22 | `b4-s22-calli-schlaeft.png` | Calli, Nino | Nacht |

**Insgesamt: 1 Character-Sheet (Nino) + 1 Cover + 22 Szenen.**
Danach übernehme ich Satz, PDFs und Website-Einbindung wie bei Band 1–3 (build-band4.js analog build-band3.js;
Print-JPGs in `.../print/` erzeugen, nicht aus 12-MB-PNGs drucken).
