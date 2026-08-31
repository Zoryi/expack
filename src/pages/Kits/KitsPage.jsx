import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useGear } from '../../hooks/useGear'

const s = {
  container: {
    minHeight: '100dvh',
    background: 'var(--color-bg)',
  },
  list: {
    padding: '16px',
  },
  kitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    marginBottom: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
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
}

export function KitsPage() {
  const navigate = useNavigate()
  const { kits } = useGear()

  const sortedKits = useMemo(
    () => [...kits].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
    [kits]
  )

  return (
    <div style={s.container}>
      <Header title="Kits" />

      <div style={s.list}>
        {sortedKits.map(kit => (
          <Link key={kit.id} to={`/kits/${kit.id}`} style={s.kitRow}>
            <div style={{ ...s.iconWrap, background: (kit.color || '#6b7280') }}>
              <Icon name={kit.icon || 'package'} size="sm" />
            </div>
            <div style={s.info}>
              <div style={s.name}>{kit.name}</div>
              <div style={s.meta}>
                {kit.itemEntries?.length || 0} article(s)
                {kit.subKitEntries?.length > 0 && ` · ${kit.subKitEntries.length} sous-kit(s)`}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {kits.length === 0 && (
        <EmptyState icon="package" message="Créez des kits pour grouper votre matériel réutilisable" actionLabel="Créer un kit" onAction={() => navigate('/kits/new')} />
      )}

      <button style={s.fab} onClick={() => navigate('/kits/new')} aria-label="Créer un kit"><Icon name="plus" size="lg" /></button>
    </div>
  )
}
