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
    formUrl: 'https://42261e04.sibforms.com/v2/serve/MUIFAONzU-Y2Atkvid91AI2togFdezdUGUt4-9y4IixzyK_jlzdtP4PgY2W4S_aKWo_DrU8lBG9UJO9uZVoGCmoHkeJadvEJakyYL4F8gznaV7AOsyGd0spAjBhsdgeeOAVQy9lGp1smG9fMzJbRKbeSOFDDmkJPovmxI59QRYfisEekueJ-xIE2icL94KjC4Uv4-rrm9NK5oaIW',
    href: '/buecher/bonusmaterial/',
    items: [
      { title: 'Vordrucke „Heute mal nicht alles“', detail: 'Logbuch, Listen und Akuthilfe-Karte, zehn Seiten A4' },
      { title: 'Atembegleiter „Heute mal nicht alles“', detail: 'Audio zum Mitatmen, für die Akutmomente' },
      { title: 'Trainingsprotokoll „Krafttraining für Frauen ab 40“', detail: '12-Wochen-Protokoll für Einheit A und B plus Meilenstein-Checks' },
    ],
  },
  en: {
    formUrl: 'https://42261e04.sibforms.com/v2/serve/MUIFALVVxdwDxj6S8Zm9D7IHsRUVbJkkAD4D8beqCRXVYy5L88Vt_gvv_5lDBI46QklAuyHtkEeHUBzUZYV-SlXn5TcN6OBruHLn8q-JPDI5Wx0AFVEkfRdRW6utXSFLgAvTn3oGWqLBrM_mYgKtPOWx_p7PBqZvumattScGO5QqMWo5YUdCsB7n-XI2-F7v2o3tIuBdLaB_IF8_',
    href: '/en/books/bonus-material/',
    items: [
      { title: 'Printables for “Not Everything, Not Today”', detail: 'Logbook, lists and pocket help card, ten pages' },
      { title: 'Breathing guide for “Not Everything, Not Today”', detail: 'Audio to breathe along with, for the hard moments' },
      { title: 'Training log for “Strength Training for Women Over 40”', detail: '12-week log for session A and B plus milestone checks' },
    ],
  },
};

export const bonusFor = (lang) => bookBonus[lang] || bookBonus.de;
