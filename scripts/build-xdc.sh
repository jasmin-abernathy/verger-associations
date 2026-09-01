#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_DIR="$ROOT_DIR/apps/reunions-decisions"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/reunions-decisions.xdc"

mkdir -p "$DIST_DIR"
rm -f "$OUTPUT"

(
  cd "$APP_DIR"
  zip -9 "$OUTPUT" index.html styles.css app.js manifest.toml
)

unzip -t "$OUTPUT"
echo "Paquet créé : $OUTPUT"
