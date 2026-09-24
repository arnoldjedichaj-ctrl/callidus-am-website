// Kurszugaenge von Hand pflegen – fuer Kaeufe aus der Zeit vor der automatischen
// Freischaltung (vor der IPN-Anbindung) oder fuer Kulanzfaelle.
//
//   node scripts/stress-reset-access.mjs list  <email>
//   node scripts/stress-reset-access.mjs grant <email> <produkt> [bestellnummer]
//   node scripts/stress-reset-access.mjs revoke <dokument-id>
//   node scripts/stress-reset-access.mjs import <datei.csv>
//
// <produkt> ist eine id aus functions/data/stress-reset-course.json: bundle, modul1 ... modul7.
// CSV fuer import: je Zeile  email;produkt;bestellnummer  (Kopfzeile erlaubt, Trenner ; oder ,).
// Zugang: nexus-service-account.json im Projektordner (nie committen).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import admin from 'firebase-admin';

const root = process.cwd();
const course = JSON.parse(readFileSync(join(root, 'functions/data/stress-reset-course.json'), 'utf8'));
const keyFile = process.env.NEXUS_SERVICE_ACCOUNT || join(root, 'nexus-service-account.json');
if (!existsSync(keyFile)) {
  console.error(`Dienstkonto-Datei fehlt: ${keyFile}`);
  process.exit(1);
}
const serviceAccount = JSON.parse(readFileSync(keyFile, 'utf8'));
if (serviceAccount.project_id !== 'nexus-app-61494') {
  console.error(`Falsches Projekt im Dienstkonto (${serviceAccount.project_id}). Erwartet: nexus-app-61494.`);
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const orders = db.collection('course_orders');

const [command, ...rest] = process.argv.slice(2);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function grant(emailInput, productKey, orderIdInput = '') {
  const email = normalizeEmail(emailInput);
  const product = course.products.find((item) => item.id === productKey);
  if (!email.includes('@') || !product) {
    throw new Error(`Ungueltig: "${emailInput}" / "${productKey}". Produkte: ${course.products.map((item) => item.id).join(', ')}`);
  }
  const orderId = String(orderIdInput || '').trim().toUpperCase();
  const docId = `manual-${createHash('sha256').update(`${email}|${product.id}|${orderId}`).digest('hex').slice(0, 20)}`;
  await orders.doc(docId).set({
    course: course.courseId,
    order_id: orderId || docId,
    product_id: product.digistoreProductId || '',
    product_key: product.id,
    modules: product.modules,
    email,
    status: 'paid',
    source: 'manual',
    paid_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`freigeschaltet: ${email} -> ${product.id} (${docId})`);
}

if (command === 'list') {
  const email = normalizeEmail(rest[0]);
  const snap = await orders.where('email', '==', email).get();
  if (snap.empty) console.log(`Keine Kurs-Kaeufe fuer ${email}.`);
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`${doc.id}  ${data.product_key}  ${data.status}  Bestellung ${data.order_id}  Quelle ${data.source}${data.claimed_uid ? `  zugeordnet an ${data.claimed_uid}` : ''}`);
  }
} else if (command === 'grant') {
  await grant(rest[0], rest[1], rest[2]);
} else if (command === 'revoke') {
  await orders.doc(rest[0]).set({ status: 'refunded', refund_event: 'manual', updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(`gesperrt: ${rest[0]}`);
} else if (command === 'import') {
  const lines = readFileSync(rest[0], 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const [email, product, orderId] = line.split(/[;,]/).map((part) => part.trim());
    if (!email.includes('@')) continue; // Kopfzeile
    await grant(email, product, orderId);
  }
} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 11).join('\n'));
}
