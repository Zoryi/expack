import { Link } from 'react-router-dom'
import { Icon } from '../Icon/Icon'

const s = {
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
  baseCompact: {
    alignItems: 'center',
    border: 'none',
    background: 'transparent',
    padding: 0,
    marginBottom: 0,
    borderRadius: 0,
    cursor: 'default',
  },
  liseré: {
    position: 'absolute',
    left: 0,
    top: '8px',
    bottom: '8px',
    width: '3px',
    borderRadius: '2px',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  infoCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  compactLeft: {
    flex: 1,
    minWidth: 0,
  },
  metaCompact: {
    marginTop: '1px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  nameCompact: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '2px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    flexWrap: 'wrap',
  },
  notes: {
    marginTop: '2px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  favorite: {
    color: '#f59e0b',
    fontSize: '14px',
  },
  right: {
    textAlign: 'right',
    flexShrink: 0,
  },
  weight: {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  weightCompact: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
}

function consumableIcon(type) {
  if (type === 'water') return 'droplet'
  if (type === 'fuel') return 'flame'
  if (type === 'food') return 'food'
  return 'refresh'
}

function dimsAndVolume(item) {
  const { length, width, depth, volume } = item
  const dims = [length, width, depth].filter(v => v != null)
  const dimsStr = dims.length ? `${dims.join(' × ')} cm` : ''
  const volumeStr = volume != null ? `${volume} L` : ''
  return [dimsStr, volumeStr].filter(Boolean).join(' · ')
}

export function ItemCard({
  item,
  compact = false,
  to,
  onClick,
  leading,
  rightSlot,
  badge,
  categoryColor,
  showConsumable = false,
  showFavorite = false,
  showNotes = true,
  metaLines,
  style,
  role,
  ariaChecked,
}) {
  const baseStyle = {
    ...(compact ? s.baseCompact : s.base),
    ...style,
    ...(categoryColor ? { paddingLeft: '18px' } : {}),
  }

  const defaultMetaLines = [
    [item.brand, item.model].filter(Boolean).join(' · ') || null,
    dimsAndVolume(item) || null,
  ].filter(Boolean)
  const lines = metaLines != null ? metaLines : defaultMetaLines

  const inner = (
    <>
      {categoryColor && <div style={{ ...s.liseré, background: categoryColor }} />}
      {leading}
      {compact ? (
        <div style={{ ...s.info, ...s.infoCompact }}>
          <div style={s.compactLeft}>
            <div style={s.nameCompact}>
              {showConsumable && item.isConsumable && (
                <Icon name={consumableIcon(item.consumableType)} size="xs" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }} />
              )}
              {showFavorite && item.isFavorite && <span style={s.favorite}>★ </span>}
              {item.name}
            </div>
            {[item.brand, item.model].filter(Boolean).join(' · ') && (
              <div style={s.metaCompact}>{[item.brand, item.model].filter(Boolean).join(' · ')}</div>
            )}
          </div>
          {rightSlot}
        </div>
      ) : (
        <>
          <div style={s.info}>
            <div style={s.name}>
              {showConsumable && item.isConsumable && (
                <Icon name={consumableIcon(item.consumableType)} size="xs" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }} />
              )}
              {showFavorite && item.isFavorite && <span style={s.favorite}>★ </span>}
              {item.name}
            </div>
            {lines.length > 0 && lines.map((line, i) => (
              <div key={i} style={s.meta}>{line}</div>
            ))}
            {showNotes && item.notes && <div style={s.notes}>{item.notes}</div>}
          </div>
          {rightSlot}
        </>
      )}
      {badge}
    </>
  )

  if (to) {
    return (
      <Link to={to} style={baseStyle}>
        {inner}
      </Link>
    )
  }
  return (
    <div style={baseStyle} onClick={onClick} role={role} aria-checked={ariaChecked}>
      {inner}
    </div>
  )
}

export const ItemCardWeight = ({ weight, compact = false }) => (
  <div style={compact ? s.weightCompact : s.weight}>
    {weight ? `${weight}g` : '—'}
  </div>
)

export const ItemCardRightWeight = ({ weight, qty }) => (
  <div style={s.right}>
    <div style={s.weight}>{weight ? `${weight}g` : '—'}</div>
    {qty > 1 && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>×{qty}</div>}
  </div>
)
