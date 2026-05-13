import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--color-text, #f1f5f9)',
          background: 'var(--color-bg, #0f172a)',
        }}>
          <h1 style={{ fontSize: 'var(--text-3xl, 1.75rem)', marginBottom: '12px' }}>Une erreur est survenue</h1>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', marginBottom: '24px' }}>
            {this.state.error?.message || 'Erreur inattendue'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary, #60a5fa)',
              color: 'white',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 'var(--text-base, 1rem)',
              fontWeight: 600,
            }}
          >
            Recharger la page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
