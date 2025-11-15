import { Card, Button, Form, Input, Radio, Space, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { TextArea } = Input

interface MultipleChoiceSingleQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form?: any
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export const MultipleChoiceSingleQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: MultipleChoiceSingleQuestionProps) => {
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
        message="Single Correct Answer"
        description="Select ONE correct answer for this question. Users will select only one option."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        className="mb-3"
      />

      <Form.Item
        label="Correct Answer (Select One)"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true, message: 'Please select the correct answer' }]}
      >
        <Radio.Group onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}>
          <Space direction="vertical">
            {Array.from({ length: optionCount }).map((_, index) => (
              <Radio key={index} value={OPTION_LABELS[index]}>
                {OPTION_LABELS[index]}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}
