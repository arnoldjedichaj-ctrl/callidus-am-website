import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outPath = path.join(root, 'src/data/legal-pages.json');

const pages = [
  {
    slug: 'impressum',
    title: 'Impressum',
    lead: 'Anbieterkennzeichnung und Kontaktangaben von Callidus A&M.',
  },
  {
    slug: 'datenschutz',
    title: 'Datenschutz',
    lead: 'Datenschutzerklärung für die Website und die Callidus Apps.',
  },
  {
    slug: 'nutzungsbedingungen',
    title: 'Nutzungsbedingungen',
    lead: 'Regeln für die Nutzung der Website, Inhalte und verbundenen Dienste.',
  },
];

function repairMojibake(value) {
  const direct = value
    .replace(/Ã¤/g, 'ä').replace(/Ã¶/g, 'ö').replace(/Ã¼/g, 'ü')
    .replace(/Ã„/g, 'Ä').replace(/Ã–/g, 'Ö').replace(/Ãœ/g, 'Ü')
    .replace(/ÃŸ/g, 'ß').replace(/â€“|â€”/g, '-').replace(/â€ž|â€œ|â€/g, '"')
    .replace(/â€™|â€˜/g, "'").replace(/Â /g, ' ');
  try {
    return Buffer.from(direct, 'latin1').toString('utf8').includes('�') ? direct : Buffer.from(direct, 'latin1').toString('utf8');
  } catch {
    return direct;
  }
}

function decodeEntities(value) {
  return repairMojibake(value)
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;|&#038;/gi, '&')
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
    .replace(/\uFFFE|\uFFFD|\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTokens(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const tokens = [];
  const re = /<(h[1-4]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = re.exec(stripped))) {
    const text = cleanText(match[2]);
    if (!text || text.length < 3) continue;
    if (text.length < 8000 && /Cookie|Datenschutzeinstellungen|Website-Tracking|Drittanbieter|Akzeptieren|Ablehnen|Website-Übersetzer|IONOS SiteAnalytics|YouTube-Video|Wir benötigen Ihre Zustimmung|Alle Dienste auswählen|Funktionalitäten die auf dieser Website/i.test(text)) continue;
    if (/Impressum \| Datenschutz|Copyright\. Alle Rechte vorbehalten/i.test(text)) continue;
    tokens.push({ type: match[1].toLowerCase(), text });
  }
  return tokens;
}

function sectionizeDatenschutz(tokens) {
  const giant = tokens.find((token) => token.text.length > 8000)?.text || tokens.map((token) => token.text).join(' ');
  let text = giant;
  const start = text.indexOf('Datenschutzerklärung 1.');
  if (start >= 0) text = text.slice(start);
  text = text.replace(/^Datenschutzerklärung\s*/i, '');
  const stop = text.search(/Impressum\s+\|\s+Datenschutz|© Copyright|Wir benötigen Ihre Zustimmung/i);
  if (stop > 0) text = text.slice(0, stop);

  const sections = [];
  const parts = text
    .replace(/\s+(?=\d+\.\s+[A-ZÄÖÜ])/g, '\n')
    .replace(/\s+(?=Datenschutzerklärung für die App)/g, '\n')
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const titleMatch = part.match(/^(\d+\.\s+[^.]{3,120}?)(?:\s{1,}|$)([\s\S]*)$/);
    if (titleMatch) {
      sections.push({
        heading: titleMatch[1].trim(),
        paragraphs: titleMatch[2] ? splitLongText(titleMatch[2]) : [],
      });
    } else {
      sections.push({ heading: '', paragraphs: splitLongText(part) });
    }
  }
  return sections;
}

function splitLongText(value) {
  return value
    .replace(/\s+(?=(?:Art\.|§)\s*\d+)/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9])/)
    .reduce((paragraphs, sentence) => {
      const current = paragraphs.at(-1);
      if (!current || current.length + sentence.length > 520) paragraphs.push(sentence);
      else paragraphs[paragraphs.length - 1] = `${current} ${sentence}`;
      return paragraphs;
    }, [])
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionizeSimple(tokens) {
  const sections = [];
  let current = null;
  for (const token of tokens) {
    if (/^(Impressum|Nutzungsbedingungen|Datenschutz)$/i.test(token.text)) continue;
    const sectionStart = token.text.match(/^(\d+(?:\.\d+)?\.?\s+[^.]{3,95}?)(?=\s+(?:Anbieter|Alle|Das|Die|Der|Diese|Es|Bei|Stand|Wir|Auf|Ausgenommen|Nutzung|Callidus|YouTube|Google|TikTok|Eine|Wartungsarbeiten|Für|https?:|Tel|E-Mail)\b)(?:\s+([\s\S]+))?$/);
    if (token.type.startsWith('h') || sectionStart) {
      if (current) sections.push(current);
      current = {
        heading: sectionStart ? sectionStart[1].trim() : token.text,
        paragraphs: sectionStart?.[2] ? splitLongText(sectionStart[2]) : [],
      };
    } else {
      if (!current) current = { heading: '', paragraphs: [] };
      current.paragraphs.push(token.text);
    }
  }
  if (current) sections.push(current);
  return sections;
}

const output = [];
for (const page of pages) {
  const html = await readFile(path.join(root, 'source/content-html', `${page.slug}.html`), 'utf8');
  const tokens = extractTokens(html);
  const sections = page.slug === 'datenschutz' ? sectionizeDatenschutz(tokens) : sectionizeSimple(tokens);
  output.push({
    ...page,
    originalUrl: `https://www.callidus-am.de/${page.slug}/`,
    sections,
  });
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
for (const page of output) console.log(`${page.slug}: ${page.sections.length} sections`);
