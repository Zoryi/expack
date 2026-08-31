import { useState, useMemo } from 'react'
import { KitRow } from '../KitRow/KitRow'
import { SearchBar } from '../SearchBar/SearchBar'
import { ItemCard, ItemCardWeight } from '../ItemCard/ItemCard'
import { CategoryHeader } from '../CategoryHeader/CategoryHeader'
import { groupItemsByCategory } from '../../utils/groupItemsByCategory'
import { useBackClose } from '../../hooks/useBackClose'

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    animation: 'fadeIn 150ms ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    paddingTop: 'calc(16px + var(--safe-top))',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
  },
  headerTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
  },
  closeBtn: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
  },
  searchWrap: {
    padding: '12px 16px',
    background: 'var(--color-bg)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    background: 'var(--color-bg)',
    padding: '8px 16px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    marginBottom: '6px',
    cursor: 'pointer',
    border: '1px solid var(--color-border)',
    transition: 'border-color var(--transition-fast)',
  },
  itemSelected: {
    border: '1px solid var(--color-primary)',
  },
  itemCheck: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 700,
  },
  itemCheckSelected: {
    backgroundColor: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
    color: 'white',
  },
  group: {
    marginBottom: '8px',
  },
  footer: {
    padding: '16px',
    paddingBottom: 'calc(16px + var(--safe-bottom))',
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export function ItemSelectModal({ items, categories = [], onConfirm, onCancel, title = 'Sélectionner', selectedIds = [] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set(selectedIds))

  useBackClose(true, onCancel)

  const filtered = useMemo(() => {
    const all = items || []
    if (!search.trim()) {
      return { articleItems: all.filter(i => i.categoryId != null), kitItems: all.filter(i => i.categoryId == null) }
    }
    const q = search.toLowerCase()
    return {
      articleItems: all.filter(i => i.categoryId != null && i.name.toLowerCase().includes(q)),
      kitItems: all.filter(i => i.categoryId == null && i.name.toLowerCase().includes(q)),
    }
  }, [items, search])

  const grouped = useMemo(() => groupItemsByCategory(filtered.articleItems, categories), [filtered.articleItems, categories])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalCount = grouped.reduce((n, g) => n + g.items.length, 0) + filtered.kitItems.length

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.header}>
        <span style={s.headerTitle}>{title}</span>
        <button style={s.closeBtn} onClick={onCancel} aria-label="Fermer">✕</button>
      </div>

      <div style={s.searchWrap}>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un article…" />
      </div>

      <div style={s.list}>
        {grouped.map(group => (
          <div key={group.catId} style={s.group}>
            <CategoryHeader icon={group.icon} name={group.name} count={group.items.length} />
            {group.items.map(item => {
              const isSelected = selected.has(item.id)
              return (
                <ItemCard
                  key={`${item.id}-${isSelected}`}
                  item={item}
                  onClick={() => toggle(item.id)}
                  style={{ ...(isSelected ? { borderColor: 'var(--color-primary)' } : {}) }}
                  showConsumable
                  showFavorite
                  leading={(
                    <div style={{ ...s.itemCheck, ...(isSelected ? s.itemCheckSelected : {}) }}>
                      {isSelected ? '✓' : ''}
                    </div>
                  )}
                  rightSlot={<ItemCardWeight weight={item.weight} />}
                />
              )
            })}
          </div>
        ))}

        {filtered.kitItems.length > 0 && (
          <div style={s.group}>
            <CategoryHeader icon="package" name="Kits" count={filtered.kitItems.length} />
            {filtered.kitItems.map(item => {
              const isSelected = selected.has(item.id)
              return (
                <div
                  key={`${item.id}-${isSelected}`}
                  style={{ ...s.item, ...(isSelected ? s.itemSelected : {}) }}
                  onClick={() => toggle(item.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                >
                  <div style={{ ...s.itemCheck, ...(isSelected ? s.itemCheckSelected : {}) }}>
                    {isSelected ? '✓' : ''}
                  </div>
                  <KitRow icon={item.icon} name={item.name} weight={item.weight || 0} itemCount={item.itemCount || 0} />
                </div>
              )
            })}
          </div>
        )}

        {totalCount === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Aucun article trouvé
          </div>
        )}
      </div>

      <div style={s.footer}>
        <button
          style={s.confirmBtn}
          onClick={() => onConfirm(Array.from(selected))}
        >
          Valider ({selected.size})
        </button>
      </div>
    </div>
  )
}
