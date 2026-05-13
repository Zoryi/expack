import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator/OfflineIndicator'
import { UpdateNotification } from './components/UpdateNotification/UpdateNotification'
import { Home } from './pages/Home/Home'
import { About } from './pages/About/About'
import { NotFound } from './pages/NotFound/NotFound'
import './styles/global.css'

const s = {
  app: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    transition: 'background var(--transition-normal), color var(--transition-normal)',
  },
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/expack">
        <div style={s.app}>
          <OfflineIndicator />
          <UpdateNotification />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
