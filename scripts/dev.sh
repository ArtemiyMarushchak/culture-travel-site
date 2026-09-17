#!/bin/bash
# Локальная разработка: сборка + сервер
set -e
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:$PATH"
node tools/build.mjs
echo ""
echo "🌐 Открой: http://127.0.0.1:8766/"
echo "   Остановить: Ctrl+C"
echo ""
cd dist && python3 -m http.server 8766
