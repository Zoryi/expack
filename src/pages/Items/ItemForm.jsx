import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Modal } from '../../components/Modal/Modal'
import { useGear } from '../../hooks/useGear'
import { CONDITION, CONDITION_LABELS, CONDITION_COLORS, CONDITION_ORDER, PRIORITY, PRIORITY_LABELS, CONSUMABLE_TYPE, CONSUMABLE_TYPE_LABELS } from '../../models/item'

const s = {
  container: {
    minHeight: '100dvh',
    background: 'var(--color-bg)',
  },
  form: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--color-text-secondary)',
    marginBottom: '12px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    marginBottom: '10px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    marginBottom: '10px',
    outline: 'none',
    cursor: 'pointer',
  },
  conditionGrid: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  conditionBtn: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  toggle: {
    position: 'relative',
    width: '40px',
    height: '22px',
    borderRadius: '11px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    flexShrink: 0,
  },
  toggleLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
  },
  toggleSub: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
  },
  priorityRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '10px',
  },
  priorityBtn: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px',
    paddingBottom: '32px',
  },
  saveBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '14px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-danger)',
    background: 'transparent',
    color: 'var(--color-danger)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

const defaultFormState = {
  name: '', categoryId: '', brand: '', model: '',
  weight: 0, quantity: 1,
  length: null, width: null, depth: null, volume: null,
  condition: CONDITION.BON,
  purchaseDate: '', purchasePrice: null,
  isConsumable: false, consumableType: CONSUMABLE_TYPE.OTHER,
  dryWeight: 0, fullWeight: 0,
  isWorn: false,
  priority: PRIORITY.IMPORTANT, isFavorite: false,
  notes: '',
}

const formFromItem = (item) => ({
  name: item.name || '',
  categoryId: item.categoryId || '',
  brand: item.brand || '',
  model: item.model || '',
  weight: item.weight ?? 0,
  quantity: item.quantity ?? 1,
  length: item.length ?? null,
  width: item.width ?? null,
  depth: item.depth ?? null,
  volume: item.volume ?? null,
  condition: item.condition || CONDITION.BON,
  purchaseDate: item.purchaseDate || '',
  purchasePrice: item.purchasePrice ?? null,
  isConsumable: item.isConsumable || false,
  consumableType: item.consumableType || CONSUMABLE_TYPE.OTHER,
  dryWeight: item.dryWeight ?? 0,
  fullWeight: item.fullWeight ?? 0,
  isWorn: item.isWorn || false,
  priority: item.priority || PRIORITY.IMPORTANT,
  isFavorite: item.isFavorite || false,
  notes: item.notes || '',
})

export function ItemForm() {
  const { id } = useParams()
  const { items } = useGear()
  const existingItem = id ? items.find(i => i.id === id) : null
  return <ItemFormInner key={id || 'new'} existingItem={existingItem} />
}

