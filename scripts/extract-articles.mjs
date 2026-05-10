import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const inventoryPath = path.join(root, 'source/data/inventory.json');
const imagesPath = path.join(root, 'source/data/images.json');
const mediaPath = path.join(root, 'source/data/media.json');
const outPath = path.join(root, 'src/data/articles.json');

async function readJson(filePath) {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content.replace(/^\uFEFF/, ''));
}

async function readOptionalJson(filePath, fallback) {
  try {
    return await readJson(filePath);
  } catch {
    return fallback;
  }
}

const inventory = await readJson(inventoryPath);
const images = await readJson(imagesPath);
const mediaInventory = await readOptionalJson(mediaPath, []);
const imageMap = new Map(
  images
    .filter((item) => item.status === 'ok')
    .map((item) => [item.url, item.localPath.replace('source/assets/original/', '/assets/original/')]),
);
const mediaMap = new Map(
  mediaInventory
    .filter((item) => item.status === 'ok' && item.publicPath)
    .map((item) => [item.url, item.publicPath]),
);

const utilitySlugs = new Set([
  'home',
  'datenschutz',
  'impressum',
  'uber-uns',
  'unsere-empfehlungen',
  'nachhaltigkeit',
  'nachhaltigkeit-text',
  'lexicon-vitae',
  'nutzungsbedingungen',
  'bitte-bestaetigen',
  'download',
  'reset-hub',
  'stress-reset-kurs',
  'kurs-mitgliederbereich',
  'modul-4',
  'modul-5',
  'nexus-app',
]);

const boilerplatePatterns = [
  /^(Home|Ratgeber|Unsere Empfehlungen|Nachhaltigkeit|Impressum|Datenschutz)$/i,
  /Cookie|Datenschutzeinstellungen|Website-Tracking|Drittanbieter|Akzeptieren|Ablehnen/i,
  /Wir benötigen Ihre Zustimmung/i,
  /Impressum\s+\|\s+Datenschutz/i,
  /Alle Rechte vorbehalten/i,
  /^\*?Disclaimer:/i,
  /Mit diesen Einstellungen aktivieren/i,
  /Facebook|Instagram|TikTok|Youtube|Email/i,
  /Toggle/i,
  /Website-Übersetzer|IONOS SiteAnalytics|YouTube-Video/i,
];

function decodeEntities(value) {
  return repairMojibake(value)
    .replace(/\\u0026/g, '&')
    .replace(/u0026/g, '&')
    .replace(/\\u002d/g, '-')
    .replace(/u002d/g, '-')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8212;|&mdash;/gi, '-')
    .replace(/&auml;/gi, (m) => (m[1] === 'A' ? 'Ä' : 'ä'))
    .replace(/&ouml;/gi, (m) => (m[1] === 'O' ? 'Ö' : 'ö'))
    .replace(/&uuml;/gi, (m) => (m[1] === 'U' ? 'Ü' : 'ü'))
    .replace(/&szlig;/gi, 'ß')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function repairMojibake(value) {
  const direct = value
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ãœ/g, 'Ü')
    .replace(/ÃŸ/g, 'ß')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/â€ž/g, '"')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/Â·/g, '·')
    .replace(/Â©/g, '©')
    .replace(/Â /g, ' ');
  if (!/[ÃÂâ]/.test(direct)) return direct;
  try {
    return Buffer.from(direct, 'latin1').toString('utf8');
  } catch {
    return direct;
  }
}

function fix(value) {
  if (Array.isArray(value)) return value.map((item) => fix(item));
  if (typeof value === 'string') return repairMojibake(decodeEntities(value));
  return value;
}

function cleanText(html) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function extractMedia(html) {
  const blocks = [];
  const encodedRe = /data-encoded-html="([^"]+)"/g;
  let match;

  while ((match = encodedRe.exec(html))) {
    let decoded = '';
    try {
      decoded = Buffer.from(match[1], 'base64').toString('utf8');
    } catch {
      continue;
    }

    const srcMatch = /<(audio|video|iframe)\b[\s\S]*?(?:src|href)="([^"]+)"/i.exec(decoded);
    const sourceMatch = /<source\b[^>]*src="([^"]+)"/i.exec(decoded);
    const type = srcMatch?.[1]?.toLowerCase() || (/audio/i.test(decoded) ? 'audio' : /video/i.test(decoded) ? 'video' : '');
    const src = sourceMatch?.[1] || srcMatch?.[2] || '';
    if (!type || !src) continue;
    if (!/^(https?:)?\/\//i.test(src) && !src.startsWith('/')) continue;

    const label = cleanText(decoded)
      .replace(/Ihr Browser unterstützt das Audio-Element nicht\.?/i, '')
      .replace(/anhören\s+(\d)/i, 'anhören ($1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s+/g, ' ')
      .trim();

    blocks.push({
      type,
      title: label || (type === 'audio' ? 'Audio zum Artikel' : 'Video zum Artikel'),
      src: mediaMap.get(src) || src,
      originalSrc: src,
    });
  }

  return blocks;
}

function slugPath(page) {
  return new URL(page.url).pathname;
}

