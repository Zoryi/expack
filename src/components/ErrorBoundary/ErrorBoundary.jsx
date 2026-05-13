import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
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
          color: 'var(--color-text)',
          background: 'var(--color-bg)',
        }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '12px' }}>Une erreur est survenue</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            {this.state.error?.message || 'Erreur inattendue'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
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
