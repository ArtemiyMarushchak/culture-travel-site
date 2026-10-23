import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 4173;

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
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(root, reqPath) {
  const cleaned = normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const full = join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function pipeFile(req, res, path, status = 200) {
  const ext = extname(path).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const { size } = statSync(path);
  const range = req.headers.range;

  const onError = (err) => {
    console.error('stream error', path, err.message);
    if (!res.headersSent) res.writeHead(500).end('Read error');
    else res.destroy();
  };

  if (range && /^bytes=/.test(range)) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m[1] ? Number(m[1]) : 0;
    let end = m[2] ? Number(m[2]) : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      res.end();
      return;
    }
    end = Math.min(end, size - 1);
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': type,
      'Cache-Control': 'no-cache',
    });
    const stream = createReadStream(path, { start, end, highWaterMark: 64 * 1024 });
    stream.on('error', onError);
    req.on('close', () => stream.destroy());
    stream.pipe(res);
    return;
  }

  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  });
  const stream = createReadStream(path, { highWaterMark: 64 * 1024 });
  stream.on('error', onError);
  req.on('close', () => stream.destroy());
  stream.pipe(res);
}

const server = createServer((req, res) => {
  try {
    let url = decodeURIComponent(req.url?.split('?')[0] || '/');
    if (url.endsWith('/') && url !== '/') url += 'index.html';
    if (!extname(url)) url = join(url, 'index.html').replace(/\\/g, '/');

    const filePath = safeJoin(DIST, url);
    const fallback = join(DIST, '404', 'index.html');

    if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
      pipeFile(req, res, filePath, 200);
    } else if (existsSync(fallback)) {
      pipeFile(req, res, fallback, 404);
    } else {
      res.writeHead(404).end('Not found');
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500).end('Server error');
  }
});

server.requestTimeout = 0;
server.headersTimeout = 0;
server.keepAliveTimeout = 70_000;
server.maxConnections = 64;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🌐 Preview: http://127.0.0.1:${PORT}\n`);
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
});
