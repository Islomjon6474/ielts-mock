'use client'

import { Card, Select } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface MatchHeadingQuestionProps {
  question: Question
  questionNumber: number
}

const MatchHeadingQuestion = observer(({ question, questionNumber }: MatchHeadingQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  const headingOptions = question.options || []

  return (
    <Card className="mb-4">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
        <span className="font-bold text-lg">{questionNumber}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{question.text}</p>
          <Select
            className="w-full"
            placeholder="Select a heading or drag from the list above"
            value={answer}
            onChange={handleChange}
            options={headingOptions.map(h => ({ label: h, value: h }))}
            disabled={readingStore.isPreviewMode}
          />
        </div>
      </div>
    </Card>
  )
})

export default MatchHeadingQuestion
