export const MERGE = 'merge'
export const DUPLICATE = 'duplicate'
export const SKIP = 'skip'

export const MEANINGFUL_ITEM_FIELDS = [
  'name',
  'categoryId',
  'brand',
  'model',
  'weight',
  'quantity',
  'length',
  'width',
  'depth',
  'volume',
  'condition',
  'purchaseDate',
  'purchasePrice',
  'isConsumable',
  'consumableType',
  'capacityL',
  'dryWeight',
  'fullWeight',
  'isWorn',
  'priority',
  'isFavorite',
  'notes',
]

export const ITEM_FIELD_LABELS = {
  name: 'Nom',
  categoryId: 'Catégorie',
  brand: 'Marque',
  model: 'Modèle',
  weight: 'Poids',
  quantity: 'Quantité',
  length: 'Longueur',
  width: 'Largeur',
  depth: 'Profondeur',
  volume: 'Volume',
  condition: 'État',
  purchaseDate: "Date d'achat",
  purchasePrice: "Prix d'achat",
  isConsumable: 'Consommable',
  consumableType: 'Type de consommable',
  capacityL: 'Capacité (L)',
  dryWeight: 'Poids à vide',
  fullWeight: 'Poids en charge',
  isWorn: 'Porté',
  priority: 'Priorité',
  isFavorite: 'Favori',
  notes: 'Notes',
}

let _idCounter = Date.now()

