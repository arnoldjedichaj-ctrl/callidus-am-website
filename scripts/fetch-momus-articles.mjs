#!/usr/bin/env node
/**
 * Holt Momus-Artikel aus Firebase Firestore und schreibt sie als JSON in
 * src/data/momus-articles.json. Das Format ist kompatibel mit articles.json.
 *
 * Voraussetzung:
 *  - firebase-service-account.json liegt im Projekt-Root (per .gitignore geschuetzt)
 *  - npm install firebase-admin
 *
 * Aufruf:
 *  node scripts/fetch-momus-articles.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const serviceAccountPath = resolve(projectRoot, 'firebase-service-account.json');
const outPath = resolve(projectRoot, 'src/data/momus-articles.json');

if (!existsSync(serviceAccountPath)) {
  console.error('\n[fetch-momus-articles] firebase-service-account.json fehlt.');
  console.error('Bitte die JSON-Datei aus Firebase Console > Projekteinstellungen >');
  console.error('Dienstkonten > "Neuen privaten Schluessel generieren" als');
  console.error('firebase-service-account.json ins Projekt-Root legen.\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Mapping zwischen Momus-Kategorien und callidus-am.de-Kategorien.
 * Zukunft der Gesundheit existiert in Momus noch nicht.
 */
const categoryMap = {
  mind: 'geist-seele',
  body: 'koerper-ernaehrung',
  sport: 'sport-energie',
  energy: 'sport-energie',
  future: 'zukunft-gesundheit',
};

/**
 * URL-tauglichen Slug aus deutschem Titel erzeugen.
 */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Lesezeit grob schaetzen: 200 Woerter pro Minute.
 */
function estimateReadingTime(text) {
  const words = String(text || '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Inhalt in Bloecke (heading/paragraph/list) aufteilen.
 * Erkennt: Zeilen mit "## Titel" / "### Titel" als Heading,
 *          Zeilen mit "- " als Listenitem,
 *          alles andere als Paragraph.
 */
function blocksFromText(text) {
  if (!text) return [];
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let currentList = null;
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ').trim() });
      currentParagraph = [];
    }
  };
  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h3) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: 3, text: h3[1].trim() });
      continue;
    }
    if (h2 || h1) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: 2, text: (h2 || h1)[1].trim() });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (!currentList) currentList = { type: 'list', items: [] };
      currentList.items.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    flushList();
    currentParagraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function pickLang(obj, lang, fallback = '') {
  if (obj == null) return fallback;
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.de || obj.en || fallback;
}

function isoFromTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (value._seconds != null) return new Date(value._seconds * 1000).toISOString();
  return null;
}

async function main() {
  console.log('[fetch-momus-articles] Lade Artikel aus Firestore...');
  const snapshot = await db.collection('articles').orderBy('publishedAt', 'desc').get();
  console.log(`[fetch-momus-articles] ${snapshot.size} Dokumente gefunden.`);

  const articles = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const titleDe = pickLang(data.title, 'de');
    const titleEn = pickLang(data.title, 'en');
    if (!titleDe && !titleEn) {
      console.warn(`[fetch-momus-articles] Skip ${doc.id} - kein Titel`);
      continue;
    }
    const descriptionDe = pickLang(data.excerpt, 'de');
    const descriptionEn = pickLang(data.excerpt, 'en');
    const contentDe = pickLang(data.content, 'de');
    const contentEn = pickLang(data.content, 'en');
    const baseSlug = slugify(titleDe || titleEn) || `momus-${doc.id.toLowerCase()}`;

    articles.push({
      app: 'momus',
      firestoreId: doc.id,
      slug: baseSlug,
      path: `/${baseSlug}/`,
      title: titleDe || titleEn,
      titleEn: titleEn || titleDe,
      description: descriptionDe || descriptionEn,
      descriptionEn: descriptionEn || descriptionDe,
      image: data.imageUrl || null,
      category: categoryMap[data.category] || categoryMap.mind,
      momusCategory: data.category || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      isFeatured: Boolean(data.isFeatured),
      publishedAt: isoFromTimestamp(data.publishedAt),
      readingTime: estimateReadingTime(contentDe || contentEn),
      blocks: blocksFromText(contentDe || contentEn),
      blocksEn: blocksFromText(contentEn || contentDe),
    });
  }

  writeFileSync(outPath, JSON.stringify(articles, null, 2), 'utf8');
  console.log(`[fetch-momus-articles] ${articles.length} Artikel nach ${outPath} geschrieben.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[fetch-momus-articles] Fehler:', err);
    process.exit(1);
  });
