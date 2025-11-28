import { Form, Input, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

interface Props {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
}

export const ImageInputsQuestion = ({ groupPath, questionIndex, questionNumber, onRemove, onAnswerChange }: Props) => {
  const base = [...groupPath, 'questions', questionIndex]
  
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAnswerChange) {
      onAnswerChange(questionNumber, e.target.value)
    }
  }
  
  return (
    <div className="rounded border p-2 mb-1">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-sm">Question {questionNumber}</div>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
          Remove
        </Button>
      </div>
      {/* Persist questionNumber to ensure stable numbering in saved content */}
      <Form.Item name={[...base, 'questionNumber']} initialValue={questionNumber} hidden>
        <Input />
      </Form.Item>
      
      <Form.Item 
        label="Correct Answer" 
        name={[...base, 'answer']} 
        rules={[{ required: true, message: 'Enter correct answer' }]}
        style={{ marginBottom: 0 }}
      >
        <Input 
          placeholder="Enter the correct answer" 
          onChange={handleAnswerChange}
        />
      </Form.Item>
      {/* imageUrl will be injected from group.imageId by the parent editor */}
    </div>
  )
}
