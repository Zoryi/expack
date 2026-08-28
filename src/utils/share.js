import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import pako from 'pako'

const QR_CAPACITY = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
}

let _idCounter = Date.now()

function generateId(prefix) {
  return `${prefix}-${++_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

function toBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binaryStr = atob(str)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}

function collectDependencies(focalType, focalId, allItems, allCategories, allKits, allSacs) {
  const neededItems = new Set()
  const neededCategories = new Set()
  const neededKits = new Set()
  const neededSacs = new Set()

  function collectKit(kitId) {
    if (neededKits.has(kitId)) return
    neededKits.add(kitId)
    const kit = allKits.find(k => k.id === kitId)
    if (!kit) return
    for (const entry of kit.itemEntries) {
      neededItems.add(entry.itemId)
    }
    for (const sub of kit.subKitEntries) {
      collectKit(sub.kitId)
    }
  }

  if (focalType === 'item') {
    neededItems.add(focalId)
  } else if (focalType === 'kit') {
    collectKit(focalId)
  } else if (focalType === 'sac') {
    neededSacs.add(focalId)
    const sac = allSacs.find(s => s.id === focalId)
    if (sac) {
      for (const entry of sac.entries) {
        if (entry.type === 'item') {
          neededItems.add(entry.itemId)
        } else if (entry.type === 'kit') {
          collectKit(entry.kitId)
        }
      }
    }
  }

  const items = allItems.filter(i => neededItems.has(i.id))
  for (const item of items) {
    neededCategories.add(item.categoryId)
  }

  const categories = allCategories.filter(c => neededCategories.has(c.id))
  const kits = allKits.filter(k => neededKits.has(k.id))
  const sacs = allSacs.filter(s => neededSacs.has(s.id))

  return { items, categories, kits, sacs }
}

export function prepareSharePayload(focalType, focalId, allItems, allCategories, allKits, allSacs) {
  const deps = collectDependencies(focalType, focalId, allItems, allCategories, allKits, allSacs)
  return {
    version: 1,
    op: 'share',
    focalType,
    focalId,
    exportedAt: new Date().toISOString(),
    items: deps.items,
    categories: deps.categories,
    kits: deps.kits,
    sacs: deps.sacs,
  }
}

export function compressForQr(data) {
  const json = JSON.stringify(data)
  const compressed = pako.gzip(json, { level: 9 })
  return toBase64Url(compressed)
}

export function safeCompressForQr(data) {
  try {
    return { ok: true, value: compressForQr(data) }
  } catch (err) {
    console.error('compressForQr error:', err)
    return { ok: false, error: err.message }
  }
}

export function decompressFromQr(str) {
  const bytes = fromBase64Url(str)
  const decompressed = pako.ungzip(bytes, { to: 'string' })
  return JSON.parse(decompressed)
}

export function canFitInQr(compressedStr) {
  const size = compressedStr.length
  if (size <= QR_CAPACITY.M) return { fits: true, level: 'M', size, maxSize: QR_CAPACITY.M }
  if (size <= QR_CAPACITY.L) return { fits: true, level: 'L', size, maxSize: QR_CAPACITY.L }
  return { fits: false, level: null, size, maxSize: QR_CAPACITY.L }
}

export function getFocalInfo(payload) {
  const { focalType, focalId, items, kits, sacs } = payload
  let name = ''
  let itemCount = 0
  let totalWeight = 0

  if (focalType === 'item') {
    const item = items.find(i => i.id === focalId)
    if (item) {
      name = item.name
      itemCount = 1
      totalWeight = (item.weight || 0) * (item.quantity || 1)
    }
  } else if (focalType === 'kit') {
    const kit = kits.find(k => k.id === focalId)
    if (kit) {
      name = kit.name
      for (const entry of kit.itemEntries) {
        const item = items.find(i => i.id === entry.itemId)
        if (item) {
          itemCount++
          totalWeight += (item.weight || 0) * (entry.quantity || 1)
        }
      }
      for (const sub of kit.subKitEntries) {
        const subKit = kits.find(k => k.id === sub.kitId)
        if (subKit) itemCount += subKit.itemEntries.length
      }
    }
  } else if (focalType === 'sac') {
    const sac = sacs.find(s => s.id === focalId)
    if (sac) {
      name = sac.name
      for (const entry of sac.entries) {
        if (entry.type === 'item') {
          const item = items.find(i => i.id === entry.itemId)
          if (item) {
            itemCount++
            totalWeight += (item.weight || 0) * (entry.quantity || 1)
          }
        } else if (entry.type === 'kit') {
          const kit = kits.find(k => k.id === entry.kitId)
          if (kit) {
            itemCount += kit.itemEntries.length
            for (const ke of kit.itemEntries) {
              const item = items.find(i => i.id === ke.itemId)
              if (item) totalWeight += (item.weight || 0) * (ke.quantity || 1)
            }
          }
        }
      }
    }
  }

  return {
    type: focalType,
    id: focalId,
    name,
    itemCount,
    totalWeight,
  }
}

export function reassignIds(payload, existingState) {
  const existingItemIds = new Set(existingState.items.map(i => i.id))
  const existingKitIds = new Set(existingState.kits.map(k => k.id))
  const existingSacIds = new Set(existingState.sacs.map(s => s.id))

  const existingCategoriesByName = {}
  for (const cat of existingState.categories) {
    existingCategoriesByName[cat.name.toLowerCase()] = cat
  }

  const idMap = {}
  const newItems = []
  const newCategories = []
  const newKits = []
  const newSacs = []

  const catIdMap = {}

  for (const cat of payload.categories) {
    const existing = existingCategoriesByName[cat.name.toLowerCase()]
    if (existing) {
      catIdMap[cat.id] = existing.id
    } else {
      const newId = generateId('cat')
      catIdMap[cat.id] = newId
      const conflict = existingState.categories.find(c => c.id === newId) ||
        newCategories.find(c => c.id === newId)
      const finalId = conflict ? generateId('cat') : newId
      catIdMap[cat.id] = finalId
      newCategories.push({ ...cat, id: finalId })
    }
  }

  for (const item of payload.items) {
    const newId = existingItemIds.has(item.id) ? generateId('itm') : item.id
    idMap[item.id] = newId
    newItems.push({
      ...item,
      id: newId,
      categoryId: catIdMap[item.categoryId] || item.categoryId,
    })
  }

  const itemIdMap = idMap

  for (const kit of payload.kits) {
    const newId = existingKitIds.has(kit.id) ? generateId('kit') : kit.id
    idMap[kit.id] = newId
    newKits.push({
      ...kit,
      id: newId,
      itemEntries: kit.itemEntries.map(e => ({
        itemId: itemIdMap[e.itemId] || e.itemId,
        quantity: e.quantity,
      })),
      subKitEntries: kit.subKitEntries.map(e => ({
        kitId: idMap[e.kitId] || e.kitId,
      })),
    })
  }

  for (const sac of payload.sacs) {
    const newId = existingSacIds.has(sac.id) ? generateId('sac') : sac.id
    idMap[sac.id] = newId
    newSacs.push({
      ...sac,
      id: newId,
      entries: sac.entries.map(e => ({
        ...e,
        itemId: e.itemId ? (itemIdMap[e.itemId] || e.itemId) : undefined,
        kitId: e.kitId ? (idMap[e.kitId] || e.kitId) : undefined,
      })),
    })
  }

  return { items: newItems, categories: newCategories, kits: newKits, sacs: newSacs }
}

export async function shareViaFile(data) {
  const filename = `expack-share-${new Date().toISOString().slice(0, 10)}.json`
  const json = JSON.stringify(data, null, 2)

  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({
      title: 'Partager une ressource ExPack',
      text: 'Fichier de partage ExPack',
      url: result.uri,
    }).catch(() => {})
  } else {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
