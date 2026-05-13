import { useState, useMemo } from 'react'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { ICONS } from '../../components/Icon/icons'
import { Modal } from '../../components/Modal/Modal'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useGear } from '../../hooks/useGear'
import { useBackClose } from '../../hooks/useBackClose'

const COLORS = [
  '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981',
  '#ef4444', '#06b6d4', '#ec4899', '#6b7280',
  '#84cc16', '#14b8a6', '#f97316', '#6366f1',
]

const ICON_NAMES = Object.keys(ICONS)

const s = {
  container: {
    minHeight: '100dvh',
    background: 'var(--color-bg)',
  },
  list: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
  },
  iconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
    outline: 'none',
  },
  count: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  },
  deleteBtn: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  fab: {
    position: 'fixed',
    bottom: '96px',
    right: '20px',
    width: '52px',
    height: '52px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  formOverlay: {
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
  form: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    width: '100%',
    maxWidth: '380px',
    animation: 'scaleIn 200ms ease',
  },
  formTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    marginBottom: '16px',
    color: 'var(--color-text)',
    outline: 'none',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: 'var(--text-sm)',
    marginBottom: '12px',
    outline: 'none',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '6px',
    marginBottom: '12px',
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text)',
    outline: 'none',
    boxShadow: 'none',
  },
  iconActive: {
    border: '1px solid var(--color-primary)',
    background: 'var(--color-primary)',
    color: 'white',
    outline: 'none',
    boxShadow: 'none',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  colorBtn: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-full)',
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  colorActive: {
    border: '3px solid var(--color-text)',
    transform: 'scale(1.25)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'white',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export function CategoriesPage() {
  const { categories, items, addCategory, updateCategory, deleteCategory } = useGear()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ name: '', icon: 'package', color: '#6b7280' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  useBackClose(showForm, () => { setShowForm(false); setEditing(null) })

  const itemCounts = useMemo(() => {
    const counts = {}
    for (const item of items) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1
    }
    return counts
  }, [items])

  const openAdd = () => {
    setEditing(null)
    setFormData({ name: '', icon: 'package', color: '#6b7280' })
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setFormData({ name: cat.name, icon: cat.icon, color: cat.color })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) return
    if (editing) {
      updateCategory(editing.id, formData)
    } else {
      addCategory(formData)
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const ok = deleteCategory(deleteTarget.id)
    if (!ok) {
      alert('Impossible : des articles sont liés à cette catégorie.')
    }
    setDeleteTarget(null)
  }

  return (
    <div style={s.container}>
      <Header title="Catégories" onBack={() => window.history.back()} />

      <div style={s.list}>
        {categories.map(cat => (
          <div key={cat.id} style={s.card} onClick={() => openEdit(cat)}>
            <div style={{ ...s.iconWrap, background: cat.color }}>
              <Icon name={cat.icon} size="sm" />
            </div>
            <div style={s.info}>
              <div style={s.name}>{cat.name}</div>
              <div style={s.count}>{itemCounts[cat.id] || 0} article(s)</div>
            </div>
            <button
              style={s.deleteBtn}
              onClick={e => { e.stopPropagation(); setDeleteTarget(cat) }}
              aria-label="Supprimer"
            >
              <Icon name="trash" size="sm" />
            </button>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <EmptyState icon="tag" message="Créez vos catégories pour organiser votre matériel" actionLabel="Ajouter une catégorie" onAction={openAdd} />
      )}

      <button style={s.fab} onClick={openAdd} aria-label="Ajouter une catégorie"><Icon name="plus" size="lg" /></button>

      {showForm && (
        <div style={s.formOverlay} onClick={() => { setShowForm(false); setEditing(null) }}>
          <div style={s.form} onClick={e => e.stopPropagation()}>
            <div style={s.formTitle}>{editing ? 'Modifier' : 'Nouvelle catégorie'}</div>

            <label style={s.label}>Nom</label>
            <input
              style={s.input}
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Cuisine & Eau"
            />

            <label style={s.label}>Icône</label>
            <div style={s.iconGrid}>
              {ICON_NAMES.map(iname => (
                <button
                  key={iname}
                  style={{ ...s.iconBtn, ...(formData.icon === iname ? s.iconActive : {}) }}
                  onClick={(e) => { e.currentTarget.blur(); setFormData(f => ({ ...f, icon: iname })) }}
                >
                  <Icon name={iname} size="sm" />
                </button>
              ))}
            </div>

            <label style={s.label}>Couleur</label>
            <div style={s.colorGrid}>
              {COLORS.map(color => (
                <button
                  key={color}
                  style={{ ...s.colorBtn, background: color, ...(formData.color === color ? s.colorActive : {}) }}
                  onClick={(e) => { e.currentTarget.blur(); setFormData(f => ({ ...f, color })) }}
                  aria-label={color}
                />
              ))}
            </div>

            <div style={s.actions}>
              <button style={s.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Annuler</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={!formData.name.trim()}>
                {editing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <Modal
          title="Supprimer la catégorie"
          message={`Voulez-vous vraiment supprimer « ${deleteTarget.name} » ?`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
