'use client'

import { useState } from 'react'
import { Button, Space, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'

interface QuestionMarkingButtonsProps {
  mockId: string
  sectionId: string
  questionOrd: number
  isCorrect: boolean | null
  onMarkingChange?: () => void
}

export const QuestionMarkingButtons = ({
  mockId,
  sectionId,
  questionOrd,
  isCorrect,
  onMarkingChange
}: QuestionMarkingButtonsProps) => {
  const [marking, setMarking] = useState(false)

  const handleMark = async (correct: boolean) => {
    try {
      setMarking(true)
      await mockResultApi.setAnswerAsCorrect({
        mockId,
        sectionId,
        questionOrd,
        isCorrect: correct ? 1 : 0
      })

      message.success(`Question ${questionOrd} marked as ${correct ? 'correct' : 'incorrect'}`)

      // Trigger recalculation and reload
      await mockResultApi.calcScore({ mockId, sectionId })
      message.success('Score recalculated')

      // Reload page to show updated data
      window.location.reload()

      onMarkingChange?.()
    } catch (error: any) {
      console.error('Failed to mark answer:', error)
      message.error(error.response?.data?.reason || 'Failed to mark answer')
      setMarking(false)
    }
  }

  return (
    <Space size="small" className="inline-flex ml-2">
      <Button
        size="small"
        type={isCorrect === true ? 'primary' : 'default'}
        icon={<CheckCircleOutlined />}
        loading={marking}
        onClick={() => handleMark(true)}
        style={{
          backgroundColor: isCorrect === true ? '#52c41a' : undefined,
          borderColor: isCorrect === true ? '#52c41a' : undefined,
        }}
      >
        ✓
      </Button>
      <Button
        size="small"
        type={isCorrect === false ? 'primary' : 'default'}
        danger={isCorrect === false}
        icon={<CloseCircleOutlined />}
        loading={marking}
        onClick={() => handleMark(false)}
      >
        ✗
      </Button>
    </Space>
  )
}

export default QuestionMarkingButtons
