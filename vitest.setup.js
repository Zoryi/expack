import { vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web', isNativePlatform: () => false },
  registerPlugin: () => ({}),
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {},
  Directory: { Data: 'Data', Documents: 'Documents' },
  Encoding: { UTF8: 'UTF8' },
}))

vi.mock('@capacitor/share', () => ({
  Share: {},
}))
