#!/usr/bin/env node
/**
 * Держит preview.mjs живым: при падении перезапускает через 1с.
 * Запуск: node tools/preview-keep.mjs
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const preview = join(__dirname, 'preview.mjs');
const PORT = process.env.PORT || '4173';

let child = null;
let stopping = false;

function start() {
  if (stopping) return;
  console.log(`[keep] start preview on ${PORT}`);
  child = spawn(process.execPath, [preview], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, PORT },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    console.error(`[keep] preview exited code=${code} signal=${signal} — restart in 1s`);
    setTimeout(start, 1000);
  });
}

function stop() {
  stopping = true;
  if (child) child.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start();
