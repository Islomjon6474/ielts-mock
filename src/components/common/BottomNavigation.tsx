'use client'

import { Button } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
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
}

const BottomNavigation = observer(({
  parts,
  currentPart,
  currentQuestionIndex,
  onPartClick,
  onQuestionClick,
  isQuestionAnswered,
  onSubmit,
  isPreviewMode = false
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
    <footer className="border-t bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Part Navigation with Question Numbers */}
        <div className="flex items-center gap-3 flex-1">
          {parts && parts.length > 0 ? parts.map((part) => {
            const [start, end] = part.questionRange
            const answeredCount = R.range(start, end + 1).filter(qNum =>
              isQuestionAnswered(qNum)
            ).length
            const totalCount = end - start + 1
            const isCurrentPart = currentPart === part.id

            return (
              <div
                key={part.id}
                className={`flex items-center gap-3 cursor-pointer justify-center px-3 py-2 rounded-lg ${
                  isCurrentPart
                    ? 'bg-gray-100'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                style={{ width: getPartWidth(part.id) }}
                onClick={() => onPartClick(part.id)}
              >
                <span
                  className={`font-semibold whitespace-nowrap ${
                    isCurrentPart
                      ? 'text-black'
                      : 'text-gray-500'
                  }`}
                >
                  {part.title}
                </span>
                
                {/* Show question numbers only for current part */}
                {isCurrentPart && (
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {R.range(start, end + 1).map((questionNum) => {
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
                          <div className={`
                            min-w-[32px] w-[32px] h-[32px] 
                            flex items-center justify-center
                            text-sm
                            text-black
                            border
                            ${isCurrent 
                              ? 'border-2 border-black font-bold' 
                              : 'border-gray-300'
                            }
                            bg-white
                            hover:bg-gray-50
                            transition-colors
                          `}>
                            {questionNum}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Show count for non-current parts */}
                {!isCurrentPart && (
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {answeredCount} of {totalCount}
                  </span>
                )}
              </div>
            )
          }) : (
            <div className="text-gray-400 text-sm">Loading...</div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="primary"
          icon={<CheckOutlined />}
          className="bg-green-600 hover:bg-green-700 flex-shrink-0"
          onClick={onSubmit}
          disabled={isPreviewMode}
        >
          Submit
        </Button>
      </div>
    </footer>
  )
})

export default BottomNavigation
