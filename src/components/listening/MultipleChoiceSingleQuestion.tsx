'use client'

import { useEffect, useRef } from 'react'
import { Radio } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface MultipleChoiceSingleQuestionProps {
  question: any
  questionNumber: number
  isPreviewMode?: boolean
}

const MultipleChoiceSingleQuestion = observer(({ question, questionNumber, isPreviewMode = false }: MultipleChoiceSingleQuestionProps) => {
  const { listeningStore } = useStore()
  const answer = listeningStore.getAnswer(question.id) as string | undefined
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const radio = containerRef.current?.querySelector('input[type="radio"]') as HTMLInputElement
        if (radio) {
          radio.focus()
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumber])

  const handleChange = (value: string) => {
    listeningStore.setAnswer(question.id, value)
  }

  return (
    <div className="border-b pb-4" data-question-id={questionNumber} ref={containerRef}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 font-medium text-sm"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Radio.Group
            value={answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
          >
            <div className="space-y-2">
              {question.options?.map((option: string, index: number) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Radio
                      value={option}
                      className="whitespace-normal"
                      disabled={isPreviewMode}
                    >
                      <span className="font-semibold mr-2">{optionLabel}.</span>
                      <span className="text-sm">{option}</span>
                    </Radio>
                  </div>
                )
              })}
            </div>
          </Radio.Group>
        </div>
      </div>
    </div>
  )
})

export default MultipleChoiceSingleQuestion
