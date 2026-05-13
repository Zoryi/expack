import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation/Navigation'

const s = {
  layout: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    transition: 'background var(--transition-normal), color var(--transition-normal)',
  },
  content: {
    flex: 1,
    paddingBottom: '80px',
  },
}

export function Layout() {
  return (
    <div style={s.layout}>
      <div style={s.content}>
        <Outlet />
      </div>
      <Navigation />
    </div>
  )
}
