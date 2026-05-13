import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { ICONS } from '../../components/Icon/icons'
import { ItemSelectModal } from '../../components/ItemSelectModal/ItemSelectModal'
import { Modal } from '../../components/Modal/Modal'
import { useGear } from '../../hooks/useGear'
import { getKitTotalWeight } from '../../models/kit'

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#6b7280', '#84cc16', '#14b8a6']
const ICON_NAMES = Object.keys(ICONS)

const s = {
  container: { minHeight: '100dvh', background: 'var(--color-bg)' },
  form: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '12px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginBottom: '10px', outline: 'none' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', resize: 'vertical', minHeight: '60px', outline: 'none' },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '12px' },
  iconBtn: { width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)', outline: 'none', boxShadow: 'none' },
  colorGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  colorBtn: { width: '28px', height: '28px', borderRadius: 'var(--radius-full)', border: '2px solid transparent', cursor: 'pointer' },
  entryList: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' },
  entryRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' },
  entryName: { flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' },
  removeBtn: { padding: '4px 8px', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 },
  addBtn: { padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center' },
  weightInfo: { fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'right' },
  actions: { display: 'flex', gap: '10px', marginTop: '24px', paddingBottom: '32px' },
  saveBtn: { flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' },
  deleteBtn: { padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' },
}

const defaultKitForm = { name: '', description: '', icon: 'package', color: '#6b7280', itemEntries: [], subKitEntries: [] }

const kitFormFromExisting = (kit) => ({
  name: kit.name || '',
  description: kit.description || '',
  icon: kit.icon || 'package',
  color: kit.color || '#6b7280',
  itemEntries: [...(kit.itemEntries || [])],
  subKitEntries: [...(kit.subKitEntries || [])],
})

export function KitForm() {
  const { id } = useParams()
  const { kits, kitsMeta } = useGear()
  if (id && kitsMeta.loading) return null
  const existingKit = id ? kits.find(k => k.id === id) : null
  return <KitFormInner key={id || 'new'} existingKit={existingKit} />
}

function KitFormInner({ existingKit }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { kits, items, addKit, updateKit, deleteKit } = useGear()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(existingKit ? kitFormFromExisting(existingKit) : defaultKitForm)
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [showKitPicker, setShowKitPicker] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const totalWeight = useMemo(() => {
    let w = 0
    for (const entry of form.itemEntries) {
      const item = items.find(i => i.id === entry.itemId)
      if (item) w += (item.weight || 0) * entry.quantity
    }
    for (const se of form.subKitEntries) {
      w += getKitTotalWeight(se.kitId, kits, items).weight
    }
    return w
  }, [form, items, kits])

  const handleAddItems = (selectedIds) => {
    for (const id of selectedIds) {
      if (!form.itemEntries.some(e => e.itemId === id)) {
        set('itemEntries', [...form.itemEntries, { itemId: id, quantity: 1 }])
      }
    }
    setShowItemPicker(false)
  }

  const handleAddKit = (selectedIds) => {
    for (const kid of selectedIds) {
      if (!form.subKitEntries.some(e => e.kitId === kid) && kid !== id) {
        set('subKitEntries', [...form.subKitEntries, { kitId: kid }])
      }
    }
    setShowKitPicker(false)
  }

  const removeItem = (itemId) => set('itemEntries', form.itemEntries.filter(e => e.itemId !== itemId))
  const removeSubKit = (kitId) => set('subKitEntries', form.subKitEntries.filter(e => e.kitId !== kitId))
  const changeQty = (itemId, qty) => set('itemEntries', form.itemEntries.map(e => e.itemId === itemId ? { ...e, quantity: Math.max(1, qty) } : e))

  const handleSave = () => {
    if (!form.name.trim()) return
    if (isEditing) {
      updateKit(id, form)
      navigate('/kits/' + id)
    } else {
      addKit(form)
      navigate('/kits')
    }
  }

  const handleDelete = () => {
    deleteKit(id)
    navigate('/kits')
  }

  const getItemName = (iid) => items.find(i => i.id === iid)?.name || 'Article inconnu'
  const getKitName = (kid) => kits.find(k => k.id === kid)?.name || 'Kit inconnu'

  const availableSubKits = kits.filter(k => k.id !== id)

  return (
    <div style={s.container}>
      <Header title={isEditing ? 'Modifier le kit' : 'Nouveau kit'} onBack={() => navigate('/kits')} />

      <div style={s.form}>
        <div style={s.section}>
          <div style={s.sectionTitle}>Informations</div>
          <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom du kit *" />
          <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (optionnelle)" />

          <div style={s.sectionTitle}>Icône</div>
          <div style={s.iconGrid}>
            {ICON_NAMES.map(iname => (
              <button key={iname} style={{ ...s.iconBtn, ...(form.icon === iname ? { border: '1px solid var(--color-primary)', background: 'var(--color-primary)', color: 'white', outline: 'none', boxShadow: 'none' } : {}) }} onClick={(e) => { e.currentTarget.blur(); set('icon', iname) }}><Icon name={iname} size="sm" /></button>
            ))}
          </div>

          <div style={s.sectionTitle}>Couleur</div>
          <div style={s.colorGrid}>
            {COLORS.map(color => (
              <button key={color} style={{ ...s.colorBtn, background: color, ...(form.color === color ? { border: '3px solid var(--color-text)', transform: 'scale(1.25)' } : {}) }} onClick={(e) => { e.currentTarget.blur(); set('color', color) }} />
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Articles ({form.itemEntries.length})</div>
          <div style={s.entryList}>
            {form.itemEntries.map(entry => (
              <div key={entry.itemId} style={s.entryRow}>
                <span style={s.entryName}>{getItemName(entry.itemId)}</span>
                <input
                  type="number"
                  min="1"
                  value={entry.quantity}
                  onChange={e => changeQty(entry.itemId, Number(e.target.value))}
                  style={{ width: '44px', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', textAlign: 'center', fontSize: '12px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', width: '40px', textAlign: 'right' }}>
                  {(() => { const it = items.find(i => i.id === entry.itemId); return it ? `${(it.weight || 0) * entry.quantity}g` : '' })()}
                </span>
                <button style={s.removeBtn} onClick={() => removeItem(entry.itemId)}>✕</button>
              </div>
            ))}
          </div>
          <button style={s.addBtn} onClick={() => setShowItemPicker(true)}>+ Ajouter des articles</button>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Sous-kits ({form.subKitEntries.length})</div>
          <div style={s.entryList}>
            {form.subKitEntries.map(entry => (
              <div key={entry.kitId} style={s.entryRow}>
                <span style={s.entryName}>{getKitName(entry.kitId)}</span>
                <button style={s.removeBtn} onClick={() => removeSubKit(entry.kitId)}>✕</button>
              </div>
            ))}
          </div>
          <button style={s.addBtn} onClick={() => setShowKitPicker(true)}>+ Ajouter un sous-kit</button>
        </div>

        <div style={s.weightInfo}>
          Poids total estimé : {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(2)} kg` : `${totalWeight} g`}
        </div>

        <div style={s.actions}>
          <button style={s.saveBtn} onClick={handleSave}>
            {isEditing ? 'Enregistrer' : 'Créer le kit'}
          </button>
          {isEditing && (
            <button style={s.deleteBtn} onClick={() => setShowDelete(true)}>Supprimer</button>
          )}
        </div>
      </div>

      {showItemPicker && (
        <ItemSelectModal
          items={items}
          selectedIds={form.itemEntries.map(e => e.itemId)}
          onConfirm={handleAddItems}
          onCancel={() => setShowItemPicker(false)}
          title="Sélectionner des articles"
        />
      )}

      {showKitPicker && (
        <ItemSelectModal
          items={availableSubKits.map(k => {
            const info = getKitTotalWeight(k.id, kits, items)
            return { id: k.id, name: k.name, icon: k.icon, weight: info.weight, itemCount: info.itemCount, brand: `${info.itemCount} articles` }
          })}
          selectedIds={form.subKitEntries.map(e => e.kitId)}
          onConfirm={handleAddKit}
          onCancel={() => setShowKitPicker(false)}
          title="Sélectionner un sous-kit"
        />
      )}

      {showDelete && (
        <Modal
          title="Supprimer le kit"
          message={`Voulez-vous vraiment supprimer « ${form.name} » ? Les sous-kits ne seront pas supprimés.`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
