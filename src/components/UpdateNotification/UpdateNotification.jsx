import { useSWUpdate } from '../../hooks/useSWUpdate'

export function UpdateNotification() {
  const { hasUpdate, update } = useSWUpdate()

  if (!hasUpdate) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 300ms ease',
        maxWidth: '90vw',
        paddingBottom: 'calc(12px + var(--safe-bottom))',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
        Une nouvelle version est disponible
      </span>
      <button
        onClick={update}
        style={{
          padding: '6px 16px',
          background: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Mettre à jour
      </button>
    </div>
  )
}
