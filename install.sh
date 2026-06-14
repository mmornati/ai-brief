#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f src/install.js ]; then
  echo "Error: src/install.js not found."
  echo "Run install.sh from the ai-brief project root directory."
  exit 1
fi

exec node src/install.js "$@"
