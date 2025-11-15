import { Card, Button, Form, Input, Checkbox, Space, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { TextArea } = Input

interface MultipleChoiceQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form?: any
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export const MultipleChoiceQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: MultipleChoiceQuestionProps) => {
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
    <Card size="small" className="mb-2" bodyStyle={{ padding: '12px' }} title={<span className="text-sm">Question {questionIndex + 1}</span>} extra={
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label={<span className="text-xs">Question Text</span>}
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter question text' }]}
        style={{ marginBottom: '8px' }}
      >
        <TextArea rows={2} placeholder="Enter the question..." />
      </Form.Item>
      
      <Form.Item label={<span className="text-xs">Options</span>} style={{ marginBottom: '8px' }}>
        <Space direction="vertical" className="w-full">
          {Array.from({ length: optionCount }).map((_, index) => (
            <Space key={index} className="w-full">
              <Form.Item
                name={[...groupPath, 'questions', questionIndex, 'options', index]}
                rules={[{ required: true, message: `Option ${OPTION_LABELS[index]} is required` }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input 
                  placeholder={`${OPTION_LABELS[index]}:`} 
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
        message="Multiple Correct Answers"
        description="Select ALL correct answers for this question. Users will need to select all of them."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        className="mb-3"
      />

      <Form.Item
        label="Correct Answers (Select Multiple)"
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
      >
        <Checkbox.Group onChange={(values) => onAnswerChange?.(questionNumber, values)}>
          <Space direction="vertical">
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
