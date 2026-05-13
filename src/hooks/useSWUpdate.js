import { useState, useEffect, useCallback } from 'react'

export function useSWUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null)
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true)
              setWaitingWorker(installing)
            }
          })
        })
      })
    }
  }, [])

  const update = useCallback(() => {
    if (!waitingWorker) return
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }, [waitingWorker])

  return { hasUpdate, update }
}
