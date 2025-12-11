'use client'

import { useEffect, useRef } from 'react'
import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface TableCompletionQuestionProps {
  question: any
  questionNumber: number
  isPreviewMode?: boolean
}

const TableCompletionQuestion = observer(({ question, questionNumber, isPreviewMode = false }: TableCompletionQuestionProps) => {
  const { listeningStore } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber

    // Focus on the specific input for the current question number
    if (containerRef.current) {
      setTimeout(() => {
        if (!containerRef.current) return

        const inputs = containerRef.current.querySelectorAll('input')

        if (!inputs || inputs.length === 0) return

        inputs.forEach((input) => {
          const htmlInput = input as HTMLInputElement
          const placeholder = htmlInput.placeholder
          const placeholderNum = parseInt(placeholder)

          if (placeholderNum === currentQuestionNumber) {
            htmlInput.focus()
            htmlInput.select()
          }
        })
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumber])

  // Parse HTML content and replace placeholders with inputs
  const renderTableWithInputs = () => {
    const text = question.text || ''

    // Check if text contains HTML (from rich text editor)
    const isHtml = text.includes('<') && text.includes('>')

    if (!isHtml) {
      // Plain text - just replace [n] with inputs
      return renderPlainTextWithInputs(text)
    }

    // Parse HTML and inject inputs at placeholder positions
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = text

    // Find all placeholder spans and replace them with markers
    const placeholders = tempDiv.querySelectorAll('[data-placeholder]')
    placeholders.forEach((placeholder) => {
      const number = parseInt(placeholder.getAttribute('data-number') || '0')
      if (number > 0) {
        const inputWrapper = document.createElement('span')
        inputWrapper.setAttribute('data-input-placeholder', number.toString())
        inputWrapper.className = 'table-input-placeholder'
        placeholder.replaceWith(inputWrapper)
      }
    })

    // Also handle plain text [n] format within HTML
    let htmlContent = tempDiv.innerHTML
    htmlContent = htmlContent.replace(/\[(\d+)\]/g, (match, num) => {
      return `<span data-input-placeholder="${num}" class="table-input-placeholder"></span>`
    })

    return (
      <div
        className="table-completion-container"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        ref={(el) => {
          if (el) {
            // Replace placeholder spans with actual Input components
            const inputPlaceholders = el.querySelectorAll('[data-input-placeholder]')
            inputPlaceholders.forEach((placeholder) => {
              const number = parseInt(placeholder.getAttribute('data-input-placeholder') || '0')
              if (number > 0) {
                // Create wrapper span for input and buttons
                const wrapper = document.createElement('span')
                wrapper.className = 'inline-flex items-center'

                const input = document.createElement('input')
                input.type = 'text'
                input.className = 'ant-input inline-block mx-1 text-center font-bold'
                input.style.width = '120px'
                input.style.minWidth = '80px'
                input.style.padding = '4px 8px'
                input.style.borderRadius = '4px'
                input.style.border = '2px solid var(--input-border)'
                input.placeholder = number.toString()

                // In preview mode with submitted answers
                if (isPreviewMode) {
                  const submittedAnswer = listeningStore.getSubmittedAnswer(number)
                  const isCorrect = listeningStore.isAnswerCorrect(number)

                  input.value = (submittedAnswer as string) || ''
                  input.disabled = true

                  // Style based on correctness
                  if (submittedAnswer) {
                    if (isCorrect === true) {
                      input.style.borderColor = '#52c41a'
                      input.style.backgroundColor = '#f6ffed'
                    } else if (isCorrect === false) {
                      input.style.borderColor = '#ff4d4f'
                      input.style.backgroundColor = '#fff2f0'
                    }
                  } else {
                    input.style.backgroundColor = 'var(--input-background)'
                    input.style.borderColor = 'var(--input-border)'
                  }

                  wrapper.appendChild(input)

                  // Add marking buttons if mockId and sectionId available
                  if (listeningStore.mockId && listeningStore.sectionId) {
                    const buttonContainer = document.createElement('span')
                    buttonContainer.className = 'inline-flex ml-1'
                    buttonContainer.setAttribute('data-question-buttons', number.toString())
                    wrapper.appendChild(buttonContainer)
                  }
                } else {
                  // Normal mode - editable
                  const blankAnswer = listeningStore.getAnswer(number) as string | undefined
                  input.value = blankAnswer || ''
                  input.disabled = false
                  input.style.backgroundColor = 'var(--input-background)'
                  input.style.borderColor = 'var(--input-border)'

                  input.addEventListener('input', (e) => {
                    listeningStore.setAnswer(number, (e.target as HTMLInputElement).value)
                  })
                  input.addEventListener('change', (e) => {
                    listeningStore.setAnswer(number, (e.target as HTMLInputElement).value)
                  })

                  wrapper.appendChild(input)
                }

                input.style.color = 'var(--text-primary)'
                placeholder.replaceWith(wrapper)
              }
            })
          }
        }}
      />
    )
  }

  // Render plain text with inputs (fallback for non-HTML content)
  const renderPlainTextWithInputs = (text: string) => {
    const parts = text.split(/(\[\d+\])/)

    return (
      <div className="leading-loose text-sm">
        {parts.map((part: string, index: number) => {
          const blankMatch = part.match(/\[(\d+)\]/)
          if (blankMatch) {
            const blankNumber = parseInt(blankMatch[1])

            if (isPreviewMode) {
              const submittedAnswer = listeningStore.getSubmittedAnswer(blankNumber)
              const isCorrect = listeningStore.isAnswerCorrect(blankNumber)

              let borderColor = 'var(--input-border)'
              let backgroundColor = 'var(--input-background)'

              if (submittedAnswer) {
                if (isCorrect === true) {
                  borderColor = '#52c41a'
                  backgroundColor = '#f6ffed'
                } else if (isCorrect === false) {
                  borderColor = '#ff4d4f'
                  backgroundColor = '#fff2f0'
                }
              }

              return (
                <span key={index} className="inline-flex items-center">
                  <Input
                    className="inline-block mx-1 text-center font-bold"
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
                  {listeningStore.mockId && listeningStore.sectionId && (
                    <QuestionMarkingButtons
                      mockId={listeningStore.mockId}
                      sectionId={listeningStore.sectionId}
                      questionOrd={blankNumber}
                      isCorrect={isCorrect}
                    />
                  )}
                </span>
              )
            }

            // Normal mode - editable
            const blankAnswer = listeningStore.getAnswer(blankNumber) as string | undefined

            return (
              <Input
                key={index}
                className="inline-block mx-1 text-center font-bold"
                style={{ width: '120px', backgroundColor: 'var(--input-background)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                value={blankAnswer || ''}
                onChange={(e) => listeningStore.setAnswer(blankNumber, e.target.value)}
                placeholder={blankNumber.toString()}
                disabled={false}
              />
            )
          }
          return <span key={index}>{part}</span>
        })}
      </div>
    )
  }

  return (
    <div
      style={{ borderBottomColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      className="border-b pb-4"
      data-question-id={questionNumber}
      ref={containerRef}
    >
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

      {renderTableWithInputs()}

      <style jsx global>{`
        .table-completion-container table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        .table-completion-container td,
        .table-completion-container th {
          border: 2px solid var(--border-color, #d9d9d9);
          padding: 10px 14px;
          vertical-align: middle;
          text-align: left;
        }

        .table-completion-container th {
          font-weight: bold;
          background-color: var(--table-header-bg, #fafafa);
        }

        .table-completion-container tr:nth-child(even) td {
          background-color: var(--table-row-alt-bg, rgba(0, 0, 0, 0.02));
        }

        /* Dark mode */
        [data-theme="dark"] .table-completion-container th {
          background-color: #1f1f1f;
        }

        [data-theme="dark"] .table-completion-container tr:nth-child(even) td {
          background-color: rgba(255, 255, 255, 0.02);
        }

        /* Yellow mode */
        [data-theme="yellow"] .table-completion-container th {
          background-color: #fffbe6;
        }

        .table-input-placeholder {
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </div>
  )
})

export default TableCompletionQuestion
