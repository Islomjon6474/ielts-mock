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

  const handlePrevious = () => {
    readingStore.previousQuestion()
  }

  const handleNext = () => {
    readingStore.nextQuestion()
  }

  // Check if there's a previous question
  const hasPrevious = !(readingStore.currentPart === 1 && readingStore.currentQuestionIndex === 0)

  // Check if there's a next question
  const currentPart = readingStore.parts[readingStore.currentPart - 1]
  const hasNext = currentPart && !(
    readingStore.currentPart === readingStore.parts.length &&
    readingStore.currentQuestionIndex === currentPart.questions.length - 1
  )

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
      onPrevious={handlePrevious}
      onNext={handleNext}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
    />
  )
})

export default BottomNavigation
