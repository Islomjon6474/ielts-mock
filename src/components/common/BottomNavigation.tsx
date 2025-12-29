'use client'

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

  return (
    <>
      {/* Navigation Arrows - Above Bottom Nav */}
      <div className="ielts-nav-arrows">
        <button
          className="ielts-nav-arrow prev"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous question"
        >
          <LeftOutlined />
        </button>
        <button
          className="ielts-nav-arrow next"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next question"
        >
          <RightOutlined />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="ielts-nav-row" aria-label="Questions">
        {/* Parts Container - spreads parts across available width */}
        <div className="ielts-parts-container">
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
                className={`ielts-section-wrapper ${isCurrentPart ? 'selected' : ''}`}
                role="tablist"
              >
                <button
                  role="tab"
                  className="ielts-section-btn"
                  onClick={() => onPartClick(part.id)}
                  tabIndex={isCurrentPart ? -1 : 0}
                >
                  <span className="ielts-section-prefix">Part</span>
                  <span className="ielts-section-nr">{part.id}</span>
                  <span className="ielts-attempted-count">
                    {answeredCount} of {totalCount}
                  </span>
                </button>

                {/* Question Numbers - Only visible when part is selected */}
                <div className="ielts-subquestion-wrapper">
                  {R.range(start, end + 1).map((questionNum: number) => {
                    const isAnswered = isQuestionAnswered(questionNum)
                    const isCurrent = questionNum === currentQuestionNumber

                    return (
                      <button
                        key={questionNum}
                        className={`ielts-subquestion ${isAnswered ? 'answered' : ''} ${isCurrent ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuestionClick(questionNum)
                        }}
                        aria-label={`Question ${questionNum}${isAnswered ? ' (answered)' : ''}`}
                      >
                        {questionNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          }) : (
            <div style={{ color: 'var(--text-secondary)', padding: '10px 15px' }}>Loading...</div>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="ielts-submit-btn"
          onClick={onSubmit}
          disabled={isPreviewMode}
          aria-label="Submit test"
        >
          <CheckOutlined />
          <span>Submit</span>
        </button>
      </nav>
    </>
  )
})

export default BottomNavigation
