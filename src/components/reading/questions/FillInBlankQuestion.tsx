'use client'

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
    <Card className="mb-4">
      <div className="space-y-4">
        {renderWithInputs()}
      </div>
    </Card>
  )
})

export default FillInBlankQuestion
