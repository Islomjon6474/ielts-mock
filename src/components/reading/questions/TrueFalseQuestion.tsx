'use client'

import { Radio, Space, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface TrueFalseQuestionProps {
  question: Question
  questionNumber: number
}

const TrueFalseQuestion = observer(({ question, questionNumber }: TrueFalseQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 border-2 border-gray-800 rounded flex items-center justify-center font-bold">
          {questionNumber}
        </div>
        
        <div className="flex-1">
          <p className="mb-4">{question.text}</p>
          
          <Radio.Group
            value={answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <Space direction="vertical" className="w-full">
              <Radio value="TRUE">TRUE</Radio>
              <Radio value="FALSE">FALSE</Radio>
              <Radio value="NOT GIVEN">NOT GIVEN</Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
})

export default TrueFalseQuestion
