'use client'

import { useEffect, useRef } from 'react'
import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface FillInBlankQuestionProps {
  question: Question
  questionNumber: number
}

const FillInBlankQuestion = observer(({ question, questionNumber }: FillInBlankQuestionProps) => {
  const { readingStore } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return
    
    // Auto-focus when this is the current question
    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    
    // For fill-in-blank questions, we need to focus on the specific input for the current question number
    if (containerRef.current) {
      // Use longer timeout to ensure inputs are rendered
      setTimeout(() => {
        if (!containerRef.current) return
        
        // Try to find input with placeholder matching the current question number
        const inputs = containerRef.current.querySelectorAll('input[type="text"]')
        
        if (!inputs || inputs.length === 0) return
        
        let focused = false
        inputs.forEach((input) => {
          const htmlInput = input as HTMLInputElement
          const placeholder = htmlInput.placeholder
          const placeholderNum = parseInt(placeholder)
          
          if (placeholderNum === currentQuestionNumber && !focused && !htmlInput.disabled) {
            htmlInput.focus()
            htmlInput.select()
            focused = true
            
            // Scroll into view if needed
            htmlInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }, 300)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumber, readingStore.isPreviewMode])

  // Check if text contains HTML (from rich text editor)
  const isHtml = question.text.includes('<') && question.text.includes('>')

  // Parse HTML content and replace placeholders with inputs
  const renderHtmlWithBlanks = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = question.text

    // Find all placeholder spans
    const placeholders = tempDiv.querySelectorAll('[data-placeholder]')
    
    placeholders.forEach((placeholder) => {
      const number = parseInt(placeholder.getAttribute('data-number') || '0')
      if (number > 0) {
        const inputWrapper = document.createElement('span')
        inputWrapper.setAttribute('data-input-placeholder', number.toString())
        inputWrapper.className = 'inline-input-placeholder'
        placeholder.replaceWith(inputWrapper)
      }
    })

    return tempDiv.innerHTML
  }

  // Parse plain text to find blank markers like [7], [8], etc.
  const renderPlainTextWithBlanks = () => {
    const parts = question.text.split(/(\[\d+\])/)

    return parts.map((part, index) => {
      const blankMatch = part.match(/\[(\d+)\]/)
      if (blankMatch) {
        const blankNumber = parseInt(blankMatch[1])

        // In preview mode with submitted answers, show submitted answer with correctness styling
        if (readingStore.isPreviewMode) {
          const submittedAnswer = readingStore.getSubmittedAnswer(blankNumber)
          const isCorrect = readingStore.isAnswerCorrect(blankNumber)

          console.log(`🔍 FillInBlank Q${blankNumber}: submittedAnswer=`, submittedAnswer, 'isCorrect=', isCorrect, 'previewMode=', readingStore.isPreviewMode)

          // Determine border and background color based on correctness
          let borderColor = 'var(--input-border)'
          let backgroundColor = 'var(--input-background)'

          if (submittedAnswer) {
            if (isCorrect === true) {
              borderColor = '#52c41a' // Green for correct
              backgroundColor = '#f6ffed' // Light green background
            } else if (isCorrect === false) {
              borderColor = '#ff4d4f' // Red for incorrect
              backgroundColor = '#fff2f0' // Light red background
            }
          }

          return (
            <Input
              key={index}
              className="inline-block mx-2 text-center font-bold"
              style={{
                width: '120px',
                backgroundColor,
                borderColor,
                borderWidth: '2px',
                color: 'var(--text-primary)'
              }}
              value={submittedAnswer as string || ''}
              placeholder={blankNumber.toString()}
              disabled={true}
            />
          )
        }

        // Normal mode - editable
        const blankAnswer = readingStore.getAnswer(blankNumber) as string | undefined

        return (
          <Input
            key={index}
            className="inline-block mx-2 text-center font-bold"
            style={{
              width: '120px',
              backgroundColor: 'var(--input-background)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)'
            }}
            value={blankAnswer || ''}
            onChange={(e) => readingStore.setAnswer(blankNumber, e.target.value)}
            placeholder={blankNumber.toString()}
            disabled={false}
          />
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Render HTML with interactive inputs
  const renderWithInputs = () => {
    if (isHtml) {
      const htmlContent = renderHtmlWithBlanks()

      return (
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          ref={(el) => {
            if (el) {
              // Replace placeholder spans with actual Input components
              const inputPlaceholders = el.querySelectorAll('[data-input-placeholder]')
              inputPlaceholders.forEach((placeholder) => {
                const number = parseInt(placeholder.getAttribute('data-input-placeholder') || '0')
                if (number > 0) {
                  const input = document.createElement('input')
                  input.type = 'text'
                  input.className = 'ant-input inline-block mx-2 text-center font-bold'
                  input.style.width = '120px'
                  input.placeholder = number.toString()

                  // In preview mode with submitted answers, show submitted answer with correctness styling
                  if (readingStore.isPreviewMode) {
                    const submittedAnswer = readingStore.getSubmittedAnswer(number)
                    const isCorrect = readingStore.isAnswerCorrect(number)

                    input.value = (submittedAnswer as string) || ''
                    input.disabled = true

                    // Style based on correctness
                    if (submittedAnswer) {
                      if (isCorrect === true) {
                        input.style.borderColor = '#52c41a'
                        input.style.backgroundColor = '#f6ffed'
                        input.style.borderWidth = '2px'
                      } else if (isCorrect === false) {
                        input.style.borderColor = '#ff4d4f'
                        input.style.backgroundColor = '#fff2f0'
                        input.style.borderWidth = '2px'
                      }
                    } else {
                      input.style.backgroundColor = 'var(--input-background)'
                      input.style.borderColor = 'var(--input-border)'
                    }
                  } else {
                    // Normal mode - editable
                    const blankAnswer = readingStore.getAnswer(number) as string | undefined
                    input.value = blankAnswer || ''
                    input.disabled = false
                    input.style.backgroundColor = 'var(--input-background)'
                    input.style.borderColor = 'var(--input-border)'
                    input.addEventListener('change', (e) => {
                      readingStore.setAnswer(number, (e.target as HTMLInputElement).value)
                    })
                  }

                  input.style.color = 'var(--text-primary)'
                  placeholder.replaceWith(input)
                }
              })
            }
          }}
        />
      )
    }

    return <div className="leading-loose">{renderPlainTextWithBlanks()}</div>
  }

  return (
    <Card className="mb-4" ref={containerRef} style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
      <div className="space-y-4">
        {/* Display image if available */}
        {question.imageUrl && (
          <div className="mb-4">
            <AuthenticatedImage
              src={question.imageUrl}
              alt={`Question ${questionNumber} image`}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              className="rounded border"
            />
          </div>
        )}
        {renderWithInputs()}
      </div>
    </Card>
  )
})

export default FillInBlankQuestion
