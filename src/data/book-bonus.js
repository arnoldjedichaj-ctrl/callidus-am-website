// Bonuspaket zu den Buechern: alles Zusatzmaterial gebuendelt per E-Mail.
//
// Wichtig: Die einzelnen Dateien bleiben auf den Buchseiten frei abrufbar, weil
// ihre Pfade aus den veroeffentlichten E-Books heraus verlinkt sind. Das Paket
// ist ein ZUSAETZLICHES Angebot, kein Riegel vor den bestehenden Downloads.
// Ab dem naechsten Buch wird neues Bonusmaterial von Anfang an nur ueber diese
// Seite ausgeliefert – dann zeigt der Link im Buch direkt hierher.
//
// formUrl: Brevo-Formular (sibforms.com). Solange leer, zeigen die Seiten einen
// ehrlichen Platzhalter statt eines leeren Formulars, und die Teaser auf den
// Buchseiten bleiben ausgeblendet.
export const bookBonus = {
  de: {
    formUrl: '',
    href: '/buecher/bonusmaterial/',
    items: [
      { title: 'Vordrucke „Heute mal nicht alles“', detail: 'Logbuch, Listen und Akuthilfe-Karte, zehn Seiten A4' },
      { title: 'Atembegleiter „Heute mal nicht alles“', detail: 'Audio zum Mitatmen, für die Akutmomente' },
      { title: 'Trainingsprotokoll „Krafttraining für Frauen ab 40“', detail: '12-Wochen-Protokoll für Einheit A und B plus Meilenstein-Checks' },
    ],
  },
  en: {
    formUrl: '',
    href: '/en/books/bonus-material/',
    items: [
      { title: 'Printables for “Not Everything, Not Today”', detail: 'Logbook, lists and pocket help card, ten pages' },
      { title: 'Breathing guide for “Not Everything, Not Today”', detail: 'Audio to breathe along with, for the hard moments' },
      { title: 'Training log for “Strength Training for Women Over 40”', detail: '12-week log for session A and B plus milestone checks' },
    ],
  },
};

export const bonusFor = (lang) => bookBonus[lang] || bookBonus.de;
