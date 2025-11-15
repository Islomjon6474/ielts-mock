import { Card, Button, Form, Input, Radio } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface TrueFalseQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  type: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
}

export const TrueFalseQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove, 
  type,
  onAnswerChange 
}: TrueFalseQuestionProps) => {
  const options = type === 'YES_NO_NOT_GIVEN' 
    ? [{ value: 'YES', label: 'YES' }, { value: 'NO', label: 'NO' }, { value: 'NOT_GIVEN', label: 'NOT GIVEN' }]
    : [{ value: 'TRUE', label: 'TRUE' }, { value: 'FALSE', label: 'FALSE' }, { value: 'NOT_GIVEN', label: 'NOT GIVEN' }]

  return (
    <Card size="small" className="mb-2" bodyStyle={{ padding: '12px' }} title={<span className="text-sm">Statement {questionIndex + 1}</span>} extra={
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label={<span className="text-xs">Statement</span>}
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter statement' }]}
        style={{ marginBottom: '8px' }}
      >
        <TextArea rows={2} placeholder="Enter the statement..." />
      </Form.Item>
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Radio.Group onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}>
          {options.map(opt => (
            <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}
