import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    const controllerChange = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', controllerChange)
    }

    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChange)
      }
    }
  }, [])

  return isOnline
}
