import { Card, Button, Form, Input, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { RichTextEditor } from '../RichTextEditor'

interface MultipleCorrectAnswersQuestionProps {
  groupPath: (string | number)[]
  questionIndex: number
  questionNumber: number
  onRemove: () => void
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
  form?: any
}

export const MultipleCorrectAnswersQuestion = ({
  groupPath,
  questionIndex,
  questionNumber,
  onRemove,
  onAnswerChange,
  form
}: MultipleCorrectAnswersQuestionProps) => {

  return (
    <Card
      size="small"
      className="mb-2"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <span className="font-bold">Question {questionNumber}</span>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      }
    >
      <Alert
        message="Multiple Correct Answers"
        description={
          <div className="text-xs">
            <p>• Students will see a text input field</p>
            <p>• You can add multiple acceptable answer versions</p>
            <p>• If the student enters ANY of the correct answers, it will be marked as correct</p>
            <p>• Use this for questions where spelling variations or synonyms are acceptable</p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        className="mb-3"
        showIcon
      />

      <Form.Item
        label="Question Text"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter the question text' }]}
      >
        <RichTextEditor
          placeholder="Enter your question text here..."
          questionNumber={questionNumber}
        />
      </Form.Item>

      {/* Dynamic list of correct answers */}
      <Form.List name={[...groupPath, 'questions', questionIndex, 'correctAnswers']}>
        {(fields, { add, remove }) => (
          <>
            <div className="mb-2 font-medium text-sm">Correct Answers</div>
            <div className="text-xs text-gray-500 mb-3">
              Add all acceptable answer variations. Students only need to match one of these.
            </div>

            {fields.length === 0 && (
              <Alert
                message="No correct answers added yet"
                description="Click 'Add Answer Option' to add acceptable answers"
                type="warning"
                showIcon
                className="mb-3"
              />
            )}

            {fields.map((field, index) => (
              <div key={field.key} className="mb-3 flex gap-2 items-start">
                <div className="flex-1">
                  <Form.Item
                    {...field}
                    rules={[
                      { required: true, message: 'Please enter an answer' },
                      { whitespace: true, message: 'Answer cannot be empty' }
                    ]}
                    className="mb-0"
                  >
                    <Input
                      placeholder={`Correct answer option ${index + 1}`}
                      onChange={(e) => {
                        // Collect all answers and notify parent
                        if (onAnswerChange && form) {
                          const allAnswers = form.getFieldValue([...groupPath, 'questions', questionIndex, 'correctAnswers']) || []
                          onAnswerChange(questionNumber, allAnswers)
                        }
                      }}
                    />
                  </Form.Item>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    remove(field.name)
                    // Update parent with new answers list
                    if (onAnswerChange && form) {
                      setTimeout(() => {
                        const allAnswers = form.getFieldValue([...groupPath, 'questions', questionIndex, 'correctAnswers']) || []
                        onAnswerChange(questionNumber, allAnswers)
                      }, 100)
                    }
                  }}
                  title="Remove this answer option"
                />
              </div>
            ))}

            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
              className="mt-2"
            >
              Add Answer Option
            </Button>

            {fields.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Total acceptable answers: <span className="font-semibold text-blue-600">{fields.length}</span>
              </div>
            )}
          </>
        )}
      </Form.List>
    </Card>
  )
}
