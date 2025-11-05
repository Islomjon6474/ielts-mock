'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import BottomNavigationComponent from '@/components/common/BottomNavigation'

interface BottomNavigationProps {
  onSubmit?: () => void
  isPreviewMode?: boolean
}

const BottomNavigation = observer(({ onSubmit, isPreviewMode = false }: BottomNavigationProps) => {
  const { readingStore } = useStore()

  const handlePartClick = (partNumber: number) => {
    readingStore.setCurrentPart(partNumber)
  }

  const handleQuestionClick = (questionNumber: number) => {
    readingStore.goToQuestion(questionNumber)
  }

  return (
    <BottomNavigationComponent
      parts={readingStore.parts}
      currentPart={readingStore.currentPart}
      currentQuestionIndex={readingStore.currentQuestionIndex}
      onPartClick={handlePartClick}
      onQuestionClick={handleQuestionClick}
      isQuestionAnswered={(qNum) => readingStore.isQuestionAnswered(qNum)}
      onSubmit={onSubmit}
      isPreviewMode={isPreviewMode}
    />
  )
})

export default BottomNavigation
