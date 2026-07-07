import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manuscriptPath = resolve('docs/kinderbuch-band1-vollmanuskript.md');
const privateDir = resolve('buchprojekt/kinderbuch-band1');
const workingOutPath = resolve(privateDir, 'callis-kompass-band1-arbeitsfassung.html');
const kdpInteriorOutPath = resolve(privateDir, 'callis-kompass-band1-kdp-inhalt.html');
const reportPath = resolve('docs/kinderbuch-band1-illustrationsplanung.md');

const printImageMap = new Map([
  [1, 'bilder/gesundheitskompass-kids-cover-concept.png'],
  [5, 'bilder/final/page-05-fruehstueck-piep.png'],
  [6, 'bilder/scenes/mvp-02-calli-stellt-sich-vor.png'],
  [7, 'bilder/final/page-07-gesundheitszentrale.png'],
  [8, 'bilder/scenes/mvp-06-knurr-bauch-post.png'],
  [9, 'bilder/scenes/mvp-08-durst-giesskanne.png'],
  [13, 'bilder/final/page-13-schlaf-turm.png'],
  [14, 'bilder/final/page-14-nacht-werkstatt.png'],
  [15, 'bilder/final/page-15-licht-sagt-wach.png'],
  [16, 'bilder/final/page-16-startrampen-ritual.png'],
  [18, 'bilder/final/page-18-drei-gute-dinge.png'],
  [21, 'bilder/gesundheitskompass-kids-food-spread-concept.png'],
  [22, 'bilder/final/page-22-kein-essen-boesewicht.png'],
  [26, 'bilder/final/page-26-teller-detektiv.png'],
  [29, 'bilder/scenes/full-16-kribbelbein.png'],
  [30, 'bilder/scenes/mvp-12-zappelbeine.png'],
  [31, 'bilder/final/page-31-kopf-wach-gefuehl.png'],
  [34, 'bilder/final/page-34-tier-olympiade.png'],
  [38, 'bilder/scenes/mvp-16-gefuehls-wetter.png'],
  [39, 'bilder/final/page-39-wetter-sprechen.png'],
  [40, 'bilder/final/page-40-angst-nebel.png'],
  [45, 'bilder/final/page-45-seifen-rutschbahn.png'],
  [47, 'bilder/final/page-47-wasch-lied.png'],
  [48, 'bilder/scenes/full-20-nies-turbo.png'],
  [49, 'bilder/scenes/mvp-14-aua-reparatur-trupp.png'],
  [53, 'bilder/final/page-53-wochen-kompass.png'],
  [58, 'bilder/final/page-58-siebter-tag.png'],
  [59, 'bilder/scenes/mvp-20-urkunde-finale.png'],
  [71, 'bilder/final/page-71-ruhiger-abschluss.png'],
  [72, 'bilder/final/page-72-calli-schlaeft.png'],
]);

const chapterAccent = (pageNumber) => {
  if (pageNumber <= 12) return 'mint';
  if (pageNumber <= 20) return 'blue';
  if (pageNumber <= 28) return 'gold';
  if (pageNumber <= 36) return 'coral';
  if (pageNumber <= 44) return 'blue';
  if (pageNumber <= 52) return 'mint';
  if (pageNumber <= 60) return 'gold';
  return 'quiet';
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const typographicText = (value) =>
  String(value)
    .replace(/"([^"]+)"/g, '„$1“')
    .replace(/\s-\s/g, ' – ');

const inlineMarkdown = (value) =>
  escapeHtml(typographicText(value))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

function pageKind(page) {
  if (page.number === 60) return 'certificate';
  if (/^Wusstest du schon\?$/i.test(page.title)) return 'fact';
  if (/^Mach mit:/i.test(page.title)) return 'mission';
  if (/^Mini-Elternimpuls$/i.test(page.title) || /^Elternseite:/i.test(page.title)) return 'parent';
  if (/Quellen|Impressum|KI-|Über callidus|Was als Nächstes/i.test(page.title)) return 'appendix';
  if (page.number <= 4) return 'intro';
  return 'story';
}

const iconSets = {
  fact: ['KNURR', 'WASSER', 'PAUSE', 'LOS'],
  mission: ['1', '2', '3', 'FERTIG'],
  parent: ['FRAGE', 'RUHE', 'KLEIN', 'DRAN'],
  appendix: ['INFO', 'TEAM', 'PRUEFEN', 'WEITER'],
  intro: ['OHR', 'HERZ', 'KARTE', 'CALLI'],
  story: ['HOEREN', 'SPUEREN', 'WAEHLEN', 'WACHSEN'],
};

