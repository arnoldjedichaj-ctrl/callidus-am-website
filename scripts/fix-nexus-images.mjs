#!/usr/bin/env node
/**
 * Aktualisiert das imageUrl-Feld aller Artikel in der NEXUS-Firebase auf die
 * neuen, dauerhaften Bilder unter https://www.callidus-am.de/assets/original/...
 *
 * Wie das Matching funktioniert:
 *  - Die alte URL hat die Form
 *      https://www.callidus-am.de/wp-content/uploads/go-x/u/<GUID>/.../image.png
 *  - Die lokal gesicherten Bilder unter public/assets/original/ enthalten dieselbe
 *    GUID im Dateinamen (Format 001-wp-content-uploads-go-x-u-<GUID>-image-...png).
 *  - Pro Artikel wird die GUID extrahiert und das passende lokale Bild gesucht.
 *
 * Voraussetzung:
 *  - nexus-service-account.json im Projekt-Root (per .gitignore geschuetzt)
 *
 * Modi:
 *  --dry-run  Nur anzeigen, was geaendert wuerde, ohne Schreibzugriff
 *  --write    Tatsaechlich in Firestore schreiben (Default ist dry-run)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const saPath = resolve(projectRoot, 'nexus-service-account.json');
const assetsDir = resolve(projectRoot, 'public/assets/original');

const args = new Set(process.argv.slice(2));
const writeMode = args.has('--write');

if (!existsSync(saPath)) {
  console.error('\n[fix-nexus-images] nexus-service-account.json fehlt im Projekt-Root.');
  console.error('Bitte aus der NEXUS-Firebase-Konsole exportieren (Dienstkonten >');
  console.error('"Neuen privaten Schluessel generieren") und als nexus-service-account.json');
  console.error('im Projekt-Root ablegen.\n');
  process.exit(1);
}

if (!existsSync(assetsDir)) {
  console.error(`[fix-nexus-images] Assets-Ordner nicht gefunden: ${assetsDir}`);
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));
console.log(`[fix-nexus-images] Verbinde mit Firebase-Projekt: ${sa.project_id}`);
console.log(`[fix-nexus-images] Modus: ${writeMode ? 'WRITE (Updates werden gespeichert)' : 'DRY-RUN (nur Vorschau)'}`);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

// GUID-Pattern: 8-4-4-4-12 Hex-Zeichen
const GUID_RE = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

// Index aller lokalen Bilder, gruppiert nach GUID
const files = readdirSync(assetsDir).filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
const filesByGuid = new Map();
for (const file of files) {
  const m = file.match(GUID_RE);
  if (!m) continue;
  const guid = m[0].toLowerCase();
  if (!filesByGuid.has(guid)) filesByGuid.set(guid, []);
  filesByGuid.get(guid).push(file);
}
console.log(`[fix-nexus-images] ${files.length} lokale Bilder indexiert, ${filesByGuid.size} eindeutige GUIDs.`);

const NEW_BASE = 'https://www.callidus-am.de/assets/original/';

function buildNewUrl(file) {
  return NEW_BASE + encodeURIComponent(file).replace(/%2F/g, '/');
}

function pickFile(candidates) {
  // Bevorzuge groesste Variante (Datei mit hoechster Aufloesung im Namen)
  return candidates.slice().sort((a, b) => {
    const sizeOf = (n) => {
      const m = n.match(/(\d+)x(\d+)/);
      return m ? Number(m[1]) * Number(m[2]) : 0;
    };
    return sizeOf(b) - sizeOf(a);
  })[0];
}

async function main() {
  const snap = await db.collection('articles').get();
  console.log(`[fix-nexus-images] ${snap.size} NEXUS-Artikel geladen.\n`);

  const updates = [];
  const misses = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const title = (data.title && (data.title.de || data.title.en)) || data.id || doc.id;
    const oldUrl = data.imageUrl || '';
    const m = oldUrl.match(GUID_RE);
    if (!m) {
      misses.push({ doc: doc.id, title, oldUrl, reason: 'keine GUID in imageUrl' });
      continue;
    }
    const guid = m[0].toLowerCase();
    const candidates = filesByGuid.get(guid);
    if (!candidates || candidates.length === 0) {
      misses.push({ doc: doc.id, title, oldUrl, reason: `keine lokale Datei fuer GUID ${guid}` });
      continue;
    }
    const file = pickFile(candidates);
    const newUrl = buildNewUrl(file);
    if (newUrl === oldUrl) {
      console.log(`= ${doc.id}: bereits aktuell`);
      continue;
    }
    updates.push({ doc: doc.id, title, oldUrl, newUrl, file });
  }

  // Vorschau
  console.log('\n=== UPDATES (' + updates.length + ') ===');
  for (const u of updates) {
    console.log(`• ${u.doc} | ${u.title.slice(0, 60)}`);
    console.log(`    alt: ${u.oldUrl.slice(0, 90)}`);
    console.log(`    neu: ${u.newUrl}`);
  }
  if (misses.length > 0) {
    console.log('\n=== KEIN MATCH (' + misses.length + ') ===');
    for (const m of misses) {
      console.log(`• ${m.doc} | ${m.title.slice(0, 60)}`);
      console.log(`    Grund: ${m.reason}`);
      console.log(`    alt:   ${m.oldUrl.slice(0, 120)}`);
    }
  }

  // Schreiben
  if (writeMode && updates.length > 0) {
    console.log(`\n[fix-nexus-images] Schreibe ${updates.length} Updates in Firestore...`);
    let batch = db.batch();
    let batchCount = 0;
    for (const u of updates) {
      batch.update(db.collection('articles').doc(u.doc), { imageUrl: u.newUrl });
      batchCount += 1;
      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`[fix-nexus-images] ${updates.length} Artikel aktualisiert.`);
  } else if (!writeMode && updates.length > 0) {
    console.log('\n[fix-nexus-images] Dry-run. Mit --write tatsaechlich speichern.');
  } else {
    console.log('\n[fix-nexus-images] Nichts zu aktualisieren.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[fix-nexus-images] Fehler:', err);
    process.exit(1);
  });
