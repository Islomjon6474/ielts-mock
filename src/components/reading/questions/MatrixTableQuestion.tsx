'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface MatrixTableQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  options: string[]
  isPreviewMode?: boolean
}

const MatrixTableQuestion = observer(({
  questions,
  questionNumbers,
  options,
  isPreviewMode = false
}: MatrixTableQuestionProps) => {
  const { readingStore } = useStore()

  // Toggle cell selection for a question
  const handleCellClick = (questionId: number, option: string) => {
    if (isPreviewMode) return

    const currentAnswer = readingStore.getAnswer(questionId) as string[] | string | undefined

    // Convert to array if needed
    let answerArray: string[] = []
    if (Array.isArray(currentAnswer)) {
      answerArray = [...currentAnswer]
    } else if (currentAnswer) {
      answerArray = [currentAnswer]
    }

    // Toggle the option
    const optionIndex = answerArray.indexOf(option)
    if (optionIndex > -1) {
      // Remove option
      answerArray.splice(optionIndex, 1)
    } else {
      // Add option
      answerArray.push(option)
    }

    // Update answer
    readingStore.setAnswer(questionId, answerArray)
  }

  // Check if a cell is selected
  const isCellSelected = (questionId: number, option: string): boolean => {
    const answer = readingStore.getAnswer(questionId)
    if (Array.isArray(answer)) {
      return answer.includes(option)
    } else if (answer) {
      return answer === option
    }
    return false
  }

  // Strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <div className="overflow-x-auto mb-6">
      <table
        className="w-full"
        style={{
          borderCollapse: 'collapse',
          border: '2px solid #d1d5db',
          backgroundColor: 'var(--card-background)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        <thead>
          <tr>
            <th
              className="py-2 px-3 text-center font-bold text-sm"
              style={{
                border: '2px solid #d1d5db',
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                width: '60px'
              }}
            >
              #
            </th>
            <th
              className="py-2 px-3 text-left font-bold text-sm"
              style={{
                border: '2px solid #d1d5db',
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                minWidth: '200px'
              }}
            >
              Question
            </th>
            {options.map((option, idx) => (
              <th
                key={idx}
                className="py-2 px-3 text-center font-bold text-sm"
                style={{
                  border: '2px solid #d1d5db',
                  backgroundColor: '#a78bfa',
                  color: '#ffffff',
                  minWidth: '120px'
                }}
              >
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: '#ffffff' }}
                  dangerouslySetInnerHTML={{ __html: option }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => {
            const questionNumber = questionNumbers[index]

            // In preview mode, get submitted answer for styling
            const submittedAnswer = readingStore.isPreviewMode
              ? readingStore.getSubmittedAnswer(question.id)
              : null
            const isCorrect = readingStore.isPreviewMode
              ? readingStore.isAnswerCorrect(question.id)
              : null

            // Determine row border color based on correctness
            let rowBorderColor = 'var(--border-color)'
            if (readingStore.isPreviewMode && submittedAnswer) {
              if (isCorrect === true) {
                rowBorderColor = '#52c41a' // Green for correct
              } else if (isCorrect === false) {
                rowBorderColor = '#ff4d4f' // Red for incorrect
              }
            }

            return (
              <tr key={question.id} className="hover:bg-opacity-50">
                <td
                  className="py-2 px-3 text-center font-bold"
                  style={{
                    border: '2px solid #d1d5db',
                    backgroundColor: '#8b5cf6',
                    color: '#ffffff'
                  }}
                >
                  {questionNumber}
                </td>
                <td
                  className="py-2 px-3"
                  style={{
                    border: '2px solid #d1d5db',
                    backgroundColor: readingStore.isPreviewMode && submittedAnswer
                      ? (isCorrect === true ? '#dcfce7' : isCorrect === false ? '#fee2e2' : 'var(--secondary)')
                      : 'var(--secondary)',
                    color: 'var(--text-primary)',
                    borderLeft: readingStore.isPreviewMode && submittedAnswer
                      ? `4px solid ${isCorrect === true ? '#22c55e' : isCorrect === false ? '#ef4444' : '#d1d5db'}`
                      : '2px solid #d1d5db'
                  }}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: question.text }}
                  />
                </td>
                {options.map((option, optIdx) => {
                  // Check if this option is selected for this question
                  const isSelected = isCellSelected(question.id, option)

                  // In preview mode, check if this was the submitted answer
                  const wasSubmitted = readingStore.isPreviewMode &&
                    Array.isArray(submittedAnswer) &&
                    submittedAnswer.includes(option)

                  // Determine cell background color
                  let cellBgColor = 'var(--card-background)'
                  let cellBorderColor = '#d1d5db'

                  if (readingStore.isPreviewMode && wasSubmitted) {
                    if (isCorrect === true) {
                      cellBgColor = '#dcfce7' // Light green
                      cellBorderColor = '#22c55e' // Green border
                    } else if (isCorrect === false) {
                      cellBgColor = '#fee2e2' // Light red
                      cellBorderColor = '#ef4444' // Red border
                    }
                  } else if (isSelected && !readingStore.isPreviewMode) {
                    cellBgColor = '#dbeafe' // Light blue for selected
                    cellBorderColor = '#3b82f6' // Blue border
                  }

                  return (
                    <td
                      key={optIdx}
                      className="py-2 px-3 text-center transition-all"
                      style={{
                        border: `2px solid ${cellBorderColor}`,
                        backgroundColor: cellBgColor,
                        cursor: isPreviewMode ? 'default' : 'pointer'
                      }}
                      onClick={() => handleCellClick(question.id, option)}
                      onMouseEnter={(e) => {
                        if (!isPreviewMode && !isSelected) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPreviewMode && !isSelected) {
                          e.currentTarget.style.backgroundColor = cellBgColor
                        }
                      }}
                    >
                      <div className="flex items-center justify-center min-h-[36px]">
                        {(isSelected || wasSubmitted) && (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color: readingStore.isPreviewMode
                                ? (isCorrect ? '#22c55e' : '#ef4444')
                                : '#3b82f6',
                              strokeWidth: 3
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default MatrixTableQuestion