function renderMiniCalli() {
  return `
    <svg class="mini-calli" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <circle cx="48" cy="48" r="42" fill="#d6aa3d"/>
      <circle cx="48" cy="48" r="31" fill="#cfe0c7" stroke="#8aa383" stroke-width="2"/>
      <path d="M48 15 L55 47 L48 41 L41 47 Z" fill="#a7604f"/>
      <path d="M48 81 L42 50 L48 56 L54 50 Z" fill="#f2e6c2"/>
      <circle cx="36" cy="52" r="4.5" fill="#223026"/>
      <circle cx="60" cy="52" r="4.5" fill="#223026"/>
      <path d="M35 64 Q48 73 61 64" fill="none" stroke="#223026" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `;
}

function renderDesignedArt(page, kind) {
  const icons = iconSets[kind] || iconSets.story;
  const cardTitle = kind === 'fact'
    ? 'Wusstest-du-schon-Karten'
    : kind === 'mission'
      ? 'Mitmach-Kompass'
      : kind === 'parent'
        ? 'Eltern-Kompass'
        : kind === 'appendix'
          ? 'Anhangsseite'
          : 'Callis Karten';

  return `
    <figure class="art designed-art ${kind}">
      <div class="wash wash-a"></div>
      <div class="wash wash-b"></div>
      <div class="designed-card">
        ${renderMiniCalli()}
        <div>
          <span class="designed-kicker">${cardTitle}</span>
          <strong>${escapeHtml(page.title)}</strong>
        </div>
      </div>
      <div class="icon-row" aria-hidden="true">
        ${icons.map((icon) => `<span>${escapeHtml(icon)}</span>`).join('')}
      </div>
    </figure>
  `;
}

function parsePages(markdown) {
  const pageRegex = /^## Seite (\d+) - (.+)$/gm;
  const matches = [...markdown.matchAll(pageRegex)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const body = markdown.slice(start, end).trim();
    const textStart = body.indexOf('**Text:**');
    const imageStart = body.indexOf('**Bildidee:**');
    const textRaw = textStart >= 0 && imageStart >= 0
      ? body.slice(textStart + '**Text:**'.length, imageStart).trim()
      : body.trim();
    const imageIdeaRaw = imageStart >= 0
      ? body.slice(imageStart + '**Bildidee:**'.length).trim()
      : '';
    const imageIdea = imageIdeaRaw.replace(/\s*---\s*$/g, '').trim();
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      text: textRaw.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean),
      imageIdea: imageIdea.replace(/\n+/g, ' ').trim(),
    };
  });
}

function renderPage(page, options = {}) {
  const imageMap = options.imageMap || printImageMap;
  const image = imageMap.get(page.number);
  const displayNumber = options.displayNumber ?? page.number;
  const accent = chapterAccent(page.number);
  const isCertificate = page.number === 60;
  const isCover = page.number === 1;
  const kind = pageKind(page);
  const copyLength = page.text.join(' ').length;
  const hasImage = Boolean(image);
  const isShortCopy = !isCover && !isCertificate && page.text.length <= 7 && copyLength < 560;
  const isLongCopy = !isCover && !isCertificate && (page.text.length > 12 || copyLength > 900);
  const pageClass = ['book-page', accent, kind === 'certificate' ? '' : `${kind}-page`, isCover ? 'cover-page' : '', isCertificate ? 'certificate-page' : '', !hasImage && !isCertificate ? 'no-image-page' : '', isShortCopy ? 'short-copy-page' : '', isLongCopy ? 'long-copy-page' : '']
    .filter(Boolean)
    .join(' ');

  const art = image
    ? `<figure class="art"><img src="${image}" alt="${escapeHtml(page.imageIdea || page.title)}"></figure>`
    : renderDesignedArt(page, kind);

  const text = page.text.map((paragraph) => `<p>${inlineMarkdown(paragraph)}</p>`).join('\n');

  if (isCertificate) {
    return `
      <section class="${pageClass}" id="seite-${page.number}">
        <div class="certificate-cut">Ausschneide-Urkunde</div>
        <div class="certificate">
          <p class="cert-brand">CALLIDUS KIDS · CALLIS GESUNDHEITS-KOMPASS</p>
          <h2>URKUNDE</h2>
          <p>für einen echten <strong>Signal-Helden</strong> / eine echte <strong>Signal-Heldin</strong></p>
          <div class="cert-name">(Dein Name)</div>
          <p>hat gelernt, die Zeichen seines Körpers zu hören:</p>
          <p>vom morgendlichen <strong>KNURR</strong> bis zum großen Gähnen –</p>
          <p>und weiß jetzt: <em>Der Körper redet. Helden hören zu.</em></p>
          <div class="cert-calli">${renderMiniCalli()}</div>
          <div class="cert-signatures">
            <span>Datum</span>
            <span>Calli, dein Kompass</span>
          </div>
        </div>
        <footer>Seite ${displayNumber}</footer>
      </section>
    `;
  }

  return `
    <section class="${pageClass}" id="seite-${page.number}">
      ${art}
      <article class="copy">
        <p class="page-kicker">Seite ${displayNumber}</p>
        <h2>${escapeHtml(page.title)}</h2>
        ${text}
      </article>
      <footer>${displayNumber}</footer>
    </section>
  `;
}

