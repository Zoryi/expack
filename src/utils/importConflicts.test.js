import { describe, it, expect } from 'vitest'

import {
  MERGE,
  DUPLICATE,
  SKIP,
  detectConflicts,
  hasConflicts,
  applyImport,
} from './importConflicts.js'

function makeState() {
  return {
    categories: [
      { id: 'cat-sleep', name: 'Dormir' },
      { id: 'cat-cook', name: 'Cuisine' },
    ],
    items: [
      { id: 'itm-1', name: 'Sac de couchage', categoryId: 'cat-sleep', brand: 'Forclaz', weight: 1200, quantity: 1 },
      { id: 'itm-2', name: 'Sac de couchage', categoryId: 'cat-sleep', brand: 'Quechua', weight: 700, quantity: 2 },
      { id: 'itm-3', name: 'Réchaud', categoryId: 'cat-cook', brand: 'MSR', weight: 300 },
    ],
    kits: [],
    sacs: [],
  }
}

function makePayload() {
  return {
    categories: [
      { id: 'pc-sleep', name: 'Dormir' },
      { id: 'pc-wear', name: 'Vêtements' },
    ],
    items: [
      { id: 'p-itm-1', name: 'Sac de couchage', categoryId: 'pc-sleep', brand: 'Quechua', weight: 700, quantity: 2 },
    ],
    kits: [],
    sacs: [],
  }
}

describe('detectConflicts', () => {
  it('ranks same-name candidates and preselects the most similar', () => {
    const payload = makePayload()
    const existingState = makeState()
    const conflicts = detectConflicts(payload, existingState)

    expect(conflicts.items).toHaveLength(1)
    const c = conflicts.items[0]
    expect(c.index).toBe(0)

    // Two same-name items are candidates
    expect(c.candidates).toHaveLength(2)
    // Quechua ± 700g brand match outranks Forclaz 1200g
    expect(c.candidates[0].existing.id).toBe('itm-2')
    expect(c.selectedExistingId).toBe('itm-2')
  })

  it('uses name-first fallback when no candidate shares the category', () => {
    const existingState = makeState()
    // Payload item has a category that does NOT exist in existing state
    const payload = {
      ...makePayload(),
      categories: [{ id: 'pc-other', name: 'Autre' }],
      items: [
        { id: 'p-itm-1', name: 'Sac de couchage', categoryId: 'pc-other', brand: 'X', weight: 900 },
      ],
    }
    const conflicts = detectConflicts(payload, existingState)
    expect(conflicts.items).toHaveLength(1)
    expect(conflicts.items[0].candidates).toHaveLength(2)
  })

  it('returns no conflict when no same-name item exists', () => {
    const payload = {
      ...makePayload(),
      items: [{ id: 'p-x', name: 'Tente inconnue', categoryId: 'pc-wear' }],
    }
    const conflicts = detectConflicts(payload, makeState())
    expect(conflicts.items).toHaveLength(0)
  })

  it('flags fuzzy name matches (no exact candidate) as matchType fuzzy', () => {
    const existingState = {
      categories: [{ id: 'cat-sleep', name: 'Dormir' }],
      items: [
        { id: 'itm-1', name: 'Sac de couchage femme', categoryId: 'cat-sleep' },
      ],
      kits: [],
      sacs: [],
    }
    const payload = {
      categories: [{ id: 'pc-sleep', name: 'Dormir' }],
      items: [
        // Near-miss typo of the existing name — not exact, but high Dice similarity
        { id: 'p-fuzzy', name: 'Sac de couchage femm', categoryId: 'pc-sleep' },
      ],
      kits: [],
      sacs: [],
    }
    const conflicts = detectConflicts(payload, existingState)
    expect(conflicts.items).toHaveLength(1)
    const fuzzy = conflicts.items[0]
    expect(fuzzy.matchType).toBe('fuzzy')
    expect(fuzzy.candidates.some(c => c.existing.id === 'itm-1')).toBe(true)
  })

  it('detects kit and sac conflicts by exact name', () => {
    const existingState = makeState()
    existingState.kits = [{ id: 'kit-1', name: 'Kit cuisine', itemEntries: [], subKitEntries: [] }]
    existingState.sacs = [{ id: 'sac-1', name: 'Sac rando', entries: [] }]
    const payload = {
      categories: [],
      items: [],
      kits: [{ id: 'p-kit', name: 'Kit cuisine', itemEntries: [], subKitEntries: [] }],
      sacs: [{ id: 'p-sac', name: 'Sac rando', entries: [] }],
    }
    const conflicts = detectConflicts(payload, existingState)
    expect(conflicts.kits).toHaveLength(1)
    expect(conflicts.sacs).toHaveLength(1)
    expect(hasConflicts(conflicts)).toBe(true)
  })

  it('hasConflicts is false when nothing conflicts', () => {
    const payload = { categories: [], items: [], kits: [], sacs: [] }
    expect(hasConflicts(detectConflicts(payload, makeState()))).toBe(false)
  })
})

