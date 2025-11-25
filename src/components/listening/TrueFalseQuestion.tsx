'use client'

import { useEffect, useRef } from 'react'
import { Radio } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface TrueFalseQuestionProps {
  question: any
  questionNumber: number
  type?: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
  isPreviewMode?: boolean
}

const TrueFalseQuestion = observer(({ question, questionNumber, type = 'TRUE_FALSE_NOT_GIVEN', isPreviewMode = false }: TrueFalseQuestionProps) => {
  const { listeningStore } = useStore()
  const storedAnswer = listeningStore.getAnswer(question.id) as string
  // Convert stored answer (with underscores) to display format (with spaces)
  const answer = storedAnswer?.replace(/_/g, ' ')
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

  const options = type === 'YES_NO_NOT_GIVEN' 
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  return (
    <div className="border-b pb-4" data-question-id={questionNumber} ref={containerRef}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 text-sm"><strong>{questionNumber}</strong> {question.text}</p>
          
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
            value={answer}
            onChange={(e) => {
              // Normalize the value by replacing spaces with underscores to match admin format
              const normalizedValue = e.target.value.replace(/ /g, '_')
              listeningStore.setAnswer(question.id, normalizedValue)
            }}
            className="flex gap-4"
          >
            {options.map((opt: string) => (
              <Radio key={opt} value={opt} className="text-sm" disabled={isPreviewMode}>
                {opt}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      </div>
    </div>
  )
})

export default TrueFalseQuestion
