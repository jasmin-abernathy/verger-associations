#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules/@capacitor/core ]]; then
  echo "Dépendances Capacitor absentes. Lancez d'abord : npm install"
  exit 1
fi

npm run build

if [[ ! -d android ]]; then
  npx cap add android
fi

npx cap sync android

echo
echo "Projet Android prêt : apps/verger-pwa/android"
echo "APK debug : npm run android:apk:debug"
echo "Android Studio : npm run android:open"