describe('applyImport', () => {
  it('duplicates an imported item with no conflict decision', () => {
    const existingState = makeState()
    const payload = {
      categories: [{ id: 'pc-wear', name: 'Vêtements' }],
      items: [{ id: 'p-new', name: 'T-shirt', categoryId: 'pc-wear', weight: 150 }],
      kits: [],
      sacs: [],
    }
    const result = applyImport(payload, existingState)

    expect(result.items).toHaveLength(4)
    const added = result.items.find(i => i.name === 'T-shirt')
    expect(added).toBeTruthy()
    // New category created
    expect(result.categories.map(c => c.name)).toContain('Vêtements')
    expect(result.summary).toEqual({ duplicated: 1, merged: 0, skipped: 0, items: [{ name: 'T-shirt', action: DUPLICATE }], kits: [], sacs: [] })
  })

  it('merges into the chosen candidate (existingId) instead of duplicating', () => {
    const existingState = makeState()
    const payload = makePayload()
    const decision = {
      items: {
        0: { action: MERGE, existingId: 'itm-2', fields: { brand: 'imported', weight: 'imported' } },
      },
    }
    const result = applyImport(payload, existingState, decision)

    // Merged, not duplicated
    expect(result.items).toHaveLength(3)
    const merged = result.items.find(i => i.id === 'itm-2')
    // existingId override chosen
    expect(merged.brand).toBe('Quechua')
    expect(merged.weight).toBe(700)
    // id identity preserved
    expect(result.items.some(i => i.id === 'itm-2')).toBe(true)
    expect(result.summary).toEqual({ duplicated: 0, merged: 1, skipped: 0, items: [{ name: 'Sac de couchage', action: MERGE }], kits: [], sacs: [] })
  })

  it('only overwrites fields marked as imported', () => {
    const existingState = makeState()
    const payload = makePayload()
    const decision = {
      items: {
        0: { action: MERGE, existingId: 'itm-1', fields: { brand: 'imported' } },
      },
    }
    const result = applyImport(payload, existingState, decision)
    const merged = result.items.find(i => i.id === 'itm-1')
    // brand overwritten
    expect(merged.brand).toBe('Quechua')
    // weight NOT overwritten (existing 1200 kept, not payload 700)
    expect(merged.weight).toBe(1200)
    expect(result.items).toHaveLength(3)
  })

  it('skips an item and maps its id to the conflict target', () => {
    const existingState = makeState()
    const payload = makePayload()
    const decision = { items: { 0: SKIP } }
    const result = applyImport(payload, existingState, decision)
    // Not duplicated
    expect(result.items).toHaveLength(3)
    expect(result.items.find(i => i.id === 'itm-2')).toBeTruthy()
    expect(result.items.find(i => i.id === 'p-itm-1')).toBeFalsy()
    expect(result.summary).toEqual({ duplicated: 0, merged: 0, skipped: 1, items: [{ name: 'Sac de couchage', action: SKIP }], kits: [], sacs: [] })
  })
})
