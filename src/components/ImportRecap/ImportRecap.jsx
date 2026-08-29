import { useBackClose } from '../../hooks/useBackClose'
import { MERGE, DUPLICATE, SKIP } from '../../utils/importConflicts'

const TYPE_LABELS = { items: 'Articles', kits: 'Kits', sacs: 'Sacs' }

const ACTION_LABELS = {
  [MERGE]: 'Fusionné',
  [DUPLICATE]: 'Dupliqué',
  [SKIP]: 'Ignoré',
}

const ACTION_COLORS = {
  [MERGE]: 'var(--color-primary)',
  [DUPLICATE]: 'var(--color-text)',
  [SKIP]: 'var(--color-text-secondary)',
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: '24px', animation: 'fadeIn 150ms ease',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    maxWidth: '440px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'scaleIn 200ms ease',
  },
  title: { fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' },
  message: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px' },
  totalsRow: { display: 'flex', gap: '8px', marginBottom: '16px' },
  totalChip: {
    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    textAlign: 'center',
  },
  totalNum: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' },
  totalLabel: { fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' },
  list: { flex: 1, overflowY: 'auto', marginBottom: '16px' },
  group: { marginBottom: '12px' },
  groupLabel: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '6px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 10px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    marginBottom: '4px',
  },
  rowName: {
    flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--color-text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  rowAction: { fontSize: '11px', fontWeight: 700, flexShrink: 0 },
  footer: { display: 'flex', justifyContent: 'flex-end' },
  primaryBtn: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--color-primary)',
    color: 'white', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  },
}

export function ImportRecap({ summary, onClose }) {
  useBackClose(true, onClose)

  const total = {
    duplicated: summary.duplicated,
    merged: summary.merged,
    skipped: summary.skipped,
  }

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.modal}>
        <div style={s.title}>Import terminé</div>
        <div style={s.message}>
          Vos données ont été importées avec succès.
        </div>
        <div style={s.totalsRow}>
          <div style={s.totalChip}>
            <div style={s.totalNum}>{total.merged}</div>
            <div style={s.totalLabel}>Fusionnées</div>
          </div>
          <div style={s.totalChip}>
            <div style={s.totalNum}>{total.duplicated}</div>
            <div style={s.totalLabel}>Dupliquées</div>
          </div>
          <div style={s.totalChip}>
            <div style={s.totalNum}>{total.skipped}</div>
            <div style={s.totalLabel}>Ignorées</div>
          </div>
        </div>
        <div style={s.list}>
          {(['items', 'kits', 'sacs'])
            .filter(type => summary[type] && summary[type].length > 0)
            .map(type => (
              <div key={type} style={s.group}>
                <div style={s.groupLabel}>{TYPE_LABELS[type]}</div>
                {summary[type].map((entry, idx) => (
                  <div key={idx} style={s.row}>
                    <span style={s.rowName}>{entry.name}</span>
                    <span style={{ ...s.rowAction, color: ACTION_COLORS[entry.action] || 'var(--color-text-secondary)' }}>
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>
        <div style={s.footer}>
          <button style={s.primaryBtn} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
