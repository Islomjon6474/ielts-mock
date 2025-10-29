import { Card, Button, Form, Input } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface ShortAnswerQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string) => void
}

export const ShortAnswerQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange 
}: ShortAnswerQuestionProps) => {
  return (
    <Card size="small" className="mb-3" title={`Question ${questionIndex + 1}`} extra={
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label="Question"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true }]}
      >
        <TextArea rows={2} placeholder="Enter the question..." />
      </Form.Item>
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Input 
          placeholder="Enter the correct answer" 
          onBlur={(e) => onAnswerChange?.(questionNumber, e.target.value)}
        />
      </Form.Item>
    </Card>
  )
}
