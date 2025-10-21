'use client'

import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface FillInBlankQuestionProps {
  questionId: number
  text: string
  startNumber: number
}

const FillInBlankQuestion = observer(({ questionId, text, startNumber }: FillInBlankQuestionProps) => {
  const { listeningStore } = useStore()

  // Parse text for [number] patterns and replace with inputs
  const renderTextWithInputs = () => {
    const parts: JSX.Element[] = []
    const regex = /\[(\d+)\]/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      const questionNumber = parseInt(match[1])
      const actualQuestionId = questionId + (questionNumber - startNumber)

      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${match.index}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        )
      }

      // Add input field
      const answer = listeningStore.getAnswer(actualQuestionId) as string || ''
      parts.push(
        <Input
          key={`input-${questionNumber}`}
          value={answer}
          onChange={(e) => listeningStore.setAnswer(actualQuestionId, e.target.value)}
          placeholder={questionNumber.toString()}
          className="inline-block w-32 mx-1"
          size="small"
        />
      )

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-end`}>
          {text.substring(lastIndex)}
        </span>
      )
    }

    return parts
  }

  return (
    <div className="text-base leading-relaxed">
      {renderTextWithInputs()}
    </div>
  )
})

export default FillInBlankQuestion
