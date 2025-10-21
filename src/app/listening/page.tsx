'use client'

import { useEffect } from 'react'
import { useStore } from '@/stores/StoreContext'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import { sampleListeningTest } from '@/data/sampleListeningTest'

export default function ListeningPage() {
  const { listeningStore } = useStore()

  useEffect(() => {
    listeningStore.setParts(sampleListeningTest)
  }, [listeningStore])

  return <ListeningTestLayout />
}
