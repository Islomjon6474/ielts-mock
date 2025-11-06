import { Card, Button, Form, Input, Radio, Space } from 'antd'
import { DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
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
    <Card size="small" className="mb-3" title={`Question ${questionIndex + 1}`} extra={
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label="Question Text"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter question text' }]}
      >
        <TextArea rows={2} placeholder="Enter the question..." />
      </Form.Item>
      
      <Form.Item label="Options">
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

      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Radio.Group onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}>
          {Array.from({ length: optionCount }).map((_, index) => (
            <Radio key={index} value={OPTION_LABELS[index]}>{OPTION_LABELS[index]}</Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}
