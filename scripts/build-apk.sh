#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

RELEASE=false
if [ "${1:-}" = "--release" ]; then RELEASE=true; fi

# Read app name from package.json
APP_NAME=$(node -p "require('./package.json').name")
echo "=== Building ${APP_NAME} APK ==="

# Auto-wrap box64 if on ARM
[ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ] && bash scripts/wrap-x86_64.sh

echo "[1/5] Building web (Vite)..."
npm run build

echo "[2/5] Copying to Capacitor..."
npx cap copy 2>&1

echo "[3/5] Syncing Android..."
npx cap sync android 2>&1

if [ "$RELEASE" = true ]; then
  echo "[4/5] Building RELEASE APK..."
  echo "       Full log: gradle-build.log"
  cd android && ./gradlew assembleRelease --no-daemon 2>&1 | tee ../gradle-build.log && cd ..
  APK_FILE=$(ls android/app/build/outputs/apk/release/app-release*.apk 2>/dev/null | head -1)
  if [ -n "$APK_FILE" ]; then
    cp "$APK_FILE" "${APP_NAME}-release.apk"
    echo ""
    echo "=== Release APK ready ==="
    ls -lh "${APP_NAME}-release.apk"
  else
    echo ""
    echo "=== ERROR: Build failed ==="
    echo "Check gradle-build.log for the full error."
    echo "Common causes:"
    echo "  • Android SDK missing: npm run setup:android"
    echo "  • JDK version: need 17+ (java -version)"
    echo "  • ARM/Apple Silicon: box64 may need re-run"
    exit 1
  fi
else
  echo "[4/5] Building DEBUG APK..."
  echo "       Full log: gradle-build.log"
  cd android && ./gradlew assembleDebug --no-daemon 2>&1 | tee ../gradle-build.log && cd ..
  APK_FILE=$(ls android/app/build/outputs/apk/debug/app-debug*.apk 2>/dev/null | head -1)
  if [ -n "$APK_FILE" ]; then
    cp "$APK_FILE" "${APP_NAME}.apk"
    echo ""
    echo "=== Debug APK ready ==="
    ls -lh "${APP_NAME}.apk"
  else
    echo ""
    echo "=== ERROR: Build failed ==="
    echo "Check gradle-build.log for the full error."
    echo "Common causes:"
    echo "  • Android SDK missing: npm run setup:android"
    echo "  • JDK version: need 17+ (java -version)"
    echo "  • ARM/Apple Silicon: box64 may need re-run"
    exit 1
  fi
fi
