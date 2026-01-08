import { Card, Form, Select, Alert } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { RichTextEditor } from '../RichTextEditor'
import { useEffect, useState } from 'react'

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
  const [extractedPlaceholders, setExtractedPlaceholders] = useState<number[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})

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

  // Extract placeholders from initial form data when component loads
  useEffect(() => {
    if (form) {
      const questionText = form.getFieldValue([...groupPath, 'questions', questionIndex, 'text'])
      if (questionText) {
        // Extract placeholders from HTML or plain text format
        // HTML format: <span data-number="37">...</span>
        // Plain text format: [37]
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

  // Handle placeholder extraction from the RichTextEditor component
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

  // Handle individual answer change
  const handleAnswerSelect = (placeholderNum: number, value: string) => {
    const updatedAnswers = { ...answers, [placeholderNum]: value }
    setAnswers(updatedAnswers)

    // Notify parent component about the answer change
    if (onAnswerChange) {
      onAnswerChange(placeholderNum, value)
    }
  }

  // Strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <Card
      size="small"
      className="mb-2"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">Question {questionIndex + 1}</span>
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
        message="Fill in the Blanks with Drag & Drop"
        description={
          <div className="text-xs">
            <p>• Use the toolbar to format text (bold, italic, lists, alignment)</p>
            <p>• Click "Insert Placeholder" button to add blank spaces for students to fill</p>
            <p>• Example: The young Mozart received [37] from his father and the symphony was not [38]</p>
            <p>• Each placeholder number will have its own answer dropdown below</p>
            <p>• Students will drag words (A, B, C...) into the blanks</p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        className="mb-2"
        showIcon
      />

      <Form.Item
        label="Passage Text with Blank Placeholders"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[
          { required: true, message: 'Please enter the passage text' },
          {
            validator: (_, value) => {
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
              <span className="text-green-600">✓ Found {extractedPlaceholders.length} placeholder(s) for question number(s):</span>
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
        <RichTextEditor
          placeholder="Enter passage text with placeholders..."
          questionNumber={questionNumber}
          onPlaceholdersChange={handlePlaceholdersChange}
        />
      </Form.Item>

      {/* Separate dropdown fields for each placeholder */}
      {extractedPlaceholders.length > 0 ? (
        <div className="space-y-3">
          <div className="font-medium text-sm">Correct Answers (Select letter + word for each blank)</div>
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
              rules={[{ required: true, message: `Please select answer for question ${placeholderNum}` }]}
            >
              <Select
                placeholder={`Select the correct answer for blank [${placeholderNum}]`}
                onChange={(value) => handleAnswerSelect(placeholderNum, value)}
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
          ))}
        </div>
      ) : (
        <Form.Item
          label="Correct Answer"
          name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
          rules={[{ required: true }]}
          extra="Add placeholders to the passage text above to create answer fields"
        >
          <Select placeholder="Select the correct answer" disabled>
            {options.map((opt, idx) => {
              const letter = getLetterLabel(idx)
              const cleanText = stripHtml(opt)
              return (
                <Select.Option key={idx} value={`${letter} ${cleanText}`}>
                  {letter} - {cleanText}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
      )}
    </Card>
  )
}
