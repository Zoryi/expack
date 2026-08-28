import { createContext, useCallback, useMemo, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useStorage } from '../hooks/useStorage'
import { createItem, updateItem as updateItemModel, validateItem, CONDITION, PRIORITY } from '../models/item'
import { reassignIds } from '../utils/share'
import { createCategory } from '../models/category'
import { DEFAULT_CATEGORIES } from '../models/category'
import { createKit, resolveKitItems, validateKit } from '../models/kit'
import { createSac, resolveSac, addDirectEntry, addKitEntry, removeEntry, togglePacked, toggleFill, setAllPacked, getSacTotalWeight, getSacProgress, TRIP_TYPES } from '../models/sac'
import { storage } from '../services/storage'

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
    const newItems = [
      createItem({ name: 'Tente MSR Hubba Hubba NX', categoryId: 'cat-abri', brand: 'MSR', weight: 1800, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchasePrice: 450 }),
      createItem({ name: 'Duvet -10°C', categoryId: 'cat-abri', brand: 'Cumulus', weight: 950, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchasePrice: 320 }),
      createItem({ name: 'Matelas Therm-a-Rest NeoAir', categoryId: 'cat-abri', brand: 'Therm-a-Rest', weight: 510, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 180 }),
      createItem({ name: 'Coussin gonflable', categoryId: 'cat-abri', brand: 'Sea to Summit', weight: 60, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 25 }),
      createItem({ name: 'Réchaud MSR PocketRocket Deluxe', categoryId: 'cat-cuisine', brand: 'MSR', weight: 73, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchasePrice: 85 }),
      createItem({ name: 'Gaz MSR IsoPro 230g', categoryId: 'cat-cuisine', brand: 'MSR', weight: 370, quantity: 2, condition: CONDITION.USAGE, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'fuel', fullWeight: 370, dryWeight: 140, purchasePrice: 8 }),
      createItem({ name: 'Casserole Titanium 1.3L', categoryId: 'cat-cuisine', brand: 'Toaks', weight: 125, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 55 }),
      createItem({ name: 'Gourde Platypus 2L', categoryId: 'cat-cuisine', brand: 'Platypus', weight: 40, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'water', capacityL: 2, purchasePrice: 15 }),
      createItem({ name: 'T-shirt mérinos 160', categoryId: 'cat-vetements', brand: 'Icebreaker', weight: 150, quantity: 2, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchasePrice: 60 }),
      createItem({ name: 'Pantalon de randonnée', categoryId: 'cat-vetements', brand: 'Fjällräven', weight: 350, quantity: 1, condition: CONDITION.USAGE, priority: PRIORITY.IMPORTANT, purchasePrice: 120 }),
      createItem({ name: 'Veste imperméable Gore-Tex', categoryId: 'cat-vetements', brand: 'Millet', weight: 420, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 250 }),
      createItem({ name: 'Sac à dos Osprey Exos 48L', categoryId: 'cat-sac', brand: 'Osprey', weight: 1150, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isWorn: true, isFavorite: true, purchasePrice: 180 }),
      createItem({ name: 'Poche à eau 3L', categoryId: 'cat-sac', brand: 'Platypus', weight: 130, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'water', capacityL: 3, purchasePrice: 28 }),
      createItem({ name: 'Trousse de secours', categoryId: 'cat-securite', brand: '', weight: 200, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 35 }),
      createItem({ name: 'GPS Garmin eTrex 22x', categoryId: 'cat-navigation', brand: 'Garmin', weight: 141, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchasePrice: 200 }),
      createItem({ name: 'Lampe frontale Petzl Actik Core', categoryId: 'cat-navigation', brand: 'Petzl', weight: 80, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.INDISPENSABLE, purchasePrice: 65 }),
      createItem({ name: 'Carte IGN 1:25000', categoryId: 'cat-navigation', brand: 'IGN', weight: 50, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 12 }),
      createItem({ name: 'Brosse à dents pliable', categoryId: 'cat-hygiene', brand: 'Sea to Summit', weight: 20, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.OPTIONNEL, purchasePrice: 8 }),
      createItem({ name: 'Crème solaire SPF50', categoryId: 'cat-hygiene', brand: '', weight: 80, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, isConsumable: true, consumableType: 'other', purchasePrice: 12 }),
      createItem({ name: 'Couteau suisse Climber', categoryId: 'cat-divers', brand: 'Victorinox', weight: 75, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchasePrice: 35 }),
      createItem({ name: 'Assiette pliable Sea to Summit', categoryId: 'cat-cuisine', brand: 'Sea to Summit', weight: 55, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 18 }),
      createItem({ name: 'Mug plastique', categoryId: 'cat-cuisine', brand: 'Sea to Summit', weight: 30, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 12 }),
    ]

    const itemIndex = {}
    for (const item of newItems) {
      const key = item.name.split(' ').slice(0, 2).join(' ')
      itemIndex[key] = item.id
    }

    const messKit = createKit({
      name: 'Couvert & Vaisselle',
      description: 'Assiette et mug',
      icon: 'tools',
      color: '#84cc16',
      itemEntries: [
        { itemId: itemIndex['Assiette pliable'], quantity: 1 },
        { itemId: itemIndex['Mug plastique'], quantity: 1 },
      ],
    })

    const newKits = [
      createKit({
        name: 'Cuisine légère',
        description: 'Kit cuisine pour 1 personne',
        icon: 'cook',
        color: '#f59e0b',
        itemEntries: [
          { itemId: itemIndex['Réchaud MSR'], quantity: 1 },
          { itemId: itemIndex['Gaz MSR'], quantity: 2 },
          { itemId: itemIndex['Casserole Titanium'], quantity: 1 },
          { itemId: itemIndex['Gourde Platypus'], quantity: 1 },
        ],
        subKitEntries: [{ kitId: messKit.id }],
      }),
      createKit({
        name: 'Navigation',
        description: 'Kit navigation et orientation',
        icon: 'compass',
        color: '#06b6d4',
        itemEntries: [
          { itemId: itemIndex['GPS Garmin'], quantity: 1 },
          { itemId: itemIndex['Lampe frontale'], quantity: 1 },
          { itemId: itemIndex['Carte IGN'], quantity: 1 },
        ],
      }),
      messKit,
    ]

    const newSacs = [
      createSac({
        name: 'Trek Jura 3 jours',
        description: 'Tour du Jura en 3 jours - mai',
        destination: 'Jura',
        duration: 3,
        type: TRIP_TYPES.TREK,
        entries: [
          { entryId: 'e-gen-1', type: 'item', itemId: itemIndex['Tente MSR'], quantity: 1 },
          { entryId: 'e-gen-2', type: 'item', itemId: itemIndex['Duvet -10°C'], quantity: 1 },
          { entryId: 'e-gen-3', type: 'item', itemId: itemIndex['Matelas Therm-a-Rest'], quantity: 1 },
          { entryId: 'e-gen-4', type: 'item', itemId: itemIndex['Coussin gonflable'], quantity: 1 },
          { entryId: 'e-gen-5', type: 'kit', kitId: newKits[0].id },
          { entryId: 'e-gen-6', type: 'item', itemId: itemIndex['T-shirt mérinos'], quantity: 2 },
          { entryId: 'e-gen-7', type: 'item', itemId: itemIndex['Pantalon de'], quantity: 1 },
          { entryId: 'e-gen-8', type: 'item', itemId: itemIndex['Veste imperméable'], quantity: 1 },
          { entryId: 'e-gen-9', type: 'item', itemId: itemIndex['Poche à'], quantity: 1 },
          { entryId: 'e-gen-10', type: 'item', itemId: itemIndex['Trousse de'], quantity: 1 },
          { entryId: 'e-gen-11', type: 'kit', kitId: newKits[1].id },
          { entryId: 'e-gen-12', type: 'item', itemId: itemIndex['Brosse à'], quantity: 1 },
          { entryId: 'e-gen-13', type: 'item', itemId: itemIndex['Crème solaire'], quantity: 1 },
          { entryId: 'e-gen-14', type: 'item', itemId: itemIndex['Couteau suisse'], quantity: 1 },
        ],
        packingState: {},
      }),
    ]

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

  const importSharedData = useCallback((payload) => {
    const existingState = { items, categories, kits, sacs }
    const reassigned = reassignIds(payload, existingState)

    setCategories(prev => {
      const existingByName = {}
      for (const c of prev) existingByName[c.name.toLowerCase()] = true
      const merged = [...prev]
      for (const cat of reassigned.categories) {
        if (!existingByName[cat.name.toLowerCase()]) {
          merged.push(cat)
        }
      }
      return merged
    })

    setItems(prev => [...prev, ...reassigned.items])
    setKits(prev => [...prev, ...reassigned.kits])
    setSacs(prev => [...prev, ...reassigned.sacs])
  }, [items, categories, kits, sacs, setItems, setCategories, setKits, setSacs])

  const importData = useCallback(async (file) => {
    const text = await file.text()
    const data = JSON.parse(text)

    if (data.op === 'share') {
      importSharedData(data)
      return
    }

    if (!data.version || !Array.isArray(data.items) || !Array.isArray(data.categories) || !Array.isArray(data.kits) || !Array.isArray(data.sacs)) {
      throw new Error('Format de fichier invalide')
    }
    await storage.set('gear-items', data.items)
    await storage.set('gear-categories', data.categories)
    await storage.set('gear-kits', data.kits)
    await storage.set('gear-sacs', data.sacs)
    window.location.reload()
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