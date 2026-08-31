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
    const resolved = typeof next === 'function' ? next(value) : next
    setValue(resolved)
    try {
      await storage.set(key, resolved)
    } catch (e) {
      setError(e)
    }
  }, [key, value])

  const remove = useCallback(async () => {
    await storage.delete(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  return [value, setPersisted, { loading, error, remove }]
}
