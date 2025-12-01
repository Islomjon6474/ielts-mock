'use client'

import { useEffect, useRef } from 'react'
import { Radio, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface MultipleChoiceSingleQuestionProps {
  question: Question
  questionNumber: number
}

const MultipleChoiceSingleQuestion = observer(({ question, questionNumber }: MultipleChoiceSingleQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return
    
    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const radio = containerRef.current?.querySelector('input[type="radio"]:not([disabled])') as HTMLInputElement
        if (radio) {
          radio.focus()
        }
      }, 100)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumber, readingStore.isPreviewMode])

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  // In preview mode, get submitted answer for styling
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) as string : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null

  return (
    <Card
      className="mb-4"
      ref={containerRef}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: readingStore.isPreviewMode && submittedAnswer ?
          (isCorrect ? '#52c41a' : '#ff4d4f') :
          'var(--border-color)',
        borderWidth: readingStore.isPreviewMode && submittedAnswer ? '2px' : '1px'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4 font-medium" style={{ color: 'var(--text-primary)' }}><strong>{questionNumber}</strong> {question.text}</p>

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
            value={readingStore.isPreviewMode && submittedAnswer ? submittedAnswer : answer}
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
                      value={optionLabel}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2" style={{ color: 'var(--text-primary)' }}>{optionLabel}.</span>
                      <span style={{ color: 'var(--text-primary)' }}>{option}</span>
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
