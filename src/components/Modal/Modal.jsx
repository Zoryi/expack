import { useEffect, useRef } from 'react'
import { useBackClose } from '../../hooks/useBackClose'

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '24px',
    animation: 'fadeIn 150ms ease',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    animation: 'scaleIn 200ms ease',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    marginBottom: '8px',
    color: 'var(--color-text)',
  },
  message: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  cancel: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirm: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-danger)',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export function Modal({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel, isDestructive = true }) {
  const confirmRef = useRef(null)

  useBackClose(true, onCancel)

  useEffect(() => {
    confirmRef.current?.focus()
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div style={s.overlay} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 id="modal-title" style={s.title}>{title}</h2>
        <p style={s.message}>{message}</p>
        <div style={s.actions}>
          <button
            style={s.cancel}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            style={{
              ...s.confirm,
              ...(!isDestructive ? { background: 'var(--color-primary)' } : {}),
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
