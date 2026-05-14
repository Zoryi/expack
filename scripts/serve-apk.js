#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = path.resolve(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf-8'))
const APP_NAME = pkg.name
const PORT = parseInt(process.env.PORT || '8080', 10)
const DIR = PROJECT_DIR

function findAPK() {
  const candidates = [
    `docs/apk/${APP_NAME}.apk`,
    `docs/apk/${APP_NAME}-release.apk`,
    `${APP_NAME}.apk`,
    `${APP_NAME}-release.apk`,
    'android/app/build/outputs/apk/debug/app-debug.apk',
    'android/app/build/outputs/apk/debug/app-debug-unsigned.apk',
    'android/app/build/outputs/apk/release/app-release.apk',
    'android/app/build/outputs/apk/release/app-release-unsigned.apk',
  ]
  for (const c of candidates) {
    const p = path.join(DIR, c)
    if (fs.existsSync(p)) return p
  }
  return null
}

let APK_PATH = findAPK()

function getLocalIP() {
  try {
    for (const addrs of Object.values(os.networkInterfaces())) {
      for (const addr of addrs || []) {
        if (addr.family === 'IPv4' && !addr.internal) return addr.address
      }
    }
  } catch {}
  return '0.0.0.0'
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function getDevicesIPs() {
  try {
    const ips = []
    for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
      for (const addr of addrs || []) {
        if (addr.family === 'IPv4' && !addr.internal) {
          ips.push({ iface: name, ip: addr.address })
        }
      }
    }
    if (ips.length > 0) return ips
  } catch {}
  try {
    const out = execSync('ifconfig 2>/dev/null').toString()
    const matches = out.matchAll(/inet (\d+\.\d+\.\d+\.\d+)/g)
    for (const m of matches) {
      if (m[1] !== '127.0.0.1') return [{ iface: 'network', ip: m[1] }]
    }
  } catch {}
  return []
}

function html({ apkExists, apkStat, apkHash, apkName, devices }) {
  const size = apkExists ? formatBytes(apkStat.size) : '—'
  const hash = apkExists ? apkHash : '—'
  const version = apkExists ? '1.0.0' : '—'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${APP_NAME} — Téléchargement APK</title>
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
  .infobox .value{color:#e2e8f0;font-family:monospace;font-size:12px;word-break:break-all}
  .hash{font-size:11px;color:#475569;word-break:break-all;margin-top:8px;padding-top:8px;border-top:1px solid #1e293b}
  .btn{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;transition:background .15s}
  .btn:hover{background:#2563eb}
  .btn:disabled{background:#475569;cursor:not-allowed}
  .hint{color:#64748b;font-size:12px;line-height:1.6}
  .ip-list{list-style:none;margin:12px 0;font-size:13px}
  .ip-list li{background:#0f172a;padding:8px 12px;border-radius:6px;margin-bottom:6px;font-family:monospace;font-size:13px}
  .ip-list li .iface{color:#64748b;font-size:11px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">📦</div>
  <h1>${APP_NAME}</h1>
  <p class="sub">APK Android — v${version}</p>

  <div class="infobox">
    <div><span class="label">Fichier</span><span class="value">${apkName}</span></div>
    <div><span class="label">Taille</span><span class="value">${size}</span></div>
  </div>

  <div class="hash">SHA256: ${hash}</div>

  ${apkExists
    ? `<a class="btn" href="/${apkName}" download>Télécharger l'APK</a>`
    : `<button class="btn" disabled>APK non trouvé</button>`
  }

  <p class="hint">
    Ouvrez cette page sur votre appareil Android, téléchargez le fichier,
    puis ouvrez-le pour installer l'application.
  </p>

  <hr style="border:none;border-top:1px solid #1e293b;margin:16px 0">

  <p class="hint" style="margin-bottom:8px">Connectez-vous sur le même réseau WiFi et ouvrez :</p>
  <ul class="ip-list">
    ${devices.map(d => `<li><a href="http://${d.ip}:${PORT}" style="color:#60a5fa;text-decoration:none">http://${d.ip}:${PORT}</a> <span class="iface">(${d.iface})</span></li>`).join('')}
  </ul>
</div>
</body>
</html>`
}

// --- Main ---

const devices = getDevicesIPs()

if (!APK_PATH) {
  console.log('APK not found — building...')
  try {
    execSync('npm run build:apk', { cwd: DIR, stdio: 'inherit' })
  } catch {
    console.error('Build failed. Starting server without APK.')
  }
  APK_PATH = findAPK()
}

const apkExists = !!APK_PATH
const apkStat = apkExists ? fs.statSync(APK_PATH) : null
const apkHash = apkExists ? sha256(APK_PATH) : null
const apkName = apkExists ? path.basename(APK_PATH) : `${APP_NAME}.apk`

const server = http.createServer((req, res) => {
  if (req.url === '/' + apkName && apkExists) {
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': apkStat.size,
      'Content-Disposition': `attachment; filename="${apkName}"`,
    })
    fs.createReadStream(APK_PATH).pipe(res)
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })
  res.end(html({ apkExists, apkStat, apkHash, apkName, devices }))
})

server.listen(PORT, () => {
  console.log('')
  console.log(`  📦 ${APP_NAME.charAt(0).toUpperCase() + APP_NAME.slice(1)} — Serveur de téléchargement APK`)
  console.log('')
  for (const d of devices) {
    console.log(`  http://${d.ip}:${PORT}  (${d.iface})`)
  }
  console.log('')
  if (apkExists) {
    console.log(`  Fichier : ${apkName} (${formatBytes(apkStat.size)})`)
    console.log(`  SHA256  : ${apkHash}`)
  } else {
    console.log('  ⚠️  APK non trouvé. Lancez d\'abord: npm run build:apk')
  }
  console.log('')
})
