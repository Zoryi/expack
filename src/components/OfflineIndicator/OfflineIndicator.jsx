import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    animation: 'slideDown 250ms ease',
    paddingTop: 'calc(8px + var(--safe-top))',
  },
  offline: {
    background: 'var(--color-danger)',
    color: 'white',
  },
  online: {
    background: 'var(--color-success)',
    color: 'white',
  },
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div style={{ ...styles.banner, ...styles.offline }} role="alert">
      Vous êtes hors ligne — certaines fonctionnalités peuvent être limitées
    </div>
  )
}
