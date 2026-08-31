import { describe, it, expect } from 'vitest'
import {
  createSac,
  resolveSac,
  getItemEffectiveWeight,
  getSacTotalWeight,
  toggleFill,
} from './sac'

const water = {
  id: 'itm-water',
  name: 'Poche à eau',
  weight: 130,
  quantity: 1,
  isConsumable: true,
  consumableType: 'water',
  volume: 3,
}
const fuel = {
  id: 'itm-fuel',
  name: 'Gaz',
  weight: 150,
  quantity: 1,
  isConsumable: true,
  consumableType: 'fuel',
  dryWeight: 140,
  fullWeight: 370,
}
const normal = { id: 'itm-tent', name: 'Tente', weight: 1800, quantity: 1 }
const kit = {
  id: 'kit-cuisine',
  name: 'Cuisine légère',
  itemEntries: [
    { itemId: 'itm-fuel', quantity: 1 },
    { itemId: 'itm-tent', quantity: 1 },
  ],
  subKitEntries: [],
}

function sacWithPackingFill(packingFill) {
  return {
    ...createSac({ name: 'Sac' }),
    entries: [
      { entryId: 'e1', type: 'item', itemId: 'itm-water', quantity: 1 },
      { entryId: 'e2', type: 'kit', kitId: 'kit-cuisine' },
    ],
    packingFill,
  }
}

describe('resolveSac consumer propagation', () => {
  it('carries consumable fields and default fillState=empty for direct entries', () => {
    const sac = sacWithPackingFill({})
    const { flatItems } = resolveSac(sac, [kit], [water, fuel, normal])
    const fi = flatItems.find(f => f.itemId === 'itm-water')
    expect(fi.consumableType).toBe('water')
    expect(fi.volume).toBe(3)
    expect(fi.fillState).toBe('empty')
  })

  it('carries consumable fields for kit-resolved entries', () => {
    const sac = sacWithPackingFill({})
    const { flatItems } = resolveSac(sac, [kit], [water, fuel, normal])
    const fi = flatItems.find(f => f.itemId === 'itm-fuel')
    expect(fi.consumableType).toBe('fuel')
    expect(fi.dryWeight).toBe(140)
    expect(fi.fullWeight).toBe(370)
    expect(fi.fillState).toBe('empty')
  })

  it('honors sac.packingFill in fillState', () => {
    const sac = sacWithPackingFill({ 'e1:itm-water:': 'full' })
    const { flatItems } = resolveSac(sac, [kit], [water, fuel, normal])
    const fi = flatItems.find(f => f.itemId === 'itm-water')
    const fuelFi = flatItems.find(f => f.itemId === 'itm-fuel')
    expect(fi.fillState).toBe('full')
    expect(fuelFi.fillState).toBe('empty')
  })
})

describe('getItemEffectiveWeight', () => {
  it('defaults missing fillState to empty (water)', () => {
    expect(getItemEffectiveWeight({ ...water })).toBe(130)
  })

  it('water empty vs full', () => {
    expect(getItemEffectiveWeight({ ...water, fillState: 'empty' })).toBe(130)
    expect(getItemEffectiveWeight({ ...water, fillState: 'full' })).toBe(3130)
  })

  it('fuel empty vs full', () => {
    expect(getItemEffectiveWeight({ ...fuel, fillState: 'empty' })).toBe(140)
    expect(getItemEffectiveWeight({ ...fuel, fillState: 'full' })).toBe(370)
  })

  it('normal items ignore fillState', () => {
    expect(getItemEffectiveWeight({ ...normal, fillState: 'full' })).toBe(1800)
  })
})

describe('getSacTotalWeight', () => {
  it('counts consumables as empty by default and full when toggled', () => {
    const base = sacWithPackingFill({})
    expect(getSacTotalWeight(base, [kit], [water, fuel, normal]))
      .toBe(130 + 140 + 1800)

    const full = sacWithPackingFill({
      'e1:itm-water:': 'full',
      'e2:itm-fuel:kit-cuisine': 'full',
    })
    expect(getSacTotalWeight(full, [kit], [water, fuel, normal]))
      .toBe(3130 + 370 + 1800)
  })
})

describe('toggleFill', () => {
  it('defaults to empty and toggles to full', () => {
    const sac = createSac({ name: 'Sac', entries: [{ entryId: 'e1', type: 'item', itemId: 'itm-water', quantity: 1 }] })
    const after = toggleFill(sac, 'e1:itm-water:')
    expect(after.packingFill['e1:itm-water:']).toBe('empty')
    const again = toggleFill(after, 'e1:itm-water:')
    expect(again.packingFill['e1:itm-water:']).toBe('full')
  })
})
