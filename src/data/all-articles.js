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

/**
 * ISO-Kalenderwoche (1-53) aus einem Datum.
 */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Deterministischer Seed pro Jahr+Woche.
 * 2026-KW19 -> 202619
 */
function weekSeed(date = new Date()) {
  return date.getUTCFullYear() * 100 + isoWeek(date);
}

/**
 * Stabiler Pseudozufall pro Artikel: gleicher Seed + gleiche Slug-Liste
 * = gleicher Index. Aendert sich nur, wenn Seed wechselt.
 */
function pickStable(list, seed) {
  if (!list || list.length === 0) return null;
  // Linear Congruential Generator-Schritt
  const mix = ((seed * 9301 + 49297) % 233280 + 233280) % 233280;
  return list[mix % list.length];
}

/**
 * Liefert je 1 Artikel pro Kategorie (sofern Artikel vorhanden) + 1 Momus-Artikel.
 * Die Auswahl rotiert wochenweise und ist innerhalb einer Woche stabil.
 * Build pro Woche => neue Auswahl. Build mehrfach innerhalb der Woche
 * => gleiche Auswahl.
 */
export function getWeeklyFeatured(categories, date = new Date()) {
  const seed = weekSeed(date);
  const byCategory = new Map();
  for (const article of allArticles) {
    if (!byCategory.has(article.category)) byCategory.set(article.category, []);
    byCategory.get(article.category).push(article);
  }
  const picks = [];
  const usedSlugs = new Set();
  categories.forEach((category, idx) => {
    const pool = byCategory.get(category.slug) || [];
    const article = pickStable(pool, seed + idx * 17);
    if (article && !usedSlugs.has(article.slug)) {
      picks.push(article);
      usedSlugs.add(article.slug);
    }
  });
  // Plus 1 Momus-Highlight, das nicht schon ausgewaehlt wurde.
  const momusPool = momusAll.filter((article) => !usedSlugs.has(article.slug));
  const momusPick = pickStable(momusPool, seed + 999);
  if (momusPick) picks.push(momusPick);
  return picks;
}

