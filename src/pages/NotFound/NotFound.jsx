import { Link } from 'react-router-dom'

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    minHeight: '80dvh',
    padding: '24px',
    textAlign: 'center',
  },
  code: {
    fontSize: '4rem',
    fontWeight: 800,
    color: 'var(--color-text-secondary)',
    lineHeight: 1,
  },
  title: {
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
  },
  text: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  link: {
    color: 'var(--color-primary)',
    fontSize: 'var(--text-sm)',
  },
}

export function NotFound() {
  return (
    <div style={s.container}>
      <div style={s.code}>404</div>
      <h1 style={s.title}>Page introuvable</h1>
      <p style={s.text}>Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" style={s.link}>← Retour à l'accueil</Link>
    </div>
  )
}
