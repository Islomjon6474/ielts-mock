'use client'

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

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }
  
  const isYesNo = type === 'YES_NO_NOT_GIVEN'
  const options = isYesNo 
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  return (
    <Card className="mb-4">
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
