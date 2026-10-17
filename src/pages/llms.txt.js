// /llms.txt nach llmstxt.org: kompakte Übersicht für KI-Suchsysteme
// (ChatGPT, Perplexity, Google AI). Wird beim Build aus denselben Daten erzeugt
// wie die Seite selbst und bleibt dadurch automatisch aktuell.
import { nexusAll, momusAll } from '../data/all-articles.js';
import { books } from '../data/books.js';
import { organizationDescription, founders } from '../data/positioning.js';
import structure from '../data/site-structure.json';

const site = 'https://www.callidus-am.de';
const link = (title, path, note) => `- [${title}](${new URL(path, site).href})${note ? `: ${note}` : ''}`;
const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

export function GET() {
  const categoryTitle = new Map(structure.categories.map((category) => [category.slug, category.title]));
  const guides = structure.categories
    .map((category) => {
      const items = nexusAll.filter((article) => article.category === category.slug);
      if (items.length === 0) return '';
      return [`### ${categoryTitle.get(category.slug)}`, ...items.map((article) => link(clean(article.title), article.path, clean(article.description)))].join('\n');
    })
    .filter(Boolean);

  const lines = [
    '# callidus A&M',
    '',
    `> ${organizationDescription}`,
    '',
    `Deutschsprachiges Gesundheitsangebot von ${founders.join(' und ')}. Inhalte sind redaktionell und KI-unterstützt erstellt, Quellen werden je Artikel offengelegt. Callidus ersetzt keine Diagnose, Therapie oder individuelle medizinische Beratung. Affiliate-Links sind mit einem Sternchen gekennzeichnet.`,
    '',
    '## Kernangebote',
    link('Gesundheits-Kompass', '/gesundheits-kompass/', 'ordnet die eigene Situation in Körper, Geist und Alltag ein'),
    link('Stress-Reset-Kurs', '/stress-reset-kurs/', 'Online-Kurs gegen Daueranspannung'),
    link('Quellencheck', '/quellencheck/', 'Gesundheitsbehauptungen gegen Studien geprüft'),
    link('Quellen & Methodik', '/quellen-methodik/', 'wie wir Quellen auswählen und Grenzen kennzeichnen'),
    link('Ratgeber', '/ratgeber/', 'alle Artikel nach Themen'),
    link('Empfehlungen', '/unsere-empfehlungen/', 'kuratierte Produkte mit Bewertungskriterien'),
    link('Über uns', '/uber-uns/'),
    link('FAQ', '/faq/'),
    '',
    '## Bücher',
    ...books.map((book) => link(clean(book.title), book.href, clean(book.subtitle))),
    '',
    '## Ratgeber-Artikel',
    '',
    ...guides.flatMap((block) => [block, '']),
    '## Optional',
    '',
    'MOMUS ist die Satire-Rubrik von callidus A&M. Die Texte sind bewusst überzeichnet und keine Gesundheitsempfehlung.',
    '',
    ...momusAll.map((article) => link(clean(article.title), article.path)),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
