// Zentrale Positionierung von callidus A&M.
// Zielgruppe, Mission, Vision und Markenversprechen stehen bewusst nur hier.
// Startseite, Über-uns-Seite und das Organization-JSON-LD lesen aus dieser Datei,
// damit die Aussage an allen Stellen identisch bleibt.

export const audience = {
  eyebrow: 'Für wen wir schreiben',
  headline: 'Für Menschen mit vollem Alltag, nicht für Optimierer.',
  summary:
    'Du bist zwischen 30 und 60, jonglierst Familie und Beruf und willst gesundheitlich etwas ändern. '
    + 'Nur weißt du nach zehn Suchergebnissen nicht mehr, was davon stimmt und was verkauft werden soll.',
  fits: [
    'Du willst verstehen, warum etwas wirkt, statt Regeln auswendig zu lernen.',
    'Du hast wenig Zeit und brauchst Schritte, die in einen normalen Tag passen.',
    'Du willst wissen, woher eine Aussage kommt, bevor du ihr folgst.',
  ],
  fitsNot: [
    'Du suchst eine Diagnose oder eine Therapie. Dafür ist deine Ärztin oder dein Arzt zuständig.',
    'Du willst Leistungssport auf Wettkampfniveau steuern.',
    'Du suchst ein Versprechen in Zahlen und Wochen. Das geben wir bewusst nicht.',
  ],
};

export const mission = {
  label: 'Mission',
  statement:
    'Wir übersetzen Gesundheitswissen in Schritte, die in einen normalen Alltag passen: '
    + 'mit offengelegten Quellen und ohne Versprechen, die wir nicht halten können.',
};

export const vision = {
  label: 'Vision',
  statement:
    'Ein Gesundheitsraum, in dem Wissen, tägliche Begleitung und persönlicher Fortschritt zusammenlaufen, '
    + 'statt über zehn Apps und hundert Websites verteilt zu sein.',
};

export const brandPromise = {
  eyebrow: 'Wofür wir stehen',
  headline: 'Drei Zusagen, an denen du uns messen kannst.',
  pillars: [
    {
      title: 'Geprüft und transparent',
      text:
        'Wir nennen unsere Quellen und trennen sichtbar zwischen eigener Erfahrung, Studienlage und Empfehlung. '
        + 'Wo die Datenlage dünn ist, schreiben wir das hin.',
      accent: 'mint',
      href: '/quellen-methodik/',
      linkLabel: 'Quellen und Methodik',
    },
    {
      title: 'Alltagstauglich statt perfekt',
      text:
        'Zehn Minuten, die du wirklich machst, schlagen ein Programm, das du nach drei Tagen abbrichst. '
        + 'Deshalb beginnt bei uns alles klein.',
      accent: 'coral',
      href: '/gesundheits-kompass/',
      linkLabel: 'Kompass starten',
    },
    {
      title: 'Familie statt Konzern',
      text:
        'Hinter callidus stehen Arnold und Margarita, keine anonyme Großredaktion und kein Investor. '
        + 'Wir machen unsere redaktionelle Arbeitsweise und Grenzen transparent.',
      accent: 'gold',
      href: '/uber-uns/',
      linkLabel: 'Über uns',
    },
  ],
};

// Problem-Lösung-Paare für die Startseite. Die Reihenfolge ist bewusst gespiegelt:
// jedes Problem hat unten seine direkte Antwort an derselben Position.
export const problemSolution = {
  problemEyebrow: 'Kennst du das?',
  problemHeadline: 'Gesundheit scheitert selten am Willen.',
  problems: [
    {
      title: 'Jede Quelle sagt etwas anderes',
      text: 'Kaffee ist gesund. Kaffee ist schädlich. Nach einer halben Stunde Lesen bist du unsicherer als vorher.',
    },
    {
      title: 'Keine Zeit für 40 Seiten Studie',
      text: 'Zwischen Job, Kindern und Haushalt bleibt kein Abend übrig, um Fachliteratur zu sortieren.',
    },
    {
      title: 'Gekauft, geschluckt, nichts gemerkt',
      text: 'Das Regal ist voll mit Präparaten, von denen du nicht weißt, ob sie in deiner Situation überhaupt etwas bringen.',
    },
  ],
  bridge: 'Nicht dein Wille fehlt. Die Orientierung fehlt.',
  solutionEyebrow: 'Was wir dagegen tun',
  solutionHeadline: 'Erst einordnen, dann handeln.',
  solutions: [
    {
      title: 'Der Kompass ordnet ein',
      text: 'Fünf Bereiche, wenige Minuten, keine Anmeldung. Am Ende weißt du, wo dein größter Hebel liegt.',
      href: '/gesundheits-kompass/#kompass-tool',
      linkLabel: 'Kompass starten',
      accent: 'mint',
    },
    {
      title: 'Der Ratgeber legt offen',
      text: 'Jeder Beitrag nennt seine Quellen und sagt dazu, wie sicher die Studienlage wirklich ist.',
      href: '/ratgeber/',
      linkLabel: 'Ratgeber öffnen',
      accent: 'blue',
    },
    {
      title: 'Die Apps begleiten dich',
      text: 'NEXUS, MOMUS und KAIROS übersetzen deine Daten in verständliche Hinweise, statt nur Zahlen zu sammeln.',
      href: '/nexus-app/',
      linkLabel: 'Apps ansehen',
      accent: 'gold',
    },
  ],
};

// Für das Organization-JSON-LD im BaseLayout.
export const organizationDescription =
  'callidus A&M übersetzt Gesundheitswissen in alltagstaugliche Schritte: '
  + 'Ratgeber mit offengelegten Quellen, ein Gesundheits-Kompass zur Einordnung und digitale Begleiter für den Alltag.';

export const organizationSlogan = 'Ein klarer Kompass für deine Gesundheit.';

export const founders = ['Arnold Jedich', 'Margarita Jedich'];
