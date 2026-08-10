#!/bin/bash
# Локальная разработка: сборка + сервер
set -e
cd "$(dirname "$0")/.."
python3 tools/build.py
echo ""
echo "🌐 Открой: http://127.0.0.1:8766/"
echo "   Остановить: Ctrl+C"
echo ""
cd dist && python3 -m http.server 8766