function ItemFormInner({ existingItem }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, addItem, updateItem, deleteItem } = useGear()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(existingItem ? formFromItem(existingItem) : defaultFormState)
  const [showDelete, setShowDelete] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = () => {
    if (!form.name.trim()) return
    if (!form.categoryId) return
    const data = { ...form, weight: Number(form.weight) || 0, quantity: Math.max(1, Number(form.quantity) || 1) }
    if (isEditing) {
      updateItem(id, data)
      navigate('/items/' + id)
    } else {
      addItem(data)
      navigate('/inventory')
    }
  }

  const handleDelete = () => {
    deleteItem(id)
    navigate('/inventory')
  }

  return (
    <div style={s.container}>
      <Header title={isEditing ? 'Modifier l\'article' : 'Nouvel article'} />

      <div style={s.form}>
        <div style={s.section}>
          <div style={s.sectionTitle}>Identité</div>
          <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom *" />
            <select style={s.select} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
            <option value="">Catégorie *</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={s.row}>
            <input style={s.input} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Marque" />
            <input style={s.input} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Modèle" />
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Physique</div>
          <div style={s.row}>
            <div>
              <label style={s.label}>Poids (g)</label>
              <input style={s.input} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} min="0" />
            </div>
            <div>
              <label style={s.label}>Quantité</label>
              <input style={s.input} type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} min="1" />
            </div>
          </div>
          <div style={s.sectionTitle}>Dimensions (optionnel)</div>
          <div style={s.row}>
            <input style={s.input} type="number" value={form.length ?? ''} onChange={e => set('length', e.target.value ? Number(e.target.value) : null)} placeholder="L (cm)" />
            <input style={s.input} type="number" value={form.width ?? ''} onChange={e => set('width', e.target.value ? Number(e.target.value) : null)} placeholder="l (cm)" />
            <input style={s.input} type="number" value={form.depth ?? ''} onChange={e => set('depth', e.target.value ? Number(e.target.value) : null)} placeholder="P (cm)" />
            <input style={s.input} type="number" value={form.volume ?? ''} onChange={e => set('volume', e.target.value ? Number(e.target.value) : null)} placeholder="Volume (L)" />
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>État & Achat</div>
          <label style={s.label}>État</label>
          <div style={s.conditionGrid}>
            {CONDITION_ORDER.map(c => (
              <button
                key={c}
                style={{
                  ...s.conditionBtn,
                  ...(form.condition === c ? { background: CONDITION_COLORS[c], color: 'white', border: '1px solid ' + CONDITION_COLORS[c] } : {}),
                }}
                onClick={() => set('condition', c)}
              >
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
          <div style={s.row}>
            <input style={s.input} type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} placeholder="Date d'achat" />
            <input style={s.input} type="number" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value ? Number(e.target.value) : null)} placeholder="Prix (€)" min="0" step="0.01" />
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Préparation voyage</div>

          <div style={s.toggleRow}>
            <button
              style={{ ...s.toggle, background: form.isConsumable ? '#22c55e' : 'var(--color-border)' }}
              onClick={() => set('isConsumable', !form.isConsumable)}
              aria-label="Consommable"
            />
            <div>
              <div style={s.toggleLabel}>Consommable</div>
              <div style={s.toggleSub}>Se consomme (gaz, eau, savon…)</div>
            </div>
          </div>

          {form.isConsumable && (
            <>
              <label style={s.label}>Type de consommable</label>
              <div style={s.conditionGrid}>
                {Object.values(CONSUMABLE_TYPE).map(type => (
                  <button
                    key={type}
                    style={{
                      ...s.conditionBtn,
                      ...(form.consumableType === type ? { background: '#22c55e', color: 'white', border: '1px solid #22c55e' } : {}),
                    }}
                    onClick={() => set('consumableType', type)}
                  >
                    {CONSUMABLE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {form.consumableType === CONSUMABLE_TYPE.FUEL && (
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Poids plein (g)</label>
                    <input style={s.input} type="number" value={form.fullWeight || ''} onChange={e => set('fullWeight', Number(e.target.value) || 0)} min="0" placeholder="Ex: 370" />
                  </div>
                  <div>
                    <label style={s.label}>Poids vide (g)</label>
                    <input style={s.input} type="number" value={form.dryWeight || ''} onChange={e => set('dryWeight', Number(e.target.value) || 0)} min="0" placeholder="Ex: 140" />
                  </div>
                </div>
              )}
            </>
          )}

          <div style={s.toggleRow}>
            <button
              style={{ ...s.toggle, background: form.isWorn ? '#22c55e' : 'var(--color-border)' }}
              onClick={() => set('isWorn', !form.isWorn)}
              aria-label="Porté"
            />
            <div>
              <div style={s.toggleLabel}>Porté (vêtement)</div>
              <div style={s.toggleSub}>Se porte sur soi, ne compte pas dans le poids du sac</div>
            </div>
          </div>

          <div style={s.toggleRow}>
            <button
              style={{ ...s.toggle, background: form.isFavorite ? '#f59e0b' : 'var(--color-border)' }}
              onClick={() => set('isFavorite', !form.isFavorite)}
              aria-label="Favori"
            />
            <div>
              <div style={s.toggleLabel}>Favori</div>
              <div style={s.toggleSub}>Article favori, prioritaire dans les suggestions</div>
            </div>
          </div>

          <label style={s.label}>Priorité</label>
          <div style={s.priorityRow}>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                style={{
                  ...s.priorityBtn,
                  ...(form.priority === key ? { background: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-primary)' } : {}),
                }}
                onClick={() => set('priority', key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Notes</div>
          <textarea
            style={s.textarea}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Remarques, instructions d'entretien, etc."
          />
        </div>

        <div style={s.actions}>
          <button style={s.saveBtn} onClick={handleSave}>
            {isEditing ? 'Enregistrer' : 'Ajouter'}
          </button>
          {isEditing && (
            <button style={s.deleteBtn} onClick={() => setShowDelete(true)}>
              Supprimer
            </button>
          )}
        </div>
      </div>

      {showDelete && (
        <Modal
          title="Supprimer l'article"
          message={`Voulez-vous vraiment supprimer « ${form.name} » ? Il sera retiré de tous les kits et sacs.`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
