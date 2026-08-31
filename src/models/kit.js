import { createId } from '../utils/id'

export function generateId() {
  return createId('kit')
}

export function createKit(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name: '',
    description: '',
    icon: '📦',
    color: '#6b7280',
    itemEntries: [],
    subKitEntries: [],
    createdAt: overrides.createdAt || now,
    updatedAt: now,
    ...overrides,
  }
}

export function resolveKitItems(kitId, kits, items, kitIdPath = '') {
  const kit = kits.find(k => k.id === kitId)
  if (!kit) return []

  const result = []

  for (const entry of kit.itemEntries) {
    const item = items.find(i => i.id === entry.itemId)
    if (!item) continue
    result.push({
      item,
      quantity: entry.quantity,
      kitIdPath: kitIdPath,
      kitIds: kitIdPath ? [...kitIdPath.split('/').filter(Boolean), kit.id] : [kit.id],
    })
  }

  for (const sub of kit.subKitEntries) {
    const childPath = kitIdPath ? `${kitIdPath}/${kit.id}` : kit.id
    result.push(...resolveKitItems(sub.kitId, kits, items, childPath))
  }

  return result
}

export function getKitTotalWeight(kitId, kits, items) {
  const kit = kits.find(k => k.id === kitId)
  if (!kit) return { weight: 0, itemCount: 0 }
  let weight = 0
  let itemCount = 0
  for (const ie of kit.itemEntries) {
    const item = items.find(i => i.id === ie.itemId)
    if (item) {
      weight += (item.weight || 0) * ie.quantity
      itemCount++
    }
  }
  for (const se of kit.subKitEntries) {
    const sub = getKitTotalWeight(se.kitId, kits, items)
    weight += sub.weight
    itemCount += sub.itemCount
  }
  return { weight, itemCount }
}

export function validateKit(kit) {
  const errors = []
  if (!kit.name || !kit.name.trim()) errors.push('Nom requis')
  return errors
}
