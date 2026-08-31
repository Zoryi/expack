import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SearchBar } from '../../components/SearchBar/SearchBar'
import { Icon } from '../../components/Icon/Icon'
import { Badge } from '../../components/Badge/Badge'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useGear } from '../../hooks/useGear'

const s = {
  container: {
    minHeight: '100%',
    background: 'var(--color-bg)',
  },
  subNav: {
    display: 'flex',
    gap: '4px',
    padding: '8px 16px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    overflowX: 'auto',
  },
  subNavBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--transition-fast)',
  },
  searchWrap: {
    padding: '12px 16px',
  },
  categoryGroup: {
    padding: '0 16px 12px',
  },
  categoryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '6px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    marginBottom: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  itemMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '2px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
  },
  itemNotes: {
    marginTop: '2px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  itemWeight: {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  itemQty: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
  },
  favorite: {
    color: '#f59e0b',
    fontSize: '14px',
  },
  fab: {
    position: 'fixed',
    bottom: '96px',
    right: '20px',
    width: '52px',
    height: '52px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  linksRow: {
    display: 'flex',
    gap: '12px',
    padding: '8px 16px',
  },
  linkBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
}

export function Inventory() {
  const navigate = useNavigate()
  const { items, categories } = useGear()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const byName = (a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) ||
    (a.brand ?? '').localeCompare(b.brand ?? '', 'fr', { sensitivity: 'base' }) ||
    (a.model ?? '').localeCompare(b.model ?? '', 'fr', { sensitivity: 'base' })

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
    [categories]
  )

  const filtered = useMemo(() => {
    let result = items
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q))
    }
    if (filterCat) {
      result = result.filter(i => i.categoryId === filterCat)
    }
    return [...result].sort(byName)
  }, [items, search, filterCat])

  const grouped = useMemo(() => {
    const groups = {}
    for (const item of filtered) {
      const catId = item.categoryId
      if (!groups[catId]) groups[catId] = []
      groups[catId].push(item)
    }
    return groups
  }, [filtered])

  const getCat = (id) => categories.find(c => c.id === id)

  return (
    <div style={s.container}>

      <div style={s.linksRow}>
        <Link to="/categories" style={s.linkBtn}><Icon name="tag" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Catégories</Link>
        <Link to="/kits" style={s.linkBtn}><Icon name="package" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Kits</Link>
      </div>

      <div style={s.searchWrap}>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un article…" />
      </div>

      <div style={s.subNav}>
        <button
          style={{
            ...s.subNavBtn,
            background: !filterCat ? 'var(--color-primary)' : 'var(--color-surface)',
            color: !filterCat ? 'white' : 'var(--color-text-secondary)',
          }}
          onClick={() => setFilterCat('')}
        >
          Tous
        </button>
        {sortedCategories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...s.subNavBtn,
              background: filterCat === cat.id ? cat.color : 'var(--color-surface)',
              color: filterCat === cat.id ? 'white' : 'var(--color-text-secondary)',
            }}
            onClick={() => setFilterCat(cat.id)}
          >
            <Icon name={cat.icon} size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {cat.name}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <EmptyState
          icon="clipboard"
          message={items.length === 0 ? "Ajoutez votre premier article pour constituer votre inventaire" : "Aucun article ne correspond à votre recherche"}
          actionLabel={items.length === 0 ? "Ajouter un article" : undefined}
          onAction={items.length === 0 ? () => navigate('/items/new') : undefined}
        />
      )}

      {Object.entries(grouped).sort(([aId], [bId]) => {
        const ca = categories.find(c => c.id === aId)
        const cb = categories.find(c => c.id === bId)
        return (ca?.name ?? '').localeCompare(cb?.name ?? '', 'fr', { sensitivity: 'base' })
      }).map(([catId, catItems]) => {
        const cat = getCat(catId)
        return (
          <div key={catId} style={s.categoryGroup}>
            <div style={s.categoryTitle}>
              <Icon name={cat?.icon || 'package'} size="sm" />
              <span>{cat?.name || 'Sans catégorie'}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '11px' }}>({catItems.length})</span>
            </div>
            {catItems.map(item => {
              const { length, width, depth, volume } = item
              const dims = [length, width, depth].filter(v => v != null)
              const dimsStr = dims.length ? `${dims.join(' × ')} cm` : ''
              const volumeStr = volume != null ? `${volume} L` : ''
              const dimLine = [dimsStr, volumeStr].filter(Boolean).join(' · ')
              return (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                style={s.item}
              >
                <div style={s.itemInfo}>
                  <div style={s.itemName}>
                    {item.isConsumable && (() => {
  const icon = item.consumableType === 'water' ? 'droplet'
    : item.consumableType === 'fuel' ? 'flame'
    : item.consumableType === 'food' ? 'food'
    : 'refresh'
  return <Icon name={icon} size="xs" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }} />
})()}
                    {item.isFavorite && <span style={s.favorite}>★ </span>}
                    {item.name}
                  </div>
                  <div style={s.itemMeta}>
                    {[item.brand, item.model].filter(Boolean).join(' · ') && (
                      <span>{[item.brand, item.model].filter(Boolean).join(' · ')}</span>
                    )}
                  </div>
                  {dimLine && <div style={s.itemMeta}>{dimLine}</div>}
                  {item.notes && (
                    <div style={s.itemNotes}>{item.notes}</div>
                  )}
                </div>
                <div style={s.itemRight}>
                  <div style={s.itemWeight}>{item.weight ? `${item.weight}g` : '—'}</div>
                  {item.quantity > 1 && <div style={s.itemQty}>×{item.quantity}</div>}
                </div>
                <Badge condition={item.condition} />
              </Link>
              )
            })}
          </div>
        )
      })}

      <button style={s.fab} onClick={() => navigate('/items/new')} aria-label="Ajouter un article"><Icon name="plus" size="lg" /></button>
    </div>
  )
}
