'use client'

import { Checkbox, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface MultipleChoiceQuestionProps {
  question: Question
  questionNumber: number
}

const MultipleChoiceQuestion = observer(({ question, questionNumber }: MultipleChoiceQuestionProps) => {
  const { readingStore } = useStore()
  const answer = (readingStore.getAnswer(question.id) as string[]) || []
  const maxAnswers = question.maxAnswers || 2

  const handleChange = (checkedValues: string[]) => {
    // Limit to max answers
    if (checkedValues.length <= maxAnswers) {
      readingStore.setAnswer(question.id, checkedValues)
    }
  }

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4 font-medium"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Checkbox.Group
            value={answer}
            onChange={(checkedValues) => handleChange(checkedValues as string[])}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Checkbox
                      value={option}
                      disabled={readingStore.isPreviewMode || (!answer.includes(option) && answer.length >= maxAnswers)}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2">{optionLabel}.</span>
                      <span>{option}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </Checkbox.Group>

          <div className="mt-3 text-sm text-gray-500">
            Selected: {answer.length} / {maxAnswers}
          </div>
        </div>
      </div>
    </Card>
  )
})

export default MultipleChoiceQuestion
