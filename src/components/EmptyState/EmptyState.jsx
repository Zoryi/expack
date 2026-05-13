import { Icon } from '../Icon/Icon'

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    animation: 'fadeIn 400ms ease',
    gap: '12px',
  },
  icon: {
    marginBottom: '4px',
    color: 'var(--color-text-secondary)',
    opacity: 0.5,
  },
  message: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
    maxWidth: '280px',
  },
  action: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
}

export function EmptyState({ icon = 'package', message, actionLabel, onAction }) {
  return (
    <div style={s.container}>
      <div style={s.icon}><Icon name={icon} size="xxl" /></div>
      <p style={s.message}>{message}</p>
      {actionLabel && onAction && (
        <button style={s.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
