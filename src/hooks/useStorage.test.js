// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useStorage } from './useStorage'

const setMock = vi.fn()

vi.mock('../services/storage', () => ({
  storage: {
    get: vi.fn(async (key, dflt) => dflt),
    set: (...args) => setMock(...args),
  },
}))

import { storage } from '../services/storage'

function Harness() {
  const [value, setPersisted] = useStorage('k', 0)
  useEffect(() => {
    globalThis.__value = value
  }, [value])
  useEffect(() => {
    globalThis.__inc = () => setPersisted((c) => c + 1)
    globalThis.__set = (v) => setPersisted(v)
  }, [setPersisted])
  return null
}

describe('useStorage', () => {
  let container

  beforeEach(() => {
    vi.clearAllMocks()
    storage.get.mockImplementation(async (key, dflt) => dflt)
    setMock.mockResolvedValue(undefined)
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container?.remove()
    delete globalThis.__value
    delete globalThis.__inc
    delete globalThis.__set
  })

  it('persists the resolved value exactly once', async () => {
    await act(async () => {
      createRoot(container).render(React.createElement(Harness))
    })
    expect(globalThis.__value).toBe(0)

    await act(async () => {
      globalThis.__set(5)
    })
    expect(setMock).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith('k', 5)
    expect(globalThis.__value).toBe(5)
  })

  it('functional updater resolves from current value', async () => {
    await act(async () => {
      createRoot(container).render(React.createElement(Harness))
    })

    await act(async () => {
      globalThis.__set(5)
    })
    expect(setMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      globalThis.__inc()
    })
    expect(setMock).toHaveBeenCalledTimes(2)
    expect(setMock).toHaveBeenLastCalledWith('k', 6)
  })
})
