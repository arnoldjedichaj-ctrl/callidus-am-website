#!/usr/bin/env node
/**
 * Listet alle Top-Level-Collections im verbundenen Firebase-Projekt
 * mit Anzahl Dokumente und Beispielfeldern.
 */
import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';

const sa = JSON.parse(readFileSync('firebase-service-account.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

console.log('Projekt:', sa.project_id);
const cols = await db.listCollections();
console.log('Top-Level Collections:');
for (const c of cols) {
  const snap = await c.limit(1).get();
  let count = '?';
  try {
    count = (await c.count().get()).data().count;
  } catch (_) {}
  console.log(`  - ${c.id} (${count} Dokumente)`);
  if (snap.size > 0) {
    const d = snap.docs[0];
    console.log(`    Beispiel-Doc: ${d.id}`);
    console.log(`    Felder: ${Object.keys(d.data()).join(', ')}`);
    // imageUrl-aehnliche Felder zeigen
    const data = d.data();
    for (const [key, value] of Object.entries(data)) {
      if (/image|photo|picture|url|cover/i.test(key) && typeof value === 'string') {
        console.log(`    ${key}: ${value.slice(0, 100)}`);
      }
    }
  }
}
process.exit(0);
