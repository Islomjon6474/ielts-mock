'use client'

import { useEffect } from 'react'
import { useStore } from '@/stores/StoreContext'
import WritingTestLayout from '@/components/writing/WritingTestLayout'
import { sampleWritingTest } from '@/data/sampleWritingTest'

export default function WritingPage() {
  const { writingStore } = useStore()

  useEffect(() => {
    writingStore.setTasks(sampleWritingTest)
  }, [writingStore])

  return <WritingTestLayout />
}
