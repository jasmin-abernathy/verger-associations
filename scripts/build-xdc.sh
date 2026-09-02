#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_DIR="$ROOT_DIR/apps/reunions-decisions"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/reunions-decisions.xdc"

sh "$ROOT_DIR/scripts/test.sh"
mkdir -p "$DIST_DIR"
rm -f "$OUTPUT"

(
  cd "$APP_DIR"
  zip -9 "$OUTPUT" index.html styles.css model.js app.js manifest.toml
)

unzip -t "$OUTPUT"
echo "Paquet créé : $OUTPUT"
