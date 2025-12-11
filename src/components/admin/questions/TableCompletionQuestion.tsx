import { Card, Form, Input, Alert } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { TableRichTextEditor } from '../TableRichTextEditor'
import { useState, useEffect } from 'react'

interface TableCompletionQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form?: any
}

export const TableCompletionQuestion = ({
  groupPath,
  questionIndex,
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: TableCompletionQuestionProps) => {
  const [extractedPlaceholders, setExtractedPlaceholders] = useState<number[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})

  // Extract placeholders from initial form data when component loads
  useEffect(() => {
    if (form) {
      const questionText = form.getFieldValue([...groupPath, 'questions', questionIndex, 'text'])
      if (questionText) {
        // Extract placeholders from HTML or plain text format
        // HTML format: <span data-number="1">...</span>
        // Plain text format: [1]
        const htmlMatches = questionText.match(/data-number="(\d+)"/g) || []
        const plainMatches = questionText.match(/\[(\d+)\]/g) || []

        const numbers: number[] = []

        // Extract from HTML
        htmlMatches.forEach((m: string) => {
          const num = m.match(/data-number="(\d+)"/)
          if (num) numbers.push(parseInt(num[1]))
        })

        // Extract from plain text
        plainMatches.forEach((m: string) => {
          const num = m.match(/\[(\d+)\]/)
          if (num) numbers.push(parseInt(num[1]))
        })

        const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b)

        if (uniqueNumbers.length > 0) {
          setExtractedPlaceholders(uniqueNumbers)
        }
      }
    }
  }, [form, groupPath, questionIndex])

  // Handle placeholder extraction from the TableRichTextEditor component
  const handlePlaceholdersChange = (placeholders: number[]) => {
    setExtractedPlaceholders(placeholders)

    // Auto-update the range field based on placeholder numbers
    if (placeholders.length > 0 && form) {
      const minNum = Math.min(...placeholders)
      const maxNum = Math.max(...placeholders)
      const newRange = `${minNum}-${maxNum}`
      form.setFieldValue([...groupPath, 'range'], newRange)
    }
  }

  // Handle individual answer change and collect all answers
  const handleAnswerInput = (placeholderNum: number, value: string) => {
    const updatedAnswers = { ...answers, [placeholderNum]: value }
    setAnswers(updatedAnswers)

    // Notify parent component about the answer change for this specific placeholder
    if (onAnswerChange) {
      onAnswerChange(placeholderNum, value)
    }
  }

  return (
    <Card
      size="small"
      className="mb-2"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">Table Question {questionIndex + 1}</span>
          {extractedPlaceholders.length > 0 && (
            <span className="text-xs font-normal flex items-center gap-1 flex-wrap">
              <span className="text-gray-500">(Contains placeholders for</span>
              {extractedPlaceholders.map((num, idx) => (
                <span key={num} className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-300 text-xs">
                    Q{num}
                  </span>
                  {idx < extractedPlaceholders.length - 1 && <span className="text-gray-400 mx-0.5">,</span>}
                </span>
              ))}
              <span className="text-gray-500">)</span>
            </span>
          )}
        </div>
      }
      extra={null}
    >
      <Alert
        message="Table Completion Question"
        description={
          <div className="text-xs">
            <p><strong>How to create a table with placeholders:</strong></p>
            <ol className="list-decimal ml-4 mt-1">
              <li>Click "Insert Table" and choose a size (e.g., 4x2)</li>
              <li>Fill in the table cells with your content</li>
              <li>Place cursor where you want a blank, then click "Insert Placeholder [n]"</li>
              <li>Use row/column buttons to add or remove rows/columns</li>
              <li>Use Merge/Split buttons to combine or split cells</li>
            </ol>
            <p className="mt-2"><strong>Example:</strong> Early May | Introductory <span className="bg-blue-100 text-blue-700 px-1 rounded">[37]</span>......about the project</p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        className="mb-3"
        showIcon
      />

      <Form.Item
        label="Table Content with Placeholders"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[
          { required: true, message: 'Please create a table with content' },
          {
            validator: (_, value) => {
              // Check if there's a table
              if (!value || !value.includes('<table')) {
                return Promise.reject('Please insert a table using the "Insert Table" button')
              }
              // Check for HTML placeholder format or plain text format
              const htmlPlaceholders = (value || '').match(/data-number="\d+"/g)
              const plainPlaceholders = (value || '').match(/\[(\d+)\]/g)
              if ((!htmlPlaceholders || htmlPlaceholders.length === 0) && (!plainPlaceholders || plainPlaceholders.length === 0)) {
                return Promise.reject('Please insert at least one placeholder using the "Insert Placeholder" button')
              }
              return Promise.resolve()
            }
          }
        ]}
        extra={
          extractedPlaceholders.length > 0 && (
            <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-green-600">Found {extractedPlaceholders.length} placeholder(s) for question number(s):</span>
              <div className="flex items-center gap-1 flex-wrap">
                {extractedPlaceholders.map((num) => (
                  <span
                    key={num}
                    className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-300"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )
        }
      >
        <TableRichTextEditor
          placeholder="Create a table and add placeholders..."
          questionNumber={questionNumber}
          onPlaceholdersChange={handlePlaceholdersChange}
        />
      </Form.Item>

      {/* Separate input fields for each placeholder */}
      {extractedPlaceholders.length > 0 ? (
        <div className="space-y-3">
          <div className="font-medium text-sm">Correct Answers</div>
          {extractedPlaceholders.map((placeholderNum) => (
            <Form.Item
              key={placeholderNum}
              label={
                <span className="flex items-center gap-2">
                  <span>Answer for Question</span>
                  <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-300 text-xs">
                    {placeholderNum}
                  </span>
                </span>
              }
              name={[...groupPath, 'questions', questionIndex, 'answers', placeholderNum]}
              rules={[{ required: true, message: `Please enter answer for question ${placeholderNum}` }]}
            >
              <Input
                placeholder={`Enter correct answer for question ${placeholderNum}`}
                onChange={(e) => handleAnswerInput(placeholderNum, e.target.value)}
              />
            </Form.Item>
          ))}
        </div>
      ) : (
        <Form.Item
          label="Correct Answer"
          name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
          rules={[{ required: true }]}
          extra="Create a table and add placeholders to enable answer fields"
        >
          <Input
            placeholder="Enter the correct answer"
            disabled
          />
        </Form.Item>
      )}
    </Card>
  )
}
