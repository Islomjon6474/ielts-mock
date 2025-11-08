'use client'

import { Radio, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface MultipleChoiceSingleQuestionProps {
  question: Question
  questionNumber: number
}

const MultipleChoiceSingleQuestion = observer(({ question, questionNumber }: MultipleChoiceSingleQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4 font-medium"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Radio.Group
            value={answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Radio
                      value={option}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2">{optionLabel}.</span>
                      <span>{option}</span>
                    </Radio>
                  </div>
                )
              })}
            </div>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
})

export default MultipleChoiceSingleQuestion
