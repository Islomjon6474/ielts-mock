import { Card, Button, Form, Select, Space, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined, ArrowDownOutlined, ArrowUpOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { PassageRichTextEditor } from '../PassageRichTextEditor'
import { useEffect, useState, useRef } from 'react'
import type { PassageRichTextEditorRef } from '../PassageRichTextEditor'

interface SentenceCompletionQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form: any
}

export const SentenceCompletionQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: SentenceCompletionQuestionProps) => {
  const [options, setOptions] = useState<string[]>([])
  const editorRef = useRef<PassageRichTextEditorRef>(null)

  // Load options from group level
  useEffect(() => {  
    const groupOptions = form.getFieldValue([...groupPath, 'options']) || []
    setOptions(Array.isArray(groupOptions) ? groupOptions : [])
  }, [form, groupPath])

  // Watch for changes in group options
  useEffect(() => {
    const interval = setInterval(() => {
      const groupOptions = form.getFieldValue([...groupPath, 'options']) || []
      const newOptions = Array.isArray(groupOptions) ? groupOptions : []
      if (JSON.stringify(newOptions) !== JSON.stringify(options)) {
        setOptions(newOptions)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [form, groupPath, options])

  const handleInsertPlaceholder = () => {
    const placeholder = `[${questionNumber}]`
    
    if (editorRef.current) {
      // Insert placeholder at cursor position
      editorRef.current.insertText(placeholder)
    }
  }

  const handleInsertArrow = (direction: 'down' | 'up' | 'left' | 'right') => {
    const arrows = {
      down: '↓',
      up: '↑',
      left: '←',
      right: '→'
    }
    
    if (editorRef.current) {
      // Insert arrow with some spacing for better visibility
      editorRef.current.insertText(` ${arrows[direction]} `)
    }
  }

  return (
    <Card size="small" className="mb-2" bodyStyle={{ padding: '12px' }} title={<span className="text-sm font-bold">Question {questionNumber}</span>} extra={
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="text-xs">Sentence with blank</span>
            <Space size="small">
              <Tooltip title="Insert down arrow">
                <Button 
                  size="small" 
                  icon={<ArrowDownOutlined />} 
                  onClick={() => handleInsertArrow('down')}
                  type="text"
                />
              </Tooltip>
              <Tooltip title="Insert up arrow">
                <Button 
                  size="small" 
                  icon={<ArrowUpOutlined />} 
                  onClick={() => handleInsertArrow('up')}
                  type="text"
                />
              </Tooltip>
              <Tooltip title="Insert left arrow">
                <Button 
                  size="small" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => handleInsertArrow('left')}
                  type="text"
                />
              </Tooltip>
              <Tooltip title="Insert right arrow">
                <Button 
                  size="small" 
                  icon={<ArrowRightOutlined />} 
                  onClick={() => handleInsertArrow('right')}
                  type="text"
                />
              </Tooltip>
              <Tooltip title="Insert question placeholder">
                <Button 
                  size="small" 
                  onClick={handleInsertPlaceholder}
                  type="text"
                >
                  [{questionNumber}]
                </Button>
              </Tooltip>
            </Space>
          </div>
        }
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter sentence' }]}
        style={{ marginBottom: '8px' }}
      >
        <PassageRichTextEditor
          ref={editorRef}
          placeholder={`e.g., Impression fossils are [${questionNumber}]`}
          minHeight="100px"
        />
      </Form.Item>
      
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true, message: 'Please select correct answer' }]}
      >
        <Select
          placeholder="Select the correct option"
          onChange={(value) => onAnswerChange?.(questionNumber, value)}
        >
          {options.map((opt, idx) => {
            // Strip HTML tags for display
            const stripHtml = (html: string) => {
              const tmp = document.createElement('DIV')
              tmp.innerHTML = html
              return tmp.textContent || tmp.innerText || ''
            }
            const cleanText = stripHtml(opt)
            const displayText = cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText
            
            return (
              <Select.Option key={idx} value={opt}>
                Option {idx + 1}: {displayText}
              </Select.Option>
            )
          })}
        </Select>
      </Form.Item>
    </Card>
  )
}
