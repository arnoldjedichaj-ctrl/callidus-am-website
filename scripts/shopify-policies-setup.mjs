#!/usr/bin/env node
// Uebertraegt Impressum, Widerruf, AGB und Versandinfos aus src/data/legal-pages.json
// in die Shopify-Rechtsseiten. Die Versandseite wird aus den echten Tarifen im Shop
// erzeugt, damit Text und Einstellung nicht auseinanderlaufen.
//
// Voraussetzung: Die App braucht zusaetzlich den Scope write_legal_policies.
//
// Aufruf:
//   node scripts/shopify-policies-setup.mjs            (Secret wird abgefragt)
//   node scripts/shopify-policies-setup.mjs --dry-run  (nur anzeigen)

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const SHOP = 'ywg7pa-bq.myshopify.com';
const API_VERSION = '2026-01';
const DEFAULT_CLIENT_ID = '6f4195a55a70f5be7abb91f71461d9c2';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const dryRun = process.argv.includes('--dry-run');
const clientId = process.env.SHOPIFY_CLIENT_ID || DEFAULT_CLIENT_ID;
let clientSecret = process.env.SHOPIFY_CLIENT_SECRET || '';

const POLICY_BY_SLUG = {
  impressum: 'LEGAL_NOTICE',
  widerruf: 'REFUND_POLICY',
  agb: 'TERMS_OF_SERVICE',
  datenschutz: 'PRIVACY_POLICY',
};

// Fallback, falls der Scope read_shipping fehlt und die Tarife nicht gelesen
// werden koennen. Beim Aendern der Versandeinstellungen hier mitziehen.
const SHIPPING_FALLBACK = {
  deStandard: '3.90',
  deExpress: '9.99',
  deFreeFrom: '35.00',
  euStandard: '13.99',
};

function askSecret(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('Kein interaktives Terminal — SHOPIFY_CLIENT_SECRET als Umgebungsvariable setzen.'));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (text) => { if (muted) rl.output.write('*'); else rl.output.write(text); };
    rl.question(question, (value) => { rl.close(); process.stdout.write('\n'); resolve(value.trim()); });
    muted = true;
  });
}

async function getAccessToken() {
  const response = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`Token-Endpunkt lieferte HTTP ${response.status} statt JSON — Client-ID oder Secret sind vermutlich falsch.`);
  }
  if (!payload.access_token) {
    throw new Error(`Kein Token erhalten: ${payload.error_description || payload.error || `HTTP ${response.status}`}`);
  }
  return { token: payload.access_token, scopes: String(payload.scope || '').split(',').filter(Boolean) };
}

async function callAdmin(token, query, variables = {}) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`Unerwartete Antwort (HTTP ${response.status}): ${raw.slice(0, 200)}`);
  }
  if (payload.errors?.length) throw new Error(payload.errors.map((e) => e.message).join('; '));
  return payload.data;
}

const SET_POLICY = `
  mutation SetPolicy($shopPolicy: ShopPolicyInput!) {
    shopPolicyUpdate(shopPolicy: $shopPolicy) {
      shopPolicy { type url }
      userErrors { field message }
    }
  }
`;

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Erlaubte Inline-Auszeichnungen aus den Quelltexten wieder aktivieren und
// interne Links absolut machen, damit sie aus Shopify heraus funktionieren.
const restoreMarkup = (html) => html
  .replace(/&lt;(\/?(?:strong|em|b|i|a|br|ul|ol|li)\b[^&]*?)&gt;/g, '<$1>')
  .replace(/href="\/([^"]*)"/g, 'href="https://www.callidus-am.de/$1"');

// Die Datenschutzerklaerung deckt Website, Apps und Shop gemeinsam ab. Ohne
// Wegweiser muesste ein Shop-Kunde 20 Abschnitte zu App-Themen durchlesen,
// bevor er zur Bestellabwicklung kommt.
const PRIVACY_INTRO = '<p><strong>Hinweis für Kundinnen und Kunden des Onlineshops:</strong> '
  + 'Diese Datenschutzerklärung gilt gemeinsam für unsere Website, unsere Apps und diesen Onlineshop. '
  + 'Die für Ihre Bestellung maßgeblichen Abschnitte sind „Onlineshop und Bestellabwicklung (Shopify)“, '
  + '„Zahlungsabwicklung“ sowie „Versand und Fulfillment“ am Ende dieser Seite. '
  + 'Ihre Rechte als betroffene Person finden Sie im Abschnitt „Speicherdauer, Ihre Rechte und Kontolöschung“.</p>\n';

function renderLegalPage(page) {
  let html = '';
  if (page.slug === 'datenschutz') html += PRIVACY_INTRO;
  if (page.lead) html += `<p>${escapeHtml(page.lead)}</p>\n`;
  for (const section of page.sections || []) {
    if (section.heading) html += `<h2>${escapeHtml(section.heading)}</h2>\n`;
    for (const paragraph of section.paragraphs || []) html += `<p>${escapeHtml(paragraph)}</p>\n`;
  }
  return restoreMarkup(html);
}

