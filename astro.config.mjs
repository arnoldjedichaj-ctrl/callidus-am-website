import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// Die Sitemap ist ein Signal für die öffentlich strategischen Inhalte. Geschützte
// Bereiche, Funnels, rechtliche Dokumente und das separate Krypto-Lab bleiben
// erreichbar, werden aber nicht als Kern des Gesundheitsangebots ausgespielt.
const sitemapExcludedPrefixes = [
  '/bitte-bestaetigen/',
  '/download/',
  '/kurs-mitgliederbereich/',
  '/reset-hub/',
  '/modul-4/',
  '/modul-5/',
  '/assets/documents/',
  '/portal/',
  '/wallet/',
  '/valus/',
  '/krypto-',
];

const sitemapExcludedPaths = new Set([
  '/agb/',
  '/datenschutz/',
  '/impressum/',
  '/nutzungsbedingungen/',
  '/widerruf/',
  '/seiten/',
  // Partnerseiten sind bewusst noindex.
  '/affiliate-kinderbuch/',
  '/affiliate-stress-reset/',
]);

// Kurzadressen und Altpfade, die nur per Astro.redirect weiterleiten. Sie würden sonst
// als eigene (noindex-)Seite in der Sitemap landen und Duplikate erzeugen.
// Neue Weiterleitungsseite in src/pages → Pfad hier ergänzen.
const sitemapRedirectPaths = new Set([
  '/apps/',
  '/gesundheitsbuch-kinder/',
  '/heute-mal-nicht-alles/',
  '/not-everything-today/',
  '/unsere-empfehlungen/geist-and-seele-1/',
]);

const shouldIncludeInSitemap = (page) => {
  const path = new URL(page).pathname;
  return !sitemapExcludedPaths.has(path)
    && !sitemapRedirectPaths.has(path)
    && !sitemapExcludedPrefixes.some((prefix) => path.startsWith(prefix));
};

// lastmod nur dort, wo ein echtes Datum belegt ist (updatedAt/publishedAt der Artikel).
// Ein Build-Datum für alle Seiten wäre für Google wertlos.
const readArticles = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf-8'));
const articleLastmod = new Map();
for (const article of [...readArticles('./src/data/articles.json'), ...readArticles('./src/data/momus-articles.json')]) {
  const date = article.updatedAt || article.publishedAt;
  if (!date || !article.path) continue;
  articleLastmod.set(article.path, date);
  if (Array.isArray(article.blocksEn) && article.blocksEn.length > 0) {
    articleLastmod.set(`/en/guide/${article.slug}/`, date);
  }
}
// MOMUS-Satire ist eigene Rubrik und nicht der Kern des Gesundheitsangebots.
const satirePaths = new Set(
  readArticles('./src/data/momus-articles.json').flatMap((article) => [article.path, `/en/guide/${article.slug}/`])
);

export default defineConfig({
  site: 'https://www.callidus-am.de',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de-DE', en: 'en-US' },
      },
      changefreq: 'monthly',
      priority: 0.7,
      filter: shouldIncludeInSitemap,
      serialize(item) {
        const path = new URL(item.url).pathname;
        const lastmod = articleLastmod.get(path);
        if (lastmod) item = { ...item, lastmod: new Date(lastmod).toISOString() };
        if (satirePaths.has(path)) {
          return { ...item, priority: 0.3 };
        }
        if (item.url === 'https://www.callidus-am.de/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/ratgeber') || item.url.includes('/unsere-empfehlungen')) {
          return { ...item, priority: 0.8 };
        }
        return item;
      },
    }),
  ],
});
