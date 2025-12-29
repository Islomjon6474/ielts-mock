'use client'

import { observer } from 'mobx-react-lite'

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
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Use CSS variable for normal color, only override for warning states
  const getColor = () => {
    if (isTimeUp) return '#dc3545' // Red for time up
    if (timeRemaining < 300) return '#faad14' // Orange warning (less than 5 minutes)
    return 'var(--text-primary)' // Use theme color
  }

  return (
    <span
      className="timer-display"
      style={{
        color: getColor(),
        fontSize: '16px',
        fontWeight: 500,
      }}
    >
      {isTimeUp ? 'Time Up!' : formatTime(timeRemaining)}
    </span>
  )
})

export default Timer
