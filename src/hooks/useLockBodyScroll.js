import { useEffect } from 'react'

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [locked])
}
