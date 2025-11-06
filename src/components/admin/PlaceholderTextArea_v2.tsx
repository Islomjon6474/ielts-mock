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
 * ContentEditable-based textarea that supports inline placeholder markers {{1}}, {{2}}, etc.
 * - Uses contentEditable for native HTML rendering
 * - Auto-converts {{number}} to styled placeholders
 * - No overlay positioning issues
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
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const isProcessingRef = useRef(false)

  // Extract placeholders from text
  const extractPlaceholders = useCallback((text: string) => {
    const matches = text.match(/\[(\d+)\]/g) || []
    const numbers = matches.map(m => {
      const num = m.match(/\[(\d+)\]/)
      return num ? parseInt(num[1]) : 0
    }).filter(n => n > 0)
    return [...new Set(numbers)].sort((a, b) => a - b)
  }, [])

  // Convert plain text with [number] to HTML with styled spans
  const textToHtml = (text: string): string => {
    // Convert [number] to {{number}} for display
    let displayText = text.replace(/\[(\d+)\]/g, '{{$1}}')
    
    // Replace {{number}} with styled spans
    displayText = displayText.replace(
      /\{\{(\d+)\}\}/g,
      '<span class="placeholder-marker" contenteditable="false" data-number="$1">{{$1}}</span>'
    )
    
    // Convert newlines to <br> for contentEditable
    displayText = displayText.replace(/\n/g, '<br>')
    
    return displayText
  }

  // Convert HTML content back to plain text with [number]
  const htmlToText = (html: string): string => {
    // Create temp element to parse HTML
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    // Replace placeholder spans with [number]
    const placeholderSpans = temp.querySelectorAll('.placeholder-marker')
    placeholderSpans.forEach(span => {
      const number = span.getAttribute('data-number')
      const textNode = document.createTextNode(`[${number}]`)
      span.parentNode?.replaceChild(textNode, span)
    })
    
    // Get text content and normalize
    let text = temp.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/&nbsp;/g, ' ')
    
    return text
  }

  // Auto-convert {{number}} patterns to styled spans
  const autoConvertPlaceholders = () => {
    if (!editorRef.current || isProcessingRef.current) return false
    
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return false
    
    // Save cursor position
    const range = selection.getRangeAt(0)
    const cursorNode = range.startContainer
    const cursorOffset = range.startOffset
    
    // Check if current HTML has plain text {{number}} patterns
    const html = editorRef.current.innerHTML
    const hasPlainPlaceholders = /(?<!data-number=")\{\{(\d+)\}\}(?![^<]*<\/span>)/g.test(html)
    
    if (!hasPlainPlaceholders) return false
    
    isProcessingRef.current = true
    
    // Replace plain {{number}} with styled spans
    const newHtml = html.replace(
      /(?<!data-number=")\{\{(\d+)\}\}(?![^<]*<\/span>)/g,
      '<span class="placeholder-marker" contenteditable="false" data-number="$1">{{$1}}</span>'
    )
    
    editorRef.current.innerHTML = newHtml
    
    // Try to restore cursor position
    try {
      if (cursorNode && cursorNode.parentNode) {
        const newRange = document.createRange()
        newRange.setStart(cursorNode, Math.min(cursorOffset, cursorNode.textContent?.length || 0))
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    } catch (e) {
      // Cursor restoration failed, place at end
      const newRange = document.createRange()
      newRange.selectNodeContents(editorRef.current)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    
    isProcessingRef.current = false
    return true
  }

  // Update editor content when value changes
  useEffect(() => {
    if (!editorRef.current || isProcessingRef.current) return
    
    const html = textToHtml(value)
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html
    }
  }, [value])

  // Handle content changes
  const handleInput = () => {
    if (!editorRef.current || isProcessingRef.current) return
    
    // Auto-convert any {{number}} patterns to styled spans
    const wasConverted = autoConvertPlaceholders()
    
    if (wasConverted) {
      // If we converted something, trigger another input event
      setTimeout(() => handleInput(), 0)
      return
    }
    
    const html = editorRef.current.innerHTML
    const text = htmlToText(html)
    
    // Extract and notify placeholders
    const placeholders = extractPlaceholders(text)
    onPlaceholdersChange?.(placeholders)
    
    // Notify parent of change
    onChange?.(text)
  }

  // Insert placeholder at cursor
  const insertPlaceholder = (questionNum: number) => {
    if (!editorRef.current) return
    
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) {
      // No selection, append to end
      const placeholder = `<span class="placeholder-marker" contenteditable="false" data-number="${questionNum}">{{${questionNum}}}</span>&nbsp;`
      editorRef.current.innerHTML += placeholder
      handleInput()
      return
    }
    
    // Insert at cursor position
    const range = selection.getRangeAt(0)
    range.deleteContents()
    
    // Create placeholder element
    const span = document.createElement('span')
    span.className = 'placeholder-marker'
    span.setAttribute('contenteditable', 'false')
    span.setAttribute('data-number', questionNum.toString())
    span.textContent = `{{${questionNum}}}`
    
    // Insert space after placeholder
    const space = document.createTextNode('\u00A0')
    
    range.insertNode(space)
    range.insertNode(span)
    
    // Move cursor after placeholder
    range.setStartAfter(space)
    range.setEndAfter(space)
    selection.removeAllRanges()
    selection.addRange(range)
    
    handleInput()
  }

  // Get next placeholder number
  const getNextPlaceholderNumber = (): number => {
    if (!editorRef.current) return questionNumber
    
    const text = htmlToText(editorRef.current.innerHTML)
    const placeholders = extractPlaceholders(text)
    
    if (placeholders.length === 0) return questionNumber
    return Math.max(...placeholders, questionNumber - 1) + 1
  }

  // Calculate height based on rows
  const minHeight = `${rows * 1.5715 * 14 + 8}px` // lineHeight * fontSize * rows + padding

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Tooltip title="Insert placeholder at cursor position">
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
          Click button or type manually using {`{{number}}`} syntax
        </span>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-3 py-2 border rounded
          transition-colors resize-y overflow-auto
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          ${isFocused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'}
        `}
        style={{
          minHeight,
          fontSize: '14px',
          lineHeight: '1.5715',
          outline: 'none',
        }}
        data-placeholder={placeholder}
      />

      <div className="text-xs text-gray-500">
        ?? Placeholders like <span className="placeholder-marker inline-block">{'{{1}}'}</span> will become input fields for users
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #bfbfbf;
          pointer-events: none;
        }
        
        .placeholder-marker {
          display: inline-block;
          background-color: #e6f7ff;
          color: #1890ff;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #91d5ff;
          margin: 0 2px;
          cursor: default;
          user-select: none;
        }
        
        [contenteditable] {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  )
}
