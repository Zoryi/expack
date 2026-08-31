import { createId } from './id'
import { normalize } from './string'

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
  'dryWeight',
  'fullWeight',
  'isWorn',
  'priority',
  'isFavorite',
  'notes',
]

const NUMERIC_ITEM_FIELDS = new Set([
  'weight', 'quantity', 'length', 'width', 'depth', 'volume',
  'purchasePrice', 'dryWeight', 'fullWeight',
])

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
  dryWeight: 'Poids à vide',
  fullWeight: 'Poids en charge',
  isWorn: 'Porté',
  priority: 'Priorité',
  isFavorite: 'Favori',
  notes: 'Notes',
}

const FUZZY_THRESHOLD = 0.9

function bigrams(str) {
  const s = normalize(str)
  const grams = new Set()
  if (s.length === 1) return new Set([s])
  for (let i = 0; i < s.length - 1; i++) grams.add(s.slice(i, i + 2))
  return grams
}

function diceCoefficient(a, b) {
  const ga = bigrams(a)
  const gb = bigrams(b)
  if (ga.size === 0 && gb.size === 0) return 1
  if (ga.size === 0 || gb.size === 0) return 0
  let inter = 0
  for (const g of ga) if (gb.has(g)) inter++
  return (2 * inter) / (ga.size + gb.size)
}

function nameSimilarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 2
  const dice = diceCoefficient(na, nb)
  return dice >= FUZZY_THRESHOLD ? dice : 0
}

function collectItemCandidates(imported, existingState) {
  const exact = []
  for (const it of existingState.items) {
    if (normalize(it.name) !== normalize(imported.name)) continue
    exact.push(it)
  }
  if (exact.length > 0) return { candidates: exact, matchType: 'exact' }

  const fuzzy = []
  for (const it of existingState.items) {
    if (nameSimilarity(imported.name, it.name) >= FUZZY_THRESHOLD) fuzzy.push(it)
  }
  return { candidates: fuzzy, matchType: fuzzy.length > 0 ? 'fuzzy' : 'exact' }
}

function isFilled(value) {
  return value !== undefined && value !== null && value !== ''
}

function categoryNameForId(categories, id) {
  if (!categories || !id) return ''
  const cat = categories.find(c => c.id === id)
  return cat ? cat.name : ''
}

function itemFieldCompare(existing, imported, field, existingState, payload) {
  const ea = existing[field]
  const ia = imported[field]
  const eEmpty = !isFilled(ea)
  const iEmpty = !isFilled(ia)
  if (eEmpty && iEmpty) return 0
  if (field === 'categoryId') {
    const en = categoryNameForId(existingState.categories, ea)
    const im = categoryNameForId(payload.categories, ia)
    return (!!en && en === im) ? 1 : -1
  }
  if (NUMERIC_ITEM_FIELDS.has(field)) {
    if (eEmpty || iEmpty) return -1
    const e = Number(ea)
    const i = Number(ia)
    if (e === i) return 2
    const max = Math.max(Math.abs(e), Math.abs(i), 1)
    const rel = Math.abs(e - i) / max
    return rel < 0.05 ? 1 : (rel < 0.3 ? 0 : -1)
  }
  if (typeof ea === 'boolean' || typeof ia === 'boolean') {
    return ea === ia ? 1 : -1
  }
  if (normalize(String(ea)) === normalize(String(ia))) return 1
  return 0
}

function scoreSimilarity(existing, imported, existingState, payload) {
  let score = 0
  for (const field of MEANINGFUL_ITEM_FIELDS) {
    score += itemFieldCompare(existing, imported, field, existingState, payload)
  }
  return score
}

