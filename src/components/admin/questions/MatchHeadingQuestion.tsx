import { Card, Button, Form, Input, Space, Divider } from 'antd'
import { DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface MatchHeadingQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string) => void
}

export const MatchHeadingQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange 
}: MatchHeadingQuestionProps) => {
  return (
    <Card 
      size="small" 
      className="mb-3" 
      title={`Question ${questionIndex + 1} - Match Section to Heading`} 
      extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
    >
      <Form.Item
        label="Section/Paragraph Identifier"
        name={[...groupPath, 'questions', questionIndex, 'sectionId']}
        rules={[{ required: true, message: 'Enter section ID (e.g., A, B, C)' }]}
        tooltip="The paragraph or section label in the passage"
      >
        <Input placeholder="e.g., A, B, C, D" style={{ width: 100 }} />
      </Form.Item>
      
      <Form.Item
        label="Correct Heading"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true, message: 'Enter correct heading (e.g., i, ii, iii)' }]}
        tooltip="The Roman numeral of the correct heading"
      >
        <Input 
          placeholder="e.g., i, ii, iii, iv" 
          style={{ width: 100 }} 
          onBlur={(e) => onAnswerChange?.(questionNumber, e.target.value)}
        />
      </Form.Item>
    </Card>
  )
}
