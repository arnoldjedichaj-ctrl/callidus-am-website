import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
]);

const shouldIncludeInSitemap = (page) => {
  const path = new URL(page).pathname;
  return !sitemapExcludedPaths.has(path) && !sitemapExcludedPrefixes.some((prefix) => path.startsWith(prefix));
};

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
