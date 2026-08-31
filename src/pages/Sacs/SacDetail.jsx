import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Icon } from '../../components/Icon/Icon'
import { Modal } from '../../components/Modal/Modal'
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal'
import { useGear } from '../../hooks/useGear'
import { ItemCard } from '../../components/ItemCard/ItemCard'
import { CategoryHeader } from '../../components/CategoryHeader/CategoryHeader'
import { resolveSac, getSacProgress, getSacTotalWeight, getItemEffectiveWeight } from '../../models/sac'
import { prepareSharePayload, safeCompressForQr, getFocalInfo } from '../../utils/share'

const s = {
  container: { minHeight: '100dvh', background: 'var(--color-bg)' },
  content: { padding: '16px', maxWidth: '600px', margin: '0 auto' },
  infoCard: {
    padding: '16px', borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    marginBottom: '16px', animation: 'slideUp 400ms ease',
  },
  name: { fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' },
  metaRow: { display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)', flexWrap: 'wrap', marginBottom: '12px' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  progressBar: { flex: 1, height: '8px', borderRadius: '4px', background: 'var(--color-border)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px', background: 'var(--color-primary)', transition: 'width 300ms ease' },
  progressText: { fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  actions: { display: 'flex', gap: '8px', marginTop: '12px' },
  actionBtn: {
    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600, color: 'var(--color-text)',
    textAlign: 'center', transition: 'background var(--transition-fast)',
  },

  kitGroup: { marginBottom: '12px', animation: 'slideUp 500ms ease' },
  kitHeader: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
    borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', marginBottom: '4px',
    fontWeight: 700, fontSize: 'var(--text-sm)',
  },
  kitIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  packed: { opacity: 0.55, textDecoration: 'line-through' },
  checkbox: {
    width: '22px', height: '22px', borderRadius: '4px',
    border: '2px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: '12px', fontWeight: 700, transition: 'all var(--transition-fast)', alignSelf: 'center',
  },
  checkboxChecked: { background: 'var(--color-primary)', border: '2px solid var(--color-primary)', color: 'white' },
  wornBadge: { fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: '#dbeafe', color: '#2563eb', fontWeight: 600 },
  rightCol: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, alignSelf: 'center' },
  effWeight: { fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' },
  fillBtn: {
    fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', cursor: 'pointer',
    background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
  },
  fillBtnFull: { background: '#22c55e', border: '1px solid #22c55e', color: 'white' },

  directLabel: {
    fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)',
    padding: '4px 12px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  emptyCheckbox: { padding: '6px 12px', color: 'var(--color-text-secondary)', fontSize: '12px', fontStyle: 'italic' },
  bottom: { height: '100px' },
}

export function SacDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sacs, kits, items, categories, deleteSac, sacTogglePacked, sacToggleFill, sacSetAllPacked } = useGear()
  const [showDelete, setShowDelete] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [shareError, setShareError] = useState(null)

  function handleShare() {
    setShareError(null)
    try {
      const payload = prepareSharePayload('sac', id, items, categories, kits, sacs)
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

  const sac = sacs.find(s => s.id === id)
  const resolved = sac ? resolveSac(sac, kits, items) : null
  const progress = sac ? getSacProgress(sac, kits, items) : { total: 0, packed: 0, percent: 0 }
  const totalWeight = sac ? getSacTotalWeight(sac, kits, items) : 0

  function getGrouped(sac, kits, items) {
    if (!sac || !kits.length) return []
    const resolved = resolveSac(sac, kits, items)
    const groups = []
    const kitMap = {}

    for (const fi of resolved.flatItems) {
      if (fi.deleted) continue
      const topName = fi.kitPath[0] || '__direct__'
      if (!kitMap[topName]) kitMap[topName] = []
      kitMap[topName].push(fi)
    }

    for (const [name, kitItems] of Object.entries(kitMap)) {
      const subGroups = {}
      for (const fi of kitItems) {
        const catName = fi.kitPath.length > 1 ? fi.kitPath.slice(1).join(' > ') : '__all__'
        if (!subGroups[catName]) {
          let subIcon = 'package'
          let subWeight = 0
          if (fi.kitPath.length > 1) {
            const ids = fi.kitIdPath?.split('/') || []
            const subKitId = ids[1]
            if (subKitId) {
              const subKit = kits.find(k => k.id === subKitId)
              if (subKit) subIcon = subKit.icon
            }
          }
          subGroups[catName] = { items: [], icon: subIcon, weight: subWeight }
        }
        subGroups[catName].items.push(fi)
        subGroups[catName].weight += (fi.weight || 0) * fi.quantity
      }
      let icon = 'package'
      const topKitId = kitItems[0]?.kitIdPath?.split('/')[0]
      if (topKitId) {
        const kit = kits.find(k => k.id === topKitId)
        if (kit) icon = kit.icon
      }
      groups.push({ name, icon, isDirect: name === '__direct__', subGroups, items: kitItems })
    }

    groups.sort((a, b) => a.isDirect ? 1 : b.isDirect ? -1 : 0)
    return groups
  }

  const grouped = getGrouped(sac, kits, items)

  const directGrouped = (() => {
    const directFi = (grouped.find(g => g.isDirect)?.items || []).filter(fi => !fi.deleted)
    const order = new Map([...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })).map((c, i) => [c.id, i]))
    const map = {}
    const groupOrder = []
    for (const fi of directFi) {
      const catId = fi.categoryId
      if (!(catId in map)) { map[catId] = []; groupOrder.push(catId) }
      map[catId].push(fi)
    }
    groupOrder.sort((a, b) => {
      const ia = order.get(a) ?? Number.MAX_SAFE_INTEGER
      const ib = order.get(b) ?? Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      return (a ?? '').localeCompare(b ?? '', 'fr', { sensitivity: 'base' })
    })
    return groupOrder.map(catId => {
      const cat = categories.find(c => c.id === catId)
      const items = [...map[catId]].sort((x, y) => {
        const xn = x.item?.name ?? x.name ?? ''
        const yn = y.item?.name ?? y.name ?? ''
        return xn.localeCompare(yn, 'fr', { sensitivity: 'base' }) ||
          (x.item?.brand ?? '').localeCompare(y.item?.brand ?? '', 'fr', { sensitivity: 'base' }) ||
          (x.item?.model ?? '').localeCompare(y.item?.model ?? '', 'fr', { sensitivity: 'base' })
      })
      return { catId, icon: cat?.icon || 'package', name: cat?.name || 'Sans catégorie', items }
    })
  })()

  function renderPackedItem(fi) {
    const effWeight = getItemEffectiveWeight(fi)
    const it = fi.item || fi
    const wornQty = (fi.isWorn || fi.quantity > 1) ? (
      <span style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        {fi.isWorn && <span style={s.wornBadge}>Porté</span>}
        {fi.quantity > 1 && <span>×{fi.quantity}</span>}
      </span>
    ) : null
    const brandModel = [it.brand, it.model].filter(Boolean).join(' · ')
    const dims = [it.length, it.width, it.depth].filter(v => v != null)
    const dimsStr = dims.length ? `${dims.join(' × ')} cm` : ''
    const volumeStr = it.volume != null ? `${it.volume} L` : ''
    const dimLine = [dimsStr, volumeStr].filter(Boolean).join(' · ')
    const metaLines = [wornQty, brandModel, dimLine || null].filter(Boolean)
    return (
      <ItemCard
        key={fi.packingKey}
        item={it}
        onClick={() => sacTogglePacked(sac.id, fi.packingKey)}
        role="checkbox"
        ariaChecked={fi.isPacked}
        style={{ ...(fi.isPacked ? s.packed : {}) }}
        showConsumable
        leading={(
          <div style={{ ...s.checkbox, ...(fi.isPacked ? s.checkboxChecked : {}) }}>
            {fi.isPacked ? '✓' : ''}
          </div>
        )}
        metaLines={metaLines}
        rightSlot={(
          <div style={s.rightCol}>
            {(fi.consumableType === 'water' || fi.consumableType === 'fuel') && (
              <button
                onClick={e => { e.stopPropagation(); sacToggleFill(sac.id, fi.packingKey) }}
                style={{ ...s.fillBtn, ...(fi.fillState === 'full' ? s.fillBtnFull : {}) }}
              >
                {fi.fillState === 'full' ? 'Plein' : 'Vide'}
              </button>
            )}
            <div style={s.effWeight}>
              {effWeight >= 1000 ? `${(effWeight / 1000).toFixed(1)} kg` : `${effWeight} g`}
            </div>
          </div>
        )}
      />
    )
  }

  if (!sac) {
    return (
      <div style={s.container}>
        <Header title="Sac introuvable" />
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Ce sac n'existe pas ou a été supprimé.
        </div>
      </div>
    )
  }

  const kitCount = sac?.entries.filter(e => e.type === 'kit').length || 0
  const wornWeight = resolved ? resolved.flatItems.filter(fi => !fi.deleted && fi.isWorn).reduce((s, fi) => s + (fi.weight || 0) * fi.quantity, 0) : 0
  const packWeight = totalWeight - wornWeight

  return (
    <div style={s.container}>
      <Header
        title={sac.name || 'Sans nom'}
        rightAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleShare}
              style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: 'var(--color-primary)' }}
              aria-label="Partager"
            >
              <Icon name="share" />
            </button>
            <button
              onClick={() => navigate(`/sacs/${sac.id}/edit`)}
              style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: 'var(--color-text)' }}
              aria-label="Modifier"
            >
              <Icon name="edit" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: 'var(--color-danger)' }}
              aria-label="Supprimer"
            >
              <Icon name="trash" />
            </button>
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
          <div style={s.name}>{sac.name}</div>
          {(sac.destination || sac.tripDate || sac.duration > 0) && (
            <div style={s.metaRow}>
              {sac.destination && <span><Icon name="map-pin" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.destination}</span>}
              {sac.tripDate && <span><Icon name="calendar" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {new Date(sac.tripDate).toLocaleDateString('fr-FR')}</span>}
              {sac.duration > 0 && <span><Icon name="clock" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.duration}j</span>}
            </div>
          )}

          <div style={s.metaRow}>
            <span><Icon name="clipboard" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {sac.entries.length} entrée(s)</span>
            {kitCount > 0 && <span><Icon name="package" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {kitCount} kit(s)</span>}
            <span><Icon name="weight" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`}</span>
            {wornWeight > 0 && <span><Icon name="shirt" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> porté: {wornWeight}g</span>}
            {wornWeight > 0 && <span><Icon name="backpack" size="xxs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> sac: {packWeight >= 1000 ? `${(packWeight / 1000).toFixed(1)} kg` : `${packWeight} g`}</span>}
          </div>

          <div style={s.progressRow}>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progress.percent}%`,
                background: progress.percent === 100 ? '#22c55e' : 'var(--color-primary)' }} />
            </div>
            <span style={s.progressText}>{progress.packed}/{progress.total}</span>
          </div>

          <div style={s.actions}>
            <button style={s.actionBtn} onClick={() => window.confirm('Tout cocher ?') && sacSetAllPacked(sac.id, true)}>
              <Icon name="check" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Tout cocher
            </button>
            <button style={s.actionBtn} onClick={() => window.confirm('Tout décocher ?') && sacSetAllPacked(sac.id, false)}>
              <Icon name="cross" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Tout décocher
            </button>
          </div>
        </div>

        {grouped.map(group => {
          if (group.isDirect) {
            return (
              <div key={group.name} style={s.kitGroup}>
                {directGrouped.map(catGroup => (
                  <div key={catGroup.catId} style={{ marginBottom: '8px' }}>
                    <CategoryHeader icon={catGroup.icon} name={catGroup.name} count={catGroup.items.length} />
                    {catGroup.items.map(fi => renderPackedItem(fi))}
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div key={group.name} style={s.kitGroup}>
              <div style={s.kitHeader}>
                <span style={s.kitIcon}><Icon name={group.icon} size="sm" /></span>
                <span>{group.name}</span>
                <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                  {group.items.filter(i => i.isPacked).length}/{group.items.length}
                </span>
              </div>

              {Object.entries(group.subGroups).map(([subName, subGroup]) => (
                <div key={subName} style={subName !== '__all__' ? { paddingLeft: '24px' } : {}}>
                  {subName !== '__all__' && (
                    <div style={s.kitHeader}>
                      <span style={s.kitIcon}><Icon name={subGroup.icon} size="sm" /></span>
                      <span style={{ flex: 1 }}>{subName}</span>
                      <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {subGroup.items.filter(i => i.isPacked).length}/{subGroup.items.length}
                      </span>
                    </div>
                  )}
                  {subGroup.items.map(fi => renderPackedItem(fi))}
                </div>
              ))}
            </div>
          )
        })}

        {(!resolved || resolved.flatItems.length === 0) && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Ce sac est vide. Ajoutez des articles ou des kits.
          </div>
        )}

        <div style={s.bottom} />
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
          title="Supprimer le sac"
          message={`Voulez-vous vraiment supprimer « ${sac.name} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteSac(id); navigate('/sacs') }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
