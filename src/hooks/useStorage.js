import { useState, useEffect, useCallback } from 'react'
import { storage } from '../services/storage'

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    storage.get(key, defaultValue).then((v) => {
      if (!cancelled) {
        setValue(v)
        setLoading(false)
      }
    }).catch((e) => {
      if (!cancelled) {
        setError(e)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [key, defaultValue])

  const setPersisted = useCallback(async (next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      storage.set(key, resolved).catch(setError)
      return resolved
    })
  }, [key])

  const remove = useCallback(async () => {
    await storage.delete(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  return [value, setPersisted, { loading, error, remove }]
}
