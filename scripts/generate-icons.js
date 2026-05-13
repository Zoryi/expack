import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

function createPNG(width, height, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // color type: RGB
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT chunk - raw pixel data
  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3)
    rawData[row] = 0  // filter byte: none
    for (let x = 0; x < width; x++) {
      const cx = x - width / 2
      const cy = y - height / 2
      const dist = Math.sqrt(cx * cx + cy * cy)
      const radius = width * 0.4

      const px = row + 1 + x * 3
      if (dist <= radius) {
        rawData[px] = r
        rawData[px + 1] = g
        rawData[px + 2] = b
      } else {
        rawData[px] = 15
        rawData[px + 1] = 23
        rawData[px + 2] = 42
      }

      // Letter "P" approximation in the center
      if (dist < radius * 0.4) {
        const angle = Math.atan2(cy, cx)
        if (Math.abs(cx) < width * 0.04 && Math.abs(cy) < radius * 0.6) {
          rawData[px] = 255
          rawData[px + 1] = 255
          rawData[px + 2] = 255
        }
        if (cy < 0 && Math.abs(cy) > radius * 0.1 && Math.abs(cy) < radius * 0.4) {
          if (Math.abs(cx) < radius * 0.3 && cx > 0) {
            rawData[px] = 255
            rawData[px + 1] = 255
            rawData[px + 2] = 255
          }
          if (Math.abs(cx - radius * 0.25) < width * 0.04 && cx > 0 && cy < -radius * 0.05) {
            rawData[px] = 255
            rawData[px + 1] = 255
            rawData[px + 2] = 255
          }
        }
      }
    }
  }

  const compressed = deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

function createChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)

  const typeB = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeB, data])

  const crc = crc32(crcData)
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([len, typeB, data, crcB])
}

function crc32(data) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

const icon192 = createPNG(192, 192, 59, 130, 246)
const icon512 = createPNG(512, 512, 59, 130, 246)

writeFileSync('public/icons/icon-192x192.png', icon192)
writeFileSync('public/icons/icon-512x512.png', icon512)

console.log('Icons generated:')
console.log('  icon-192x192.png:', icon192.length, 'bytes')
console.log('  icon-512x512.png:', icon512.length, 'bytes')
