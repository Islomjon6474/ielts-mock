import { Card, Button, Form, Input, Checkbox, Space, Alert } from 'antd'
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { TextArea } = Input

interface MultipleQuestionsMultipleChoiceQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form?: any
  questionRange?: string // e.g., "14-20"
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export const MultipleQuestionsMultipleChoiceQuestion = ({
  groupPath,
  questionIndex,
  questionNumber,
  onRemove,
  onAnswerChange,
  form,
  questionRange
}: MultipleQuestionsMultipleChoiceQuestionProps) => {
  const [optionCount, setOptionCount] = useState(3)

  // Initialize with existing options or default to 3
  useEffect(() => {
    if (form) {
      const question = form.getFieldValue([...groupPath, 'questions', questionIndex])
      if (question && question.options) {
        setOptionCount(question.options.length)
      }
    }
  }, [form, groupPath, questionIndex])

  const addOption = () => {
    if (optionCount < OPTION_LABELS.length) {
      setOptionCount(optionCount + 1)
    }
  }

  const removeOption = (indexToRemove: number) => {
    if (optionCount > 2) {
      const question = form.getFieldValue([...groupPath, 'questions', questionIndex])
      const currentOptions = question?.options || []
      const newOptions = currentOptions.filter((_: any, idx: number) => idx !== indexToRemove)
      form.setFieldValue([...groupPath, 'questions', questionIndex, 'options'], newOptions)
      setOptionCount(optionCount - 1)
    }
  }

  return (
    <Card
      size="small"
      className="mb-2"
      bodyStyle={{ padding: '12px' }}
    >
      <Alert
        message="Multiple Questions with Shared Answer"
        description={`This question group covers questions ${questionRange || 'N/A'}. All questions will have the SAME correct answer. Define options below, then select the correct answers that apply to ALL questions in the range.`}
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        className="mb-3"
      />

      <Form.Item
        label={<span className="text-xs">Question Text / Instruction (optional)</span>}
        name={[...groupPath, 'questions', questionIndex, 'text']}
        style={{ marginBottom: '8px' }}
      >
        <TextArea rows={2} placeholder="Enter instruction or question text that applies to all questions in this range..." />
      </Form.Item>

      <Form.Item label={<span className="text-xs">Shared Options (for all questions in range)</span>} style={{ marginBottom: '8px' }}>
        <Space direction="vertical" className="w-full">
          {Array.from({ length: optionCount }).map((_, index) => (
            <Space key={index} className="w-full">
              <Form.Item
                name={[...groupPath, 'questions', questionIndex, 'options', index]}
                rules={[{ required: true, message: `Option ${OPTION_LABELS[index]} is required` }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder={`${OPTION_LABELS[index]}: Enter option text`}
                  addonBefore={OPTION_LABELS[index]}
                />
              </Form.Item>
              {optionCount > 2 && (
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeOption(index)}
                />
              )}
            </Space>
          ))}
          {optionCount < OPTION_LABELS.length && (
            <Button
              type="dashed"
              onClick={addOption}
              block
              icon={<PlusOutlined />}
            >
              Add Option
            </Button>
          )}
        </Space>
      </Form.Item>

      <Alert
        message="Shared Correct Answer"
        description="Select the correct answers below. These same answers will apply to ALL questions in the range."
        type="warning"
        showIcon
        className="mb-3"
      />

      <Form.Item
        label={<span className="text-xs font-semibold">Correct Answers (applies to ALL questions {questionRange})</span>}
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[
          { required: true, message: 'Please select at least one correct answer' },
          {
            validator: (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject('Please select at least one correct answer')
              }
              return Promise.resolve()
            }
          }
        ]}
        style={{ marginBottom: 0 }}
      >
        <Checkbox.Group onChange={(values) => onAnswerChange?.(questionNumber, values)}>
          <Space>
            {Array.from({ length: optionCount }).map((_, index) => (
              <Checkbox key={index} value={OPTION_LABELS[index]}>
                {OPTION_LABELS[index]}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Form.Item>
    </Card>
  )
}
