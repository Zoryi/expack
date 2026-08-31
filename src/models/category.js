import { createId } from '../utils/id'

export function generateId() {
  return createId('cat')
}

export function createCategory(overrides = {}) {
  return {
    id: generateId(),
    name: '',
    icon: 'duffel',
    color: '#6b7280',
    ...overrides,
  }
}

export const DEFAULT_CATEGORIES = [
  { id: 'cat-abri', name: 'Abri & Nuit', icon: 'tent', color: '#3b82f6' },
  { id: 'cat-cuisine', name: 'Cuisine & Eau', icon: 'cook', color: '#f59e0b' },
  { id: 'cat-vetements', name: 'Vêtements', icon: 'shirt', color: '#8b5cf6' },
  { id: 'cat-sac', name: 'Sac & Transport', icon: 'duffel', color: '#10b981' },
  { id: 'cat-securite', name: 'Sécurité & Secours', icon: 'safety', color: '#ef4444' },
  { id: 'cat-navigation', name: 'Navigation', icon: 'compass', color: '#06b6d4' },
  { id: 'cat-hygiene', name: 'Hygiène & Santé', icon: 'hygiene', color: '#ec4899' },
  { id: 'cat-divers', name: 'Divers', icon: 'tools', color: '#6b7280' },
]
