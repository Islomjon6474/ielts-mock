'use client'

import { useEffect, useRef } from 'react'
import { Checkbox } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface MultipleChoiceQuestionProps {
  question: any
  questionNumber: number
}

const MultipleChoiceQuestion = observer(({ question, questionNumber }: MultipleChoiceQuestionProps) => {
  const { listeningStore } = useStore()
  const answer = (listeningStore.getAnswer(question.id) as string[]) || []
  const maxAnswers = question.maxAnswers || 2
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const checkbox = containerRef.current?.querySelector('input[type="checkbox"]') as HTMLInputElement
        if (checkbox) {
          checkbox.focus()
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumber])

  const handleChange = (checkedValues: string[]) => {
    listeningStore.setAnswer(question.id, checkedValues)
  }

  return (
    <div className="mb-6" data-question-id={questionNumber} ref={containerRef}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 font-medium text-sm"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Checkbox.Group
            onChange={(checkedValues) => handleChange(checkedValues as string[])}
            className="w-full"
          >
            <div className="space-y-2">
              {question.options?.map((option: string, index: number) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Checkbox
                      value={option}
                      disabled={!answer.includes(option) && answer.length >= maxAnswers}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2">{optionLabel}.</span>
                      <span className="text-sm">{option}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </Checkbox.Group>

          <div className="mt-2 text-xs text-gray-500">
            Selected: {answer.length} / {maxAnswers}
          </div>
        </div>
      </div>
    </div>
  )
})

export default MultipleChoiceQuestion
