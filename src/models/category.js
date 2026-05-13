const ID_PREFIX = 'cat'

let _counter = Date.now()

export function generateId() {
  return `${ID_PREFIX}-${++_counter}-${Math.random().toString(36).slice(2, 6)}`
}

export function createCategory(overrides = {}) {
  return {
    id: generateId(),
    name: '',
    icon: '📦',
    color: '#6b7280',
    ...overrides,
  }
}

export const DEFAULT_CATEGORIES = [
  { id: 'cat-abri', name: 'Abri & Nuit', icon: '🏕️', color: '#3b82f6' },
  { id: 'cat-cuisine', name: 'Cuisine & Eau', icon: '🍳', color: '#f59e0b' },
  { id: 'cat-vetements', name: 'Vêtements', icon: '👕', color: '#8b5cf6' },
  { id: 'cat-sac', name: 'Sac & Transport', icon: '🎒', color: '#10b981' },
  { id: 'cat-securite', name: 'Sécurité & Secours', icon: '🆘', color: '#ef4444' },
  { id: 'cat-navigation', name: 'Navigation', icon: '🧭', color: '#06b6d4' },
  { id: 'cat-hygiene', name: 'Hygiène & Santé', icon: '🧴', color: '#ec4899' },
  { id: 'cat-divers', name: 'Divers', icon: '🔧', color: '#6b7280' },
]
