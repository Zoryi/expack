import { createContext, useCallback, useMemo } from 'react'
import { useStorage } from '../hooks/useStorage'
import { createItem, updateItem as updateItemModel, validateItem } from '../models/item'
import { createCategory } from '../models/category'
import { DEFAULT_CATEGORIES } from '../models/category'
import { createKit, resolveKitItems, validateKit } from '../models/kit'
import { createSac, resolveSac, addDirectEntry, addKitEntry, removeEntry, togglePacked, setAllPacked, getSacTotalWeight, getSacProgress } from '../models/sac'

export const GearContext = createContext(null)

export function GearProvider({ children }) {
  const [items, setItems, itemsMeta] = useStorage('gear-items', [])
  const [categories, setCategories, categoriesMeta] = useStorage('gear-categories', DEFAULT_CATEGORIES)
  const [kits, setKits, kitsMeta] = useStorage('gear-kits', [])
  const [sacs, setSacs, sacsMeta] = useStorage('gear-sacs', [])

  const loading = itemsMeta.loading || categoriesMeta.loading || kitsMeta.loading || sacsMeta.loading
  const error = itemsMeta.error || categoriesMeta.error || kitsMeta.error || sacsMeta.error

  const getCategory = useCallback((id) => categories.find(c => c.id === id), [categories])

  const getItem = useCallback((id) => items.find(i => i.id === id), [items])

  const getKit = useCallback((id) => kits.find(k => k.id === id), [kits])

  const getSac = useCallback((id) => sacs.find(s => s.id === id), [sacs])

  const addItem = useCallback((data) => {
    const newItem = createItem(data)
    setItems(prev => [...prev, newItem])
    return newItem
  }, [setItems])

  const updateItem = useCallback((id, changes) => {
    setItems(prev => prev.map(i => i.id === id ? updateItemModel(i, changes) : i))
  }, [setItems])

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setKits(prev => prev.map(k => ({
      ...k,
      itemEntries: k.itemEntries.filter(e => e.itemId !== id),
      updatedAt: new Date().toISOString(),
    })))
  }, [setItems, setKits])

  const addCategory = useCallback((data) => {
    const newCat = createCategory(data)
    setCategories(prev => [...prev, newCat])
    return newCat
  }, [setCategories])

  const updateCategory = useCallback((id, changes) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }, [setCategories])

  const deleteCategory = useCallback((id) => {
    const linked = items.some(i => i.categoryId === id)
    if (linked) return false
    setCategories(prev => prev.filter(c => c.id !== id))
    return true
  }, [setCategories, items])

  const addKit = useCallback((data) => {
    const newKit = createKit(data)
    setKits(prev => [...prev, newKit])
    return newKit
  }, [setKits])

  const updateKit = useCallback((id, changes) => {
    setKits(prev => prev.map(k => k.id === id ? { ...k, ...changes, updatedAt: new Date().toISOString() } : k))
  }, [setKits])

  const deleteKit = useCallback((id) => {
    setKits(prev => prev.filter(k => k.id !== id))
    setKits(prev => prev.map(k => ({
      ...k,
      subKitEntries: k.subKitEntries.filter(e => e.kitId !== id),
      updatedAt: new Date().toISOString(),
    })))
  }, [setKits])

  const addSac = useCallback((data) => {
    const newSac = createSac(data)
    setSacs(prev => [...prev, newSac])
    return newSac
  }, [setSacs])

  const updateSac = useCallback((id, changes) => {
    setSacs(prev => prev.map(s => s.id === id ? { ...s, ...changes, updatedAt: new Date().toISOString() } : s))
  }, [setSacs])

  const deleteSac = useCallback((id) => {
    setSacs(prev => prev.filter(s => s.id !== id))
  }, [setSacs])

  const getResolvedSac = useCallback((sacId) => {
    const sac = sacs.find(s => s.id === sacId)
    if (!sac) return null
    return resolveSac(sac, kits, items)
  }, [sacs, kits, items])

  const sacAddDirectItem = useCallback((sacId, itemId, quantity) => {
    setSacs(prev => prev.map(s => s.id === sacId ? addDirectEntry(s, itemId, quantity) : s))
  }, [setSacs])

  const sacAddKit = useCallback((sacId, kitId) => {
    setSacs(prev => prev.map(s => s.id === sacId ? addKitEntry(s, kitId) : s))
  }, [setSacs])

  const sacRemoveEntry = useCallback((sacId, entryId) => {
    setSacs(prev => prev.map(s => s.id === sacId ? removeEntry(s, entryId) : s))
  }, [setSacs])

  const sacTogglePacked = useCallback((sacId, packingKey) => {
    setSacs(prev => prev.map(s => s.id === sacId ? togglePacked(s, packingKey) : s))
  }, [setSacs])

  const sacSetAllPacked = useCallback((sacId, packed) => {
    setSacs(prev => prev.map(s => s.id === sacId ? setAllPacked(s, packed) : s))
  }, [setSacs])

  const getItemsByCategory = useCallback((categoryId) => {
    return items.filter(i => i.categoryId === categoryId)
  }, [items])

  const getItemsNotInKit = useCallback((kitId) => {
    const kit = kits.find(k => k.id === kitId)
    if (!kit) return items
    const kitItemIds = new Set(kit.itemEntries.map(e => e.itemId))
    return items.filter(i => !kitItemIds.has(i.id))
  }, [items, kits])

  const getAvailableKits = useCallback((excludeId) => {
    return kits.filter(k => k.id !== excludeId)
  }, [kits])

  const value = useMemo(() => ({
    items, itemsMeta, categories, categoriesMeta, kits, kitsMeta, sacs, sacsMeta,
    loading, error, getCategory, getItem, getKit, getSac,
    addItem, updateItem, deleteItem, validateItem,
    addCategory, updateCategory, deleteCategory,
    addKit, updateKit, deleteKit, validateKit,
    addSac, updateSac, deleteSac, getResolvedSac,
    sacAddDirectItem, sacAddKit, sacRemoveEntry,
    sacTogglePacked, sacSetAllPacked,
    getSacTotalWeight, getSacProgress,
    getItemsByCategory, getItemsNotInKit,
    getAvailableKits,
    resolveKitItems,
  }), [
    items, itemsMeta, categories, categoriesMeta,
    kits, kitsMeta, sacs, sacsMeta,
    loading, error, getCategory, getItem, getKit, getSac,
    addItem, updateItem, deleteItem, validateItem,
    addCategory, updateCategory, deleteCategory,
    addKit, updateKit, deleteKit, validateKit,
    addSac, updateSac, deleteSac, getResolvedSac,
    sacAddDirectItem, sacAddKit, sacRemoveEntry,
    sacTogglePacked, sacSetAllPacked,
    getSacTotalWeight, getSacProgress,
    getItemsByCategory, getItemsNotInKit,
    getAvailableKits, resolveKitItems,
  ])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-bg)',
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)', borderRadius: '50%',
          animation: 'spin 600ms linear infinite',
        }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', padding: '24px', textAlign: 'center', color: 'var(--color-text)',
        background: 'var(--color-bg)', gap: '12px',
      }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Erreur de chargement</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{String(error)}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px', background: 'var(--color-primary)', color: 'white',
            borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Recharger
        </button>
      </div>
    )
  }

  return (
    <GearContext.Provider value={value}>
      {children}
    </GearContext.Provider>
  )
}
