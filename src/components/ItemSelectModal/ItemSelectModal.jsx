import { useState, useMemo } from 'react'
import { KitRow } from '../KitRow/KitRow'
import { SearchBar } from '../SearchBar/SearchBar'
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
    border: '2px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 700,
  },
  itemCheckSelected: {
    background: 'var(--color-primary)',
    border: '2px solid var(--color-primary)',
    color: 'white',
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
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
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

export function ItemSelectModal({ items, onConfirm, onCancel, title = 'Sélectionner', selectedIds = [] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set(selectedIds))

  useBackClose(true, onCancel)

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(q))
  }, [items, search])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
        {filtered.map(item => {
          const isSelected = selected.has(item.id)
          return (
            <div
              key={item.id}
              style={{ ...s.item, ...(isSelected ? s.itemSelected : {}) }}
              onClick={() => toggle(item.id)}
              role="checkbox"
              aria-checked={isSelected}
            >
              <div style={{ ...s.itemCheck, ...(isSelected ? s.itemCheckSelected : {}) }}>
                {isSelected ? '✓' : ''}
              </div>
              {item.icon ? (
                <KitRow icon={item.icon} name={item.name} weight={item.weight || 0} itemCount={item.itemCount || 0} />
              ) : (
                <div style={s.itemInfo}>
                  <div style={s.itemName}>{item.name}</div>
                  <div style={s.itemMeta}>
                    {item.weight ? `${item.weight}g` : '—'} · {item.brand || 'Sans marque'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
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
