import { Card, Button, Form, Select } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { PassageRichTextEditor } from '../PassageRichTextEditor'
import { useEffect, useState } from 'react'

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
    const currentText = form.getFieldValue([...groupPath, 'questions', questionIndex, 'text']) || ''
    const placeholder = `[${questionNumber}]`
    const newText = currentText + placeholder
    form.setFieldValue([...groupPath, 'questions', questionIndex, 'text'], newText)
  }

  return (
    <Card size="small" className="mb-2" bodyStyle={{ padding: '12px' }} title={<span className="text-sm">Question {questionNumber}</span>} extra={
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label={<span className="text-xs">Sentence with blank</span>}
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter sentence' }]}
        style={{ marginBottom: '8px' }}
      >
        <PassageRichTextEditor
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
