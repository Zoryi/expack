import { useEffect, useRef } from 'react'
import { useLockBodyScroll } from './useLockBodyScroll'

export function useBackClose(open, onClose) {
  const ref = useRef(onClose)

  useLockBodyScroll(Boolean(open))

  useEffect(() => {
    ref.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const handler = () => ref.current?.()
    window.history.pushState(null, '')
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [open])
}
