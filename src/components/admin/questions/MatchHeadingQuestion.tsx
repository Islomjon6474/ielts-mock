import { Card, Button, Form, Select } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { PassageRichTextEditor } from '../PassageRichTextEditor'
import { useEffect, useState } from 'react'

interface MatchHeadingQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form: any
}

export const MatchHeadingQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: MatchHeadingQuestionProps) => {
  const [headingOptions, setHeadingOptions] = useState<string[]>([])

  // Load heading options from group level
  useEffect(() => {  
    const groupOptions = form.getFieldValue([...groupPath, 'headingOptions']) || []
    setHeadingOptions(Array.isArray(groupOptions) ? groupOptions : [])
  }, [form, groupPath])

  // Watch for changes in group heading options
  useEffect(() => {
    const interval = setInterval(() => {
      const groupOptions = form.getFieldValue([...groupPath, 'headingOptions']) || []
      const newOptions = Array.isArray(groupOptions) ? groupOptions : []
      if (JSON.stringify(newOptions) !== JSON.stringify(headingOptions)) {
        setHeadingOptions(newOptions)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [form, groupPath, headingOptions])

  // Strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <Card 
      size="small" 
      className="mb-3" 
      title={`Question ${questionNumber}`} 
      extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
    >
      <Form.Item
        label="Correct Heading"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true, message: 'Please select correct heading' }]}
      >
        <Select
          placeholder="Select the correct heading"
          onChange={(value) => onAnswerChange?.(questionNumber, value)}
        >
          {headingOptions.map((opt, idx) => {
            const cleanText = stripHtml(opt)
            const displayText = cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText
            
            return (
              <Select.Option key={idx} value={opt}>
                Heading {idx + 1}: {displayText}
              </Select.Option>
            )
          })}
        </Select>
      </Form.Item>
    </Card>
  )
}
