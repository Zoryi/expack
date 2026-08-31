import { createContext, useCallback, useMemo, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useStorage } from '../hooks/useStorage'
import { updateItem as updateItemModel, validateItem } from '../models/item'
import { applyImport } from '../utils/importConflicts'
import { createCategory } from '../models/category'
import { DEFAULT_CATEGORIES } from '../models/category'
import { resolveKitItems, validateKit } from '../models/kit'
import { resolveSac, addDirectEntry, addKitEntry, removeEntry, togglePacked, toggleFill, setAllPacked, getSacTotalWeight, getSacProgress } from '../models/sac'
import { generateTestData as buildTestData } from '../data/testData'

const EMPTY_ITEMS = []
const EMPTY_KITS = []
const EMPTY_SACS = []

export const GearContext = createContext(null)

export function GearProvider({ children }) {
  const [items, setItems, itemsMeta] = useStorage('gear-items', EMPTY_ITEMS)
  const [categories, setCategories, categoriesMeta] = useStorage('gear-categories', DEFAULT_CATEGORIES)
  const [kits, setKits, kitsMeta] = useStorage('gear-kits', EMPTY_KITS)
  const [sacs, setSacs, sacsMeta] = useStorage('gear-sacs', EMPTY_SACS)

  const loading = itemsMeta.loading || categoriesMeta.loading || kitsMeta.loading || sacsMeta.loading
  const error = itemsMeta.error || categoriesMeta.error || kitsMeta.error || sacsMeta.error

  const [forceShow, setForceShow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

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

  const sacToggleFill = useCallback((sacId, packingKey) => {
    setSacs(prev => prev.map(s => s.id === sacId ? toggleFill(s, packingKey) : s))
  }, [setSacs])

  const sacSetAllPacked = useCallback((sacId, packed) => {
    setSacs(prev => prev.map(s => s.id === sacId ? setAllPacked(s, packed, kits, items) : s))
  }, [setSacs, kits, items])

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

  const clearAllData = useCallback(() => {
    setItems(EMPTY_ITEMS)
    setCategories(DEFAULT_CATEGORIES)
    setKits(EMPTY_KITS)
    setSacs(EMPTY_SACS)
  }, [setItems, setCategories, setKits, setSacs])

  const generateTestData = useCallback(() => {
    const { items: newItems, kits: newKits, sacs: newSacs } = buildTestData()
    setItems(newItems)
    setKits(newKits)
    setSacs(newSacs)
  }, [setItems, setKits, setSacs])

  const exportData = useCallback(async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      categories,
      kits,
      sacs,
    }
    const filename = `expack-export-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(data, null, 2)

    if (Capacitor.isNativePlatform()) {
      const result = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })
      Share.share({
        title: 'Exporter les données',
        text: 'Fichier d\'export ExPack',
        url: result.uri,
      }).catch(() => {})
    } else {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [items, categories, kits, sacs])

  const importSharedData = useCallback((payload, decisions) => {
    const existingState = { items, categories, kits, sacs }
    const result = applyImport(payload, existingState, decisions)

    setCategories(result.categories)
    setItems(result.items)
    setKits(result.kits)
    setSacs(result.sacs)
    return result.summary
  }, [items, categories, kits, sacs, setItems, setCategories, setKits, setSacs])

  const importData = useCallback(async (file, decisions) => {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version || !Array.isArray(data.items) || !Array.isArray(data.categories) || !Array.isArray(data.kits) || !Array.isArray(data.sacs)) {
      throw new Error('Format de fichier invalide')
    }

    importSharedData(data, decisions)
  }, [importSharedData])

  const value = useMemo(() => ({
    items, itemsMeta, categories, categoriesMeta, kits, kitsMeta, sacs, sacsMeta,
    loading, error, getCategory, getItem, getKit, getSac,
    addItem, updateItem, deleteItem,
    addCategory, updateCategory, deleteCategory,
    addKit, updateKit, deleteKit,
    addSac, updateSac, deleteSac, getResolvedSac,
    sacAddDirectItem, sacAddKit, sacRemoveEntry,
    sacTogglePacked, sacToggleFill, sacSetAllPacked,
    getSacTotalWeight, getSacProgress,
    getItemsByCategory, getItemsNotInKit,
    getAvailableKits,
    resolveKitItems,
    validateItem,
    validateKit,
    clearAllData, generateTestData, exportData, importData, importSharedData,
  }), [
    items, itemsMeta, categories, categoriesMeta,
    kits, kitsMeta, sacs, sacsMeta,
    loading, error, getCategory, getItem, getKit, getSac,
    addItem, updateItem, deleteItem,
    addCategory, updateCategory, deleteCategory,
    addKit, updateKit, deleteKit,
    addSac, updateSac, deleteSac, getResolvedSac,
    sacAddDirectItem, sacAddKit, sacRemoveEntry,
    sacTogglePacked, sacToggleFill, sacSetAllPacked,
    getSacTotalWeight, getSacProgress,
    getItemsByCategory, getItemsNotInKit,
    getAvailableKits,
    resolveKitItems,
    validateItem,
    validateKit,
    clearAllData, generateTestData, exportData, importData, importSharedData,
  ])

  if (loading && !forceShow) {
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