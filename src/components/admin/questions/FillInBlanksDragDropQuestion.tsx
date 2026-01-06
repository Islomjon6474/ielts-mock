import { Card, Button, Form, Select, Space, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { PassageRichTextEditor } from '../PassageRichTextEditor'
import { useEffect, useState, useRef } from 'react'
import type { PassageRichTextEditorRef } from '../PassageRichTextEditor'

interface FillInBlanksDragDropQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form: any
}

// Generate letter labels (A, B, C, ...)
const getLetterLabel = (index: number) => String.fromCharCode(65 + index)

export const FillInBlanksDragDropQuestion = ({
  groupPath,
  questionIndex,
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: FillInBlanksDragDropQuestionProps) => {
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
      editorRef.current.insertText(placeholder)
    }
  }

  // Strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <Card size="small" className="mb-2" bodyStyle={{ padding: '12px' }} title={<span className="text-sm font-bold">Question {questionNumber}</span>} extra={
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="text-xs">Passage text with blank placeholder</span>
            <Tooltip title="Insert question placeholder">
              <Button
                size="small"
                onClick={handleInsertPlaceholder}
                type="text"
              >
                [{questionNumber}]
              </Button>
            </Tooltip>
          </div>
        }
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter passage text with placeholder' }]}
        style={{ marginBottom: '8px' }}
      >
        <PassageRichTextEditor
          ref={editorRef}
          placeholder={`e.g., The case of Mozart could be quoted as evidence against the 10,000-hour-practice theory. However, the writer points out that the young Mozart received a lot of [${questionNumber}] from his father...`}
          minHeight="150px"
        />
      </Form.Item>

      <Form.Item
        label="Correct Answer (Letter + Word)"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true, message: 'Please select correct answer' }]}
      >
        <Select
          placeholder="Select the correct answer"
          onChange={(value) => onAnswerChange?.(questionNumber, value)}
        >
          {options.map((opt, idx) => {
            const letter = getLetterLabel(idx)
            const cleanText = stripHtml(opt)
            const displayText = cleanText.length > 40 ? cleanText.substring(0, 40) + '...' : cleanText
            // Store full value: "A encouragement"
            const fullValue = `${letter} ${cleanText}`

            return (
              <Select.Option key={idx} value={fullValue}>
                {letter} - {displayText}
              </Select.Option>
            )
          })}
        </Select>
      </Form.Item>
    </Card>
  )
}
