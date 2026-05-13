import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import { useStorage } from '../../hooks/useStorage'

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    padding: '48px 24px',
    minHeight: '100%',
    animation: 'fadeIn 400ms ease',
  },
  header: {
    textAlign: 'center',
    animation: 'slideUp 400ms ease',
  },
  title: {
    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-lg)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '24px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    animation: 'slideUp 500ms ease',
  },
  cardTitle: {
    fontWeight: 600,
    marginBottom: '16px',
    fontSize: 'var(--text-lg)',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  count: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 800,
    minWidth: '60px',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  btn: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary)',
    color: 'white',
    fontSize: '20px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  },
  nav: {
    display: 'flex',
    gap: '16px',
  },
  link: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
}

export function Home() {
  const [count, setCount] = useStorage('demo-counter', 0)

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>PWA Starter</h1>
        <p style={s.subtitle}>Template prêt pour Android — Offline-first</p>
      </div>

      <div style={s.controls}>
        <ThemeToggle />
      </div>

      <div style={s.card}>
        <h2 style={s.cardTitle}>Compteur de démonstration</h2>
        <div style={s.counter}>
          <button style={s.btn} onClick={() => setCount((c) => c - 1)} aria-label="Décrémenter">
            −
          </button>
          <span style={s.count}>{count}</span>
          <button style={s.btn} onClick={() => setCount((c) => c + 1)} aria-label="Incrémenter">
            +
          </button>
        </div>
      </div>

      <nav style={s.nav}>
        <Link to="/about" style={s.link}>À propos de cette PWA</Link>
      </nav>
    </div>
  )
}
