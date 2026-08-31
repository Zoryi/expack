import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { Modal } from '../../components/Modal/Modal'
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal'
import { ItemCard, ItemCardRightWeight } from '../../components/ItemCard/ItemCard'
import { CategoryHeader } from '../../components/CategoryHeader/CategoryHeader'
import { useGear } from '../../hooks/useGear'
import { getKitTotalWeight } from '../../models/kit'
import { prepareSharePayload, safeCompressForQr, getFocalInfo } from '../../utils/share'

const s = {
  container: { minHeight: '100dvh', background: 'var(--color-bg)' },
  content: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  emptyState: { padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' },
  infoCard: { padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'slideUp 400ms ease' },
  iconWrap: { width: '52px', height: '52px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' },
  name: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '2px' },
  description: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' },
  statsRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  statBox: { flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center' },
  statNum: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' },
  sectionHeader: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '8px', marginTop: '4px' },
  subKitSection: { marginBottom: '16px' },
  subKitHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '3px', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'background var(--transition-fast)' },
  subKitName: { flex: 1, color: 'var(--color-text)' },
  subKitMeta: { fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 },
  subItemsArea: { marginBottom: '6px' },
  subItemRow: { display: 'flex', alignItems: 'center', padding: '6px 12px', fontSize: 'var(--text-sm)' },
  subItemName: { flex: 1, color: 'var(--color-text-secondary)' },
  subItemQty: { fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '8px' },
  subItemWeight: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' },
  totalRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginTop: '8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' },
  totalWeight: { fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' },
  emptyText: { padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' },
  chevron: { width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' },
}

export function KitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { kits, items, categories, sacs, deleteKit } = useGear()
  const [showDelete, setShowDelete] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [shareError, setShareError] = useState(null)
  const [expanded, setExpanded] = useState({})

  function handleShare() {
    setShareError(null)
    try {
      const payload = prepareSharePayload('kit', id, items, categories, kits, sacs)
      const result = safeCompressForQr(payload)
      if (!result.ok) {
        console.error('Échec de la préparation du partage:', result.error)
        setShareError("Impossible de préparer le partage. Réessayez ou mettez à jour l'application.")
        return
      }
      const focalInfo = getFocalInfo(payload)
      setShareData({ compressed: result.value, focalInfo, payload })
      setShowShare(true)
    } catch (err) {
      console.error('Erreur lors du partage:', err)
      setShareError("Une erreur est survenue lors du partage. Réessayez.")
    }
  }

  const kit = kits.find(k => k.id === id)

  if (!kit) {
    return (
      <div style={s.container}>
        <Header title="Kit introuvable" onBack={() => navigate('/kits')} />
        <div style={s.emptyState}>Ce kit n'existe pas ou a été supprimé.</div>
      </div>
    )
  }

  const directItems = kit.itemEntries.map(e => ({ ...e, item: items.find(i => i.id === e.itemId) })).filter(e => e.item)

  const groupedDirectItems = (() => {
    const order = new Map([...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })).map((c, i) => [c.id, i]))
    const map = {}
    const groupOrder = []
    for (const e of directItems) {
      const catId = e.item.categoryId
      if (!(catId in map)) { map[catId] = []; groupOrder.push(catId) }
      map[catId].push(e)
    }
    groupOrder.sort((a, b) => {
      const ia = order.get(a) ?? Number.MAX_SAFE_INTEGER
      const ib = order.get(b) ?? Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      return (a ?? '').localeCompare(b ?? '', 'fr', { sensitivity: 'base' })
    })
    return groupOrder.map(catId => {
      const cat = categories.find(c => c.id === catId)
      const entries = [...map[catId]].sort((x, y) =>
        x.item.name.localeCompare(y.item.name, 'fr', { sensitivity: 'base' }) ||
        (x.item.brand ?? '').localeCompare(y.item.brand ?? '', 'fr', { sensitivity: 'base' }) ||
        (x.item.model ?? '').localeCompare(y.item.model ?? '', 'fr', { sensitivity: 'base' })
      )
      return { catId, icon: cat?.icon || 'package', name: cat?.name || 'Sans catégorie', entries }
    })
  })()

  const totalWeight = getKitTotalWeight(id, kits, items).weight

  function toggleExpand(kitId) {
    setExpanded(p => ({ ...p, [kitId]: !p[kitId] }))
  }

  function renderSubKit(subKitId, depth) {
    const sub = kits.find(k => k.id === subKitId)
    if (!sub) return null
    const isExpanded = expanded[subKitId]
    const subItems = sub.itemEntries.map(e => ({ ...e, item: items.find(i => i.id === e.itemId) })).filter(e => e.item)

    return (
      <div key={subKitId}>
        <div style={{ ...s.subKitHeader, marginLeft: `${depth * 20}px` }} onClick={() => toggleExpand(subKitId)}>
          <span style={s.chevron}>{sub.subKitEntries.length > 0 ? <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size="xxs" /> : <span style={{ fontSize: 10 }}>·</span>}</span>
          <Icon name={sub.icon || 'package'} size="sm" />
          <span style={s.subKitName}>{sub.name}</span>
          <span style={s.subKitMeta}>{subItems.length} art.</span>
        </div>
        {isExpanded && (
          <div style={s.subItemsArea}>
            {subItems.map(({ item, quantity }) => (
              <div key={item.id} style={{ ...s.subItemRow, marginLeft: `${(depth + 1) * 20}px` }}>
                <span style={s.subItemName}>{item.name}</span>
                <span style={s.subItemQty}>{quantity > 1 ? `×${quantity}` : ''}</span>
                <span style={s.subItemWeight}>{(item.weight || 0) * quantity}g</span>
              </div>
            ))}
            {sub.subKitEntries.map(se => renderSubKit(se.kitId, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={s.container}>
      <Header
        title={kit.name}
        onBack={() => navigate('/kits')}
        rightAction={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleShare} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} aria-label="Partager"><Icon name="share" /></button>
            <button onClick={() => navigate(`/kits/${id}/edit`)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center' }} aria-label="Modifier"><Icon name="edit" /></button>
            <button onClick={() => setShowDelete(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }} aria-label="Supprimer"><Icon name="trash" /></button>
          </div>
        }
      />
      <div style={s.content}>
        {shareError && (
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: '#ef444422', color: '#ef4444', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
            {shareError}
          </div>
        )}
        <div style={s.infoCard}>
          <div style={{ ...s.iconWrap, background: (kit.color || '#6b7280') }}>
            <Icon name={kit.icon || 'package'} size="lg" />
          </div>
          <div>
            <div style={s.name}>{kit.name}</div>
            {kit.description && <div style={s.description}>{kit.description}</div>}
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.statBox}>
            <div style={s.statNum}>{directItems.length}</div>
            <div style={s.statLabel}>Articles</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statNum}>{kit.subKitEntries.length}</div>
            <div style={s.statLabel}>Sous-kits</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statNum}>{totalWeight >= 1000 ? (totalWeight / 1000).toFixed(1) : totalWeight}</div>
            <div style={s.statLabel}>{totalWeight >= 1000 ? 'kg' : 'g'}</div>
          </div>
        </div>

        <div style={s.sectionHeader}>Articles ({directItems.length})</div>
        {groupedDirectItems.map(group => (
          <div key={group.catId} style={{ marginBottom: '12px' }}>
            <CategoryHeader icon={group.icon} name={group.name} count={group.entries.length} />
            {group.entries.map(({ item, quantity }) => (
              <ItemCard
                key={item.id}
                item={item}
                to={`/items/${item.id}`}
                showConsumable
                showFavorite
                rightSlot={<ItemCardRightWeight weight={item.weight} qty={quantity} />}
              />
            ))}
          </div>
        ))}
        {directItems.length === 0 && <div style={s.emptyText}>Aucun article direct</div>}

        {kit.subKitEntries.length > 0 && (
          <>
            <div style={s.sectionHeader}>Sous-kits ({kit.subKitEntries.length})</div>
            <div style={s.subKitSection}>
              {kit.subKitEntries.map(se => renderSubKit(se.kitId, 0))}
            </div>
          </>
        )}

        <div style={s.totalRow}>
          <span>Poids total</span>
          <span style={s.totalWeight}>{totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(2)} kg` : `${totalWeight} g`}</span>
        </div>
      </div>

      {showShare && shareData && (
        <QRCodeModal
          compressed={shareData.compressed}
          focalInfo={shareData.focalInfo}
          payload={shareData.payload}
          onClose={() => setShowShare(false)}
        />
      )}

      {showDelete && (
        <Modal
          title="Supprimer le kit"
          message={`Voulez-vous vraiment supprimer « ${kit.name} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteKit(id); navigate('/kits') }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
