import { createId } from '../utils/id'

export function generateId() {
  return createId('itm')
}

export const CONDITION = {
  NEUF: 'neuf',
  BON: 'bon',
  USAGE: 'usage',
  MAUVAIS: 'mauvais',
  REMPLACER: 'remplacer',
}

export const CONDITION_LABELS = {
  [CONDITION.NEUF]: 'Neuf',
  [CONDITION.BON]: 'Bon état',
  [CONDITION.USAGE]: 'Usage',
  [CONDITION.MAUVAIS]: 'Mauvais état',
  [CONDITION.REMPLACER]: 'À remplacer',
}

export const CONDITION_COLORS = {
  [CONDITION.NEUF]: '#22c55e',
  [CONDITION.BON]: '#3b82f6',
  [CONDITION.USAGE]: '#f59e0b',
  [CONDITION.MAUVAIS]: '#ef4444',
  [CONDITION.REMPLACER]: '#dc2626',
}

export const CONSUMABLE_TYPE = {
  WATER: 'water',
  FUEL: 'fuel',
  FOOD: 'food',
  OTHER: 'other',
}

export const CONSUMABLE_TYPE_LABELS = {
  [CONSUMABLE_TYPE.WATER]: 'Eau',
  [CONSUMABLE_TYPE.FUEL]: 'Gaz',
  [CONSUMABLE_TYPE.FOOD]: 'Nourriture',
  [CONSUMABLE_TYPE.OTHER]: 'Autre',
}

export const CONDITION_ORDER = [
  CONDITION.NEUF,
  CONDITION.BON,
  CONDITION.USAGE,
  CONDITION.MAUVAIS,
  CONDITION.REMPLACER,
]

export const PRIORITY = {
  INDISPENSABLE: 'indispensable',
  IMPORTANT: 'important',
  OPTIONNEL: 'optionnel',
}

export const PRIORITY_LABELS = {
  [PRIORITY.INDISPENSABLE]: 'Indispensable',
  [PRIORITY.IMPORTANT]: 'Important',
  [PRIORITY.OPTIONNEL]: 'Optionnel',
}

const DEFAULT_VALUES = {
  name: '',
  categoryId: '',
  brand: '',
  model: '',
  weight: 0,
  quantity: 1,
  length: null,
  width: null,
  depth: null,
  volume: null,
  condition: CONDITION.BON,
  purchaseDate: '',
  purchasePrice: null,
  isConsumable: false,
  consumableType: CONSUMABLE_TYPE.OTHER,
  dryWeight: 0,
  fullWeight: 0,
  isWorn: false,
  priority: PRIORITY.IMPORTANT,
  isFavorite: false,
  notes: '',
}

export function createItem(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    ...DEFAULT_VALUES,
    ...overrides,
    createdAt: overrides.createdAt || now,
    updatedAt: now,
  }
}

export function updateItem(item, changes) {
  return {
    ...item,
    ...changes,
    updatedAt: new Date().toISOString(),
  }
}

export function validateItem(item) {
  const errors = []
  if (!item.name || !item.name.trim()) errors.push('Nom requis')
  if (!item.categoryId) errors.push('Catégorie requise')
  if (typeof item.weight !== 'number' || item.weight < 0) errors.push('Poids invalide')
  if (typeof item.quantity !== 'number' || item.quantity < 1) errors.push('Quantité invalide')
  if (!CONDITION_ORDER.includes(item.condition)) errors.push('État invalide')
  return errors
}
