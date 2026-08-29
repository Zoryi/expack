import { useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGear } from '../../hooks/useGear'
import { Icon } from '../../components/Icon/Icon'
import { CONDITION_LABELS, CONDITION_COLORS, CONDITION_ORDER } from '../../models/item'
import { Modal } from '../../components/Modal/Modal'
import { QRScanner } from '../../components/QRScanner/QRScanner'
import { ImportConflictReview } from '../../components/ImportConflictReview/ImportConflictReview'
import { detectConflicts, hasConflicts } from '../../utils/importConflicts'

const s = {
  container: { padding: '24px 16px', animation: 'fadeIn 400ms ease', paddingBottom: '32px' },
  title: { fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: '20px', color: 'var(--color-text)' },
  card: {
    padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', marginBottom: '12px', animation: 'slideUp 400ms ease',
  },
  cardTitle: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginBottom: '12px' },
  bigNum: { fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' },
  bigUnit: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 400 },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' },
  barOuter: { width: '120px', height: '8px', borderRadius: '4px', background: 'var(--color-border)', overflow: 'hidden', flexShrink: 0 },
  barInner: { height: '100%', borderRadius: '4px', transition: 'width 500ms ease' },
  label: { fontSize: '12px', color: 'var(--color-text-secondary)', minWidth: '28px' },
  value: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', minWidth: '60px', textAlign: 'right' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 600 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  miniCard: {
    padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', textAlign: 'center',
  },
  miniVal: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' },
  miniLabel: { fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  footer: { textAlign: 'center', marginTop: '24px', padding: '16px' },
  footerLink: { color: 'var(--color-primary)', fontSize: 'var(--text-sm)', textDecoration: 'none' },
  adminSection: { marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' },
  adminGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  adminBtn: {
    padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)',
    fontWeight: 600, cursor: 'pointer', textAlign: 'center',
  },
  adminBtnDanger: {
    padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444',
    background: 'var(--color-surface)', color: '#ef4444', fontSize: 'var(--text-sm)',
    fontWeight: 600, cursor: 'pointer', textAlign: 'center',
  },
  importError: { marginTop: '8px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: '#ef444422', color: '#ef4444', fontSize: 'var(--text-sm)' },
}

export function StatsPage() {
  const { items, categories, kits, sacs, clearAllData, generateTestData, exportData, importSharedData } = useGear()

  const [showClearModal, setShowClearModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [importError, setImportError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [pendingSharePayload, setPendingSharePayload] = useState(null)
  const fileInputRef = useRef(null)

  const stats = useMemo(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0)
    const totalWeight = items.reduce((s, i) => s + (i.weight || 0) * i.quantity, 0)
    const totalValue = items.reduce((s, i) => s + ((i.purchasePrice || 0) * i.quantity), 0)
    const wornWeight = items.filter(i => i.isWorn).reduce((s, i) => s + (i.weight || 0) * i.quantity, 0)
    const packWeight = totalWeight - wornWeight
    const consumableWeight = items.filter(i => i.isConsumable).reduce((s, i) => s + (i.weight || 0) * i.quantity, 0)

    const heaviest = [...items].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0]
    const lightest = [...items].filter(i => i.weight > 0).sort((a, b) => (a.weight || 0) - (b.weight || 0))[0]
    const favorites = items.filter(i => i.isFavorite).length

    return { totalItems, totalWeight, totalValue, wornWeight, packWeight, consumableWeight, heaviest, lightest, favorites }
  }, [items])

  const catWeight = useMemo(() => {
    return categories.map(cat => {
      const catItems = items.filter(i => i.categoryId === cat.id)
      const weight = catItems.reduce((s, i) => s + (i.weight || 0) * i.quantity, 0)
      const count = catItems.reduce((s, i) => s + i.quantity, 0)
      return { ...cat, weight, count }
    }).sort((a, b) => b.weight - a.weight)
  }, [items, categories])

  const conditionStats = useMemo(() => {
    return CONDITION_ORDER.map(c => ({
      condition: c,
      label: CONDITION_LABELS[c],
      color: CONDITION_COLORS[c],
      count: items.filter(i => i.condition === c).length,
    }))
  }, [items])

  const maxCatWeight = Math.max(...catWeight.map(c => c.weight), 1)

  const totalSacs = sacs.length
  const totalKits = kits.length

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportData()
    } finally {
      setExporting(false)
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImportError(null)
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !Array.isArray(data.items) || !Array.isArray(data.categories) || !Array.isArray(data.kits) || !Array.isArray(data.sacs)) {
        throw new Error('Format de fichier invalide')
      }

      const found = detectConflicts(data, { items, categories, kits, sacs })
      if (hasConflicts(found)) {
        setPendingSharePayload(data)
      } else {
        importSharedData(data)
      }
    } catch (err) {
      setImportError(err.message)
    }
    e.target.value = ''
  }

  return (
    <>
    <div style={s.container}>
      <div style={s.title}>Statistiques</div>

      <div style={s.grid2}>
        <div style={s.miniCard}>
          <div style={s.miniVal}>{stats.totalItems}</div>
          <div style={s.miniLabel}>Articles</div>
        </div>
        <div style={s.miniCard}>
          <div style={s.miniVal}>{totalKits}</div>
          <div style={s.miniLabel}>Kits</div>
        </div>
        <div style={s.miniCard}>
          <div style={s.miniVal}>{totalSacs}</div>
          <div style={s.miniLabel}>Sacs</div>
        </div>
        <div style={s.miniCard}>
          <div style={s.miniVal}>{stats.totalValue.toFixed(0)}€</div>
          <div style={s.miniLabel}>Valeur</div>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: '12px' }}>
        <div style={s.cardTitle}>Poids</div>
        <div style={s.bigNum}>
          {stats.totalWeight >= 1000 ? (stats.totalWeight / 1000).toFixed(1) : stats.totalWeight}
          <span style={s.bigUnit}> {stats.totalWeight >= 1000 ? 'kg' : 'g'}</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Dont {stats.wornWeight >= 1000 ? `${(stats.wornWeight / 1000).toFixed(1)} kg` : `${stats.wornWeight} g`} porté
          · {stats.consumableWeight >= 1000 ? `${(stats.consumableWeight / 1000).toFixed(1)} kg` : `${stats.consumableWeight} g`} consommable
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Répartition par catégorie</div>
        {catWeight.map(cat => {
          const pct = maxCatWeight > 0 ? Math.round((cat.weight / maxCatWeight) * 100) : 0
          return (
            <div key={cat.id} style={s.statRow}>
              <Icon name={cat.icon} size="sm" />
              <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
              <div style={s.barOuter}>
                <div style={{ ...s.barInner, width: `${pct}%`, background: cat.color }} />
              </div>
              <span style={s.value}>
                {cat.weight >= 1000 ? `${(cat.weight / 1000).toFixed(1)}kg` : `${cat.weight}g`}
              </span>
            </div>
          )
        })}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>État du matériel</div>
        {conditionStats.map(cs => (
          <div key={cs.condition} style={s.statRow}>
            <div style={{ ...s.chip, background: cs.color + '22', color: cs.color, flex: 1 }}>{cs.label}</div>
            <div style={s.barOuter}>
              <div style={{ ...s.barInner, width: `${items.length > 0 ? (cs.count / items.length) * 100 : 0}%`, background: cs.color }} />
            </div>
            <span style={s.value}>{cs.count}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Extrêmes</div>
        {stats.heaviest && (
          <div style={s.statRow}>
            <Icon name="weight" size="sm" />
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{stats.heaviest.name}</span>
            <span style={s.value}>{stats.heaviest.weight}g</span>
          </div>
        )}
        {stats.lightest && (
          <div style={s.statRow}>
            <Icon name="target" size="sm" />
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{stats.lightest.name}</span>
            <span style={s.value}>{stats.lightest.weight}g</span>
          </div>
        )}
        {stats.favorites > 0 && (
          <div style={s.statRow}>
            <Icon name="star" size="sm" />
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>Favoris</span>
            <span style={s.value}>{stats.favorites}</span>
          </div>
        )}
      </div>

      <div style={s.adminSection}>
        <div style={s.cardTitle}>Administration</div>
        <div style={s.adminGrid}>
          <button style={s.adminBtnDanger} onClick={() => setShowClearModal(true)}><Icon name="trash" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Tout effacer</button>
          <button style={s.adminBtn} onClick={() => setShowGenerateModal(true)}><Icon name="refresh" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Données de test</button>
          <button style={s.adminBtn} onClick={handleExport} disabled={exporting}><Icon name="export" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {exporting ? 'Export…' : 'Exporter'}</button>
          <button style={s.adminBtn} onClick={() => setShowImportSheet(true)}><Icon name="import" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Importer</button>
        </div>
        {importError && <div style={s.importError}>{importError}</div>}
      </div>

      <div style={s.footer}>
        <Link to="/about" style={s.footerLink}><Icon name="compass" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Aide et informations</Link>
      </div>
    </div>

      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />

      {showImportSheet && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '24px',
          animation: 'fadeIn 150ms ease',
        }} onClick={() => setShowImportSheet(false)}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: '24px', maxWidth: '360px', width: '100%',
            animation: 'scaleIn 200ms ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
              Importer
            </div>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '14px 16px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                marginBottom: '8px',
              }}
              onClick={() => { setShowImportSheet(false); fileInputRef.current?.click() }}
            >
              <Icon name="import" size="sm" />
              <span style={{ textAlign: 'left' }}>
                <div>Fichier .json</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                  Importer un fichier d'export ou de partage
                </div>
              </span>
            </button>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '14px 16px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                marginBottom: '16px',
              }}
              onClick={() => { setShowImportSheet(false); setShowScanner(true) }}
            >
              <Icon name="share" size="sm" />
              <span style={{ textAlign: 'left' }}>
                <div>Scanner QR code</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                  Scannez un QR de partage ExPack
                </div>
              </span>
            </button>
            <button
              style={{
                display: 'block', width: '100%', padding: '10px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-text)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              }}
              onClick={() => setShowImportSheet(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <QRScanner
          items={items}
          categories={categories}
          kits={kits}
          sacs={sacs}
          onImport={(payload, decisions) => importSharedData(payload, decisions)}
          onClose={() => setShowScanner(false)}
        />
      )}

      {pendingSharePayload && (
        <ImportConflictReview
          payload={pendingSharePayload}
          existingState={{ items, categories, kits, sacs }}
          onConfirm={(decisions) => {
            importSharedData(pendingSharePayload, decisions)
            setPendingSharePayload(null)
          }}
          onCancel={() => setPendingSharePayload(null)}
        />
      )}

      {showClearModal && (
        <Modal
          title="Tout effacer"
          message="Cette action supprimera TOUTES vos données (articles, kits, sacs). Les catégories seront réinitialisées. Cette action est irréversible."
          confirmLabel="Tout effacer"
          onConfirm={() => { clearAllData(); setShowClearModal(false) }}
          onCancel={() => setShowClearModal(false)}
          isDestructive
        />
      )}

      {showGenerateModal && (
        <Modal
          title="Données de test"
          message="Cette action remplacera toutes vos données par 20 articles de test, 2 kits et 1 sac. Les données actuelles seront définitivement perdues."
          confirmLabel="Générer"
          onConfirm={() => { generateTestData(); setShowGenerateModal(false) }}
          onCancel={() => setShowGenerateModal(false)}
          isDestructive
        />
      )}
    </>
  )
}
