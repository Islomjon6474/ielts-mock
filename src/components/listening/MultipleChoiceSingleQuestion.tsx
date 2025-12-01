'use client'

import { useEffect, useRef } from 'react'
import { Radio, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

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

  // In preview mode, get submitted answer for styling
  const submittedAnswer = isPreviewMode ? listeningStore.getSubmittedAnswer(question.id) as string : null
  const isCorrect = isPreviewMode ? listeningStore.isAnswerCorrect(question.id) : null

  return (
    <Card
      className="mb-4"
      ref={containerRef}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: isPreviewMode && submittedAnswer ?
          (isCorrect ? '#52c41a' : '#ff4d4f') :
          'var(--border-color)',
        borderWidth: isPreviewMode && submittedAnswer ? '2px' : '1px'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p style={{ color: 'var(--text-primary)' }} className="mb-3 font-medium text-sm"><strong>{questionNumber}</strong> {question.text}</p>

          {/* Display image if available */}
          {question.imageUrl && (
            <div className="mb-4">
              <AuthenticatedImage
                src={question.imageUrl}
                alt={`Question ${questionNumber} image`}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                className="rounded border"
              />
            </div>
          )}

          <Radio.Group
            value={isPreviewMode ? submittedAnswer : answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            disabled={isPreviewMode}
          >
            <div className="space-y-2">
              {question.options?.map((option: string, index: number) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Radio
                      value={optionLabel}
                      className="whitespace-normal"
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
    </Card>
  )
})

export default MultipleChoiceSingleQuestion
