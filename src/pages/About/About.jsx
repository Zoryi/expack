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
        <h2 style={s.heading}>Qu'est-ce que cette application ?</h2>
        <p style={s.text}>
          Cette application est conçue pour être installée localement sur Android.
          Elle utilise SQLite natif pour le stockage hors ligne et fonctionne sans
          connexion internet.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.heading}>Installation</h2>
        <p style={s.text}>
          Téléchargez l'APK via le serveur de l'application, installez-le sur votre
          appareil Android et profitez de toutes les fonctionnalités hors ligne.
        </p>
      </div>

      <div style={s.section}>
        <h2 style={s.heading}>Fonctionnalités</h2>
        <p style={s.text}>
          ✅ Mode hors ligne (SQLite natif)<br />
          ✅ Installation Android (APK)<br />
          ✅ Thème clair/sombre avec persistence<br />
          ✅ Interface adaptée aux mobiles<br />
          ✅ Icône dans le tiroir d'applications
        </p>
      </div>

      <Link to="/" style={s.back}>← Retour à l'accueil</Link>
    </div>
  )
}
