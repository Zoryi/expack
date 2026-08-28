import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useBackClose } from '../../hooks/useBackClose'
import { Icon } from '../Icon/Icon'
import { shareViaFile, canFitInQr } from '../../utils/share'

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: '24px',
    animation: 'fadeIn 150ms ease',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    maxWidth: '380px',
    width: '100%',
    animation: 'scaleIn 200ms ease',
    textAlign: 'center',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    marginBottom: '4px',
    color: 'var(--color-text)',
  },
  subtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: '20px',
  },
  qrWrap: {
    display: 'inline-flex', padding: '16px',
    borderRadius: 'var(--radius-lg)',
    background: '#fff', marginBottom: '16px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--color-text-secondary)',
    marginBottom: '8px',
  },
  fallbackBtn: {
    display: 'block', width: '100%', padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)', color: 'white',
    border: 'none', fontWeight: 600, cursor: 'pointer',
    fontSize: 'var(--text-sm)',
  },
  closeBtn: {
    display: 'block', width: '100%', padding: '10px',
    borderRadius: 'var(--radius-md)',
    background: 'transparent', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', fontWeight: 600,
    cursor: 'pointer', fontSize: 'var(--text-sm)', marginTop: '8px',
  },
}

const TYPE_LABELS = { item: 'Article', kit: 'Kit', sac: 'Sac' }

export function QRCodeModal({ compressed, focalInfo, payload, onClose }) {
  useBackClose(true, onClose)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const { fits, level } = canFitInQr(compressed)

  return (
    <div style={s.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.title}>Partager</div>
        <div style={s.subtitle}>
          {TYPE_LABELS[focalInfo.type] || 'Ressource'} · {focalInfo.name}
        </div>

        {fits ? (
          <>
            <div style={s.qrWrap}>
              <QRCodeSVG value={compressed} size={200} level={level} />
            </div>
            <div style={s.label}>Scannez ce code avec ExPack</div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              Cette ressource est trop volumineuse pour un QR code.
            </div>
            <button
              style={s.fallbackBtn}
              onClick={async () => {
                await shareViaFile(payload)
                onClose?.()
              }}
            >
              <Icon name="export" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Partager le fichier
            </button>
          </>
        )}

        <button style={s.closeBtn} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