const manuscript = await readFile(manuscriptPath, 'utf8');
const pages = parsePages(manuscript);

function renderBookHtml(bookPages, options = {}) {
  const usedImagePages = bookPages.filter((page) => printImageMap.has(page.number));
  const designedPages = bookPages.filter((page) => !printImageMap.has(page.number) && page.number !== 60);
  const coverImage = printImageMap.get(1);
  const title = options.title || 'Callis Gesundheits-Kompass · Band 1 · private Arbeitsfassung';
  const summaryTitle = options.summaryTitle || 'Band 1 als private Arbeitsfassung';
  const summaryText = options.summaryText || 'Diese Ansicht zeigt die vollständige private Arbeitsfassung mit gesetztem Text, PNG-Originalbildern, gestalteten Info- und Mitmachseiten sowie der Ausschneide-Urkunde.';
  const renderOptions = (page) => ({
    imageMap: printImageMap,
    displayNumber: options.renumberInterior ? page.number - 1 : page.number,
  });

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --paper: #fffaf0;
    --cream: #f7f4e8;
    --ink: #223026;
    --muted: #60705d;
    --mint: #3f7f5a;
    --blue: #436f7a;
    --gold: #b09a58;
    --coral: #a7604f;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e8e1cd; color: var(--ink); font-family: Georgia, "Times New Roman", serif; }
  .toolbar { position: sticky; top: 0; z-index: 5; background: rgba(34,48,38,.93); color: #fffaf0; padding: 12px 18px; font-family: "Trebuchet MS", Arial, sans-serif; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .toolbar a { color: #fff4c8; text-decoration: none; font-weight: 700; }
  .wrap { width: min(100%, 980px); margin: 0 auto; padding: 24px; }
  .summary { background: #fffaf0; border: 1px solid rgba(34,48,38,.18); border-radius: 8px; padding: 18px 22px; margin-bottom: 24px; box-shadow: 0 15px 40px rgba(34,48,38,.14); }
  .summary h1 { margin: 0 0 8px; font-family: "Trebuchet MS", Arial, sans-serif; font-size: 30px; color: var(--mint); }
  .summary p { margin: 0 0 8px; line-height: 1.55; }
  .book-page { min-height: 940px; background: var(--paper); border: 1px solid rgba(34,48,38,.16); border-radius: 8px; overflow: hidden; margin: 0 0 26px; box-shadow: 0 24px 60px rgba(34,48,38,.18); position: relative; page-break-after: always; }
  .art { height: 430px; margin: 0; background: var(--cream); border-bottom: 5px solid var(--mint); overflow: hidden; }
  .art img { width: 100%; height: 100%; object-fit: contain; object-position: center; display: block; padding: 6px; background: #fffaf0; }
  .art.designed-art { display: grid; place-items: center; align-content: center; gap: 18px; padding: 34px; position: relative; isolation: isolate; background:
    radial-gradient(circle at 20% 25%, rgba(176,154,88,.18), transparent 28%),
    radial-gradient(circle at 78% 30%, rgba(67,111,122,.16), transparent 24%),
    linear-gradient(145deg, #fffaf0, #efe9d8); }
  .wash { position: absolute; border-radius: 999px; filter: blur(.2px); opacity: .56; z-index: -1; }
  .wash-a { width: 220px; height: 160px; background: rgba(63,127,90,.16); left: 10%; top: 18%; transform: rotate(-10deg); }
  .wash-b { width: 250px; height: 180px; background: rgba(176,154,88,.16); right: 9%; bottom: 10%; transform: rotate(12deg); }
  .designed-card { width: min(620px, 92%); min-height: 120px; display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 18px; padding: 20px 24px; border: 1px solid rgba(34,48,38,.16); border-radius: 8px; background: rgba(255,250,240,.82); box-shadow: 0 16px 36px rgba(34,48,38,.10); }
  .designed-card strong { display: block; color: var(--ink); font-family: "Trebuchet MS", Arial, sans-serif; font-size: 28px; line-height: 1.08; }
  .designed-kicker { display: block; color: var(--gold); font-family: "Trebuchet MS", Arial, sans-serif; text-transform: uppercase; letter-spacing: 0; font-size: 11px; font-weight: 800; margin-bottom: 6px; }
  .mini-calli { width: 78px; height: 78px; display: block; filter: drop-shadow(0 6px 8px rgba(34,48,38,.12)); }
  .designed-card .mini-calli { align-self: center; justify-self: center; }
  .icon-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .icon-row span { min-width: 70px; padding: 8px 10px; border-radius: 999px; background: rgba(255,250,240,.76); border: 1px solid rgba(34,48,38,.13); color: var(--blue); font-family: "Trebuchet MS", Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0; text-align: center; }
  .copy { position: relative; overflow: hidden; padding: 28px 44px 54px; }
  .no-image-page .copy { background:
    radial-gradient(circle at 88% 72%, rgba(176,154,88,.10), transparent 24%),
    radial-gradient(circle at 12% 86%, rgba(63,127,90,.08), transparent 20%); }
  .no-image-page .copy::after { content: ""; position: absolute; right: 38px; bottom: 34px; width: 92px; height: 92px; border: 3px double rgba(176,154,88,.18); border-radius: 50%; background:
    linear-gradient(90deg, transparent 48%, rgba(67,111,122,.12) 49%, rgba(67,111,122,.12) 51%, transparent 52%),
    linear-gradient(0deg, transparent 48%, rgba(67,111,122,.12) 49%, rgba(67,111,122,.12) 51%, transparent 52%);
    pointer-events: none; }
  .page-kicker { margin: 0 0 8px; color: var(--gold); font-family: "Trebuchet MS", Arial, sans-serif; text-transform: uppercase; letter-spacing: 0; font-size: 12px; font-weight: 800; }
  h2 { margin: 0 0 16px; color: var(--ink); font-family: "Trebuchet MS", Arial, sans-serif; font-size: 30px; line-height: 1.06; }
  p { font-size: 17px; line-height: 1.48; margin: 0 0 9px; }
  footer { position: absolute; right: 20px; bottom: 14px; color: rgba(34,48,38,.55); font-family: "Trebuchet MS", Arial, sans-serif; font-size: 13px; }
  .blue .art { border-bottom-color: var(--blue); }
  .gold .art { border-bottom-color: var(--gold); }
  .coral .art { border-bottom-color: var(--coral); }
  .quiet .art { border-bottom-color: rgba(34,48,38,.25); }
  .cover-page { min-height: 940px; display: flex; flex-direction: column; justify-content: flex-end; color: #fffaf0; background: linear-gradient(180deg, rgba(255,250,240,.04), rgba(34,48,38,.48)), url('${coverImage}') center / cover; }
  .cover-page .art { display: none; }
  .cover-page .copy { padding: 58px; background: linear-gradient(180deg, transparent, rgba(34,48,38,.65)); }
  .cover-page h2 { color: #fffaf0; font-size: 54px; max-width: 620px; }
  .cover-page p { max-width: 670px; color: rgba(255,250,240,.9); }
  .fact-page .art, .mission-page .art, .parent-page .art, .appendix-page .art, .intro-page .art { height: 340px; }
  .short-copy-page .art { height: 470px; }
  .short-copy-page .art.designed-art { height: 390px; }
  .long-copy-page .art { height: 390px; }
  .parent-page .copy, .appendix-page .copy { padding-top: 24px; }
  .parent-page p, .appendix-page p { font-size: 16px; line-height: 1.44; }
  .certificate-page { min-height: 760px; display: grid; place-items: center; padding: 46px; background: #fffaf0; }
  .certificate-cut { position: absolute; top: 14px; left: 18px; color: var(--muted); font-family: "Trebuchet MS", Arial, sans-serif; font-size: 12px; letter-spacing: 0; text-transform: uppercase; }
  .certificate { width: 100%; min-height: 520px; border: 6px double var(--gold); border-radius: 12px; padding: 46px 54px; text-align: center; background: #fffdf6; }
  .cert-brand { font-family: "Trebuchet MS", Arial, sans-serif; text-transform: uppercase; letter-spacing: 0; color: var(--gold); font-size: 12px; margin-bottom: 12px; }
  .certificate h2 { color: var(--mint); text-transform: uppercase; font-size: 44px; margin-bottom: 12px; }
  .cert-name { width: 55%; margin: 28px auto; padding-bottom: 8px; border-bottom: 2px dotted rgba(96,112,93,.58); font-size: 24px; color: rgba(96,112,93,.42); }
  .cert-calli { display: flex; justify-content: center; margin: 18px 0 -22px; }
  .cert-calli .mini-calli { width: 68px; height: 68px; }
  .cert-signatures { display: flex; justify-content: space-between; margin-top: 62px; text-align: left; color: var(--muted); }
  @media print {
    @page { size: 8.5in 11in; margin: 0; }
    body { background: #fff; }
    .toolbar, .summary { display: none; }
    .wrap { width: 8.5in; padding: 0; margin: 0; }
    .book-page { width: 8.5in; height: 11in; min-height: auto; margin: 0; border: 0; border-radius: 0; box-shadow: none; break-after: page; page-break-after: always; overflow: hidden; }
    .art { height: 4.75in; }
    .fact-page .art, .mission-page .art, .parent-page .art, .appendix-page .art, .intro-page .art { height: 3.75in; }
    .short-copy-page .art { height: 5.1in; }
    .short-copy-page .art.designed-art { height: 4.25in; }
    .long-copy-page .art { height: 4.25in; }
    .copy { padding: .32in .58in .56in; }
    h2 { font-size: 24pt; }
    p { font-size: 12.7pt; line-height: 1.38; margin-bottom: 5.5pt; }
    .parent-page p, .appendix-page p { font-size: 11.8pt; line-height: 1.34; }
    footer { bottom: .18in; right: .32in; }
  }
</style>
</head>
<body>
  <nav class="toolbar">
    <span>Callis Gesundheits-Kompass · private Arbeitsfassung mit ${usedImagePages.length} Aquarell-Bildseiten</span>
    <a href="#seite-60">Zur Urkunde</a>
  </nav>
  <main class="wrap">
    <section class="summary">
      <h1>${escapeHtml(summaryTitle)}</h1>
      <p>${escapeHtml(summaryText)}</p>
      <p><strong>Status:</strong> ${usedImagePages.length} Seiten nutzen Aquarellbilder, ${designedPages.length} Seiten sind bewusst als Layout-/Infoseiten gestaltet. Es gibt keine Platzhalter mehr.</p>
    </section>
    ${bookPages.map((page) => renderPage(page, renderOptions(page))).join('\n')}
  </main>
</body>
</html>`;
}

const workingHtml = renderBookHtml(pages);
const kdpInteriorPages = pages.filter((page) => page.number !== 1);
const kdpInteriorHtml = renderBookHtml(kdpInteriorPages, {
  title: 'Callis Gesundheits-Kompass · Band 1 · KDP-Inhalt',
  summaryTitle: 'KDP-Inhalt ohne Coverseite',
  summaryText: 'Diese private Datei ist fuer den Paperback-Innenteil gedacht. Das Cover wird bei KDP separat hochgeladen; deshalb beginnt die Innenpaginierung hier ohne Cover.',
  renumberInterior: true,
});

const usedImagePages = pages.filter((page) => printImageMap.has(page.number));
const designedPages = pages.filter((page) => !printImageMap.has(page.number) && page.number !== 60);

const reportRows = pages.map((page) => {
  const image = printImageMap.get(page.number);
  const status = page.number === 60
    ? 'Urkunde als Ausschneideseite gesetzt'
    : image
      ? 'PNG-Originalbild eingesetzt'
      : 'gestaltete Layout-/Info-Seite ohne separaten Bildbedarf';
  return `| ${page.number} | ${page.title} | ${status} | ${image || pageKind(page)} |`;
});

const report = `# Illustrationsplanung: Callis Gesundheits-Kompass Band 1

Stand: 2026-07-05

Diese Datei zeigt, welche Seiten in der finalen Arbeitsfassung ein Aquarellbild verwenden und welche Seiten bewusst als gestaltete Layout-/Info-Seiten gesetzt sind.

- Aquarell-Bildseiten: ${usedImagePages.length}
- Gestaltete Layout-/Info-Seiten: ${designedPages.length}
- Platzhalter: 0
- Empfehlung vor Druck: letzte Textkorrektur, fachliche Pruefung, KDP-Probedruck und Bildpruefung in finaler Druckgroesse.

| Seite | Titel | Status | Asset oder Bildidee |
| --- | --- | --- | --- |
${reportRows.join('\n')}
`;

await mkdir(privateDir, { recursive: true });
await writeFile(workingOutPath, workingHtml, 'utf8');
await writeFile(kdpInteriorOutPath, kdpInteriorHtml, 'utf8');
await writeFile(reportPath, report, 'utf8');

console.log(`Wrote ${workingOutPath}`);
console.log(`Wrote ${kdpInteriorOutPath}`);
console.log(`Wrote ${reportPath}`);
