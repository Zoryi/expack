import { Icon } from '../Icon/Icon'

const s = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '10px 36px 10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  },
  icon: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: 'var(--color-text-secondary)',
  },
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div style={s.wrapper}>
      <input
        style={s.input}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <span style={s.icon}>
        <Icon name="search" size="sm" />
      </span>
    </div>
  )
}
