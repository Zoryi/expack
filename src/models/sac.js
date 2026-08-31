import { createId } from '../utils/id'

export function generateId() {
  return createId('sac')
}

export const TRIP_TYPES = {
  RANDO: 'rando',
  BIVOUAC: 'bivouac',
  TREK: 'trek',
  AUTRE: 'autre',
}

export const TRIP_TYPE_LABELS = {
  [TRIP_TYPES.RANDO]: 'Randonnée',
  [TRIP_TYPES.BIVOUAC]: 'Bivouac',
  [TRIP_TYPES.TREK]: 'Trek',
  [TRIP_TYPES.AUTRE]: 'Autre',
}

let _entryCounter = 0

function generateEntryId() {
  return `e${++_entryCounter}-${Date.now().toString(36)}`
}

export function createSac(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name: '',
    description: '',
    destination: '',
    tripDate: '',
    duration: 1,
    type: TRIP_TYPES.BIVOUAC,
    entries: [],
    packingState: {},
    packingFill: {},
    createdAt: overrides.createdAt || now,
    updatedAt: now,
    ...overrides,
  }
}

export function addDirectEntry(sac, itemId, quantity = 1) {
  const entryId = generateEntryId()
  return {
    ...sac,
    entries: [...sac.entries, { entryId, type: 'item', itemId, quantity }],
    updatedAt: new Date().toISOString(),
  }
}

export function addKitEntry(sac, kitId) {
  const entryId = generateEntryId()
  return {
    ...sac,
    entries: [...sac.entries, { entryId, type: 'kit', kitId }],
    updatedAt: new Date().toISOString(),
  }
}

export function removeEntry(sac, entryId) {
  const entry = sac.entries.find(e => e.entryId === entryId)
  if (!entry) return sac

  const newPackingState = { ...sac.packingState }

  if (entry.type === 'item') {
    const prefix = `${entryId}:${entry.itemId}:`
    for (const key of Object.keys(newPackingState)) {
      if (key.startsWith(prefix)) delete newPackingState[key]
    }
  } else {
    const prefix = `${entryId}:`
    for (const key of Object.keys(newPackingState)) {
      if (key.startsWith(prefix)) delete newPackingState[key]
    }
  }

  return {
    ...sac,
    entries: sac.entries.filter(e => e.entryId !== entryId),
    packingState: newPackingState,
    updatedAt: new Date().toISOString(),
  }
}

export function togglePacked(sac, packingKey) {
  return {
    ...sac,
    packingState: {
      ...sac.packingState,
      [packingKey]: !sac.packingState[packingKey],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function toggleFill(sac, packingKey) {
  const current = sac.packingFill[packingKey]
  return {
    ...sac,
    packingFill: {
      ...sac.packingFill,
      [packingKey]: current === 'empty' ? 'full' : 'empty',
    },
    updatedAt: new Date().toISOString(),
  }
}

export function setAllPacked(sac, packed, kits = [], items = []) {
  const resolved = resolveSac(sac, kits, items)
  const newState = {}
  for (const fi of resolved.flatItems) {
    if (!fi.deleted) newState[fi.packingKey] = packed
  }
  return { ...sac, packingState: newState, updatedAt: new Date().toISOString() }
}

export function resolveSac(sac, kits, items) {
  const flatItems = []

  for (const entry of sac.entries) {
    if (entry.type === 'item') {
      const item = items.find(i => i.id === entry.itemId)
      if (!item) {
        flatItems.push({
          id: `${entry.entryId}:deleted`,
          deleted: true,
          entryId: entry.entryId,
          name: 'Article supprimé',
          weight: 0,
          quantity: entry.quantity,
          categoryId: '',
          isConsumable: false,
          isWorn: false,
          kitPath: [],
          isPacked: false,
          packingKey: `${entry.entryId}:${entry.itemId}:`,
        })
        continue
      }

      const packingKey = `${entry.entryId}:${entry.itemId}:`
      flatItems.push({
        id: `${entry.entryId}:${entry.itemId}`,
        entryId: entry.entryId,
        itemId: item.id,
        name: item.name,
        weight: item.weight,
        quantity: entry.quantity,
        categoryId: item.categoryId,
        isConsumable: item.isConsumable,
        isWorn: item.isWorn,
        consumableType: item.consumableType,
        volume: item.volume,
        dryWeight: item.dryWeight,
        fullWeight: item.fullWeight,
        fillState: sac.packingFill[packingKey] ?? 'empty',
        item,
        kitPath: [],
        isPacked: sac.packingState[packingKey] ?? false,
        packingKey,
      })
    } else if (entry.type === 'kit') {
      const resolvedKit = resolveKitRecursive(entry.kitId, kits, items, [], [entry.entryId])
      for (const rk of resolvedKit) {
        const packingKey = `${entry.entryId}:${rk.itemId}:${rk.kitIdPath}`
        flatItems.push({
          ...rk,
          entryId: entry.entryId,
          packingKey,
          fillState: sac.packingFill[packingKey] ?? 'empty',
          isPacked: sac.packingState[packingKey] ?? false,
        })
      }
    }
  }

  return { flatItems, sac }
}

function resolveKitRecursive(kitId, kits, items, parentNames, parentKitIds) {
  const kit = kits.find(k => k.id === kitId)
  if (!kit) return []

  const result = []
  const kitNames = [...parentNames, kit.name]
  const kitIds = [...parentKitIds, kit.id]

  for (const entry of kit.itemEntries) {
    const item = items.find(i => i.id === entry.itemId)
    if (!item) continue
    result.push({
      id: `${kitIds.join('/')}:${entry.itemId}`,
      itemId: item.id,
      item,
      name: item.name,
      weight: item.weight,
      quantity: entry.quantity,
      categoryId: item.categoryId,
      isConsumable: item.isConsumable,
      isWorn: item.isWorn,
      consumableType: item.consumableType,
      volume: item.volume,
      dryWeight: item.dryWeight,
      fullWeight: item.fullWeight,
      kitPath: kitNames,
      kitIdPath: kitIds.slice(1).join('/'),
    })
  }

  for (const sub of kit.subKitEntries) {
    result.push(...resolveKitRecursive(sub.kitId, kits, items, kitNames, kitIds))
  }

  return result
}

export function getItemEffectiveWeight(fi) {
  const fillState = fi.fillState ?? 'empty'
  if (fi.consumableType === 'water' && fi.volume != null) {
    return (fillState === 'empty' ? (fi.weight || 0) : (fi.weight || 0) + fi.volume * 1000) * fi.quantity
  }
  if (fi.consumableType === 'fuel') {
    return (fillState === 'empty' ? fi.dryWeight : (fi.fullWeight || fi.weight)) * fi.quantity
  }
  return (fi.weight || 0) * fi.quantity
}

export function getSacTotalWeight(sac, kits, items) {
  const resolved = resolveSac(sac, kits, items)
  return resolved.flatItems.reduce((sum, fi) => {
    if (fi.deleted || fi.isWorn) return sum
    return sum + getItemEffectiveWeight(fi)
  }, 0)
}

export function getSacProgress(sac, kits, items) {
  const resolved = resolveSac(sac, kits, items)
  const total = resolved.flatItems.filter(fi => !fi.deleted).length
  const packed = resolved.flatItems.filter(fi => !fi.deleted && fi.isPacked).length
  return { total, packed, percent: total > 0 ? Math.round((packed / total) * 100) : 0 }
}

export function validateSac(sac) {
  const errors = []
  if (!sac.name || !sac.name.trim()) errors.push('Nom requis')
  return errors
}
