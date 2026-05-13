import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa-template/sw.js', {
    scope: '/pwa-template/',
  })
}

if (navigator.storage?.persist) {
  navigator.storage.persist()
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
