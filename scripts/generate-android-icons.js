#!/usr/bin/env node
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SRC = 'public/icons/icon-512x512.png'
const RES_DIR = 'android/app/src/main/res'

const DENSITIES = [
  { name: 'mdpi',   launcher: 48,  foreground: 108 },
  { name: 'hdpi',   launcher: 72,  foreground: 162 },
  { name: 'xhdpi',  launcher: 96,  foreground: 216 },
  { name: 'xxhdpi', launcher: 144, foreground: 324 },
  { name: 'xxxhdpi',launcher: 192, foreground: 432 },
]

async function main() {
  const src = path.resolve(SRC)
  if (!fs.existsSync(src)) {
    console.error(`Source icon not found: ${src}`)
    process.exit(1)
  }

  console.log(`Generating Android icons from: ${SRC}\n`)

  for (const d of DENSITIES) {
    const dir = path.join(RES_DIR, `mipmap-${d.name}`)
    if (!fs.existsSync(dir)) {
      console.log(`  SKIP ${d.name} (dir not found)`)
      continue
    }

    for (const file of [`ic_launcher.png`, `ic_launcher_round.png`]) {
      const out = path.join(dir, file)
      await sharp(src).resize(d.launcher, d.launcher).png().toFile(out)
      console.log(`  ${d.name}/${file}  ${d.launcher}×${d.launcher}`)
    }

    for (const file of [`ic_launcher_foreground.png`]) {
      const out = path.join(dir, file)
      await sharp(src).resize(d.foreground, d.foreground).png().toFile(out)
      console.log(`  ${d.name}/${file}  ${d.foreground}×${d.foreground}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
