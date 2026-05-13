import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon/Icon'
import { useGear } from '../../hooks/useGear'
import { getSacProgress, getSacTotalWeight, resolveSac } from '../../models/sac'
import { TRIP_TYPE_LABELS } from '../../models/sac'

const s = {
  container: {
    background: 'var(--color-bg)',
  },
  list: {
    padding: '16px',
  },
  card: {
    display: 'block',
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    marginBottom: '10px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color var(--transition-fast)',
    animation: 'slideUp 400ms ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  name: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  type: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
  },
  meta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'var(--color-border)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    background: 'var(--color-primary)',
    transition: 'width 300ms ease',
  },
  progressText: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
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

export function SacsPage() {
  const navigate = useNavigate()
  const { sacs, kits, items } = useGear()

  const sacsWithMeta = useMemo(() => {
    return sacs.map(sac => {
      const progress = getSacProgress(sac, kits, items)
      const totalWeight = getSacTotalWeight(sac, kits, items)
      const resolved = resolveSac(sac, kits, items)
      return { ...sac, progress, totalWeight, resolved: resolved.flatItems }
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  }, [sacs, kits, items])

  return (
    <div style={s.container}>
      <div style={s.list}>
        {sacsWithMeta.map(sac => (
          <Link key={sac.id} to={`/sacs/${sac.id}`} style={s.card}>
            <div style={s.header}>
              <div style={s.name}>{sac.name || 'Sans nom'}</div>
              <span style={{
                ...s.type,
                background: sac.type === 'rando' ? '#dbeafe' : sac.type === 'bivouac' ? '#fef3c7' : sac.type === 'trek' ? '#dcfce7' : '#f3e8ff',
                color: sac.type === 'rando' ? '#2563eb' : sac.type === 'bivouac' ? '#d97706' : sac.type === 'trek' ? '#16a34a' : '#9333ea',
              }}>
                {TRIP_TYPE_LABELS[sac.type] || sac.type}
              </span>
            </div>
            <div style={s.meta}>
              {sac.destination && <span><Icon name="map-pin" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.destination}</span>}
              {sac.tripDate && <span><Icon name="calendar" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {new Date(sac.tripDate).toLocaleDateString('fr-FR')}</span>}
              {sac.duration > 0 && <span><Icon name="clock" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.duration}j</span>}
              <span><Icon name="weight" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.totalWeight >= 1000 ? `${(sac.totalWeight / 1000).toFixed(1)}kg` : `${sac.totalWeight}g`}</span>
            </div>
            <div style={s.progressWrap}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${sac.progress.percent}%` }} />
              </div>
              <span style={s.progressText}>{sac.progress.packed}/{sac.progress.total}</span>
            </div>
          </Link>
        ))}
        {sacs.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 24px', textAlign: 'center', gap: '12px',
            animation: 'fadeIn 400ms ease',
          }}>
            <Icon name="backpack" size="xxl" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, maxWidth: '280px' }}>
              Créez votre premier sac pour préparer une sortie
            </p>
            <button
              onClick={() => navigate('/sacs/new')}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none',
                background: 'var(--color-primary)', color: 'white', fontSize: 'var(--text-sm)',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Créer un sac
            </button>
          </div>
        )}
      </div>
      <button style={s.fab} onClick={() => navigate('/sacs/new')} aria-label="Créer un sac"><Icon name="plus" size="lg" /></button>
    </div>
  )
}
