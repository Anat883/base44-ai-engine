#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MSG="${1:-Save storyboard project progress}"

cd "$ROOT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository."
  exit 1
fi

git add README.md CLAUDE.md docs tools templates projects final-outputs examples

if git diff --cached --quiet; then
  echo "Nothing to save."
  exit 0
fi

git commit -m "$MSG"
git push

echo "Saved to GitHub."
