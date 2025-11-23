'use client'

import { useEffect, useRef } from 'react'
import { Radio, Space, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface TrueFalseQuestionProps {
  question: Question
  questionNumber: number
  type?: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
}

const TrueFalseQuestion = observer(({ question, questionNumber, type = 'TRUE_FALSE_NOT_GIVEN' }: TrueFalseQuestionProps) => {
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
  
  const isYesNo = type === 'YES_NO_NOT_GIVEN'
  const options = isYesNo 
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  return (
    <Card className="mb-4" ref={containerRef}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4"><strong>{questionNumber}</strong> {question.text}</p>
          
          <Radio.Group
            value={answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <Space direction="vertical" className="w-full">
              {options.map(option => (
                <Radio key={option} value={option}>{option}</Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
})

export default TrueFalseQuestion
