import { Icon } from '../Icon/Icon'

const s = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  weight: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  meta: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  },
}

export function KitRow({ icon, name, weight, itemCount }) {
  return (
    <div style={s.row}>
      <div style={s.iconWrap}>
        <Icon name={icon || 'package'} size="sm" />
      </div>
      <div style={s.info}>
        <div style={s.nameRow}>
          <div style={s.name}>{name}</div>
          <span style={s.weight}>{weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight || 0} g`}</span>
        </div>
        <div style={s.meta}>{itemCount || 0} art.</div>
      </div>
    </div>
  )
}
