import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const inventory = JSON.parse((await readFile(path.join(root, 'src/data/inventory.json'), 'utf8')).replace(/^\uFEFF/, ''));
let documentMap = new Map();
try {
  const docs = JSON.parse(await readFile(path.join(root, 'source/data/documents.json'), 'utf8'));
  documentMap = new Map(docs.filter((item) => item.status === 'ok').map((item) => [item.href, item.publicPath]));
} catch {
  documentMap = new Map();
}
const outPath = path.join(root, 'src/data/special-pages.json');

const specialSlugs = new Set([
  'stress-reset-kurs',
  'reset-hub',
  'kurs-mitgliederbereich',
  'modul-4',
  'modul-5',
  'download',
  'bitte-bestaetigen',
  'lexicon-vitae',
]);

const boilerplate = [
  /Cookie|Datenschutzeinstellungen|Website-Tracking|Drittanbieter|Akzeptieren|Ablehnen/i,
  /Impressum|Datenschutz|Alle Rechte vorbehalten|Toggle|IONOS|Website-Übersetzer/i,
  /Wir benötigen Ihre Zustimmung|Alle Dienste auswählen|Funktionalitäten die auf dieser Website/i,
  /Your web browser is old|For a better experience/i,
];

const navigationHrefs = new Set([
  '/',
  '/nexus-app/',
  '/ratgeber/',
  '/unsere-empfehlungen/',
  '/stress-reset-kurs/',
  '/nachhaltigkeit/',
  '/impressum/',
  '/datenschutz/',
  '/nutzungsbedingungen/',
  '/uber-uns/',
  '/lexicon-vitae/',
  '/ratgeber/zukunft-der-gesundheit/',
  '/ratgeber/korper-and-ernahrung/',
  '/ratgeber/sport-and-energie/',
  '/ratgeber/geist-and-seele/',
  '/unsere-empfehlungen/zukunft-der-gesundheit/',
  '/unsere-empfehlungen/korper-and-ernahrung/',
  '/unsere-empfehlungen/sport-and-energie/',
  '/unsere-empfehlungen/geist-and-seele-1/',
]);

function repairMojibake(value) {
  const direct = value
    .replace(/ÃƒÂ¤/g, 'ä').replace(/ÃƒÂ¶/g, 'ö').replace(/ÃƒÂ¼/g, 'ü')
    .replace(/Ãƒâ€ž/g, 'Ä').replace(/Ãƒâ€“/g, 'Ö').replace(/ÃƒÅ“/g, 'Ü')
    .replace(/ÃƒÅ¸/g, 'ß').replace(/Ã¢â‚¬â€œ/g, '-').replace(/Ã¢â‚¬â€/g, '-')
    .replace(/Ã¢â‚¬Å¾/g, '"').replace(/Ã¢â‚¬Å“/g, '"').replace(/Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â„¢/g, "'").replace(/Ã¢â‚¬Ëœ/g, "'").replace(/Ã‚ /g, ' ');
  if (!/[ÃƒÃ‚Ã¢]/.test(direct)) return direct;
  try {
    return Buffer.from(direct, 'latin1').toString('utf8');
  } catch {
    return direct;
  }
}

