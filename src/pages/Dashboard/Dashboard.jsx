import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import { Icon } from '../../components/Icon/Icon'
import { ItemCard, ItemCardWeight } from '../../components/ItemCard/ItemCard'
import { useGear } from '../../hooks/useGear'
import { CONDITION_LABELS, CONDITION_COLORS, CONDITION_ORDER } from '../../models/item'

const s = {
  container: {
    padding: '24px 16px',
    animation: 'fadeIn 400ms ease',
    paddingBottom: '32px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  hello: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--color-text-secondary)',
  },
  title: {
    fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
    fontWeight: 800,
    color: 'var(--color-text)',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    marginTop: '2px',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '20px',
  },
  card: {
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    animation: 'slideUp 400ms ease',
  },
  cardValue: {
    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
    fontWeight: 800,
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  cardLabel: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
    fontWeight: 500,
  },
  cardIcon: {
    marginBottom: '6px',
    color: 'var(--color-primary)',
  },
  section: {
    marginBottom: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  sectionTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  sectionLink: {
    fontSize: '11px',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  quickBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'var(--color-text)',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'border-color var(--transition-fast)',
  },
  quickIcon: {
    color: 'var(--color-primary)',
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    marginBottom: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  conditionBar: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  conditionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  conditionLabel: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
  },
}

export function Home() {
  const { items, kits, sacs } = useGear()

  const stats = useMemo(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0)
    const totalWeight = items.reduce((s, i) => s + (i.weight || 0) * i.quantity, 0)
    const totalValue = items.reduce((s, i) => s + ((i.purchasePrice || 0) * i.quantity), 0)
    const mychete = items.reduce((s, i) => s + (!i.isWorn ? (i.weight || 0) * i.quantity : 0), 0)
    return { totalItems, totalWeight, totalValue, mychete }
  }, [items])

  const conditionCounts = useMemo(() => {
    const counts = {}
    for (const item of items) {
      counts[item.condition] = (counts[item.condition] || 0) + 1
    }
    return counts
  }, [items])

  const recentItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 5)
  }, [items])

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.hello}>ExPack</div>
          <div style={s.title}>Bonjour <Icon name="wave" size="lg" style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
          <div style={s.subtitle}>
            {items.length} articles · {kits.length} kits · {sacs.length} sacs
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div style={s.cards}>
        <div style={s.card}>
          <div style={s.cardIcon}><Icon name="clipboard" /></div>
          <div style={s.cardValue}>{stats.totalItems}</div>
          <div style={s.cardLabel}>Articles</div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}><Icon name="weight" /></div>
          <div style={s.cardValue}>{stats.totalWeight >= 1000 ? `${(stats.totalWeight / 1000).toFixed(1)}kg` : `${stats.totalWeight}g`}</div>
          <div style={s.cardLabel}>Poids total</div>
        </div>
      </div>

      <div style={{ ...s.section }}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Accès rapide</div>
        </div>
        <div style={s.quickActions}>
          <Link to="/items/new" style={s.quickBtn}>
            <Icon name="plus" size="lg" style={s.quickIcon} />
            <span>Nouvel article</span>
          </Link>
          <Link to="/kits/new" style={s.quickBtn}>
            <Icon name="package" size="lg" style={s.quickIcon} />
            <span>Nouveau kit</span>
          </Link>
          <Link to="/sacs/new" style={s.quickBtn}>
            <Icon name="backpack" size="lg" style={s.quickIcon} />
            <span>Nouveau sac</span>
          </Link>
          <Link to="/inventory" style={s.quickBtn}>
            <Icon name="search" size="lg" style={s.quickIcon} />
            <span>Inventaire</span>
          </Link>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Derniers articles modifiés</div>
          <Link to="/inventory" style={s.sectionLink}>Voir tout</Link>
        </div>
        {recentItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            to={`/items/${item.id}`}
            compact
            style={s.recentItem}
            rightSlot={<ItemCardWeight weight={item.weight} compact />}
          />
        ))}
        {recentItems.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Aucun article pour l'instant
          </div>
        )}
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>État du matériel</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CONDITION_ORDER.map(c => (
            <div key={c} style={s.conditionBar}>
              <div style={{ ...s.conditionDot, background: CONDITION_COLORS[c] }} />
              <span style={s.conditionLabel}>{CONDITION_LABELS[c]}: {conditionCounts[c] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