const money = (amount) => `${Number(amount).toFixed(2).replace('.', ',')} €`;

// Baut die Versandseite aus den tatsaechlich hinterlegten Tarifen.
function renderShippingPolicy(zones) {
  // Vorsicht bei der Zonensuche: "deutschland" enthaelt die Zeichenfolge "eu",
  // ein naiver includes('eu') liefert deshalb die falsche Zone.
  const de = zones.find((z) => /deutschland|germany/i.test(z.name));
  const eu = zones.find((z) => z !== de && /^eu\b|europ/i.test(z.name));

  const rate = (zone, name) => zone?.methods.find((m) => m.name === name && !m.freeFrom);
  const freeFrom = de?.methods.find((m) => m.freeFrom)?.freeFrom;

  const deStandard = rate(de, 'Standard');
  const deExpress = rate(de, 'Express');
  const euStandard = eu?.methods.find((m) => !m.freeFrom);

  let html = '<p>Versandkosten, Lieferzeiten und Liefergebiete für Bestellungen im Callidus A&amp;M Onlineshop.</p>\n';

  html += '<h2>Versandkosten und Lieferzeiten innerhalb Deutschlands</h2>\n';
  if (deStandard) html += `<p>Standardversand: ${money(deStandard.price)} pro Bestellung. Voraussichtliche Lieferzeit 2 bis 4 Werktage nach Zahlungseingang.</p>\n`;
  if (deExpress) html += `<p>Expressversand: ${money(deExpress.price)} pro Bestellung. Voraussichtliche Lieferzeit 1 bis 2 Werktage nach Zahlungseingang.</p>\n`;
  if (freeFrom) html += `<p>Ab einem Bestellwert von ${money(freeFrom)} liefern wir innerhalb Deutschlands versandkostenfrei. Maßgeblich ist der Bestellwert nach Abzug etwaiger Rabatte und Gutscheine.</p>\n`;

  if (euStandard) {
    html += '<h2>Versandkosten und Lieferzeiten innerhalb der EU</h2>\n';
    html += `<p>Standardversand International: ${money(euStandard.price)} pro Bestellung. Voraussichtliche Lieferzeit 2 bis 5 Werktage nach Zahlungseingang.</p>\n`;
    html += '<p>Wir liefern in das EU-Festland sowie nach Irland. Eine Lieferung auf Inseln außerhalb des Festlands ist derzeit nicht möglich.</p>\n';
  }

  html += '<h2>Liefergebiet</h2>\n';
  html += '<p>Wir versenden ausschließlich innerhalb Deutschlands und der Europäischen Union. Eine Lieferung in Länder außerhalb der EU ist derzeit nicht möglich.</p>\n';

  html += '<h2>Versand und Verpackung</h2>\n';
  html += '<p>Der Versand erfolgt aus Deutschland über DHL oder UPS. Sobald Ihre Sendung das Lager verlassen hat, erhalten Sie eine Versandbestätigung per E-Mail mit den Sendungsverfolgungsdaten.</p>\n';
  html += '<p>Alle angegebenen Lieferzeiten sind voraussichtliche Zeiträume und beginnen mit dem Tag nach Zahlungseingang. Sie stellen keine verbindliche Zusage dar.</p>\n';

  html += '<h2>Preisangaben</h2>\n';
  html += '<p>Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen. Alle Preise verstehen sich zuzüglich der oben genannten Versandkosten.</p>\n';

  html += '<h2>Fragen zu Ihrer Lieferung</h2>\n';
  html += '<p>Bei Fragen zu Versand oder Lieferstatus erreichen Sie uns unter info@callidus-am.de oder telefonisch unter 01797007772.</p>\n';
  html += '<p>Callidus A&amp;M, Inhaber: Arnold Jedich, Gerstenstraße 12, 86356 Neusäß, Deutschland</p>\n';

  return html;
}

