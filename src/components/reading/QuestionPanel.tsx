'use client'

import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import TrueFalseQuestion from './questions/TrueFalseQuestion'
import FillInBlankQuestion from './questions/FillInBlankQuestion'
import MatchHeadingQuestion from './questions/MatchHeadingQuestion'
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion'
import MultipleChoiceSingleQuestion from './questions/MultipleChoiceSingleQuestion'
import MultipleCorrectAnswersQuestion from './questions/MultipleCorrectAnswersQuestion'
import ImageInputsQuestion from './questions/ImageInputsQuestion'
import SentenceCompletionQuestion from './questions/SentenceCompletionQuestion'
import MatrixTableQuestion from './questions/MatrixTableQuestion'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

const QuestionPanel = observer(() => {
  const { readingStore } = useStore()
  const currentPart = readingStore.parts[readingStore.currentPart - 1]
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (!currentPart) return
    
    const currentQuestionNumber = currentPart.questionRange[0] + readingStore.currentQuestionIndex
    const currentQuestionRef = questionRefs.current[currentQuestionNumber]
    
    if (currentQuestionRef) {
      currentQuestionRef.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      
      // Focus on the first focusable element in the question after scrolling
      setTimeout(() => {
        // Try to find input, textarea, or radio button
        const input = currentQuestionRef.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea') as HTMLInputElement | HTMLTextAreaElement | null
        const radio = currentQuestionRef.querySelector('input[type="radio"]') as HTMLInputElement | null
        const checkbox = currentQuestionRef.querySelector('input[type="checkbox"]') as HTMLInputElement | null
        
        // Priority: text input > radio > checkbox
        if (input) {
          input.focus()
          if ('select' in input && typeof input.select === 'function') {
            input.select() // Select text if it's an input
          }
        } else if (radio) {
          radio.focus()
        } else if (checkbox) {
          checkbox.focus()
        }
      }, 400)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, currentPart])

  if (!currentPart) {
    return null
  }

  const renderQuestion = (question: Question, questionNumber: number) => {
    switch (question.type) {
      case 'TRUE_FALSE_NOT_GIVEN':
      case 'YES_NO_NOT_GIVEN':
        return (
          <TrueFalseQuestion
            question={question}
            questionNumber={questionNumber}
            type={question.type as 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'}
          />
        )
      case 'FILL_IN_BLANK':
        return (
          <FillInBlankQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      case 'MATCH_HEADING':
        // Don't render individual match heading questions - they're handled by drag and drop
        return null
      case 'SENTENCE_COMPLETION':
        // Don't render individual sentence completion questions - they're handled by drag and drop
        return null
      case 'MATRIX_TABLE':
        // Don't render individual matrix table questions - they're handled as a group
        return null
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      case 'MULTIPLE_CHOICE_SINGLE':
        return (
          <MultipleChoiceSingleQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      case 'IMAGE_INPUTS':
        return (
          <ImageInputsQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      case 'MULTIPLE_CORRECT_ANSWERS':
        return (
          <MultipleCorrectAnswersQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      default:
        return null
    }
  }

  // Group consecutive questions of the same type and groupIndex
  const groupQuestions = () => {
    const groups: Array<{
      type: string
      questions: Array<{ question: Question; index: number; questionNumber: number }>
      startNumber: number
      endNumber: number
      groupIndex?: number
    }> = []

    currentPart.questions.forEach((question, index) => {
      const questionNumber = currentPart.questionRange[0] + index
      const lastGroup = groups[groups.length - 1]
      const qGroupIndex = (question as any).groupIndex

      // Start new group if type changes OR groupIndex changes
      const shouldStartNewGroup = !lastGroup || 
        lastGroup.type !== question.type ||
        (qGroupIndex !== undefined && qGroupIndex !== lastGroup.groupIndex)

      if (shouldStartNewGroup) {
        groups.push({
          type: question.type,
          questions: [{ question, index, questionNumber }],
          startNumber: questionNumber,
          endNumber: questionNumber,
          groupIndex: qGroupIndex,
        })
      } else {
        lastGroup.questions.push({ question, index, questionNumber })
        lastGroup.endNumber = questionNumber
      }
    })

    return groups
  }

  const getInstructionText = (type: string) => {
    switch (type) {
      case 'TRUE_FALSE_NOT_GIVEN':
        return (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Choose <strong>TRUE</strong> if the statement agrees with the information given in the text,
            choose <strong>FALSE</strong> if the statement contradicts the information, or choose{' '}
            <strong>NOT GIVEN</strong> if there is no information on this.
          </p>
        )
      case 'FILL_IN_BLANK':
        return (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Complete the notes. Write <strong>ONE WORD ONLY</strong> from the text for each answer.
          </p>
        )
      case 'MATCH_HEADING':
        return (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            The text has sections. Choose the correct heading for each section and move it into the gap.
          </p>
        )
      case 'MULTIPLE_CHOICE':
        return (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Choose <strong>TWO</strong> correct answers.
          </p>
        )
      default:
        return null
    }
  }

  const questionGroups = groupQuestions()

  return (
    <div className="p-6 space-y-6">
      {questionGroups.map((group, groupIndex) => {
        // Render MATCH_HEADING - only show available headings (drop zones are in passage)
        if (group.type === 'MATCH_HEADING') {
          const questionGroupData = currentPart.questionGroups?.[groupIndex]
          // Try to get headings from questionGroups first, then from the first question
          let headings = questionGroupData?.headingOptions || []
          if (!headings || headings.length === 0) {
            // Fallback: get headings from first question in the group
            headings = group.questions[0]?.question?.options || []
          }
          const parsedHeadings = Array.isArray(headings) ? headings : []
          
          // Get all used headings
          const usedHeadings = group.questions
            .map(q => readingStore.getAnswer(q.questionNumber) as string)
            .filter(Boolean)
          
          // Strip HTML tags
          const stripHtml = (html: string) => {
            const tmp = document.createElement('DIV')
            tmp.innerHTML = html
            return tmp.textContent || tmp.innerText || ''
          }
          
          const handleDragStart = (e: React.DragEvent, heading: string) => {
            const isUsed = usedHeadings.includes(heading)
            if (isUsed) {
              e.preventDefault()
              return
            }
            e.dataTransfer.setData('heading', heading)
            e.dataTransfer.effectAllowed = 'move'
          }
          
          return (
            <div key={groupIndex} className="mb-8">
              {groupIndex > 0 && (
                <div className="border-t-2 my-6" style={{ borderColor: 'var(--border-color)' }}></div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg border-l-4 p-4 mb-4" style={{ backgroundColor: 'var(--card-background)', borderLeftColor: '#22c55e' }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    Questions {group.startNumber}–{group.endNumber}
                  </h3>
                  {questionGroupData?.instruction && (
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      style={{ color: 'var(--text-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: questionGroupData.instruction }}
                    />
                  )}
                </div>
                
                {/* Only show available headings - drop zones are in the passage on the left */}
                <div>
                  <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Available Headings</h4>
                  <div className="space-y-2">
                    {parsedHeadings.map((heading, index) => {
                      const isUsed = usedHeadings.includes(heading)
                      const cleanHeading = stripHtml(heading)

                      return (
                        <div
                          key={index}
                          draggable={!isUsed}
                          onDragStart={(e) => handleDragStart(e, heading)}
                          className="px-4 py-3 border-2 rounded-md text-sm transition-all shadow-sm"
                          style={{
                            backgroundColor: isUsed ? '#d1d5db' : 'var(--card-background)',
                            color: isUsed ? '#6b7280' : 'var(--text-primary)',
                            borderColor: isUsed ? '#9ca3af' : 'var(--border-color)',
                            cursor: isUsed ? 'not-allowed' : 'move',
                            textDecoration: isUsed ? 'line-through' : 'none'
                          }}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(105 + index)}.</span>
                          {cleanHeading}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // Render MATRIX_TABLE as a special group with table
        if (group.type === 'MATRIX_TABLE') {
          const questionGroupData = currentPart.questionGroups?.[groupIndex]
          // Get matrix options from questionGroups
          let options = questionGroupData?.matrixOptions || []
          const parsedOptions = Array.isArray(options) ? options : []

          return (
            <div key={groupIndex} className="mb-8">
              {groupIndex > 0 && (
                <div className="border-t-2 my-6" style={{ borderColor: 'var(--border-color)' }}></div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg border-l-4 p-4 mb-4" style={{ backgroundColor: 'var(--card-background)', borderLeftColor: '#8b5cf6' }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    Questions {group.startNumber}–{group.endNumber}
                  </h3>
                  {questionGroupData?.instruction && (
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      style={{ color: 'var(--text-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: questionGroupData.instruction }}
                    />
                  )}
                </div>

                <MatrixTableQuestion
                  questions={group.questions.map(q => q.question)}
                  questionNumbers={group.questions.map(q => q.questionNumber)}
                  options={parsedOptions}
                  isPreviewMode={readingStore.isPreviewMode}
                />
              </div>
            </div>
          )
        }

        // Render SENTENCE_COMPLETION as a special group with drag and drop
        if (group.type === 'SENTENCE_COMPLETION') {
          const questionGroupData = currentPart.questionGroups?.[groupIndex]
          // Try to get options from questionGroups first, then from the first question
          let options = questionGroupData?.options || []
          if (!options || options.length === 0) {
            // Fallback: get options from first question in the group
            options = group.questions[0]?.question?.options || []
          }
          // Options are already an array of rich text strings
          const parsedOptions = Array.isArray(options) ? options : []
          
          console.log('SENTENCE_COMPLETION options:', parsedOptions)
          
          return (
            <div key={groupIndex} className="mb-8">
              {groupIndex > 0 && (
                <div className="border-t-2 my-6" style={{ borderColor: 'var(--border-color)' }}></div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg border-l-4 p-4 mb-4" style={{ backgroundColor: 'var(--card-background)', borderLeftColor: '#3b82f6' }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    Questions {group.startNumber}–{group.endNumber}
                  </h3>
                  {questionGroupData?.instruction && (
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      style={{ color: 'var(--text-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: questionGroupData.instruction }}
                    />
                  )}
                </div>
                
                <SentenceCompletionQuestion
                  questions={group.questions.map(q => q.question)}
                  questionNumbers={group.questions.map(q => q.questionNumber)}
                  options={parsedOptions}
                  imageUrl={questionGroupData?.imageUrl}
                />
              </div>
            </div>
          )
        }

        // For FILL_IN_BLANK, deduplicate questions with same text
        let questionsToRender = group.questions
        if (group.type === 'FILL_IN_BLANK') {
          const seenTexts = new Set<string>()
          questionsToRender = group.questions.filter(({ question }) => {
            if (seenTexts.has(question.text)) {
              return false
            }
            seenTexts.add(question.text)
            return true
          })
        }

        return (
          <div key={groupIndex} className="mb-8">
            {/* Divider between groups (except for first group) */}
            {groupIndex > 0 && (
              <div className="border-t-2 my-6" style={{ borderColor: 'var(--border-color)' }}></div>
            )}

            <div className="space-y-4">
              {/* Group Header */}
              <div className="rounded-lg border-l-4 p-4" style={{ backgroundColor: 'var(--card-background)', borderLeftColor: '#3b82f6' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Questions {group.startNumber}
                  {group.endNumber !== group.startNumber && `–${group.endNumber}`}
                </h3>
                {/* Use instruction from questionGroups if available, otherwise use default */}
                {currentPart.questionGroups && currentPart.questionGroups[groupIndex]?.instruction ? (
                  <div
                    className="text-sm mb-4 prose prose-sm max-w-none"
                    style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: currentPart.questionGroups[groupIndex].instruction }}
                  />
                ) : (
                  getInstructionText(group.type)
                )}
              </div>

              {/* Display image for this question group if available */}
              {currentPart.questionGroups && currentPart.questionGroups[groupIndex]?.imageUrl && (
                <div className="mb-6">
                  <div className="border rounded-lg p-1" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background)' }}>
                    <AuthenticatedImage
                      src={currentPart.questionGroups[groupIndex].imageUrl}
                      alt={`Question group ${groupIndex + 1} illustration`}
                      style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Questions in Group */}
              {questionsToRender.map(({ question, index, questionNumber }) => {
                const isCurrent = index === readingStore.currentQuestionIndex

                return (
                  <div
                    key={question.id}
                    ref={(el) => {
                      questionRefs.current[questionNumber] = el
                    }}
                    className={`transition-all ${isCurrent ? 'ring-2 ring-blue-400 rounded-lg' : ''}`}
                  >
                    {renderQuestion(question, questionNumber)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default QuestionPanel
