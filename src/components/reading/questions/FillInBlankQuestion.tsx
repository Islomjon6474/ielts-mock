'use client'

import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface FillInBlankQuestionProps {
  question: Question
  questionNumber: number
}

const FillInBlankQuestion = observer(({ question, questionNumber }: FillInBlankQuestionProps) => {
  const { readingStore } = useStore()

  // Parse question text to find blank markers like [7], [8], etc.
  const renderQuestionWithBlanks = () => {
    const parts = question.text.split(/(\[\d+\])/)
    
    return parts.map((part, index) => {
      const blankMatch = part.match(/\[(\d+)\]/)
      if (blankMatch) {
        const blankNumber = parseInt(blankMatch[1])
        
        // Get the answer for this specific blank number (question ID)
        const blankAnswer = readingStore.getAnswer(blankNumber) as string | undefined
        
        return (
          <Input
            key={index}
            className="inline-block mx-2 text-center"
            style={{ width: '120px' }}
            value={blankAnswer || ''}
            onChange={(e) => readingStore.setAnswer(blankNumber, e.target.value)}
            placeholder={blankNumber.toString()}
            disabled={readingStore.isPreviewMode}
          />
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <Card className="mb-4">
      <div className="space-y-4">
        <div className="leading-loose">
          {renderQuestionWithBlanks()}
        </div>
      </div>
    </Card>
  )
})

export default FillInBlankQuestion
