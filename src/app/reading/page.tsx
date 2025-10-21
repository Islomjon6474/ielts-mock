'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ReadingTestLayout from '@/components/reading/ReadingTestLayout'
import { sampleReadingTest } from '@/data/sampleReadingTest'

const ReadingPage = observer(() => {
  const { readingStore } = useStore()

  useEffect(() => {
    readingStore.setParts(sampleReadingTest)
  }, [readingStore])

  return <ReadingTestLayout />
})

export default ReadingPage
