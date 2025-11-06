'use client'

import { Radio } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface TrueFalseQuestionProps {
  question: any
  questionNumber: number
  type?: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
}

const TrueFalseQuestion = observer(({ question, questionNumber, type = 'TRUE_FALSE_NOT_GIVEN' }: TrueFalseQuestionProps) => {
  const { listeningStore } = useStore()
  const answer = listeningStore.getAnswer(question.id) as string

  const options = type === 'YES_NO_NOT_GIVEN' 
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  return (
    <div className="border-b pb-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 border-2 border-gray-800 rounded flex items-center justify-center font-bold text-sm">
          {questionNumber}
        </div>
        
        <div className="flex-1">
          <p className="mb-3 text-sm">{question.text}</p>
          
          <Radio.Group
            value={answer}
            onChange={(e) => listeningStore.setAnswer(question.id, e.target.value)}
            className="flex gap-4"
          >
            {options.map((opt: string) => (
              <Radio key={opt} value={opt} className="text-sm">
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
