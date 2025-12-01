'use client'

import { Button } from 'antd'
import { CheckOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import * as R from 'ramda'

interface Part {
  id: number
  title: string
  questionRange: [number, number]
}

interface BottomNavigationProps {
  parts: Part[]
  currentPart: number
  currentQuestionIndex: number
  onPartClick: (partNumber: number) => void
  onQuestionClick: (questionNumber: number) => void
  isQuestionAnswered: (questionNumber: number) => boolean
  onSubmit?: () => void
  isPreviewMode?: boolean
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

const BottomNavigation = observer(({
  parts,
  currentPart,
  currentQuestionIndex,
  onPartClick,
  onQuestionClick,
  isQuestionAnswered,
  onSubmit,
  isPreviewMode = false,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true
}: BottomNavigationProps) => {
  const currentPartData = parts.find(p => p.id === currentPart)
  const currentQuestionNumber = currentPartData
    ? currentPartData.questionRange[0] + currentQuestionIndex
    : 1

  // Calculate width percentages based on current part (current part gets 50%, others get 25%)
  const getPartWidth = (partId: number) => {
    return partId === currentPart ? '50%' : '25%'
  }

  return (
    <footer className="border-t" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Part Navigation with Question Numbers */}
        <div className="flex items-center gap-3 flex-1">
          {parts && parts.length > 0 ? parts.map((part: Part) => {
            const [start, end] = part.questionRange
            const answeredCount = R.range(start, end + 1).filter(qNum =>
              isQuestionAnswered(qNum)
            ).length
            const totalCount = end - start + 1
            const isCurrentPart = currentPart === part.id

            return (
              <div
                key={part.id}
                className="flex items-center gap-3 cursor-pointer justify-center px-3 py-2 rounded-lg"
                style={{
                  width: getPartWidth(part.id),
                  backgroundColor: isCurrentPart ? 'var(--background)' : 'var(--card-background)',
                  opacity: isCurrentPart ? 1 : 0.8
                }}
                onClick={() => onPartClick(part.id)}
              >
                <span
                  className="font-semibold whitespace-nowrap"
                  style={{ color: isCurrentPart ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {part.title}
                </span>
                
                {/* Show question numbers only for current part */}
                {isCurrentPart && (
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {R.range(start, end + 1).map((questionNum: number) => {
                      const isAnswered = isQuestionAnswered(questionNum)
                      const isCurrent = questionNum === currentQuestionNumber

                      return (
                        <div
                          key={questionNum}
                          className="relative cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onQuestionClick(questionNum)
                          }}
                        >
                          {/* Top border indicator */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${
                            isAnswered ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          
                          {/* Question number */}
                          <div
                            className="min-w-[32px] w-[32px] h-[32px] flex items-center justify-center text-sm border transition-colors"
                            style={{
                              color: 'var(--text-primary)',
                              borderColor: isCurrent ? 'var(--text-primary)' : 'var(--border-color)',
                              borderWidth: isCurrent ? '2px' : '1px',
                              fontWeight: isCurrent ? 'bold' : 'normal',
                              backgroundColor: 'var(--card-background)'
                            }}
                          >
                            {questionNum}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Show count and range for non-current parts */}
                {!isCurrentPart && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                      {start}-{end}
                    </span>
                    <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {answeredCount}/{totalCount}
                    </span>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          )}
        </div>

        {/* Navigation Arrows and Submit Button */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Previous and Next Buttons Row */}
          <div className="flex items-center gap-3">
            {/* Previous Button */}
            <Button
              icon={<LeftOutlined />}
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="w-12 h-12 flex items-center justify-center"
              style={{
                backgroundColor: hasPrevious ? 'var(--primary)' : 'var(--background)',
                borderColor: hasPrevious ? 'var(--primary)' : 'var(--border-color)',
                color: hasPrevious ? (getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() === '#ffff00' ? '#000000' : '#ffffff') : 'var(--text-secondary)'
              }}
            />

            {/* Next Button */}
            <Button
              icon={<RightOutlined />}
              onClick={onNext}
              disabled={!hasNext}
              className="w-12 h-12 flex items-center justify-center"
              style={{
                backgroundColor: hasNext ? 'var(--primary)' : 'var(--background)',
                borderColor: hasNext ? 'var(--primary)' : 'var(--border-color)',
                color: hasNext ? (getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() === '#ffff00' ? '#000000' : '#ffffff') : 'var(--text-secondary)'
              }}
            />
          </div>
          
          {/* Submit Button Row */}
          <Button
            type="primary"
            icon={<CheckOutlined />}
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={onSubmit}
            disabled={isPreviewMode}
          >
            Submit
          </Button>
        </div>
      </div>
    </footer>
  )
})

export default BottomNavigation
