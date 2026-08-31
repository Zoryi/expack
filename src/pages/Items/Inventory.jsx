import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SearchBar } from '../../components/SearchBar/SearchBar'
import { Icon } from '../../components/Icon/Icon'
import { Badge } from '../../components/Badge/Badge'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ItemCard, ItemCardRightWeight } from '../../components/ItemCard/ItemCard'
import { CategoryHeader } from '../../components/CategoryHeader/CategoryHeader'
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
            <CategoryHeader
              icon={cat?.icon || 'package'}
              name={cat?.name || 'Sans catégorie'}
              count={catItems.length}
            />
            {catItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                to={`/items/${item.id}`}
                showConsumable
                showFavorite
                rightSlot={<ItemCardRightWeight weight={item.weight} qty={item.quantity} />}
                badge={<Badge condition={item.condition} />}
              />
            ))}
          </div>
        )
      })}

      <button style={s.fab} onClick={() => navigate('/items/new')} aria-label="Ajouter un article"><Icon name="plus" size="lg" /></button>
    </div>
  )
}
