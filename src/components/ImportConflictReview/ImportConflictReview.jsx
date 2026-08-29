import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { useBackClose } from '../../hooks/useBackClose'
import {
  detectConflicts,
  hasConflicts,
  MERGE,
  DUPLICATE,
  SKIP,
  MEANINGFUL_ITEM_FIELDS,
  ITEM_FIELD_LABELS,
} from '../../utils/importConflicts'

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
  list: { flex: 1, overflowY: 'auto', marginBottom: '16px' },
  group: { marginBottom: '12px' },
  groupLabel: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '6px',
  },
  card: {
    padding: '12px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg)', marginBottom: '8px',
    border: '1px solid var(--color-border)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
  name: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
  actionsRow: { display: 'flex', gap: '6px', marginBottom: '4px' },
  actions: { display: 'flex', gap: '6px', flex: 1 },
  actionBtn: {
    flex: 1, padding: '6px 4px', borderRadius: 'var(--radius-md)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  },
  actionActive: { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' },
  fieldList: { marginTop: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' },
  fieldRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '8px', padding: '4px 0', fontSize: '12px',
  },
  fieldLabel: { color: 'var(--color-text)' },
  fieldToggle: { display: 'flex', gap: '4px' },
  fieldChoice: {
    padding: '3px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  },
  fieldChoiceActive: { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' },
  footer: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  primaryBtn: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--color-primary)',
    color: 'white', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', background: 'transparent',
    color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  },
  empty: {
    padding: '16px', textAlign: 'center', fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
}

const TYPE_LABELS = { items: 'Articles', kits: 'Kits', sacs: 'Sacs' }

function actionLabel(action) {
  if (action === MERGE) return 'Fusionner'
  if (action === SKIP) return 'Ignorer'
  return 'Dupliquer'
}

export function ImportConflictReview({ payload, existingState, onConfirm, onCancel }) {
  useBackClose(true, onCancel)

  const [conflicts] = useState(() => detectConflicts(payload, existingState))
  const [decisions, setDecisions] = useState(() => {
    const d = { items: {}, kits: {}, sacs: {} }
    for (const c of conflicts.items) d.items[c.index] = { action: DUPLICATE }
    for (const c of conflicts.kits) d.kits[c.index] = { action: DUPLICATE }
    for (const c of conflicts.sacs) d.sacs[c.index] = { action: DUPLICATE }
    return d
  })

  if (!hasConflicts(conflicts)) {
    return (
      <div style={s.overlay} onClick={onCancel} role="dialog" aria-modal="true">
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.title}>Conflicts détectés</div>
          <div style={s.empty}>Aucun conflit détecté.</div>
          <div style={s.footer}>
            <button style={s.secondaryBtn} onClick={onCancel}>Annuler</button>
            <button style={s.primaryBtn} onClick={() => onConfirm(decisions)}>Importer</button>
          </div>
        </div>
      </div>
    )
  }

  const setAction = (type, index, action) => {
    setDecisions(prev => {
      const current = prev[type][index] || {}
      const next = { ...prev, [type]: { ...prev[type], [index]: { ...current, action } } }
      return next
    })
  }

  const setField = (index, field, value) => {
    setDecisions(prev => {
      const current = prev.items[index] || { action: MERGE }
      const fields = current.fields || {}
      const next = {
        ...prev,
        items: {
          ...prev.items,
          [index]: { ...current, action: MERGE, fields: { ...fields, [field]: value } },
        },
      }
      return next
    })
  }

  const renderItemConflict = (c) => {
    const decision = decisions.items[c.index]
    const action = decision?.action || DUPLICATE
    const fields = decision?.fields || {}
    const isMerge = action === MERGE

    return (
      <div key={`itm-${c.index}`} style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.name}>{c.imported.name}</span>
        </div>
        <div style={s.actionsRow}>
          <div style={s.actions}>
            {[DUPLICATE, MERGE, SKIP].map(a => (
              <div
                key={`${a}-${action === a}`}
                className="icr-btn"
                style={{ ...s.actionBtn, ...(action === a ? s.actionActive : {}) }}
                onClick={() => setAction('items', c.index, a)}
              >
                {actionLabel(a)}
              </div>
            ))}
          </div>
        </div>
        {isMerge && (
          <div style={s.fieldList}>
            {MEANINGFUL_ITEM_FIELDS.map(field => (
              <div key={field} style={s.fieldRow}>
                <span style={s.fieldLabel}>{ITEM_FIELD_LABELS[field] || field}</span>
                <div style={s.fieldToggle}>
                  {['existing', 'imported'].map(choice => (
                    <div
                      key={`${choice}-${(fields[field] || 'existing') === choice}`}
                      className="icr-btn"
                      style={{
                        ...s.fieldChoice,
                        ...((fields[field] || 'existing') === choice ? s.fieldChoiceActive : {}),
                      }}
                      onClick={() => setField(c.index, field, choice)}
                    >
                      {choice === 'existing' ? 'Existant' : 'Importé'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderKitConflict = (c) => {
    const decision = decisions.kits[c.index]
    const action = decision?.action || DUPLICATE
    return (
      <div key={`kit-${c.index}`} style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.name}>{c.imported.name}</span>
        </div>
        <div style={s.actionsRow}>
          <div style={s.actions}>
            {[DUPLICATE, MERGE, SKIP].map(a => (
              <div
                key={`${a}-${action === a}`}
                className="icr-btn"
                style={{ ...s.actionBtn, ...(action === a ? s.actionActive : {}) }}
                onClick={() => setAction('kits', c.index, a)}
              >
                {actionLabel(a)}
              </div>
            ))}
          </div>
        </div>
        {action === MERGE && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Le kit existant sera conservé avec ses références mises à jour.
          </div>
        )}
      </div>
    )
  }

  const renderSacConflict = (c) => {
    const decision = decisions.sacs[c.index]
    const action = decision?.action || DUPLICATE
    return (
      <div key={`sac-${c.index}`} style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.name}>{c.imported.name}</span>
        </div>
        <div style={s.actionsRow}>
          <div style={s.actions}>
            {[DUPLICATE, MERGE, SKIP].map(a => (
              <div
                key={`${a}-${action === a}`}
                className="icr-btn"
                style={{ ...s.actionBtn, ...(action === a ? s.actionActive : {}) }}
                onClick={() => setAction('sacs', c.index, a)}
              >
                {actionLabel(a)}
              </div>
            ))}
          </div>
        </div>
        {action === MERGE && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Le sac existant sera conservé avec ses références mises à jour.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={s.overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.title}>Conflits détectés</div>
        <div style={s.message}>
          Certaines ressources existent déjà dans votre inventaire. Choisissez quoi en faire avant l'import.
        </div>
        <div style={s.list}>
          {conflicts.items.length > 0 && (
            <div style={s.group}>
              <div style={s.groupLabel}>{TYPE_LABELS.items}</div>
              {conflicts.items.map(renderItemConflict)}
            </div>
          )}
          {conflicts.kits.length > 0 && (
            <div style={s.group}>
              <div style={s.groupLabel}>{TYPE_LABELS.kits}</div>
              {conflicts.kits.map(renderKitConflict)}
            </div>
          )}
          {conflicts.sacs.length > 0 && (
            <div style={s.group}>
              <div style={s.groupLabel}>{TYPE_LABELS.sacs}</div>
              {conflicts.sacs.map(renderSacConflict)}
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button style={s.secondaryBtn} onClick={onCancel}>Annuler</button>
          <button style={s.primaryBtn} onClick={() => onConfirm(decisions)}>
            <Icon name="import" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Importer
          </button>
        </div>
      </div>
    </div>
  )
}
