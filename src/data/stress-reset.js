// Stress-Reset-Kurs: Website-Sicht auf die gemeinsame Kurs-Konfiguration.
// Dieselbe Datei steuert in den Cloud Functions die Freischaltung nach dem Kauf,
// deshalb Preise und Digistore-IDs nur dort pflegen.
import course from '../../functions/data/stress-reset-course.json';

export const courseImage = '/assets/original/074-wp-content-uploads-go-x-u-b076dea2-a190-4db0-bbe8-ae6244b2fe60-l3-t298-w807-h969-image.png';

export const modules = course.modules;
export const dayModules = course.modules.filter((module) => module.number);

const checkoutUrl = (product) => `https://www.digistore24.com/product/${product.digistoreProductId}`;

// Nur Produkte mit Digistore-ID sind kaufbar.
export const products = course.products
  .filter((product) => product.digistoreProductId)
  .map((product) => ({ ...product, checkoutUrl: checkoutUrl(product) }));

export const bundle = products.find((product) => product.id === 'bundle');

export const singleModuleOffers = dayModules.map((module) => ({
  module,
  product: products.find((product) => product.id !== 'bundle' && product.modules.includes(module.id)) || null,
}));

// Summe aller einzeln kaufbaren Module – ein echter Vergleichswert, kein Streichpreis.
export const singleModulesTotalCents = course.products
  .filter((product) => product.id !== 'bundle')
  .reduce((sum, product) => sum + product.priceCents, 0);

export const formatEuro = (cents) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

// Gratis-Einstieg: bleibt öffentlich, alles andere liegt im privaten Kurs-Speicher.
export const freeResources = [
  {
    title: 'Wahre Entlastung',
    kind: 'Kompendium',
    text: 'Der wissenschaftliche Leitfaden: was bei Stress im Körper passiert und warum kleine Routinen wirken.',
    href: '/assets/documents/003-wahre-entlastung.pdf',
  },
  {
    title: 'Stress-Reset-Journal',
    kind: 'Werkzeug',
    text: 'Dein Arbeitsheft für Reflexion und Umsetzung – nutzbar auch ohne Kurs.',
    href: '/assets/documents/004-modul-1-stress-reset-journal.pdf',
  },
  {
    title: 'Vitamin-Kompendium',
    kind: 'E-Book',
    text: '38 Seiten zu den 13 essenziellen Vitaminen.',
    href: '/assets/documents/001-vitamin-kompendium.pdf',
  },
  {
    title: 'Klangfrequenzen-Kompendium',
    kind: 'E-Book',
    text: 'Frequenzen für Meditation und Entspannung.',
    href: '/assets/documents/002-klangfrequenzen--meditation-gesundheit-anwendung.pdf',
  },
];

// Die 60-Sekunden-Übung aus Mail 4 als kostenlose Kostprobe der Kurspraxis.
export const sixtySecondReset = [
  'Vier Sekunden ruhig durch die Nase einatmen.',
  'Kurz halten – zwei Sekunden, nicht pressen.',
  'Sechs bis acht Sekunden langsam durch den Mund ausatmen, als würdest du durch einen Strohhalm pusten.',
  'Das Ganze fünf- bis sechsmal wiederholen.',
];
