'use client'

import { useEffect, useRef } from 'react'
import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

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
        
        // Get the answer for this specific blank number (question ID)
        const blankAnswer = readingStore.getAnswer(blankNumber) as string | undefined
        
        return (
          <Input
            key={index}
            className="inline-block mx-2 text-center"
            style={{ width: '120px' }}
            value={blankAnswer || ''}
            onChange={(e) => readingStore.setAnswer(blankNumber, e.target.value)}
            placeholder={blankNumber.toString()}
            disabled={readingStore.isPreviewMode}
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
                  const blankAnswer = readingStore.getAnswer(number) as string | undefined
                  
                  const input = document.createElement('input')
                  input.type = 'text'
                  input.className = 'ant-input inline-block mx-2 text-center'
                  input.style.width = '120px'
                  input.value = blankAnswer || ''
                  input.placeholder = number.toString()
                  input.disabled = readingStore.isPreviewMode
                  input.addEventListener('change', (e) => {
                    readingStore.setAnswer(number, (e.target as HTMLInputElement).value)
                  })
                  
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
    <Card className="mb-4" ref={containerRef}>
      <div className="space-y-4">
        {renderWithInputs()}
      </div>
    </Card>
  )
})

export default FillInBlankQuestion
