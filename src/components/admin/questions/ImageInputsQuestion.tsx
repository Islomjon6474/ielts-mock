import { Form, Input, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

interface Props {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
}

export const ImageInputsQuestion = ({ groupPath, questionIndex, questionNumber, onRemove }: Props) => {
  const base = [...groupPath, 'questions', questionIndex]
  return (
    <div className="rounded border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Question {questionNumber}</div>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
          Remove
        </Button>
      </div>
      {/* Persist questionNumber to ensure stable numbering in saved content */}
      <Form.Item name={[...base, 'questionNumber']} initialValue={questionNumber} hidden>
        <Input />
      </Form.Item>

      <Form.Item label="Prompt" name={[...base, 'text']} rules={[{ required: true, message: 'Enter question text' }]}>
        <Input placeholder="Enter label text for this input (e.g., Label A)" />
      </Form.Item>
      {/* No coordinates; imageUrl will be injected from group.imageId by the parent editor */}
    </div>
  )
}