const RATES_QUERY = `
  query Rates {
    deliveryProfiles(first: 3) {
      nodes {
        profileLocationGroups {
          locationGroupZones(first: 10) {
            nodes {
              zone { name }
              methodDefinitions(first: 10) {
                nodes {
                  name
                  active
                  rateProvider { ... on DeliveryRateDefinition { price { amount } } }
                  methodConditions { field conditionCriteria { ... on MoneyV2 { amount } } }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Braucht den Scope read_shipping. Fehlt der, wird mit SHIPPING_FALLBACK
// weitergearbeitet — die Werte werden dann im Protokoll ausgewiesen.
async function readZones(token) {
  let data;
  try {
    data = await callAdmin(token, RATES_QUERY);
  } catch (error) {
    if (!/Access denied/i.test(error.message)) throw error;
    console.warn('  ~ Versandtarife nicht lesbar (Scope read_shipping fehlt).');
    console.warn(`  ~ Es werden die hinterlegten Vorgabewerte verwendet: Standard ${SHIPPING_FALLBACK.deStandard} EUR,`);
    console.warn(`  ~ Express ${SHIPPING_FALLBACK.deExpress} EUR, gratis ab ${SHIPPING_FALLBACK.deFreeFrom} EUR, EU ${SHIPPING_FALLBACK.euStandard} EUR.`);
    console.warn('  ~ Bitte gegen die Versandeinstellungen im Shop pruefen.\n');
    return [
      {
        name: 'Deutschland',
        methods: [
          { name: 'Standard', price: SHIPPING_FALLBACK.deStandard, freeFrom: null },
          { name: 'Standard', price: '0', freeFrom: SHIPPING_FALLBACK.deFreeFrom },
          { name: 'Express', price: SHIPPING_FALLBACK.deExpress, freeFrom: null },
        ],
      },
      {
        name: 'EU (Europäische Union)',
        methods: [{ name: 'Standard International', price: SHIPPING_FALLBACK.euStandard, freeFrom: null }],
      },
    ];
  }
  const zones = [];
  for (const profile of data.deliveryProfiles.nodes) {
    for (const group of profile.profileLocationGroups) {
      for (const node of group.locationGroupZones.nodes) {
        zones.push({
          name: node.zone.name,
          methods: node.methodDefinitions.nodes
            .filter((m) => m.active)
            .map((m) => ({
              name: m.name,
              price: m.rateProvider?.price?.amount ?? '0',
              freeFrom: m.methodConditions?.find((c) => c.field === 'TOTAL_PRICE')?.conditionCriteria?.amount || null,
            })),
        });
      }
    }
  }
  return zones;
}

async function main() {
  console.log(`Shop: ${SHOP}`);
  if (dryRun) console.log('Modus: Testlauf, es wird nichts geschrieben.');
  console.log('');

  if (!clientSecret) clientSecret = await askSecret('Client-Secret aus dem Dev Dashboard einfuegen: ');
  if (!clientSecret) throw new Error('Kein Secret eingegeben.');

  const { token, scopes } = await getAccessToken();
  if (!scopes.includes('write_legal_policies')) {
    console.error('Der Scope write_legal_policies fehlt.');
    console.error('Im Dev Dashboard eine Version mit');
    console.error('  read_orders,read_discounts,write_discounts,write_legal_policies');
    console.error('veroeffentlichen und die App danach erneut auf dem Shop installieren.');
    process.exitCode = 1;
    return;
  }

  const legalPages = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/data/legal-pages.json'), 'utf8'));
  const pages = Array.isArray(legalPages) ? legalPages : (legalPages.pages || Object.values(legalPages)[0]);

  const jobs = [];
  for (const [slug, type] of Object.entries(POLICY_BY_SLUG)) {
    const page = pages.find((p) => p.slug === slug);
    if (!page) {
      console.error(`  ! ${slug} — nicht in legal-pages.json gefunden, wird uebersprungen`);
      continue;
    }
    jobs.push({ label: slug, type, body: renderLegalPage(page) });
  }
  jobs.push({ label: 'versand', type: 'SHIPPING_POLICY', body: renderShippingPolicy(await readZones(token)) });

  let written = 0;
  let failed = 0;

  for (const job of jobs) {
    if (dryRun) {
      // Im Testlauf die erzeugten Texte ablegen, damit sie vor dem
      // Veroeffentlichen im Browser gegengelesen werden koennen.
      const previewDir = path.join(repoRoot, 'tmp', 'shopify-policies');
      fs.mkdirSync(previewDir, { recursive: true });
      const file = path.join(previewDir, `${job.label}.html`);
      fs.writeFileSync(file, job.body);
      console.log(`  ~ ${job.label.padEnd(11)} -> ${job.type.padEnd(18)} ${String(job.body.length).padStart(6)} Zeichen  ${path.relative(repoRoot, file)}`);
      continue;
    }
    const data = await callAdmin(token, SET_POLICY, { shopPolicy: { type: job.type, body: job.body } });
    const errors = data.shopPolicyUpdate.userErrors;
    if (errors.length) {
      console.error(`  ! ${job.label} — ${errors.map((e) => e.message).join('; ')}`);
      failed += 1;
      continue;
    }
    console.log(`  + ${job.label.padEnd(10)} -> ${job.type.padEnd(18)} ${job.body.length} Zeichen`);
    written += 1;
  }

  console.log(`\nFertig: ${written} geschrieben, ${failed} fehlgeschlagen.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\nFehlgeschlagen: ${error.message}`);
  process.exitCode = 1;
});
