import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
      filter: (page) =>
        !page.includes('/bitte-bestaetigen') &&
        !page.includes('/download') &&
        !page.includes('/kurs-mitgliederbereich') &&
        !page.includes('/reset-hub'),
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
