import { Card, Button, Form, Input, Radio, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface MultipleChoiceQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string) => void
}

export const MultipleChoiceQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange 
}: MultipleChoiceQuestionProps) => {
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
        <Form.Item
          name={[...groupPath, 'questions', questionIndex, 'optionA']}
          rules={[{ required: true }]}
        >
          <Input placeholder="A:" addonBefore="A" />
        </Form.Item>
        <Form.Item
          name={[...groupPath, 'questions', questionIndex, 'optionB']}
          rules={[{ required: true }]}
        >
          <Input placeholder="B:" addonBefore="B" />
        </Form.Item>
        <Form.Item
          name={[...groupPath, 'questions', questionIndex, 'optionC']}
          rules={[{ required: true }]}
        >
          <Input placeholder="C:" addonBefore="C" />
        </Form.Item>
        <Form.Item
          name={[...groupPath, 'questions', questionIndex, 'optionD']}
          rules={[{ required: true }]}
        >
          <Input placeholder="D:" addonBefore="D" />
        </Form.Item>
      </Form.Item>
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Radio.Group onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}>
          <Radio value="A">A</Radio>
          <Radio value="B">B</Radio>
          <Radio value="C">C</Radio>
          <Radio value="D">D</Radio>
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}
