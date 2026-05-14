#!/usr/bin/env bash
set -euo pipefail

OUTDIR="./gh-pages"
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

APP_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")

APKS=()
for f in "${APP_NAME}"*.apk; do
  [ -f "$f" ] && APKS+=("$f")
done

if [ ${#APKS[@]} -eq 0 ]; then
  echo "ERROR: No APK found matching ${APP_NAME}*.apk at project root"
  exit 1
fi

CARDS=""
for APK in "${APKS[@]}"; do
  NAME=$(basename "$APK")
  SIZE=$(stat --printf="%s" "$APK")
  SIZE_H=$(numfmt --to=iec "$SIZE")
  HASH=$(sha256sum "$APK" | cut -d' ' -f1)

  mkdir -p "$OUTDIR/apk"
  cp "$APK" "$OUTDIR/apk/$NAME"

  if [[ "$NAME" == *-release* ]]; then
    BADGE="Release"
    BADGE_COLOR="#22c55e"
    BADGE_BG="#052e16"
  else
    BADGE="Debug"
    BADGE_COLOR="#f59e0b"
    BADGE_BG="#451a03"
  fi

  CARDS+="
    <div class=\"card\">
      <span class=\"badge\" style=\"background:$BADGE_BG;color:$BADGE_COLOR\">$BADGE</span>
      <div class=\"icon\">📦</div>
      <h1>${NAME%%.apk}</h1>
      <p class=\"sub\">v${VERSION} — APK Android</p>
      <div class=\"infobox\">
        <div><span class=\"label\">Fichier</span><span class=\"value\">$NAME</span></div>
        <div><span class=\"label\">Taille</span><span class=\"value\">$SIZE_H</span></div>
      </div>
      <div class=\"hash\">SHA256: $HASH</div>
      <a class=\"btn\" href=\"apk/$NAME\" download>Télécharger</a>
    </div>"
done

cat > "$OUTDIR/index.html" <<EOF
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${APP_NAME} — Téléchargement APK</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0b1120;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
  .wrapper{max-width:900px;width:100%;text-align:center}
  .page-title{font-size:20px;font-weight:800;margin-bottom:4px;color:#f1f5f9}
  .page-sub{color:#64748b;font-size:13px;margin-bottom:28px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;justify-items:center}
  .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px 28px;width:100%;text-align:center;position:relative}
  .badge{position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:3px 10px;border-radius:999px}
  .icon{font-size:40px;margin-bottom:8px}
  h1{font-size:20px;font-weight:800;margin-bottom:2px}
  .sub{color:#94a3b8;font-size:13px;margin-bottom:20px}
  .infobox{background:#0f172a;border-radius:10px;padding:14px;margin-bottom:16px;text-align:left;font-size:13px}
  .infobox div{display:flex;justify-content:space-between;padding:3px 0}
  .infobox .label{color:#64748b}
  .infobox .value{color:#e2e8f0;font-family:monospace;font-size:12px;word-break:break-all}
  .hash{font-size:10px;color:#475569;word-break:break-all;margin-bottom:16px;padding-top:10px;border-top:1px solid #1e293b;font-family:monospace;line-height:1.5}
  .btn{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;transition:background .15s}
  .btn:hover{background:#2563eb}
  .footer{margin-top:28px;color:#475569;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div class="wrapper">
  <div class="page-title">${APP_NAME}</div>
  <div class="page-sub">APK Android — v${VERSION}</div>
  <div class="grid">${CARDS}
  </div>
</div>
</body>
</html>
EOF

echo "✓ gh-pages ready: $OUTDIR/index.html"
for APK in "${APKS[@]}"; do
  NAME=$(basename "$APK")
  SIZE_H=$(numfmt --to=iec "$(stat --printf='%s' "$APK")")
  echo "  • $OUTDIR/apk/$NAME ($SIZE_H)"
done
