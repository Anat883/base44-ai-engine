#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 מפעיל שירות זיהוי פנים..."
cd "$ROOT_DIR/face_service"
python app.py &
FACE_PID=$!

echo "⏳ ממתין לשירות הזיהוי..."
sleep 5

echo "🤖 מפעיל בוט WhatsApp..."
cd "$ROOT_DIR/bot"
node bot.js

# cleanup on exit
kill $FACE_PID 2>/dev/null || true
