#!/usr/bin/env node
// Legt die drei Webhooks an, die die VAL-Einloesung im Shop braucht, und prueft
// nebenbei, ob die App die noetigen Scopes hat.
//
// Dev-Dashboard-Apps haben keinen statischen Admin-Token: Client-ID und Secret
// werden gegen einen 24-h-Token getauscht. Beide Werte stehen im Dev Dashboard
// unter Einstellungen -> Anmeldedaten.
//
// Aufruf (das Secret wird abgefragt, damit es nicht im Befehlsverlauf landet):
//   node scripts/shopify-webhooks-setup.mjs
//
// Nur pruefen, nichts anlegen:
//   node scripts/shopify-webhooks-setup.mjs --dry-run

import readline from 'node:readline';

const SHOP = 'ywg7pa-bq.myshopify.com';
const API_VERSION = '2026-01';
const CALLBACK_URL = 'https://us-central1-nexus-app-61494.cloudfunctions.net/shopifyOrderWebhook';
const TOPICS = ['ORDERS_PAID', 'REFUNDS_CREATE', 'ORDERS_CANCELLED'];

// Die Client-ID ist nicht geheim und fest hinterlegt; nur das Secret wird erfragt.
const DEFAULT_CLIENT_ID = '6f4195a55a70f5be7abb91f71461d9c2';

const clientId = process.env.SHOPIFY_CLIENT_ID || DEFAULT_CLIENT_ID;
const dryRun = process.argv.includes('--dry-run');
let clientSecret = process.env.SHOPIFY_CLIENT_SECRET || '';

// Eingabe wird als Sternchen dargestellt, damit das Secret nicht sichtbar bleibt.
function askSecret(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('Kein interaktives Terminal — SHOPIFY_CLIENT_SECRET als Umgebungsvariable setzen.'));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (text) => {
      if (muted) rl.output.write('*');
      else rl.output.write(text);
    };
    rl.question(question, (value) => {
      rl.close();
      process.stdout.write('\n');
      resolve(value.trim());
    });
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
    // Bei falschen Credentials antwortet Shopify mit einer HTML-Fehlerseite.
    throw new Error(
      `Token-Endpunkt lieferte HTTP ${response.status} statt JSON — ` +
      'Client-ID oder Secret sind vermutlich falsch.',
    );
  }
  if (!payload.access_token) {
    const detail = payload.error_description || payload.error || `HTTP ${response.status}`;
    if (String(detail).includes('shop_not_permitted')) {
      throw new Error(
        'shop_not_permitted — App und Shop gehoeren nicht zur selben Organisation im Dev Dashboard, ' +
        'oder die App ist auf diesem Shop nicht installiert.',
      );
    }
    throw new Error(`Kein Token erhalten: ${detail}`);
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
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }
  return payload.data;
}

// Shopify listet Scopes normalisiert auf: write_discounts schliesst read_discounts
// ein, ohne es einzeln aufzufuehren. Statt die Scope-Liste zu interpretieren,
// wird der Rabatt-Lesezugriff direkt ausprobiert.
const PROBE_DISCOUNTS = `
  query ProbeDiscountRead {
    discountNodes(first: 1) {
      nodes { id }
    }
  }
`;

const LIST = `
  query ExistingWebhooks {
    webhookSubscriptions(first: 50) {
      nodes { id topic uri }
    }
  }
`;

const CREATE = `
  mutation SubscribeWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription { id topic }
      userErrors { field message }
    }
  }
`;

async function main() {
  console.log(`Shop:     ${SHOP}`);
  console.log(`Ziel-URL: ${CALLBACK_URL}`);
  if (dryRun) console.log('Modus:    Testlauf, es wird nichts angelegt.');
  console.log('');

  if (!clientSecret) {
    clientSecret = await askSecret('Client-Secret aus dem Dev Dashboard einfuegen: ');
  }
  if (!clientSecret) {
    throw new Error('Kein Secret eingegeben.');
  }

  const { token, scopes } = await getAccessToken();
  console.log(`Token geholt. Freigegebene Scopes: ${scopes.join(', ') || '(keine)'}`);

  try {
    await callAdmin(token, PROBE_DISCOUNTS);
    console.log('Rabatt-Zugriff funktioniert.\n');
  } catch (error) {
    console.error(`\nRabatte lassen sich nicht lesen: ${error.message}`);
    console.error('Im Dev Dashboard eine Version mit read_orders,read_discounts,write_discounts');
    console.error('veroeffentlichen und die App danach erneut auf dem Shop installieren.');
    process.exitCode = 1;
    return;
  }

  const existing = (await callAdmin(token, LIST)).webhookSubscriptions.nodes;
  const alreadySet = new Set(existing.filter((n) => n.uri === CALLBACK_URL).map((n) => n.topic));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const topic of TOPICS) {
    if (alreadySet.has(topic)) {
      console.log(`  = ${topic} — existiert bereits`);
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(`  + ${topic} — wuerde angelegt`);
      created += 1;
      continue;
    }
    const data = await callAdmin(token, CREATE, {
      topic,
      webhookSubscription: { callbackUrl: CALLBACK_URL, format: 'JSON' },
    });
    const errors = data.webhookSubscriptionCreate.userErrors;
    if (errors.length) {
      console.error(`  ! ${topic} — ${errors.map((e) => e.message).join('; ')}`);
      failed += 1;
      continue;
    }
    console.log(`  + ${topic} — angelegt`);
    created += 1;
  }

  console.log(`\nFertig: ${created} angelegt, ${skipped} bereits vorhanden, ${failed} fehlgeschlagen.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\nFehlgeschlagen: ${error.message}`);
  process.exitCode = 1;
});
