import { describe, it, expect } from 'vitest'

import {
  safeCompressForQr,
  decompressFromQr,
  canFitInQr,
  reassignIds,
} from './share.js'

describe('compress / decompress round-trip', () => {
  it('round-trips a payload through QR encoding', () => {
    const payload = {
      version: 1,
      items: [{ id: 'itm-1', name: 'Réchaud', weight: 300 }],
    }
    const { ok, value } = safeCompressForQr(payload)
    expect(ok).toBe(true)
    expect(typeof value).toBe('string')
    expect(value).not.toContain('=')
    expect(decompressFromQr(value)).toEqual(payload)
  })

  it('handles empty/edge payloads', () => {
    const payload = { categories: [], items: [], kits: [], sacs: [] }
    const { value } = safeCompressForQr(payload)
    expect(decompressFromQr(value)).toEqual(payload)
  })
})

describe('canFitInQr', () => {
  it('fits at M level for small payloads', () => {
    const { value } = safeCompressForQr({ items: [{ id: 'a' }] })
    const res = canFitInQr(value)
    expect(res.fits).toBe(true)
    expect(['M', 'L']).toContain(res.level)
    expect(res.size).toBe(value.length)
  })
})

describe('reassignIds', () => {
  it('maps item/kit/sac ids and remaps references consistently', () => {
    const existingState = {
      categories: [{ id: 'cat-1', name: 'Dormir' }],
      items: [{ id: 'itm-1', name: 'Conflicting', categoryId: 'cat-1' }],
      kits: [],
      sacs: [],
    }
    const payload = {
      categories: [{ id: 'pc-1', name: 'Dormir' }],
      items: [
        { id: 'itm-1', name: 'Conflicting', categoryId: 'pc-1', weight: 100 },
        { id: 'itm-2', name: 'Nouvel', categoryId: 'pc-1', weight: 200 },
      ],
      kits: [
        { id: 'kit-1', name: 'Kit', itemEntries: [{ itemId: 'itm-2', quantity: 1 }], subKitEntries: [] },
      ],
      sacs: [
        { id: 'sac-1', name: 'Sac', entries: [{ type: 'kit', kitId: 'kit-1' }] },
      ],
    }
    const result = reassignIds(payload, existingState)

    // Colliding ids get new ids
    expect(result.items.find(i => i.name === 'Conflicting').id).not.toBe('itm-1')
    // Non-colliding id preserved
    expect(result.items.find(i => i.name === 'Nouvel').id).toBe('itm-2')
    // Category resolved by name to existing
    expect(result.categories).toHaveLength(0)
    expect(result.items.find(i => i.name === 'Nouvel').categoryId).toBe('cat-1')

    // Kit pointer to new item id
    const kit = result.kits[0]
    expect(kit.itemEntries[0].itemId).toBe('itm-2')
    // Sac pointer to new kit id
    expect(result.sacs[0].entries[0].kitId).toBe(kit.id)
  })

  it('creates new categories when names are unknown', () => {
    const existingState = { categories: [], items: [], kits: [], sacs: [] }
    const payload = {
      categories: [{ id: 'pc-1', name: 'Nouvelle' }],
      items: [{ id: 'itm-1', name: 'X', categoryId: 'pc-1' }],
      kits: [],
      sacs: [],
    }
    const result = reassignIds(payload, existingState)
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0].name).toBe('Nouvelle')
    expect(result.items[0].categoryId).toBe(result.categories[0].id)
  })
})
