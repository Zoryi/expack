import { NavLink } from 'react-router-dom'
import { Icon } from '../Icon/Icon'

const s = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
    paddingBottom: 'calc(8px + var(--safe-bottom))',
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '4px 12px',
    textDecoration: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: '10px',
    fontWeight: 600,
    transition: 'color var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
  },
  linkActive: {
    color: 'var(--color-primary)',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    transition: 'background var(--transition-fast)',
  },
  iconWrapActive: {
    background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
  },
}

const TABS = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/inventory', icon: 'clipboard', label: 'Inventaire' },
  { to: '/sacs', icon: 'backpack', label: 'Sacs' },
  { to: '/stats', icon: 'chart-bar', label: 'Stats' },
]

export function Navigation() {
  return (
    <nav style={s.nav} role="tablist">
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          role="tab"
          style={({ isActive }) => ({
            ...s.link,
            ...(isActive ? s.linkActive : {}),
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ ...s.iconWrap, ...(isActive ? s.iconWrapActive : {}) }}>
                <Icon name={tab.icon} size="lg" />
              </div>
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
