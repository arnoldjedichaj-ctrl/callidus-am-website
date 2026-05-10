import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';

const root = process.cwd();
const articlesPath = join(root, 'src/data/articles.json');
const sourceDir = join(root, 'source/assets/media');
const publicDir = join(root, 'public/assets/media');
const inventoryPath = join(root, 'source/data/media.json');

const articles = JSON.parse(await readFile(articlesPath, 'utf8'));
const media = [];
const seen = new Set();

for (const article of articles) {
  for (const item of article.media || []) {
    const url = item.originalSrc || item.src;
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    media.push({ ...item, url, slug: article.slug });
  }
}

function safeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function request(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? httpsGet : httpGet;
    const req = client(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume();
        resolve(request(new URL(res.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

async function download(url, destination) {
  const res = await request(url);
  await new Promise((resolve, reject) => {
    const file = createWriteStream(destination);
    res.pipe(file);
    file.on('finish', () => file.close(resolve));
    file.on('error', reject);
    res.on('error', reject);
  });
}

await mkdir(sourceDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const results = [];
for (const [index, item] of media.entries()) {
  const urlPath = new URL(item.url).pathname;
  const ext = extname(urlPath) || (item.type === 'audio' ? '.m4a' : '.mp4');
  const base = safeName(basename(urlPath, ext) || item.type);
  const filename = `${String(index + 1).padStart(3, '0')}-${safeName(item.slug)}-${base}${ext}`;
  const sourcePath = join(sourceDir, filename);
  const publicPathOnDisk = join(publicDir, filename);
  const publicPath = `/assets/media/${filename}`;

  try {
    let status = 'ok';
    try {
      await stat(sourcePath);
    } catch {
      await download(item.url, sourcePath);
      status = 'downloaded';
    }
    await copyFile(sourcePath, publicPathOnDisk);
    const info = await stat(sourcePath);
    results.push({
      url: item.url,
      type: item.type,
      title: item.title,
      sourcePath: `source/assets/media/${filename}`,
      publicPath,
      bytes: info.size,
      status: 'ok',
      note: status,
    });
    console.log(`${status}: ${filename}`);
  } catch (error) {
    results.push({
      url: item.url,
      type: item.type,
      title: item.title,
      status: 'error',
      error: error.message,
    });
    console.error(`error: ${item.url} - ${error.message}`);
  }
}

await mkdir(join(root, 'source/data'), { recursive: true });
await writeFile(inventoryPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

const ok = results.filter((item) => item.status === 'ok').length;
console.log(`Media downloaded: ${ok}/${results.length}`);
