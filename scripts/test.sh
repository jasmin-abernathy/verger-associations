#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

node --check "$ROOT_DIR/apps/reunions-decisions/model.js"
node --check "$ROOT_DIR/apps/reunions-decisions/app.js"
node --check "$ROOT_DIR/apps/reunions-decisions/webxdc.js"
node "$ROOT_DIR/tests/model.test.js"

echo "Vérifications JavaScript terminées."
