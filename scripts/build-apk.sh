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

    # Generate download page with real SHA256 and size
    SIZE_H=$(du -h "${APP_NAME}-release.apk" | cut -f1)
    HASH=$(sha256sum "${APP_NAME}-release.apk" | cut -d' ' -f1)
    cat > index.html <<EOF
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Téléchargement APK</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0b1120;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
  .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center}
  .icon{font-size:48px;margin-bottom:12px}
  h1{font-size:24px;font-weight:800;margin-bottom:4px}
  .sub{color:#94a3b8;font-size:14px;margin-bottom:24px}
  .infobox{background:#0f172a;border-radius:10px;padding:16px;margin-bottom:20px;text-align:left;font-size:13px}
  .infobox div{display:flex;justify-content:space-between;padding:4px 0}
  .infobox .label{color:#64748b}
  .infobox .value{color:#e2e8f0;font-family:monospace;font-size:12px}
  .hash{font-size:11px;color:#475569;word-break:break-all;margin-top:8px;padding-top:8px;border-top:1px solid #1e293b;font-family:monospace}
  .btn{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;transition:background .15s}
  .btn:hover{background:#2563eb}
  .hint{color:#64748b;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div class="card">
  <div class="icon">📦</div>
  <h1>${APP_NAME}-release</h1>
  <p class="sub">APK Android</p>
  <div class="infobox">
    <div><span class="label">Fichier</span><span class="value">${APP_NAME}-release.apk</span></div>
    <div><span class="label">Taille</span><span class="value">${SIZE_H}</span></div>
  </div>
  <div class="hash">SHA256: ${HASH}</div>
  <a class="btn" href="${APP_NAME}-release.apk" download>Télécharger l'APK</a>
  <p class="hint">
    Téléchargez le fichier sur votre appareil Android,<br>
    ouvrez-le pour installer l'application.
  </p>
</div>
</body>
</html>
EOF

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
