'use client'

import { useState } from 'react'
import { Button, Card, Space, Tag, Tooltip, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'

interface AnswerMarkingPanelProps {
  mockId: string
  sectionId: string
  questionOrd: number
  userAnswer: string | string[] | null
  isCorrect: boolean | null
  onCorrectnessChange?: (isCorrect: boolean) => void
  onRecalculate?: () => void
}

export const AnswerMarkingPanel = ({
  mockId,
  sectionId,
  questionOrd,
  userAnswer,
  isCorrect,
  onCorrectnessChange,
  onRecalculate
}: AnswerMarkingPanelProps) => {
  const [marking, setMarking] = useState(false)

  const handleMarkAsCorrect = async (correct: boolean) => {
    try {
      setMarking(true)
      await mockResultApi.setAnswerAsCorrect({
        mockId,
        sectionId,
        questionOrd,
        isCorrect: correct ? 1 : 0
      })
      message.success(`Question ${questionOrd} marked as ${correct ? 'correct' : 'incorrect'}`)
      onCorrectnessChange?.(correct)
    } catch (error: any) {
      console.error('Failed to mark answer:', error)
      message.error(error.response?.data?.reason || 'Failed to mark answer')
    } finally {
      setMarking(false)
    }
  }

  if (!userAnswer) {
    return (
      <Tag color="default">Not answered</Tag>
    )
  }

  const displayAnswer = Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500 }}>Q{questionOrd}:</span>
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          backgroundColor: 'var(--card-background)',
          border: '1px solid var(--border-color)'
        }}>
          {displayAnswer}
        </span>
        {isCorrect === true && (
          <Tag color="success" icon={<CheckCircleOutlined />}>Correct</Tag>
        )}
        {isCorrect === false && (
          <Tag color="error" icon={<CloseCircleOutlined />}>Incorrect</Tag>
        )}
      </div>

      <Space size="small">
        <Tooltip title="Mark as correct">
          <Button
            size="small"
            type={isCorrect === true ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            loading={marking}
            onClick={() => handleMarkAsCorrect(true)}
            disabled={isCorrect === true}
          >
            Correct
          </Button>
        </Tooltip>
        <Tooltip title="Mark as incorrect">
          <Button
            size="small"
            type={isCorrect === false ? 'primary' : 'default'}
            danger={isCorrect === false}
            icon={<CloseCircleOutlined />}
            loading={marking}
            onClick={() => handleMarkAsCorrect(false)}
            disabled={isCorrect === false}
          >
            Incorrect
          </Button>
        </Tooltip>
      </Space>
    </Space>
  )
}

export default AnswerMarkingPanel
