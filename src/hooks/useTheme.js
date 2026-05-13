import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'expack-theme'

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc')
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      localStorage.setItem(STORAGE_KEY, value)
      return value
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
