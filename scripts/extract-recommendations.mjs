import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'source/content-html');
const outPath = path.join(root, 'src/data/recommendations.json');

const sources = [
  {
    file: 'unsere-empfehlungen-korper-and-ernahrung.html',
    category: 'koerper-ernaehrung',
    title: 'Körper & Ernährung',
    accent: 'mint',
    path: '/unsere-empfehlungen/korper-and-ernahrung/',
  },
  {
    file: 'unsere-empfehlungen-geist-and-seele-1.html',
    category: 'geist-seele',
    title: 'Geist & Seele',
    accent: 'blue',
    path: '/unsere-empfehlungen/geist-and-seele-1/',
  },
  {
    file: 'unsere-empfehlungen-sport-and-energie.html',
    category: 'sport-energie',
    title: 'Sport & Energie',
    accent: 'coral',
    path: '/unsere-empfehlungen/sport-and-energie/',
  },
  {
    file: 'unsere-empfehlungen-zukunft-der-gesundheit.html',
    category: 'zukunft-gesundheit',
    title: 'Zukunft der Gesundheit',
    accent: 'gold',
    path: '/unsere-empfehlungen/zukunft-der-gesundheit/',
  },
];

function repairMojibake(value) {
  const direct = value
    .replace(/ÃƒÂ¤/g, 'ä')
    .replace(/ÃƒÂ¶/g, 'ö')
    .replace(/ÃƒÂ¼/g, 'ü')
    .replace(/Ãƒâ€ž/g, 'Ä')
    .replace(/Ãƒâ€“/g, 'Ö')
    .replace(/ÃƒÅ“/g, 'Ü')
    .replace(/ÃƒÅ¸/g, 'ß')
    .replace(/Ã¢â‚¬â€œ/g, '-')
    .replace(/Ã¢â‚¬â€/g, '-')
    .replace(/Ã¢â‚¬Å¾/g, '"')
    .replace(/Ã¢â‚¬Å“/g, '"')
    .replace(/Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Ëœ/g, "'")
    .replace(/Ã‚Â·/g, '·')
    .replace(/Ã‚Â©/g, '©')
    .replace(/Ã‚ /g, ' ');
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

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractProducts(html, source) {
  const products = [];
  const seenLinks = new Set();
  const cardRe = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]{0,9000}?)(?:<a\s+[^>]*href="(https?:\/\/[^"]+)"[^>]*>\s*(?:Zum Produkt|Zum Kurs|Ansehen|Mehr erfahren)[\s\S]*?<\/a>)/gi;
  let match;

  while ((match = cardRe.exec(html))) {
    const title = cleanText(match[1]);
    const between = match[2];
    const link = decodeEntities(match[3]);
    if (!title || !link || seenLinks.has(link)) continue;
    if (/facebook|instagram|tiktok|youtube|google|mozilla|microsoft|opera|callidus-am\.de/i.test(link)) continue;

    const paragraphs = [...between.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((item) => cleanText(item[1]))
      .filter((item) => item.length > 40 && !/Impressum|Datenschutz|Copyright/i.test(item));
    const description = paragraphs[0] || '';
    if (!description) continue;

    let provider = new URL(link).hostname.replace(/^www\./, '');
    if (provider === 'amzn.to') provider = 'Amazon';
    if (provider.includes('coachcecil')) provider = 'Coach Cecil';

    seenLinks.add(link);
    products.push({
      id: slugify(`${source.category}-${title}`).slice(0, 90),
      category: source.category,
      categoryTitle: source.title,
      accent: source.accent,
      title,
      description,
      url: link,
      provider,
      cta: /kurs/i.test(title) ? 'Zum Kurs' : 'Zum Produkt',
      affiliate: true,
    });
  }

  return products;
}

const categories = [];
const products = [];

for (const source of sources) {
  const html = await readFile(path.join(sourceDir, source.file), 'utf8');
  const extracted = extractProducts(html, source);
  categories.push({
    slug: source.category,
    title: source.title,
    accent: source.accent,
    path: source.path,
    count: extracted.length,
  });
  products.push(...extracted);
}

const data = {
  disclosure: 'Mit * gekennzeichnete Links sind Affiliate-Links. Wenn du darüber kaufst, kann callidus A&M eine Provision erhalten. Für dich entstehen keine Mehrkosten.',
  categories,
  products,
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Extracted ${products.length} recommendations to ${path.relative(root, outPath)}`);
for (const category of categories) {
  console.log(`${category.title}: ${category.count}`);
}
