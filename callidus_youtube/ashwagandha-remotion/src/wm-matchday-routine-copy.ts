export const wmMatchdayDurationInFrames = 2040;

export const wmMatchdayVoiceoverText =
  'Die WM ist nicht nur ein Spielplan. Sie ist ein Ritual. Bevor der Fernseher läuft und die Snacks auf dem Tisch stehen, mach aus dem Spielabend ein kleines Energie-Upgrade. Erstens: zehn Minuten Bewegung. Ein paar Kniebeugen, lockeres Dehnen oder ein kurzer Spaziergang. Dein Kreislauf ist wach, dein Kopf wird klar. Zweitens: Wasser zuerst. Stell dir ein Glas hin, bevor Chips und Süßes aufgehen. Kleine Entscheidung, großer Unterschied. Drittens: Fan-Look bereit. Shirt, Ball, Schal oder kleines Fan-Geschenk. Nicht weil es das Spiel entscheidet, sondern weil Rituale verbinden. So wird aus passivem Zuschauen ein bewusster Spieltag: Fokus im Kopf, Energie im Körper, Stimmung im Team. Wenn du noch ein WM-Shirt, einen Fußball oder ein Fan-Accessoire suchst, packe ich dir passende Amazon-Links in die Beschreibung. Anzeige. Viel Spaß beim Spiel, und bleib in deiner Energie.';

export const wmMatchdayScenes = [
  {
    start: 0,
    duration: 240,
    image: 'generated/wm-focus/04-stadium-shirt.png',
    eyebrow: 'WM-Spieltag',
    title: 'Mehr als nur Anpfiff',
    subtitle: 'Mach aus dem Abend ein kleines Energie-Ritual.',
    align: 'bottom',
    checklist: ['Fokus', 'Energie', 'Teamgefühl'],
  },
  {
    start: 240,
    duration: 330,
    image: 'generated/wm-focus/03-healthy-matchnight.png',
    eyebrow: 'Schritt 1',
    title: '10 Minuten Bewegung',
    subtitle: 'Kurz aktivieren, bevor 90 Minuten Sofa starten.',
    align: 'top',
    checklist: ['Kreislauf wach', 'Kopf klar', 'Stimmung oben'],
  },
  {
    start: 570,
    duration: 300,
    image: 'generated/wm-focus/03-healthy-matchnight.png',
    eyebrow: 'Schritt 2',
    title: 'Wasser zuerst',
    subtitle: 'Bevor Snacks aufgehen: ein Glas bereitstellen.',
    align: 'bottom',
    checklist: ['Hydration', 'bewusster Snack', 'ruhiger Abend'],
  },
  {
    start: 870,
    duration: 300,
    image: 'generated/wm-focus/01-shirt-hero.png',
    eyebrow: 'Schritt 3',
    title: 'Fan-Look bereit',
    subtitle: 'Shirt, Ball oder Accessoire: Rituale verbinden.',
    align: 'bottom',
    checklist: ['T-Shirt', 'Fußball', 'Fan-Geschenk'],
  },
  {
    start: 1170,
    duration: 300,
    image: 'generated/wm-focus/02-breathing-focus.png',
    eyebrow: 'Mindset',
    title: 'Fokus im Kopf',
    subtitle: 'Energie im Körper. Stimmung im Team.',
    align: 'top',
    checklist: ['ruhig starten', 'bewusst schauen', 'gemeinsam genießen'],
  },
  {
    start: 1470,
    duration: 570,
    image: 'generated/wm-focus/04-stadium-shirt.png',
    eyebrow: 'Anzeige',
    title: 'WM-Shirt, Ball, Accessoire?',
    subtitle: 'Deine Affiliate-Links kommen in die Beschreibung.',
    align: 'bottom',
    checklist: ['Amazon-Links', 'Beschreibung', 'Bio'],
  },
] as const;
