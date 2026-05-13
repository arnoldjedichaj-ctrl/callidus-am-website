// Zentrale Quelle fuer alle Artikel: NEXUS (urspruengliche WordPress-Inhalte)
// und MOMUS (aus Firebase gezogene Inhalte). Wird von index.astro,
// [...slug].astro und ratgeber/index.astro genutzt.

import nexusArticles from './articles.json';
import momusArticles from './momus-articles.json';
import structure from './site-structure.json';

const categorize = (item, fallback) => {
  if (item.category) return item.category;
  const haystack = `${item.slug || ''} ${item.title || ''} ${item.description || ''} ${(item.h2 || []).join(' ')}`.toLowerCase();
  const match = structure.categories.find((category) =>
    category.keywords.some((keyword) => haystack.includes(keyword))
  );
  return (match && match.slug) || fallback || structure.categories[0].slug;
};

// NEXUS-Artikel um app-Tag erweitern
export const nexusAll = nexusArticles.map((article) => ({
  ...article,
  app: 'nexus',
  category: categorize(article, 'koerper-ernaehrung'),
}));

// MOMUS-Artikel bereits mit app="momus" und category aus dem Fetch-Skript
export const momusAll = momusArticles.map((article) => ({
  ...article,
  app: 'momus',
}));

// Kombinierter Feed, NEXUS zuerst, dann MOMUS (chronologisch absteigend)
export const allArticles = [
  ...nexusAll,
  ...momusAll.slice().sort((a, b) => {
    const aDate = a.publishedAt || '';
    const bDate = b.publishedAt || '';
    return bDate.localeCompare(aDate);
  }),
];

export function articlesForCategory(categorySlug) {
  return allArticles.filter((article) => article.category === categorySlug);
}

export function articleBySlug(slug) {
  return allArticles.find((article) => article.slug === slug);
}

export function appBadgeMeta(app) {
  if (app === 'momus') {
    return { label: 'MOMUS', className: 'app-badge app-badge-momus' };
  }
  return { label: 'NEXUS', className: 'app-badge app-badge-nexus' };
}
