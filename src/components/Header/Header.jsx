import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon/Icon'

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    paddingTop: 'calc(12px + var(--safe-top))',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  back: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

export function Header({ title, onBack, rightAction }) {
  const navigate = useNavigate()

  return (
    <header style={s.header}>
      <button
        style={s.back}
        onClick={onBack || (() => navigate(-1))}
        aria-label="Retour"
      >
        <Icon name="arrow-left" size="lg" />
      </button>
      <h1 style={s.title}>{title}</h1>
      {rightAction}
    </header>
  )
}
