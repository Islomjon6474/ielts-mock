'use client'

import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface ImageInputsQuestionProps {
  question: Question
  questionNumber: number
}

const ImageInputsQuestion = observer(({ question, questionNumber }: ImageInputsQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  return (
    <div className="mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 text-sm font-medium"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Input
            value={answer || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Answer"
            className="max-w-md"
            disabled={readingStore.isPreviewMode}
          />
        </div>
      </div>
    </div>
  )
})

export default ImageInputsQuestion
