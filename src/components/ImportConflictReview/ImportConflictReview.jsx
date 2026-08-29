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
  fieldItem: {
    marginBottom: '8px', padding: '8px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
  },
  fieldTitle: {
    fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
    color: 'var(--color-text-secondary)', marginBottom: '6px',
  },
  optRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '5px 6px', borderRadius: '6px',
  },
  optRowSelected: { background: 'var(--color-surface)', boxShadow: 'inset 2px 0 0 var(--color-primary)' },
  optSource: {
    flexShrink: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.5px', color: 'var(--color-text-secondary)', width: '52px',
  },
  fieldChoice: {
    padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
  },
  fieldChoiceActive: { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' },
  optValue: {
    flex: 1, fontSize: '12px', color: 'var(--color-text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  optValueEmpty: { color: 'var(--color-text-secondary)', fontStyle: 'italic' },
  candSection: { marginBottom: '8px' },
  candLabel: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '4px',
  },
  candRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 10px', borderRadius: 'var(--radius-md)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    marginBottom: '4px', cursor: 'pointer',
  },
  candRowActive: { borderColor: 'var(--color-primary)', boxShadow: 'inset 2px 0 0 var(--color-primary)' },
  candName: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' },
  candDetail: {
    flex: 1, fontSize: '11px', color: 'var(--color-text-secondary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  candCheck: { color: 'var(--color-primary)', fontWeight: 700 },
  fuzzyHint: {
    display: 'inline-block', fontSize: '10px', fontWeight: 700,
    color: 'var(--color-primary)', marginLeft: '8px', flexShrink: 0,
  },
  bulkBar: { display: 'flex', gap: '8px', marginBottom: '12px' },
  countBadge: {
    display: 'inline-block', marginLeft: '8px', padding: '2px 8px',
    borderRadius: '999px', background: 'var(--color-primary)', color: 'white',
    fontSize: '11px', fontWeight: 700,
  },
  bulkBtn: {
    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', background: 'transparent',
    color: 'var(--color-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
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

function isFilled(value) {
  return value !== undefined && value !== null && value !== ''
}

function categoryName(categories, id) {
  const cat = categories.find(c => c.id === id)
  return cat ? cat.name : id
}

function formatValue(field, value, categories) {
  if (!isFilled(value)) return '—'
  if (field === 'categoryId') return categoryName(categories, value)
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function valuesDiffer(a, b) {
  if (!isFilled(a) && !isFilled(b)) return false
  return String(a ?? '').trim() !== String(b ?? '').trim()
}

function fieldDiffers(existing, imported, field, payload, existingState) {
  if (field === 'categoryId') {
    const en = categoryName(existingState.categories, existing[field])
    const im = categoryName(payload.categories, imported[field])
    return en !== im
  }
  return valuesDiffer(existing[field], imported[field])
}

function hasDiffFields(existing, imported, payload, existingState) {
  return MEANINGFUL_ITEM_FIELDS.some(field => fieldDiffers(existing, imported, field, payload, existingState))
}

function autoChoice(existing, imported, field) {
  const hasExisting = isFilled(existing[field])
  const hasImported = isFilled(imported[field])
  if (hasImported && !hasExisting) return 'imported'
  return 'existing'
}

function candidateDetail(existing, existingState) {
  const parts = []
  const catId = existing.categoryId
  const catName = categoryName(existingState.categories, catId)
  if (catName && catName !== catId) parts.push(catName)
  if (isFilled(existing.brand)) parts.push(existing.brand)
  if (isFilled(existing.model)) parts.push(existing.model)
  if (isFilled(existing.weight)) { const w = Number(existing.weight); if (!isNaN(w)) parts.push(`${w} g`) }
  if (parts.length === 0) return ''
  return parts.join(' · ')
}

function resolveSelectedExisting(c, decision) {
  const chosenId = decision && decision.existingId ? decision.existingId : c.selectedExistingId
  const found = c.candidates.find(x => x.existing.id === chosenId)
  return found ? found.existing : (c.candidates[0] ? c.candidates[0].existing : null)
}

export function ImportConflictReview({ payload, existingState, onConfirm, onCancel }) {
  useBackClose(true, onCancel)

  const [conflicts] = useState(() => detectConflicts(payload, existingState))
  const [decisions, setDecisions] = useState(() => {
    const d = { items: {}, kits: {}, sacs: {} }
    for (const c of conflicts.items) {
      const existing = c.candidates.find(x => x.existing.id === c.selectedExistingId)?.existing || c.candidates[0].existing
      const fields = {}
      for (const field of MEANINGFUL_ITEM_FIELDS) fields[field] = autoChoice(existing, c.imported, field)
      d.items[c.index] = { action: DUPLICATE, existingId: existing.id, fields }
    }
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

  const setAllActions = (action) => {
    setDecisions(prev => {
      const next = { items: {}, kits: {}, sacs: {} }
      for (const c of conflicts.items) {
        const existing = prev.items[c.index] || {}
        next.items[c.index] = { ...existing, fields: existing.fields || {}, action }
      }
      for (const c of conflicts.kits) {
        next.kits[c.index] = { ...(prev.kits[c.index] || {}), action }
      }
      for (const c of conflicts.sacs) {
        next.sacs[c.index] = { ...(prev.sacs[c.index] || {}), action }
      }
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

  const setExisting = (index, existingId) => {
    setDecisions(prev => {
      const current = prev.items[index] || {}
      const c = conflicts.items.find(x => x.index === index)
      const chosen = c ? c.candidates.find(x => x.existing.id === existingId) : null
      const fields = {}
      if (chosen) {
        for (const field of MEANINGFUL_ITEM_FIELDS) fields[field] = autoChoice(chosen.existing, c.imported, field)
      }
      const next = {
        ...prev,
        items: {
          ...prev.items,
          [index]: { ...current, existingId, fields, action: current.action || DUPLICATE },
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
    const existing = resolveSelectedExisting(c, decision)
    if (!existing) return null

    return (
      <div key={`itm-${c.index}`} style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.name}>{c.imported.name}</span>
          {c.matchType === 'fuzzy' && <span style={s.fuzzyHint}>~ approchant</span>}
        </div>
        {c.candidates.length > 1 && (
          <div style={s.candSection}>
            <div style={s.candLabel}>Article existant</div>
            {c.candidates.map(({ existing: cand }) => {
              const active = existing.id === cand.id
              return (
                <div
                  key={`${cand.id}-${active}`}
                  style={{ ...s.candRow, ...(active ? s.candRowActive : {}) }}
                  onClick={() => setExisting(c.index, cand.id)}
                >
                  <span style={s.candName}>{cand.name}</span>
                  <span style={s.candDetail}>{candidateDetail(cand, existingState)}</span>
                  {active && <span style={s.candCheck}>✓</span>}
                </div>
              )
            })}
          </div>
        )}
        <div style={s.actionsRow}>
          <div style={s.actions}>
            {[DUPLICATE, MERGE, SKIP]
              .filter(a => a !== MERGE || hasDiffFields(existing, c.imported, payload, existingState))
              .map(a => (
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
            {MEANINGFUL_ITEM_FIELDS
              .filter(field => fieldDiffers(existing, c.imported, field, payload, existingState))
              .map(field => {
                const choice = fields[field] || autoChoice(existing, c.imported, field)
                return (
                  <div key={field} style={s.fieldItem}>
                    <div style={s.fieldTitle}>{ITEM_FIELD_LABELS[field] || field}</div>
                    {['existing', 'imported'].map(choiceKey => {
                      const active = choice === choiceKey
                      const existingValue = formatValue(field, existing[field], existingState.categories)
                      const importedValue = formatValue(field, c.imported[field], payload.categories)
                      const value = choiceKey === 'existing' ? existingValue : importedValue
                      const isEmpty = choiceKey === 'existing'
                        ? !isFilled(existing[field])
                        : !isFilled(c.imported[field])
                      return (
                        <div
                          key={`${choiceKey}-${active}`}
                          style={{ ...s.optRow, ...(active ? s.optRowSelected : {}) }}
                        >
                          <span style={s.optSource}>{choiceKey === 'existing' ? 'Existant' : 'Importé'}</span>
                          <div
                            className="icr-btn"
                            style={{ ...s.fieldChoice, ...(active ? s.fieldChoiceActive : {}) }}
                            onClick={() => setField(c.index, field, choiceKey)}
                          >
                            {choiceKey === 'existing' ? 'Existant' : 'Importé'}
                          </div>
                          <span style={{ ...s.optValue, ...(isEmpty ? s.optValueEmpty : {}) }}>{value}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
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
        <div style={s.title}>
          Conflits détectés
          <span style={s.countBadge}>{conflicts.items.length + conflicts.kits.length + conflicts.sacs.length}</span>
        </div>
        <div style={s.message}>
          Certaines ressources existent déjà dans votre inventaire. Choisissez quoi en faire avant l'import.
        </div>
        <div style={s.bulkBar}>
          <button style={s.bulkBtn} onClick={() => setAllActions(DUPLICATE)}>Tout dupliquer</button>
          <button style={s.bulkBtn} onClick={() => setAllActions(SKIP)}>Tout ignorer</button>
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
