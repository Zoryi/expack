import { Link } from 'react-router-dom'

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '48px 24px',
    maxWidth: '600px',
    margin: '0 auto',
    animation: 'fadeIn 400ms ease',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  heading: {
    fontWeight: 600,
    fontSize: 'var(--text-lg)',
  },
  text: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.7,
  },
  code: {
    background: 'var(--color-surface)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--color-border)',
  },
  back: {
    color: 'var(--color-primary)',
    fontSize: 'var(--text-sm)',
  },
}

export function About() {
  return (
    <div style={s.container}>
      <h1 style={s.title}>À propos</h1>

      <div style={s.section}>
        <h2 style={s.heading}>Qu'est-ce que cette PWA ?</h2>
        <p style={s.text}>
          Ce template PWA (Progressive Web App) est conçu pour être installé localement sur Android.
          Il utilise les technologies web standards pour offrir une expérience native : mode
          déconnecté (offline-first), installation sur l'écran d'accueil, et mise à jour automatique.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.heading}>Installation sur Android</h2>
        <p style={s.text}>
          1. Construisez l'application avec <code style={s.code}>npm run build</code><br />
          2. Lancez le serveur de prévisualisation : <code style={s.code}>npm run preview</code><br />
          3. Ouvrez l'URL (http://&#60;ip-locale&#62;:4173) dans Chrome Android<br />
          4. Appuyez sur Menu → Installer l'application
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.heading}>Fonctionnalités</h2>
        <p style={s.text}>
          ✅ Mode hors ligne (Service Worker + Workbox)<br />
          ✅ Installation Android (manifest complet)<br />
          ✅ Mise à jour automatique avec notification<br />
          ✅ Thème clair/sombre avec persistence<br />
          ✅ Interface adaptée aux mobiles<br />
          ✅ Icône dans le tiroir d'applications
        </p>
      </div>

      <Link to="/" style={s.back}>← Retour à l'accueil</Link>
    </div>
  )
}
