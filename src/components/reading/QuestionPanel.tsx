'use client'

import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import TrueFalseQuestion from './questions/TrueFalseQuestion'
import FillInBlankQuestion from './questions/FillInBlankQuestion'
import MatchHeadingQuestion from './questions/MatchHeadingQuestion'
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion'
import { Question } from '@/stores/ReadingStore'

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
        block: 'start',
      })
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, currentPart])

  if (!currentPart) {
    return null
  }

  const renderQuestion = (question: Question, questionNumber: number) => {
    switch (question.type) {
      case 'TRUE_FALSE_NOT_GIVEN':
        return (
          <TrueFalseQuestion
            question={question}
            questionNumber={questionNumber}
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
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            question={question}
            questionNumber={questionNumber}
          />
        )
      default:
        return null
    }
  }

  // Group consecutive questions of the same type
  const groupQuestions = () => {
    const groups: Array<{
      type: string
      questions: Array<{ question: Question; index: number; questionNumber: number }>
      startNumber: number
      endNumber: number
    }> = []

    currentPart.questions.forEach((question, index) => {
      const questionNumber = currentPart.questionRange[0] + index
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.type === question.type) {
        lastGroup.questions.push({ question, index, questionNumber })
        lastGroup.endNumber = questionNumber
      } else {
        groups.push({
          type: question.type,
          questions: [{ question, index, questionNumber }],
          startNumber: questionNumber,
          endNumber: questionNumber,
        })
      }
    })

    return groups
  }

  const getInstructionText = (type: string) => {
    switch (type) {
      case 'TRUE_FALSE_NOT_GIVEN':
        return (
          <p className="text-sm text-gray-600 mb-4">
            Choose <strong>TRUE</strong> if the statement agrees with the information given in the text,
            choose <strong>FALSE</strong> if the statement contradicts the information, or choose{' '}
            <strong>NOT GIVEN</strong> if there is no information on this.
          </p>
        )
      case 'FILL_IN_BLANK':
        return (
          <p className="text-sm text-gray-600 mb-4">
            Complete the notes. Write <strong>ONE WORD ONLY</strong> from the text for each answer.
          </p>
        )
      case 'MATCH_HEADING':
        return (
          <p className="text-sm text-gray-600 mb-4">
            The text has sections. Choose the correct heading for each section and move it into the gap.
          </p>
        )
      case 'MULTIPLE_CHOICE':
        return (
          <p className="text-sm text-gray-600 mb-4">
            Choose <strong>TWO</strong> correct answers.
          </p>
        )
      default:
        return null
    }
  }

  const questionGroups = groupQuestions()

  // Get all heading options from match heading questions
  const getAllHeadingOptions = () => {
    const matchHeadingQuestions = currentPart.questions.filter(q => q.type === 'MATCH_HEADING')
    if (matchHeadingQuestions.length > 0) {
      return matchHeadingQuestions[0].options || []
    }
    return []
  }

  const headingOptions = getAllHeadingOptions()
  const hasMatchHeadingQuestions = questionGroups.some(g => g.type === 'MATCH_HEADING')

  // Get all used headings
  const getUsedHeadings = () => {
    const used: string[] = []
    const matchHeadingQuestions = currentPart.questions.filter(q => q.type === 'MATCH_HEADING')
    matchHeadingQuestions.forEach(q => {
      const answer = readingStore.getAnswer(q.id) as string | undefined
      if (answer) {
        used.push(answer)
      }
    })
    return used
  }

  const usedHeadings = getUsedHeadings()

  const handleDragStart = (e: React.DragEvent, heading: string) => {
    // Don't allow dragging if heading is already used
    if (usedHeadings.includes(heading)) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('heading', heading)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Shared List of Headings for Match Heading Questions */}
      {hasMatchHeadingQuestions && headingOptions.length > 0 && (
        <div className="bg-white border-b pb-4 mb-4">
          <h4 className="font-semibold mb-2">List of Headings</h4>
          <p className="text-xs text-gray-500 mb-3">Drag headings to the passage sections on the left. Click ✕ to remove a heading.</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {headingOptions.map((heading, index) => {
              const isUsed = usedHeadings.includes(heading)
              
              return (
                <div
                  key={index}
                  draggable={!isUsed}
                  onDragStart={(e) => handleDragStart(e, heading)}
                  className={`p-3 border rounded transition-colors ${
                    isUsed 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                      : 'bg-white cursor-move hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{isUsed ? '✓' : '⋮⋮'}</span>
                    <span className="text-sm">{heading}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {questionGroups.map((group, groupIndex) => {
        // Skip rendering individual cards for Match Heading groups
        if (group.type === 'MATCH_HEADING') {
          return null
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
          <div key={groupIndex} className="space-y-4">
            {/* Group Header */}
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">
                Questions {group.startNumber}
                {group.endNumber !== group.startNumber && `–${group.endNumber}`}
              </h3>
              {getInstructionText(group.type)}
            </div>

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
        )
      })}
    </div>
  )
})

export default QuestionPanel
