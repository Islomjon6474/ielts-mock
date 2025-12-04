import { Card, Button, Form, Input, Checkbox } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { PassageRichTextEditor } from '../PassageRichTextEditor'
import { useEffect, useState } from 'react'

const { TextArea } = Input

interface MatrixTableQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form: any
}

export const MatrixTableQuestion = ({
  groupPath,
  questionIndex,
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: MatrixTableQuestionProps) => {
  const [matrixOptions, setMatrixOptions] = useState<string[]>([])

  // Load matrix options from group level
  useEffect(() => {
    const groupOptions = form.getFieldValue([...groupPath, 'matrixOptions']) || []
    setMatrixOptions(Array.isArray(groupOptions) ? groupOptions : [])
  }, [form, groupPath])

  // Watch for changes in group matrix options
  useEffect(() => {
    const interval = setInterval(() => {
      const groupOptions = form.getFieldValue([...groupPath, 'matrixOptions']) || []
      const newOptions = Array.isArray(groupOptions) ? groupOptions : []
      if (JSON.stringify(newOptions) !== JSON.stringify(matrixOptions)) {
        setMatrixOptions(newOptions)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [form, groupPath, matrixOptions])

  // Strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Handle checkbox change
  const handleOptionChange = (checkedValues: any[]) => {
    form.setFieldValue([...groupPath, 'questions', questionIndex, 'correctAnswers'], checkedValues)
    if (onAnswerChange) {
      onAnswerChange(questionNumber, checkedValues)
    }
  }

  return (
    <Card
      size="small"
      className="mb-2"
      bodyStyle={{ padding: '12px' }}
      title={<span className="text-sm font-bold">Question {questionNumber}</span>}
      extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />}
    >
      <div className="space-y-3">
        {/* Question Text (Rich Text Editor) */}
        <Form.Item
          label="Question Text"
          name={[...groupPath, 'questions', questionIndex, 'text']}
          rules={[{ required: true, message: 'Please enter question text' }]}
        >
          <PassageRichTextEditor
            value={form.getFieldValue([...groupPath, 'questions', questionIndex, 'text']) || ''}
            onChange={(value) => {
              form.setFieldValue([...groupPath, 'questions', questionIndex, 'text'], value)
            }}
            placeholder="Enter question text..."
          />
        </Form.Item>

        {/* Correct Answers - Multiple Selection */}
        <Form.Item
          label="Correct Options (Select multiple)"
          name={[...groupPath, 'questions', questionIndex, 'correctAnswers']}
          rules={[{ required: true, message: 'Please select at least one correct option' }]}
        >
          <Checkbox.Group
            style={{ width: '100%' }}
            onChange={handleOptionChange}
          >
            <div className="space-y-2">
              {matrixOptions.length > 0 ? (
                matrixOptions.map((opt, idx) => {
                  const cleanText = stripHtml(opt)
                  const displayText = cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText

                  return (
                    <div key={idx} className="flex items-center">
                      <Checkbox value={opt} className="w-full">
                        <span className="font-medium">Option {idx + 1}:</span> {displayText}
                      </Checkbox>
                    </div>
                  )
                })
              ) : (
                <div className="text-gray-500 text-sm italic">
                  No options defined. Please add options in the Matrix Options section below.
                </div>
              )}
            </div>
          </Checkbox.Group>
        </Form.Item>
      </div>
    </Card>
  )
}
