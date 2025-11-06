'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface PlaceholderTextAreaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  questionNumber?: number
  disabled?: boolean
  onPlaceholdersChange?: (placeholders: number[]) => void
}

/**
 * A textarea component that supports inline placeholder markers {{1}}, {{2}}, etc.
 * - Displays placeholders with visual highlighting
 * - Provides button to insert placeholders
 * - Converts {{number}} to [number] format for storage
 * - Integrates with Ant Design Form
 */
export const PlaceholderTextArea: React.FC<PlaceholderTextAreaProps> = ({
  value = '',
  onChange,
  placeholder,
  rows = 4,
  questionNumber = 1,
  disabled = false,
  onPlaceholdersChange
}) => {
  const [displayValue, setDisplayValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Convert [number] to {{number}} for editing when value prop changes
  useEffect(() => {
    const editableValue = (value || '').replace(/\[(\d+)\]/g, '{{$1}}')
    setDisplayValue(editableValue)
  }, [value])

  // Extract placeholders and notify parent
  const extractPlaceholders = useCallback((text: string) => {
    const matches = text.match(/\[(\d+)\]/g) || []
    const numbers = matches.map(m => {
      const num = m.match(/\[(\d+)\]/)
      return num ? parseInt(num[1]) : 0
    }).filter(n => n > 0)
    return [...new Set(numbers)].sort((a, b) => a - b)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)
    
    // Convert {{number}} back to [number] for storage
    const storageValue = newValue.replace(/\{\{(\d+)\}\}/g, '[$1]')
    
    // Extract placeholders and notify
    const placeholders = extractPlaceholders(storageValue)
    onPlaceholdersChange?.(placeholders)
    
    // Notify form of change
    onChange?.(storageValue)
  }

  const insertPlaceholder = (questionNum: number) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const placeholder = `{{${questionNum}}}`
    
    const newValue = 
      displayValue.substring(0, start) +
      placeholder +
      displayValue.substring(end)
    
    setDisplayValue(newValue)
    
    // Convert to storage format and notify parent
    const storageValue = newValue.replace(/\{\{(\d+)\}\}/g, '[$1]')
    
    // Extract placeholders and notify
    const placeholders = extractPlaceholders(storageValue)
    onPlaceholdersChange?.(placeholders)
    
    onChange?.(storageValue)
    
    // Set cursor position after the inserted placeholder
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + placeholder.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // Get next available placeholder number
  const getNextPlaceholderNumber = (): number => {
    const matches = displayValue.match(/\{\{(\d+)\}\}/g) || []
    if (matches.length === 0) return questionNumber
    
    const numbers = matches.map(m => {
      const num = m.match(/\{\{(\d+)\}\}/)
      return num ? parseInt(num[1]) : 0
    })
    
    return Math.max(...numbers, questionNumber - 1) + 1
  }

  // Render highlighted text overlay
  const renderHighlightedText = () => {
    const parts = displayValue.split(/(\{\{\d+\}\})/g)
    
    return parts.map((part, index) => {
      if (part.match(/\{\{(\d+)\}\}/)) {
        const num = part.match(/\{\{(\d+)\}\}/)?.[1]
        return (
          <span
            key={index}
            className="bg-blue-100 text-blue-700 font-semibold px-1 rounded border border-blue-300"
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Tooltip title={`Insert placeholder at cursor position`}>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => insertPlaceholder(getNextPlaceholderNumber())}
            disabled={disabled}
          >
            Insert Placeholder {`{{${getNextPlaceholderNumber()}}}`}
          </Button>
        </Tooltip>
        <span className="text-xs text-gray-500">
          Use {'{{number}}'} syntax for placeholders (e.g., Card number: {'{{1}}'})
        </span>
      </div>
      
      <div className="relative">
        {/* Highlighted overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none overflow-auto whitespace-pre-wrap break-words"
          style={{
            padding: '4px 11px',
            fontSize: '14px',
            lineHeight: '1.5715',
            fontFamily: 'inherit',
            border: '1px solid transparent',
            color: 'transparent',
            zIndex: 1,
          }}
        >
          {renderHighlightedText()}
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="relative z-2 w-full px-3 py-1 border border-gray-300 rounded hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-y"
          style={{
            fontSize: '14px',
            lineHeight: '1.5715',
            background: 'transparent',
            caretColor: 'black',
          }}
        />
      </div>
      
      <div className="text-xs text-gray-500">
        💡 Placeholders like <span className="bg-blue-100 text-blue-700 px-1 rounded">{'{{1}}'}</span> will become input fields for users
      </div>
    </div>
  )
}
