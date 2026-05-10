import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { get as httpsGet } from 'node:https';

const root = process.cwd();
const pagesPath = join(root, 'src/data/special-pages.json');
const sourceDir = join(root, 'source/assets/documents');
const publicDir = join(root, 'public/assets/documents');
const inventoryPath = join(root, 'source/data/documents.json');

const pages = JSON.parse(await readFile(pagesPath, 'utf8'));
const urls = [...new Set(pages.flatMap((page) => page.links || []).map((link) => link.href).filter((href) => href.endsWith('.pdf')))];

function safeName(value) {
  return decodeURIComponent(value)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß.-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = createWriteStream(destination);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

await mkdir(sourceDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const results = [];
for (const [index, href] of urls.entries()) {
  const absoluteUrl = href.startsWith('http') ? href : `https://www.callidus-am.de${href}`;
  const parsed = new URL(absoluteUrl);
  const ext = extname(parsed.pathname) || '.pdf';
  const filename = `${String(index + 1).padStart(3, '0')}-${safeName(basename(parsed.pathname, ext))}${ext}`;
  const sourcePath = join(sourceDir, filename);
  const publicPathOnDisk = join(publicDir, filename);
  const publicPath = `/assets/documents/${filename}`;

  try {
    let note = 'ok';
    try {
      await stat(sourcePath);
    } catch {
      await download(absoluteUrl, sourcePath);
      note = 'downloaded';
    }
    await copyFile(sourcePath, publicPathOnDisk);
    const info = await stat(sourcePath);
    results.push({ href, url: absoluteUrl, sourcePath: `source/assets/documents/${filename}`, publicPath, bytes: info.size, status: 'ok', note });
    console.log(`${note}: ${filename}`);
  } catch (error) {
    results.push({ href, url: absoluteUrl, status: 'error', error: error.message });
    console.error(`error: ${absoluteUrl} - ${error.message}`);
  }
}

await writeFile(inventoryPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log(`Documents downloaded: ${results.filter((item) => item.status === 'ok').length}/${results.length}`);
