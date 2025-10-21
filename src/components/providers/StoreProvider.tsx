'use client'

import { ReactNode, useRef } from 'react'
import { RootStore } from '@/stores/RootStore'
import StoreContext from '@/stores/StoreContext'

interface StoreProviderProps {
  children: ReactNode
}

export default function StoreProvider({ children }: StoreProviderProps) {
  const storeRef = useRef<RootStore>()

  if (!storeRef.current) {
    storeRef.current = new RootStore()
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  )
}
