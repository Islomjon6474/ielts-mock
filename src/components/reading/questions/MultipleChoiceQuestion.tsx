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
        <div className="flex-shrink-0 w-10 h-10 border-2 border-gray-800 rounded flex items-center justify-center font-bold">
          {questionNumber}
        </div>
        
        <div className="flex-1">
          <p className="mb-4 font-medium">{question.text}</p>
          
          <Checkbox.Group
            value={answer}
            onChange={(checkedValues) => handleChange(checkedValues as string[])}
            className="w-full"
          >
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="block">
                  <Checkbox
                    value={option}
                    disabled={!answer.includes(option) && answer.length >= maxAnswers}
                    className="whitespace-normal"
                  >
                    <span className="ml-2">{option}</span>
                  </Checkbox>
                </div>
              ))}
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
