'use client'

import { useEffect, useRef } from 'react'
import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface FillInBlankQuestionProps {
  question: any
  questionNumber: number
  isPreviewMode?: boolean
}

const FillInBlankQuestion = observer(({ question, questionNumber, isPreviewMode = false }: FillInBlankQuestionProps) => {
  const { listeningStore } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    
    // For fill-in-blank questions, we need to focus on the specific input for the current question number
    // The question text contains placeholders like [6], [7], [8] etc.
    if (containerRef.current) {
      setTimeout(() => {
        if (!containerRef.current) return
        
        // Try to find input with placeholder matching the current question number
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

  // Parse plain text to find blank markers like [1], [2], etc.
  const renderQuestionWithBlanks = () => {
    const parts = question.text.split(/(\[\d+\])/)
    
    return parts.map((part: string, index: number) => {
      const blankMatch = part.match(/\[(\d+)\]/)
      if (blankMatch) {
        const blankNumber = parseInt(blankMatch[1])
        
        // Get the answer for this specific blank number (question ID)
        const blankAnswer = listeningStore.getAnswer(blankNumber) as string | undefined
        
        return (
          <Input
            key={index}
            className="inline-block mx-2 text-center"
            style={{ width: '120px' }}
            value={blankAnswer || ''}
            onChange={(e) => listeningStore.setAnswer(blankNumber, e.target.value)}
            placeholder={blankNumber.toString()}
            disabled={isPreviewMode}
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
                  const blankAnswer = listeningStore.getAnswer(number) as string | undefined
                  
                  const input = document.createElement('input')
                  input.type = 'text'
                  input.className = 'ant-input inline-block mx-2 text-center'
                  input.style.width = '120px'
                  input.value = blankAnswer || ''
                  input.placeholder = number.toString()
                  input.disabled = isPreviewMode
                  input.addEventListener('change', (e) => {
                    listeningStore.setAnswer(number, (e.target as HTMLInputElement).value)
                  })
                  
                  placeholder.replaceWith(input)
                }
              })
            }
          }}
        />
      )
    }
    
    return <div className="leading-loose text-sm">{renderQuestionWithBlanks()}</div>
  }

  return (
    <div className="border-b pb-4" data-question-id={questionNumber} ref={containerRef}>
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
  )
})

export default FillInBlankQuestion