function isArticle(page) {
  const pagePath = slugPath(page);
  if (page.status !== 'ok') return false;
  if (utilitySlugs.has(page.slug)) return false;
  if (pagePath.startsWith('/ratgeber/')) return false;
  if (pagePath.startsWith('/unsere-empfehlungen/')) return false;
  return true;
}

function segmentHtml(html) {
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const segments = [];
  const seen = new Set();
  const tagRe = /<(h[1-4]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRe.exec(stripped))) {
    const tag = match[1].toLowerCase();
    const text = cleanText(match[2]);
    if (!text) continue;
    if (text.length < 32 && !/^h[1-4]$/.test(tag)) continue;
    if (boilerplatePatterns.some((pattern) => pattern.test(text))) continue;
    if (text.includes('--font-') || text.includes('grid-row-') || text.includes('privacy-settings')) continue;
    const key = `${tag}:${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    segments.push({ tag, text });
  }

  return segments;
}

function findArticleStart(segments, page) {
  const candidates = [...(page.h1 || []), ...(page.h2 || [])]
    .filter(Boolean)
    .map((value) => value.slice(0, 72));
  if (candidates.length === 0) return 0;
  const index = segments.findIndex((segment) =>
    candidates.some((candidate) => segment.text.includes(candidate) || candidate.includes(segment.text.slice(0, 60))),
  );
  return index >= 0 ? index : 0;
}

function toBlocks(segments) {
  const blocks = [];
  let activeList = null;

  const flushList = () => {
    if (activeList?.items.length) blocks.push(activeList);
    activeList = null;
  };

  const pushListItems = (items) => {
    if (items.length === 0) return;
    activeList ??= { type: 'list', items: [] };
    activeList.items.push(...items);
  };

  const splitBulletText = (text) => {
    const trimmed = text.trim();
    if (!/^[-\u2013]\s+/.test(trimmed)) return null;
    return trimmed
      .split(/\s+(?=[-\u2013]\s+)/)
      .map((item) => item.replace(/^[-\u2013]\s+/, '').trim())
      .filter((item) => item.length > 0);
  };

  const isLeadHeading = (segment, index) => {
    if (segment.tag !== 'p') return false;
    const text = segment.text.trim();
    const next = segments[index + 1];
    if (!next || text.length < 18 || text.length > 110) return false;
    if (/[.!?]$/.test(text)) return false;
    if (/^(Wenn|Auch|Und|Oder|Das|Die|Der|Ein|Eine)\s/i.test(text) && !text.includes(':')) return false;
    return text.includes(':') || /^[A-ZÄÖÜ][^.!?]{17,}$/.test(text);
  };

  for (const [index, segment] of segments.entries()) {
    if (/^h[1-4]$/.test(segment.tag)) {
      flushList();
      blocks.push({ type: 'heading', level: Number(segment.tag.slice(1)), text: segment.text });
      continue;
    }
    if (segment.tag === 'li') {
      activeList ??= { type: 'list', items: [] };
      activeList.items.push(segment.text);
      continue;
    }
    const bulletItems = splitBulletText(segment.text);
    if (bulletItems) {
      pushListItems(bulletItems);
      continue;
    }
    if (isLeadHeading(segment, index)) {
      flushList();
      blocks.push({ type: 'heading', level: 3, text: segment.text });
      continue;
    }
    flushList();
    blocks.push({ type: 'paragraph', text: segment.text });
  }

  flushList();
  return blocks;
}

function estimateReadingTime(blocks) {
  const words = blocks
    .flatMap((block) => (block.type === 'list' ? block.items : [block.text]))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function heroImage(page) {
  return imageMap.get(page.images?.[1]) || imageMap.get(page.images?.[0]) || '';
}

const articles = [];

for (const page of inventory.filter(isArticle)) {
  const htmlPath = path.join(root, page.localHtml.replace(/\//g, path.sep));
  const html = await readFile(htmlPath, 'utf8');
  const allSegments = segmentHtml(html);
  const media = fix(extractMedia(html));
  const start = findArticleStart(allSegments, page);
  const segments = allSegments.slice(start);
  const end = segments.findIndex((segment) => boilerplatePatterns.some((pattern) => pattern.test(segment.text)));
  const articleSegments = end >= 0 ? segments.slice(0, end) : segments;
  const blocks = toBlocks(articleSegments).filter((block) => {
    if (block.type === 'heading') return block.text.length > 8;
    if (block.type === 'paragraph') return block.text.length > 45;
    if (block.type === 'list') return block.items.length > 0;
    return true;
  });

  articles.push({
    slug: page.slug,
    path: slugPath(page),
    title: fix(page.title),
    description: fix(page.description),
    h1: fix(page.h1),
    h2: fix(page.h2),
    image: heroImage(page),
    originalUrl: page.url,
    media,
    readingTime: estimateReadingTime(blocks),
    blocks,
    extraction: {
      segmentCount: allSegments.length,
      blockCount: blocks.length,
      source: page.localHtml,
    },
  });
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(articles, null, 2)}\n`, 'utf8');

console.log(`Extracted ${articles.length} articles to ${path.relative(root, outPath)}`);
console.log(`Blocks: ${articles.reduce((sum, article) => sum + article.blocks.length, 0)}`);
