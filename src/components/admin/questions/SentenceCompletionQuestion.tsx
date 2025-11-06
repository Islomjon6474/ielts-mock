import { Card, Button, Form, Input, Select } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface SentenceCompletionQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
}

export const SentenceCompletionQuestion = ({ 
  groupPath, 
  questionIndex, 
  questionNumber,
  onRemove,
  onAnswerChange 
}: SentenceCompletionQuestionProps) => {
  return (
    <Card size="small" className="mb-3" title={`Question ${questionIndex + 1}`} extra={
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label="Sentence (use ___ for blank)"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter sentence' }]}
      >
        <TextArea rows={2} placeholder="e.g., The building was constructed in ___" />
      </Form.Item>
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Input 
          placeholder="Enter the correct word(s)" 
          onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label="Word Limit"
        name={[...groupPath, 'questions', questionIndex, 'wordLimit']}
        initialValue="THREE"
      >
        <Select>
          <Select.Option value="ONE">ONE WORD ONLY</Select.Option>
          <Select.Option value="TWO">NO MORE THAN TWO WORDS</Select.Option>
          <Select.Option value="THREE">NO MORE THAN THREE WORDS</Select.Option>
        </Select>
      </Form.Item>
    </Card>
  )
}
