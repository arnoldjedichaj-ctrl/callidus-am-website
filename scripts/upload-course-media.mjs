// Laedt Videos und PDFs des Stress-Reset-Kurses in den privaten Kurs-Bucket.
//
//   node scripts/upload-course-media.mjs              # hochladen, was in course-media/stress-reset/ liegt
//   node scripts/upload-course-media.mjs --transcode  # vorher Originale aus course-media/originale/ web-tauglich umwandeln
//   node scripts/upload-course-media.mjs --check      # nur anzeigen, was fehlt
//
// Dateinamen kommen aus functions/data/stress-reset-course.json (z. B. modul-1.mp4).
// Originale fuer --transcode heissen genauso, nur mit beliebiger Endung (modul-1.mov, bonus-zukunftsanker.mp4 ...).
// Zugang: nexus-service-account.json im Projektordner (nie committen).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Storage } from '@google-cloud/storage';

const root = process.cwd();
const course = JSON.parse(readFileSync(join(root, 'functions/data/stress-reset-course.json'), 'utf8'));
const mediaDir = join(root, 'course-media', course.courseId);
const originalsDir = join(root, 'course-media', 'originale');
const keyFile = process.env.NEXUS_SERVICE_ACCOUNT || join(root, 'nexus-service-account.json');
const args = new Set(process.argv.slice(2));

const files = course.modules.flatMap((module) => [module.video, module.pdf].filter(Boolean));
mkdirSync(mediaDir, { recursive: true });

if (args.has('--transcode')) {
  for (const target of files.filter((file) => file.endsWith('.mp4'))) {
    const name = basename(target, '.mp4');
    const output = join(mediaDir, `${name}.mp4`);
    const original = existsSync(originalsDir)
      ? readdirSync(originalsDir).find((file) => basename(file, extname(file)) === name)
      : null;
    if (!original) {
      console.log(`- kein Original fuer ${name} in course-media/originale/`);
      continue;
    }
    console.log(`Wandle ${original} um ...`);
    // 1080p, H.264/AAC, "faststart" damit das Video im Browser sofort startet.
    const result = spawnSync('ffmpeg', [
      '-y', '-i', join(originalsDir, original),
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      output,
    ], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`ffmpeg ist bei ${original} fehlgeschlagen.`);
      process.exit(1);
    }
  }
}

const missing = files.filter((file) => !existsSync(join(mediaDir, basename(file))));
if (missing.length) {
  console.log('\nNoch nicht vorhanden in course-media/stress-reset/:');
  for (const file of missing) console.log(`  - ${basename(file)}`);
}
if (args.has('--check')) process.exit(0);

if (!existsSync(keyFile)) {
  console.error(`\nDienstkonto-Datei fehlt: ${keyFile}`);
  process.exit(1);
}
const projectId = JSON.parse(readFileSync(keyFile, 'utf8')).project_id;
if (projectId !== 'nexus-app-61494') {
  console.error(`\nFalsches Projekt im Dienstkonto (${projectId}). Erwartet: nexus-app-61494.`);
  process.exit(1);
}

const storage = new Storage({ keyFilename: keyFile, projectId });
const bucket = storage.bucket(course.bucket);
const [bucketExists] = await bucket.exists();
if (!bucketExists) {
  try {
    await storage.createBucket(course.bucket, {
      location: 'EUROPE-WEST3',
      iamConfiguration: {
        uniformBucketLevelAccess: { enabled: true },
        publicAccessPrevention: 'enforced',
      },
    });
    console.log(`\nPrivaten Bucket ${course.bucket} angelegt.`);
  } catch (error) {
    console.error(`\nBucket ${course.bucket} konnte nicht angelegt werden: ${error.message}`);
    console.error('Bitte einmalig selbst anlegen:');
    console.error(`  gcloud storage buckets create gs://${course.bucket} --project=${projectId} --location=europe-west3 --uniform-bucket-level-access --public-access-prevention`);
    process.exit(1);
  }
}

const contentTypes = { '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
for (const file of files) {
  const local = join(mediaDir, basename(file));
  if (!existsSync(local)) continue;
  const sizeMb = (statSync(local).size / 1024 / 1024).toFixed(1);
  process.stdout.write(`Lade ${basename(file)} (${sizeMb} MB) ... `);
  await bucket.upload(local, {
    destination: file,
    resumable: statSync(local).size > 8 * 1024 * 1024,
    metadata: {
      contentType: contentTypes[extname(file)] || 'application/octet-stream',
      cacheControl: 'private, max-age=3600',
    },
  });
  console.log('ok');
}
console.log(`\nFertig. ${files.length - missing.length} von ${files.length} Dateien liegen im Kurs-Bucket.`);
