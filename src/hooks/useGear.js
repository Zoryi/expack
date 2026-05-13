import { useContext } from 'react'
import { GearContext } from '../context/GearContext'

export function useGear() {
  const ctx = useContext(GearContext)
  if (!ctx) throw new Error('useGear must be used within a GearProvider')
  return ctx
}
