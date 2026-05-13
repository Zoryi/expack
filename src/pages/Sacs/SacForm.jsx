import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { KitRow } from '../../components/KitRow/KitRow'
import { Modal } from '../../components/Modal/Modal'
import { ItemSelectModal } from '../../components/ItemSelectModal/ItemSelectModal'
import { useGear } from '../../hooks/useGear'
import { TRIP_TYPES, TRIP_TYPE_LABELS } from '../../models/sac'
import { getKitTotalWeight } from '../../models/kit'

const s = {
  container: { minHeight: '100dvh', background: 'var(--color-bg)' },
  form: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '12px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginBottom: '8px', outline: 'none' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'inherit', resize: 'vertical', minHeight: '60px', outline: 'none' },
  select: { width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginBottom: '8px', outline: 'none', cursor: 'pointer' },
  entryList: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  entryRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' },
  entryName: { flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text)' },
  entryMeta: { fontSize: '11px', color: 'var(--color-text-secondary)' },
  removeBtn: { padding: '4px 8px', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 },
  addBtns: { display: 'flex', gap: '8px' },
  addBtn: { flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' },
  actions: { display: 'flex', gap: '10px', marginTop: '24px', paddingBottom: '32px' },
  saveBtn: { flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' },
  deleteBtn: { padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' },
}

export function SacForm() {
  const { id } = useParams()
  const { sacs } = useGear()
  const existingSac = id ? sacs.find(s => s.id === id) : null
  return <SacFormInner key={id || 'new'} existingSac={existingSac} />
}

function SacFormInner({ existingSac }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, kits, addSac, updateSac, deleteSac } = useGear()
  const isEditing = Boolean(id)

  const [form, setForm] = useState({
    name: existingSac?.name || '',
    description: existingSac?.description || '',
    destination: existingSac?.destination || '',
    tripDate: existingSac?.tripDate || '',
    duration: existingSac?.duration || 1,
    type: existingSac?.type || TRIP_TYPES.BIVOUAC,
  })
  const [entryItems, setEntryItems] = useState(existingSac ? existingSac.entries.filter(e => e.type === 'item').map(e => e.itemId) : [])
  const [entryKits, setEntryKits] = useState(existingSac ? existingSac.entries.filter(e => e.type === 'kit').map(e => e.kitId) : [])
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [showKitPicker, setShowKitPicker] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const kitInfo = useMemo(() => {
    const map = {}
    for (const kid of entryKits) {
      map[kid] = getKitTotalWeight(kid, kits, items)
    }
    return map
  }, [entryKits, kits, items])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const totalWeight = useMemo(() => {
    let w = 0
    for (const eid of entryItems) {
      const item = items.find(i => i.id === eid)
      if (item) w += item.weight || 0
    }
    for (const kid of entryKits) {
      w += getKitTotalWeight(kid, kits, items).weight
    }
    return w
  }, [entryItems, entryKits, items, kits])

  const handleAddItems = (selectedIds) => {
    setEntryItems(prev => {
      const set = new Set(prev)
      for (const id of selectedIds) set.add(id)
      return Array.from(set)
    })
    setShowItemPicker(false)
  }

  const handleAddKits = (selectedIds) => {
    setEntryKits(prev => {
      const set = new Set(prev)
      for (const id of selectedIds) set.add(id)
      return Array.from(set)
    })
    setShowKitPicker(false)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (entryItems.length === 0 && entryKits.length === 0) return

    const sac = {
      ...form,
      duration: Number(form.duration) || 1,
      entries: [
        ...entryItems.map(itemId => ({
          entryId: `e${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'item', itemId, quantity: 1,
        })),
        ...entryKits.map(kitId => ({
          entryId: `e${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'kit', kitId,
        })),
      ],
      packingState: isEditing ? (existingSac?.packingState || {}) : {},
    }

    if (isEditing) {
      updateSac(id, sac)
      navigate('/sacs/' + id)
    } else {
      addSac(sac)
      navigate('/sacs')
    }
  }

  const handleDelete = () => {
    deleteSac(id)
    navigate('/sacs')
  }

  return (
    <div style={s.container}>
      <Header title={isEditing ? 'Modifier le sac' : 'Nouveau sac'} onBack={() => navigate(isEditing ? '/sacs/' + id : '/sacs')} />

      <div style={s.form}>
        <div style={s.section}>
          <div style={s.sectionTitle}>Expédition</div>
          <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom du sac *" />
          <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (optionnelle)" />
          <input style={s.input} value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Destination" />
          <div style={s.row}>
            <input style={s.input} type="date" value={form.tripDate} onChange={e => set('tripDate', e.target.value)} placeholder="Date" />
            <input style={s.input} type="number" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="Durée (jours)" min="1" />
          </div>
          <select style={s.select} value={form.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(TRIP_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Contenu du sac</div>

          {entryItems.length > 0 && (
            <>
              <div style={s.sectionTitle} style={{ ...s.sectionTitle, marginBottom: '4px', fontSize: '10px' }}>Articles directs</div>
              <div style={s.entryList}>
                {entryItems.map(eid => {
                  const item = items.find(i => i.id === eid)
                  return (
                    <div key={eid} style={s.entryRow}>
                      <span style={s.entryName}>{item?.name || 'Inconnu'}</span>
                      <span style={s.entryMeta}>{item?.weight ? `${item.weight}g` : ''}</span>
                      <button style={s.removeBtn} onClick={() => setEntryItems(prev => prev.filter(id => id !== eid))}>✕</button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {entryKits.length > 0 && (
            <>
              <div style={s.sectionTitle} style={{ ...s.sectionTitle, marginBottom: '4px', fontSize: '10px' }}>Kits inclus</div>
              <div style={s.entryList}>
                {entryKits.map(kid => {
                  const kit = kits.find(k => k.id === kid)
                  const info = kitInfo[kid]
                  return (
                    <div key={kid} style={s.entryRow}>
                      <KitRow
                        icon={kit?.icon}
                        name={kit?.name || 'Inconnu'}
                        weight={info?.weight || 0}
                        itemCount={info?.itemCount || 0}
                      />
                      <button style={s.removeBtn} onClick={() => setEntryKits(prev => prev.filter(id => id !== kid))}>✕</button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={s.addBtns}>
            <button style={s.addBtn} onClick={() => setShowItemPicker(true)}>+ Articles</button>
            <button style={s.addBtn} onClick={() => setShowKitPicker(true)}>+ Kit</button>
          </div>

          <div style={{
            textAlign: 'right', fontSize: '12px', color: 'var(--color-text-secondary)',
            marginTop: '8px', fontWeight: 600,
          }}>
            Poids total : {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`}
          </div>
        </div>

        <div style={s.actions}>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={!form.name.trim() || (entryItems.length === 0 && entryKits.length === 0)}
          >
            {isEditing ? 'Enregistrer' : 'Créer le sac'}
          </button>
          {isEditing && (
            <button style={s.deleteBtn} onClick={() => setShowDelete(true)}>
              Supprimer
            </button>
          )}
        </div>
      </div>

      {showItemPicker && (
        <ItemSelectModal
          items={items}
          selectedIds={entryItems}
          onConfirm={handleAddItems}
          onCancel={() => setShowItemPicker(false)}
          title="Ajouter des articles"
        />
      )}

      {showKitPicker && (
        <ItemSelectModal
          items={kits.map(k => {
            const info = getKitTotalWeight(k.id, kits, items)
            return { id: k.id, name: k.name, icon: k.icon, weight: info.weight, itemCount: info.itemCount, brand: `${info.itemCount} articles` }
          })}
          selectedIds={entryKits}
          onConfirm={handleAddKits}
          onCancel={() => setShowKitPicker(false)}
          title="Ajouter des kits"
        />
      )}

      {showDelete && (
        <Modal
          title="Supprimer le sac"
          message={`Voulez-vous vraiment supprimer « ${form.name} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => { handleDelete(); setShowDelete(false) }}
          onCancel={() => setShowDelete(false)}
          isDestructive
        />
      )}
    </div>
  )
}