export function detectConflicts(payload, existingState) {
  const items = []
  for (let i = 0; i < payload.items.length; i++) {
    const imported = payload.items[i]

    const { candidates, matchType } = collectItemCandidates(imported, existingState)

    if (candidates.length === 0) continue

    const ranked = candidates
      .map(existing => ({ existing, score: scoreSimilarity(existing, imported, existingState, payload) }))
      .sort((a, b) => b.score - a.score)

    items.push({
      index: i,
      imported,
      candidates: ranked,
      selectedExistingId: ranked[0].existing.id,
      matchType,
    })
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

function resolveChosenExisting(conflict, decision) {
  if (!conflict) return null
  const chosenId = decision && decision.existingId
    ? decision.existingId
    : conflict.selectedExistingId
  const found = conflict.candidates.find(c => c.existing.id === chosenId)
  return found ? found.existing : (conflict.candidates[0] ? conflict.candidates[0].existing : null)
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
        entries.push({ entryId: createId('sac'), type: 'item', itemId: target, quantity: e.quantity || 1 })
      }
    } else if (e.type === 'kit') {
      const target = kitIdMap[e.kitId]
      if (target && !existingKitIds.has(target)) {
        existingKitIds.add(target)
        entries.push({ entryId: createId('sac'), type: 'kit', kitId: target })
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
      const newId = createId('cat')
      catIdMap[cat.id] = newId
      finalCategories.push({ ...cat, id: newId })
      existingCategoriesByName[normalize(cat.name)] = { id: newId }
    }
  }

  const finalItems = [...existingState.items]
  const existingItemIds = new Set(existingState.items.map(i => i.id))
  const itemIdMap = {}

  const summary = { duplicated: 0, merged: 0, skipped: 0, items: [], kits: [], sacs: [] }

  const itemConflictByIndex = {}
  for (const c of detectConflicts(payload, existingState).items) {
    itemConflictByIndex[c.index] = c
  }

  for (let i = 0; i < payload.items.length; i++) {
    const imported = payload.items[i]
    const conflict = itemConflictByIndex[i] || null
    const decision = decisions.items[i]
    const action = decisionAction(decision)
    const fields = decision && decision.action === MERGE
      ? decision.fields || {}
      : {}
    const target = resolveChosenExisting(conflict, decision)

    if (action === SKIP) {
      summary.skipped++
      summary.items.push({ name: imported.name, action })
      itemIdMap[imported.id] = target ? target.id : imported.id
      continue
    }

    const categoryId = catIdMap[imported.categoryId] || imported.categoryId

    if (action === MERGE && target) {
      const merged = mergeItem(target, { ...imported, categoryId }, fields)
      const idx = finalItems.findIndex(it => it.id === target.id)
      if (idx >= 0) finalItems[idx] = merged
      else finalItems.push(merged)
      itemIdMap[imported.id] = merged.id
      summary.merged++
    } else {
      const newId = existingItemIds.has(imported.id) ? createId('itm') : imported.id
      finalItems.push({ ...imported, id: newId, categoryId })
      existingItemIds.add(newId)
      itemIdMap[imported.id] = newId
      summary.duplicated++
    }
    summary.items.push({ name: imported.name, action: action === MERGE ? MERGE : DUPLICATE })
  }

  const finalKits = [...existingState.kits]
  const existingKitIds = new Set(existingState.kits.map(k => k.id))
  const kitIdMap = {}

  for (let i = 0; i < payload.kits.length; i++) {
    const imported = payload.kits[i]
    const conflict = detectConflictByName(existingState.kits, imported, i)
    const action = decisionAction(decisions.kits[i])

    if (action === SKIP) {
      summary.skipped++
      summary.kits.push({ name: imported.name, action })
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
      summary.merged++
    } else {
      const newId = existingKitIds.has(imported.id) ? createId('kit') : imported.id
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
      summary.duplicated++
    }
    summary.kits.push({ name: imported.name, action: action === MERGE ? MERGE : DUPLICATE })
  }

  const finalSacs = [...existingState.sacs]
  const existingSacIds = new Set(existingState.sacs.map(s => s.id))

  for (let i = 0; i < payload.sacs.length; i++) {
    const imported = payload.sacs[i]
    const conflict = detectConflictByName(existingState.sacs, imported, i)
    const action = decisionAction(decisions.sacs[i])

    if (action === SKIP) {
      summary.skipped++
      summary.sacs.push({ name: imported.name, action })
      continue
    }

    if (action === MERGE && conflict) {
      const merged = mergeSacReferences(conflict.existing, imported, itemIdMap, kitIdMap)
      const idx = finalSacs.findIndex(s => s.id === conflict.existing.id)
      if (idx >= 0) finalSacs[idx] = merged
      else finalSacs.push(merged)
      summary.merged++
    } else {
      const newId = existingSacIds.has(imported.id) ? createId('sac') : imported.id
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
      summary.duplicated++
    }
    summary.sacs.push({ name: imported.name, action: action === MERGE ? MERGE : DUPLICATE })
  }

  return { items: finalItems, categories: finalCategories, kits: finalKits, sacs: finalSacs, summary }
}

function detectConflictByName(existingList, imported, index) {
  const existing = existingList.find(x => normalize(x.name) === normalize(imported.name))
  return existing ? { index, imported, existing } : null
}
