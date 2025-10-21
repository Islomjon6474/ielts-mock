'use client'

import { createContext, useContext } from 'react'
import { RootStore } from './RootStore'

const StoreContext = createContext<RootStore | null>(null)

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return context
}

export default StoreContext