function generateId(prefix) {
  return `${prefix}-${++_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

function normalize(str) {
  return (str || '').trim().toLowerCase()
}

export function detectConflicts(payload, existingState) {
  const existingCategoriesByName = {}
  for (const cat of existingState.categories) {
    existingCategoriesByName[normalize(cat.name)] = cat
  }

  const resolutionForCategory = (categoryId, payload) => {
    const cat = payload.categories.find(c => c.id === categoryId)
    if (!cat) return null
    return existingCategoriesByName[normalize(cat.name)] || null
  }

  const items = []
  for (let i = 0; i < payload.items.length; i++) {
    const imported = payload.items[i]
    const existingCat = resolutionForCategory(imported.categoryId, payload)
    let existing = existingState.items.find(it =>
      normalize(it.name) === normalize(imported.name) && existingCat && it.categoryId === existingCat.id
    )
    if (!existing && !existingCat && imported.categoryId) {
      existing = existingState.items.find(it => normalize(it.name) === normalize(imported.name))
    }
    if (existing) items.push({ index: i, imported, existing })
  }

  const kits = []
  for (let i = 0; i < payload.kits.length; i++) {
    const imported = payload.kits[i]
    const existing = existingState.kits.find(k => normalize(k.name) === normalize(imported.name))
    if (existing) kits.push({ index: i, imported, existing })
  }

  const sacs = []
  for (let i = 0; i < payload.sacs.length; i++) {
    const imported = payload.sacs[i]
    const existing = existingState.sacs.find(s => normalize(s.name) === normalize(imported.name))
    if (existing) sacs.push({ index: i, imported, existing })
  }

  return { items, kits, sacs }
}

export function hasConflicts(conflicts) {
  return conflicts.items.length > 0 || conflicts.kits.length > 0 || conflicts.sacs.length > 0
}

function mergeItem(existing, imported, fields) {
  const merged = { ...existing }
  for (const field of Object.keys(fields)) {
    if (fields[field] === 'imported' && imported[field] !== undefined) {
      merged[field] = imported[field]
    }
  }
  merged.updatedAt = new Date().toISOString()
  return merged
}

function decisionAction(decision) {
  if (!decision) return DUPLICATE
  if (typeof decision === 'string') return decision
  return decision.action || DUPLICATE
}

function mergeKitReferences(existingKit, importedKit, itemIdMap, kitIdMap) {
  const existingItems = existingKit.itemEntries.map(e => e.itemId)
  const existingSubs = existingKit.subKitEntries.map(e => e.kitId)

  for (const e of importedKit.itemEntries) {
    const target = itemIdMap[e.itemId]
    if (target && !existingItems.includes(target)) {
      existingItems.push(target)
    }
  }
  for (const e of importedKit.subKitEntries) {
    const target = kitIdMap[e.kitId]
    if (target && target !== existingKit.id && !existingSubs.includes(target)) {
      existingSubs.push(target)
    }
  }

  return {
    ...existingKit,
    itemEntries: existingItems.map(itemId => ({ itemId, quantity: 1 })),
    subKitEntries: existingSubs.map(kitId => ({ kitId })),
    updatedAt: new Date().toISOString(),
  }
}

function mergeSacReferences(existingSac, importedSac, itemIdMap, kitIdMap) {
  const existingEntries = existingSac.entries || []
  const existingItemIds = new Set(existingEntries.filter(e => e.type === 'item').map(e => e.itemId))
  const existingKitIds = new Set(existingEntries.filter(e => e.type === 'kit').map(e => e.kitId))

  const entries = [...existingEntries]
  for (const e of importedSac.entries || []) {
    if (e.type === 'item') {
      const target = itemIdMap[e.itemId]
      if (target && !existingItemIds.has(target)) {
        existingItemIds.add(target)
        entries.push({ entryId: generateId('sac'), type: 'item', itemId: target, quantity: e.quantity || 1 })
      }
    } else if (e.type === 'kit') {
      const target = kitIdMap[e.kitId]
      if (target && !existingKitIds.has(target)) {
        existingKitIds.add(target)
        entries.push({ entryId: generateId('sac'), type: 'kit', kitId: target })
      }
    }
  }

  return {
    ...existingSac,
    entries,
    updatedAt: new Date().toISOString(),
  }
}

export function applyImport(payload, existingState, decisions = {}) {
  if (!decisions.items) decisions.items = {}
  if (!decisions.kits) decisions.kits = {}
  if (!decisions.sacs) decisions.sacs = {}

  const existingCategoriesByName = {}
  for (const cat of existingState.categories) {
    existingCategoriesByName[normalize(cat.name)] = cat
  }

  const finalCategories = [...existingState.categories]
  const catIdMap = {}

  for (const cat of payload.categories) {
    const existing = existingCategoriesByName[normalize(cat.name)]
    if (existing) {
      catIdMap[cat.id] = existing.id
    } else {
      const newId = generateId('cat')
      catIdMap[cat.id] = newId
      finalCategories.push({ ...cat, id: newId })
      existingCategoriesByName[normalize(cat.name)] = { id: newId }
    }
  }

  const finalItems = [...existingState.items]
  const existingItemIds = new Set(existingState.items.map(i => i.id))
  const itemIdMap = {}

  const itemConflictByIndex = {}
  for (const c of detectConflicts(payload, existingState).items) {
    itemConflictByIndex[c.index] = c
  }

  for (let i = 0; i < payload.items.length; i++) {
    const imported = payload.items[i]
    const conflict = itemConflictByIndex[i] || null
    const action = decisionAction(decisions.items[i])
    const fields = decisions.items[i] && decisions.items[i].action === MERGE
      ? decisions.items[i].fields || {}
      : {}

    if (action === SKIP) {
      itemIdMap[imported.id] = conflict ? conflict.existing.id : imported.id
      continue
    }

    const categoryId = catIdMap[imported.categoryId] || imported.categoryId

    if (action === MERGE && conflict) {
      const merged = mergeItem(conflict.existing, { ...imported, categoryId }, fields)
      const idx = finalItems.findIndex(it => it.id === conflict.existing.id)
      if (idx >= 0) finalItems[idx] = merged
      else finalItems.push(merged)
      itemIdMap[imported.id] = merged.id
    } else {
      const newId = existingItemIds.has(imported.id) ? generateId('itm') : imported.id
      finalItems.push({ ...imported, id: newId, categoryId })
      existingItemIds.add(newId)
      itemIdMap[imported.id] = newId
    }
  }

  const finalKits = [...existingState.kits]
  const existingKitIds = new Set(existingState.kits.map(k => k.id))
  const kitIdMap = {}

  for (let i = 0; i < payload.kits.length; i++) {
    const imported = payload.kits[i]
    const conflict = detectConflictByName(payload.kits, existingState.kits, imported, i)
    const action = decisionAction(decisions.kits[i])

    if (action === SKIP) {
      kitIdMap[imported.id] = conflict ? conflict.existing.id : imported.id
      continue
    }

    if (action === MERGE && conflict) {
      const merged = mergeKitReferences(
        conflict.existing,
        imported,
        itemIdMap,
        kitIdMap
      )
      const idx = finalKits.findIndex(k => k.id === conflict.existing.id)
      if (idx >= 0) finalKits[idx] = merged
      else finalKits.push(merged)
      kitIdMap[imported.id] = merged.id
    } else {
      const newId = existingKitIds.has(imported.id) ? generateId('kit') : imported.id
      finalKits.push({
        ...imported,
        id: newId,
        itemEntries: (imported.itemEntries || []).map(e => ({
          itemId: itemIdMap[e.itemId] || e.itemId,
          quantity: e.quantity,
        })),
        subKitEntries: (imported.subKitEntries || []).map(e => ({
          kitId: kitIdMap[e.kitId] || e.kitId,
        })),
      })
      existingKitIds.add(newId)
      kitIdMap[imported.id] = newId
    }
  }

  const finalSacs = [...existingState.sacs]
  const existingSacIds = new Set(existingState.sacs.map(s => s.id))

  for (let i = 0; i < payload.sacs.length; i++) {
    const imported = payload.sacs[i]
    const conflict = detectConflictByName(payload.sacs, existingState.sacs, imported, i)
    const action = decisionAction(decisions.sacs[i])

    if (action === SKIP) continue

    if (action === MERGE && conflict) {
      const merged = mergeSacReferences(conflict.existing, imported, itemIdMap, kitIdMap)
      const idx = finalSacs.findIndex(s => s.id === conflict.existing.id)
      if (idx >= 0) finalSacs[idx] = merged
      else finalSacs.push(merged)
    } else {
      const newId = existingSacIds.has(imported.id) ? generateId('sac') : imported.id
      finalSacs.push({
        ...imported,
        id: newId,
        entries: (imported.entries || []).map(e => ({
          ...e,
          itemId: e.itemId ? (itemIdMap[e.itemId] || e.itemId) : undefined,
          kitId: e.kitId ? (kitIdMap[e.kitId] || e.kitId) : undefined,
        })),
      })
      existingSacIds.add(newId)
    }
  }

  return { items: finalItems, categories: finalCategories, kits: finalKits, sacs: finalSacs }
}

function detectConflictByName(importedList, existingList, imported, index) {
  const existing = existingList.find(x => normalize(x.name) === normalize(imported.name))
  return existing ? { index, imported, existing } : null
}
