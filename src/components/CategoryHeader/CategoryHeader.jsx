import { Icon } from '../Icon/Icon'

const s = {
  title: {
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
  count: {
    color: 'var(--color-text-secondary)',
    fontWeight: 400,
    fontSize: '11px',
  },
}

export function CategoryHeader({ icon, name, count, showCount = true }) {
  return (
    <div style={s.title}>
      <Icon name={icon || 'package'} size="sm" />
      <span>{name}</span>
      {showCount && count != null && <span style={s.count}>({count})</span>}
    </div>
  )
}
