import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { GearProvider } from './context/GearContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Dashboard/Dashboard'
import { Inventory } from './pages/Items/Inventory'
import { ItemDetail } from './pages/Items/ItemDetail'
import { ItemForm } from './pages/Items/ItemForm'
import { KitsPage } from './pages/Kits/KitsPage'
import { KitDetail } from './pages/Kits/KitDetail'
import { KitForm } from './pages/Kits/KitForm'
import { SacsPage } from './pages/Sacs/SacsPage'
import { SacDetail } from './pages/Sacs/SacDetail'
import { SacForm } from './pages/Sacs/SacForm'
import { CategoriesPage } from './pages/Categories/CategoriesPage'
import { StatsPage } from './pages/Stats/StatsPage'
import { About } from './pages/About/About'
import { NotFound } from './pages/NotFound/NotFound'
import './styles/global.css'

export default function App() {
  useEffect(() => {
    const handler = CapacitorApp.addListener('backButton', () => {
      if (window.location.pathname !== '/') {
        window.history.back()
      } else {
        CapacitorApp.exitApp()
      }
    })
    return () => handler.remove()
  }, [])

  return (
    <ErrorBoundary>
      <GearProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/items/new" element={<ItemForm />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/kits" element={<KitsPage />} />
              <Route path="/kits/new" element={<KitForm />} />
              <Route path="/kits/:id" element={<KitDetail />} />
              <Route path="/sacs" element={<SacsPage />} />
              <Route path="/sacs/new" element={<SacForm />} />
              <Route path="/sacs/:id" element={<SacDetail />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GearProvider>
    </ErrorBoundary>
  )
}
