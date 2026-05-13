#!/usr/bin/env bash
set -euo pipefail

OUTDIR="./gh-pages"
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

APK=$(ls *.apk 2>/dev/null | head -1 || true)
if [ -z "$APK" ]; then
  APK=$(find android -name "*.apk" -not -path "*/build/intermediates/*" 2>/dev/null | head -1 || true)
fi
if [ -z "$APK" ]; then
  echo "ERROR: No APK found at project root or in android/build/outputs/"
  exit 1
fi

SIZE=$(stat --printf="%s" "$APK")
SIZE_H=$(numfmt --to=iec "$SIZE")
HASH=$(sha256sum "$APK" | cut -d' ' -f1)
NAME=$(basename "$APK")

cp "$APK" "$OUTDIR/$NAME"

cat > "$OUTDIR/index.html" <<EOF
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
  <h1>${NAME%%.apk}</h1>
  <p class="sub">APK Android</p>
  <div class="infobox">
    <div><span class="label">Fichier</span><span class="value">${NAME}</span></div>
    <div><span class="label">Taille</span><span class="value">${SIZE_H}</span></div>
  </div>
  <div class="hash">SHA256: ${HASH}</div>
  <a class="btn" href="${NAME}" download>Télécharger l'APK</a>
  <p class="hint">
    Téléchargez le fichier sur votre appareil Android,<br>
    ouvrez-le pour installer l'application.
  </p>
</div>
</body>
</html>
EOF

echo "✓ gh-pages ready: $OUTDIR/index.html + $OUTDIR/$NAME ($SIZE_H)"
