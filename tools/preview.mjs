import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  let url = req.url?.split('?')[0] || '/';
  if (url.endsWith('/') && url !== '/') url += 'index.html';
  if (!extname(url)) url = join(url, 'index.html').replace(/\\/g, '/');

  const filePath = join(DIST, url);
  const fallback = join(DIST, '404', 'index.html');

  const send = (path, status = 200) => {
    const ext = extname(path);
    res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(path));
  };

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    send(filePath);
  } else if (existsSync(fallback)) {
    send(fallback, 404);
  } else {
    res.writeHead(404).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🌐 Preview: http://localhost:${PORT}\n`);
});
