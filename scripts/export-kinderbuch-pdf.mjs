import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { access, copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve('.');
const isFinal = process.argv.includes('--final');
const isWorking = process.argv.includes('--working') || process.argv.includes('--arbeitsfassung');
const basename = isFinal
  ? 'callis-kompass-band1-kdp-inhalt'
  : isWorking
    ? 'callis-kompass-band1-arbeitsfassung'
    : 'callis-kompass-band1-leseprobe';
const output = isFinal || isWorking
  ? resolve(`buchprojekt/kinderbuch-band1/${basename}.pdf`)
  : resolve(`public/assets/kinderbuch/${basename}.pdf`);
const browserOutput = resolve(`.tmp/${basename}.pdf`);
const sourcePath = isFinal
  ? '/buchprojekt/kinderbuch-band1/callis-kompass-band1-kdp-inhalt.html'
  : isWorking
    ? '/buchprojekt/kinderbuch-band1/callis-kompass-band1-arbeitsfassung.html'
  : '/public/assets/kinderbuch/callis-kompass-band1-leseprobe.html';
const userDataDir = resolve(`.tmp/kinderbuch-pdf-browser-${process.pid}-${Date.now()}`);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.pdf', 'application/pdf'],
]);

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

function findBrowser() {
  return browserCandidates.find((candidate) => existsSync(candidate));
}

function startServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const requested = decodeURIComponent(url.pathname === '/' ? sourcePath : url.pathname);
    const filePath = resolve(root, `.${requested}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const contentType = mimeTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

function runBrowser(browserPath, url) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--disable-gpu-compositing',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=3000',
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${browserOutput}`,
    url,
  ];

  return new Promise((resolveRun, reject) => {
    const child = spawn(browserPath, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      reject(new Error(`Browser export failed with exit code ${code}`));
    });
  });
}

const browserPath = findBrowser();
if (!browserPath) {
  throw new Error('No Edge/Chrome executable found. Set CHROME_PATH to export the PDF.');
}

await mkdir(dirname(output), { recursive: true });
await mkdir(resolve('.tmp'), { recursive: true });
await mkdir(userDataDir, { recursive: true });
await rm(browserOutput, { force: true });
const server = await startServer();

try {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${sourcePath}`;
  await runBrowser(browserPath, url);
  await access(browserOutput);
  await copyFile(browserOutput, output);
  console.log(`Exported ${output}`);
} finally {
  server.close();
}