function decodeEntities(value) {
  return repairMojibake(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8212;|&mdash;/gi, '-')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&szlig;/gi, 'ß')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanText(html) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBlocks(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const blocks = [];
  const seen = new Set();
  const tagRe = /<(h[1-4]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRe.exec(stripped))) {
    const tag = match[1].toLowerCase();
    const text = cleanText(match[2]);
    if (!text || text.length < 18) continue;
    if (boilerplate.some((pattern) => pattern.test(text))) continue;
    if (text.includes('--font-') || text.includes('grid-row-')) continue;
    const key = `${tag}:${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (/^h[1-4]$/.test(tag)) {
      blocks.push({ type: 'heading', level: Number(tag.slice(1)), text });
    } else if (tag === 'li') {
      blocks.push({ type: 'listItem', text });
    } else {
      blocks.push({ type: 'paragraph', text });
    }
  }
  return blocks.slice(0, 90);
}

function isLexiconTerm(value) {
  if (!value || value.length < 3 || value.length > 42) return false;
  if (/Lexicon|Wörterbuch|Willkommen|Gratis|Download|WICHTIGER|Herzlichen/i.test(value)) return false;
  if (/^[A-ZÄÖÜ]$/.test(value)) return false;
  return /^[A-ZÄÖÜ][\p{L}]+(?:\s+[A-ZÄÖÜ][\p{L}]+){0,3}$/u.test(value);
}

function splitLexiconTranslation(value) {
  const text = value.replace(/^Deutsch:\s*/i, '').trim();
  const split = text.match(/^(.+?)(\s+(?:Dieser|Dieses|Diese|Dies ist|Ein|Eine|Wir)\b[\s\S]*)$/);
  if (!split) return { translation: text, description: '' };
  return {
    translation: split[1].trim(),
    description: split[2].trim(),
  };
}

function extractLexiconEntries(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const tokens = [];
  const tagRe = /<(h[1-4]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRe.exec(stripped))) {
    const tag = match[1].toLowerCase();
    const text = cleanText(match[2]);
    if (!text || boilerplate.some((pattern) => pattern.test(text))) continue;
    if (text.includes('--font-') || text.includes('grid-row-')) continue;
    tokens.push({ tag, text });
  }

  const entries = [];
  const seen = new Set();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!/^h[1-4]$/.test(token.tag) || !isLexiconTerm(token.text) || seen.has(token.text)) continue;

    const paragraphs = [];
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const next = tokens[cursor];
      if (/^h[1-4]$/.test(next.tag)) break;
      if (next.text.length > 8 && !/^&nbsp;$/i.test(next.text)) paragraphs.push(next.text);
    }
    if (!paragraphs.some((text) => /^Deutsch:/i.test(text))) continue;

    const firstDeutsch = paragraphs.find((text) => /^Deutsch:/i.test(text));
    const { translation, description: inlineDescription } = splitLexiconTranslation(firstDeutsch);
    const description = [inlineDescription, ...paragraphs.filter((text) => text !== firstDeutsch)]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    seen.add(token.text);
    entries.push({
      term: token.text,
      translation,
      description,
    });
  }
  return entries;
}

function extractLinks(html, slug) {
  const links = [];
  const seen = new Set();
  const linkRe = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRe.exec(html))) {
    const href = decodeEntities(match[1]);
    const label = cleanText(match[2]);
    if (!href || !label || seen.has(href)) continue;
    if (slug === 'lexicon-vitae' && /^Mehr erfahren$/i.test(label)) continue;
    if (navigationHrefs.has(href)) continue;
    if (/^#|mailto:|impressum|datenschutz/i.test(href)) continue;
    if (/feed|wp-json|xmlrpc|oembed|favicon|apple-touch-icon|profile|facebook|instagram|tiktok|youtube\.com\/@callidus|google|mozilla|microsoft|opera/i.test(href)) continue;
    if (/HOME|NEXUS App|Ratgeber|Unsere Empfehlungen|Nachhaltigkeit/i.test(label)) continue;
    seen.add(href);
    links.push({
      href: documentMap.get(href) || href,
      originalHref: href,
      label,
      external: /^https?:\/\//i.test(href),
      download: href.endsWith('.pdf'),
    });
  }
  return links.slice(0, 20);
}

function kindFor(slug) {
  if (slug === 'lexicon-vitae') return 'lexicon';
  if (slug.includes('modul') || slug.includes('kurs') || slug.includes('reset')) return 'course';
  if (slug === 'download' || slug === 'bitte-bestaetigen') return 'funnel';
  return 'page';
}

const pages = [];
for (const page of inventory.filter((item) => specialSlugs.has(item.slug))) {
  const html = await readFile(path.join(root, page.localHtml.replace(/\//g, path.sep)), 'utf8');
  const blocks = extractBlocks(html);
  const links = extractLinks(html, page.slug);
  const lexiconEntries = page.slug === 'lexicon-vitae' ? extractLexiconEntries(html) : [];
  const hero = page.h1?.[0] || page.h2?.[0] || page.title || page.slug;
  const lead = page.h2?.find((item) => item && item !== hero) || blocks.find((block) => block.type === 'paragraph')?.text || '';
  pages.push({
    slug: page.slug,
    path: new URL(page.url).pathname,
    title: page.title || hero,
    hero,
    lead,
    kind: kindFor(page.slug),
    originalUrl: page.url,
    blocks,
    links,
    ...(lexiconEntries.length > 0 ? { lexiconEntries } : {}),
  });
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
console.log(`Extracted ${pages.length} special pages to ${path.relative(root, outPath)}`);
for (const page of pages) console.log(`${page.slug}: ${page.blocks.length} blocks, ${page.links.length} links`);
