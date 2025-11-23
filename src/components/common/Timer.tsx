'use client'

import { observer } from 'mobx-react-lite'
import { ClockCircleOutlined } from '@ant-design/icons'

interface TimerProps {
  timeRemaining: number // in seconds
  isTimeUp: boolean
}

const Timer = observer(({ timeRemaining, isTimeUp }: TimerProps) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getColor = () => {
    if (isTimeUp) return '#ff4d4f' // red
    if (timeRemaining < 300) return '#faad14' // orange (less than 5 minutes)
    return '#52c41a' // green
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: isTimeUp ? '#fff1f0' : '#f6ffed',
        border: `2px solid ${getColor()}`,
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '18px',
        color: getColor(),
      }}
    >
      <ClockCircleOutlined style={{ fontSize: '20px' }} />
      <span>{isTimeUp ? 'Time Up!' : formatTime(timeRemaining)}</span>
    </div>
  )
})

export default Timer
