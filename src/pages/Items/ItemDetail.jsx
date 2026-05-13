import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { Modal } from '../../components/Modal/Modal'
import { useGear } from '../../hooks/useGear'
import { CONDITION_LABELS, CONDITION_COLORS, PRIORITY_LABELS } from '../../models/item'
import { resolveSac } from '../../models/sac'

const s = {
  container: { minHeight: '100dvh', background: 'var(--color-bg)' },
  content: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  emptyState: { padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' },
  infoCard: { padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '16px', animation: 'slideUp 400ms ease' },
  catRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
  catBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 600 },
  name: { fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '2px' },
  brandModel: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  sectionHeader: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '10px', marginTop: '20px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  detailBox: { padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
  detailLabel: { fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  detailValue: { fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' },
  chipRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 600 },
  toggleGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  toggleChip: { padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' },
  toggleChipActive: { border: 'none', color: 'white' },
  notesBox: { padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  crossRefCard: { padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '4px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  crossRefIcon: { display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--color-text-secondary)' },
  crossRefInfo: { flex: 1, minWidth: 0 },
  crossRefName: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' },
  crossRefMeta: { fontSize: '11px', color: 'var(--color-text-secondary)' },
  emptyText: { padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' },
  sectionSub: { fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', marginTop: '12px' },
  contextDot: { width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' },
  contextRow: { fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' },
}

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, categories, kits, sacs, deleteItem } = useGear()
  const [showDelete, setShowDelete] = useState(false)

  const item = items.find(i => i.id === id)
  const category = item ? categories.find(c => c.id === item.categoryId) : null

  if (!item) {
    return (
      <div style={s.container}>
        <Header title="Article introuvable" onBack={() => navigate('/inventory')} />
        <div style={s.emptyState}>Cet article n'existe pas ou a été supprimé.</div>
      </div>
    )
  }

  function kitContainsItem(kitId, visited) {
    if (visited.has(kitId)) return false
    visited.add(kitId)
    const kit = kits.find(k => k.id === kitId)
    if (!kit) return false
    if (kit.itemEntries.some(e => e.itemId === id)) return true
    return kit.subKitEntries.some(se => kitContainsItem(se.kitId, visited))
  }

  const usedInKits = kits.filter(k => k.itemEntries.some(e => e.itemId === id))
  const usedInSacs = sacs.filter(s => s.entries.some(e =>
    (e.type === 'item' && e.itemId === id) ||
    (e.type === 'kit' && kitContainsItem(e.kitId, new Set()))
  ))

  return (
    <div style={s.container}>
      <Header
        title={item.name}
        onBack={() => navigate('/inventory')}
        rightAction={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate(`/items/${id}/edit`)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }} aria-label="Modifier"><Icon name="edit" /></button>
            <button onClick={() => setShowDelete(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }} aria-label="Supprimer"><Icon name="trash" /></button>
          </div>
        }
      />
      <div style={s.content}>
        <div style={s.infoCard}>
          <div style={s.catRow}>
            {category && (
              <span style={{ ...s.catBadge, background: category.color + '22', color: category.color }}>
                <Icon name={category.icon} size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {category.name}
              </span>
            )}
          </div>
          <div style={s.name}>{item.name}</div>
          {(item.brand || item.model) && (
            <div style={s.brandModel}>{[item.brand, item.model].filter(Boolean).join(' · ')}</div>
          )}
        </div>

        <div style={s.sectionHeader}>Détails</div>
        <div style={s.grid2}>
          <div style={s.detailBox}>
            <div style={s.detailLabel}>Poids</div>
            <div style={s.detailValue}>{item.weight || 0}g</div>
          </div>
          <div style={s.detailBox}>
            <div style={s.detailLabel}>Quantité</div>
            <div style={s.detailValue}>×{item.quantity}</div>
          </div>
          {(item.length != null || item.width != null || item.depth != null) && (
            <div style={s.detailBox}>
              <div style={s.detailLabel}>Dimensions</div>
              <div style={s.detailValue}>
                {[item.length, item.width, item.depth].filter(v => v != null).join(' × ')} cm
              </div>
            </div>
          )}
          {item.volume != null && (
            <div style={s.detailBox}>
              <div style={s.detailLabel}>Volume</div>
              <div style={s.detailValue}>{item.volume} L</div>
            </div>
          )}
        </div>

        <div style={s.chipRow}>
          <span style={{ ...s.chip, background: CONDITION_COLORS[item.condition] + '22', color: CONDITION_COLORS[item.condition] }}>
            {CONDITION_LABELS[item.condition]}
          </span>
          <span style={{ ...s.chip, background: 'var(--color-primary)' + '22', color: 'var(--color-primary)' }}>
            {PRIORITY_LABELS[item.priority]}
          </span>
        </div>

        {(item.purchaseDate || item.purchasePrice != null) && (
          <>
            <div style={s.sectionHeader}>Achat</div>
            <div style={s.grid2}>
              {item.purchaseDate && (
                <div style={s.detailBox}>
                  <div style={s.detailLabel}>Date d'achat</div>
                  <div style={s.detailValue}>{new Date(item.purchaseDate).toLocaleDateString('fr-FR')}</div>
                </div>
              )}
              {item.purchasePrice != null && (
                <div style={s.detailBox}>
                  <div style={s.detailLabel}>Prix</div>
                  <div style={s.detailValue}>{item.purchasePrice.toFixed(2)} €</div>
                </div>
              )}
            </div>
          </>
        )}

        <div style={s.sectionHeader}>Préparation voyage</div>
        <div style={s.toggleGrid}>
          {item.isFavorite && <span style={{ ...s.toggleChip, ...s.toggleChipActive, background: '#f59e0b' }}><Icon name="star" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Favori</span>}
          {item.isConsumable && (() => {
  const icon = item.consumableType === 'water' ? 'droplet'
    : item.consumableType === 'fuel' ? 'flame'
    : item.consumableType === 'food' ? 'food'
    : 'refresh'
  return <span style={{ ...s.toggleChip, ...s.toggleChipActive, background: '#22c55e' }}><Icon name={icon} size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Consommable</span>
})()}
          {item.isWorn && <span style={{ ...s.toggleChip, ...s.toggleChipActive, background: '#3b82f6' }}><Icon name="shirt" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Porté</span>}
          {!item.isFavorite && !item.isConsumable && !item.isWorn && (
            <div style={s.emptyText}>Aucun attribut voyage</div>
          )}
        </div>

        {item.notes && (
          <>
            <div style={s.sectionHeader}>Notes</div>
            <div style={s.notesBox}>{item.notes}</div>
          </>
        )}

        <div style={{ borderTop: '2px solid var(--color-border)', margin: '28px 0 16px' }} />
        <div style={s.sectionHeader}>Utilisé dans</div>
        {usedInKits.length > 0 && (
          <>
            <div style={s.sectionSub}><Icon name="package" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Kits ({usedInKits.length})</div>
            {usedInKits.map(k => (
              <div key={k.id} style={s.crossRefCard} onClick={() => navigate(`/kits/${k.id}`)}>
                <span style={s.crossRefIcon}><Icon name={k.icon || 'package'} size="sm" /></span>
                <div style={s.crossRefInfo}>
                  <div style={s.crossRefName}>{k.name}</div>
                  <div style={s.crossRefMeta}>{k.itemEntries.length} article(s)</div>
                </div>
                  <Icon name="chevron-right" size="xxs" style={{ color: 'var(--color-text-secondary)' }} />
              </div>
            ))}
          </>
        )}
        {usedInSacs.length > 0 && (
          <>
            <div style={s.sectionSub}><Icon name="backpack" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Sacs ({usedInSacs.length})</div>
            {usedInSacs.map(sac => {
              const resolved = resolveSac(sac, kits, items)
              const totalItems = resolved.flatItems.filter(fi => !fi.deleted).length
              const isDirect = sac.entries.some(e => e.type === 'item' && e.itemId === id)
              const isViaKit = sac.entries.some(e => e.type === 'kit' && kitContainsItem(e.kitId, new Set()))
              return (
                <div key={sac.id} style={s.crossRefCard} onClick={() => navigate(`/sacs/${sac.id}`)}>
                  <span style={s.crossRefIcon}><Icon name="backpack" size="sm" /></span>
                  <div style={s.crossRefInfo}>
                    <div style={s.crossRefName}>{sac.name}</div>
                    <div style={s.crossRefMeta}>{totalItems} article(s)</div>
                    <div style={s.contextRow}>
                      <span style={{ ...s.contextDot, background: isDirect && isViaKit ? '#8b5cf6' : isDirect ? '#3b82f6' : '#f59e0b' }} />
                      {isDirect && isViaKit ? 'Direct + kit' : isDirect ? 'Direct' : 'Via kit'}
                    </div>
                  </div>
                <Icon name="chevron-right" size="xxs" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              )
            })}
          </>
        )}
        {usedInKits.length === 0 && usedInSacs.length === 0 && (
          <div style={s.emptyText}>Cet article n'est utilisé dans aucun kit ni sac.</div>
        )}
      </div>

      {showDelete && (
        <Modal
          title="Supprimer l'article"
          message={`Voulez-vous vraiment supprimer « ${item.name} » ? Il sera retiré de tous les kits et sacs.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteItem(id); navigate('/inventory') }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
