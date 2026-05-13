import { CONDITION_LABELS, CONDITION_COLORS, CONDITION } from '../../models/item'

const s = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
}

const CONDITION_BG = {
  [CONDITION.NEUF]: '#dcfce7',
  [CONDITION.BON]: '#dbeafe',
  [CONDITION.USAGE]: '#fef3c7',
  [CONDITION.MAUVAIS]: '#fee2e2',
  [CONDITION.REMPLACER]: '#fecaca',
}

export function Badge({ condition }) {
  const label = CONDITION_LABELS[condition] || condition
  const bg = CONDITION_BG[condition] || '#e2e8f0'
  const color = CONDITION_COLORS[condition] || '#6b7280'

  return (
    <span
      style={{
        ...s.badge,
        background: bg,
        color,
      }}
      className="badge-condition"
    >
      {label}
    </span>
  )
}
