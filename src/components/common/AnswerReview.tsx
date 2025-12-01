'use client'

import { CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

interface AnswerReviewProps {
  userAnswer: string | string[] | null
  isCorrect: boolean | null
  questionNumber: number
}

export const AnswerReview: React.FC<AnswerReviewProps> = ({
  userAnswer,
  isCorrect,
  questionNumber
}) => {
  if (!userAnswer) {
    return null
  }

  // Format answer for display
  const displayAnswer = Array.isArray(userAnswer)
    ? userAnswer.join(', ')
    : userAnswer

  // Determine status color and icon
  let color: string
  let icon: React.ReactNode
  let status: string

  if (isCorrect === null) {
    // No correct answer available for comparison
    color = 'default'
    icon = <QuestionCircleOutlined />
    status = 'Unknown'
  } else if (isCorrect) {
    color = 'success'
    icon = <CheckCircleOutlined />
    status = 'Correct'
  } else {
    color = 'error'
    icon = <CloseCircleOutlined />
    status = 'Incorrect'
  }

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '12px',
        borderRadius: '6px',
        backgroundColor: 'var(--secondary)',
        borderLeft: `4px solid ${
          isCorrect === null ? 'var(--border-color)' :
          isCorrect ? '#52c41a' : '#ff4d4f'
        }`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Student Answer:
        </span>
        <Tag color={color} icon={icon} style={{ margin: 0 }}>
          {status}
        </Tag>
      </div>
      <div style={{
        fontSize: '1rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
        wordBreak: 'break-word'
      }}>
        {displayAnswer}
      </div>
    </div>
  )
}

export default AnswerReview
