import { useEffect, useState } from 'react'
import { Card, Button, Select, Form, Input, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion'
import { TrueFalseQuestion } from './TrueFalseQuestion'
import { SentenceCompletionQuestion } from './SentenceCompletionQuestion'
import { MatchHeadingQuestion } from './MatchHeadingQuestion'
import { ShortAnswerQuestion } from './ShortAnswerQuestion'
import { questionTypes } from './index'
import { ImageInputsQuestion } from './ImageInputsQuestion'
import { ImageUpload } from '../ImageUpload'

const { TextArea } = Input

interface QuestionGroupEditorProps {
  groupPath: (string | number)[]
  groupLabel: string
  form: any
  defaultQuestionRange?: string
  showImageUpload?: boolean
  onAnswerChange?: (questionNumber: number, answer: string | string[]) => void
}

export const QuestionGroupEditor = ({ 
  groupPath, 
  groupLabel, 
  form,
  defaultQuestionRange,
  showImageUpload = false,
  onAnswerChange
}: QuestionGroupEditorProps) => {
  const [questionCount, setQuestionCount] = useState(0)
  const [selectedType, setSelectedType] = useState<string>('')
  const [questionRange, setQuestionRange] = useState(defaultQuestionRange || '')

  // Sync local UI state from form values when data is programmatically loaded
  useEffect(() => {
    const type = form.getFieldValue([...groupPath, 'type'])
    const range = form.getFieldValue([...groupPath, 'range'])
    const questions = form.getFieldValue([...groupPath, 'questions']) || []

    if (type && type !== selectedType) {
      setSelectedType(type)
    }
    
    // For SHORT_ANSWER, always ensure there's 1 question
    if (type === 'SHORT_ANSWER' && questions.length === 0) {
      form.setFieldValue([...groupPath, 'questions'], [{ text: '' }])
      setQuestionCount(1)
    } else if (range && range !== questionRange) {
      setQuestionRange(range)
    }
    
    if (Array.isArray(questions) && questions.length !== questionCount) {
      setQuestionCount(questions.length)
    }
    // We deliberately include selectedType/questionRange/questionCount to avoid stale UI
  }, [form, groupPath, selectedType, questionRange, questionCount])

  // Update imageUrl for IMAGE_INPUTS questions when imageId changes
  useEffect(() => {
    if (selectedType === 'IMAGE_INPUTS') {
      const imageId = form.getFieldValue([...groupPath, 'imageId'])
      const qs = form.getFieldValue([...groupPath, 'questions']) || []
      
      if (imageId && Array.isArray(qs) && qs.length > 0) {
        const needsUpdate = qs.some((q: any) => q.imageUrl !== `/api/file/download/${imageId}`)
        
        if (needsUpdate) {
          const withUrls = qs.map((q: any) => ({ ...q, imageUrl: `/api/file/download/${imageId}` }))
          form.setFieldValue([...groupPath, 'questions'], withUrls)
        }
      }
    }
  }, [form, groupPath, selectedType])

  const addQuestion = () => {
    const path = [...groupPath, 'questions']
    const currentQuestions = form.getFieldValue(path) || []
    
    // Create a new question object based on type
    let newQuestion: any = {}
    
    switch (selectedType) {
      case 'MULTIPLE_CHOICE':
        newQuestion = { text: '', options: ['', '', ''], answer: '' }
        break
      case 'TRUE_FALSE_NOT_GIVEN':
      case 'YES_NO_NOT_GIVEN':
        newQuestion = { text: '', answer: '' }
        break
      case 'MATCH_HEADING':
        newQuestion = { paragraphText: '', answer: '' }
        break
      case 'SHORT_ANSWER':
        newQuestion = { text: '', answer: '' }
        break
      case 'IMAGE_INPUTS':
        const imageId = form.getFieldValue([...groupPath, 'imageId'])
        newQuestion = { 
          x: 50, 
          y: 50, 
          answer: '',
          imageUrl: imageId ? `/api/file/download/${imageId}` : undefined
        }
        break
      default:
        newQuestion = { text: '', answer: '' }
    }
    
    // Add the new question to the form
    const newQuestions = [...currentQuestions, newQuestion]
    form.setFieldValue(path, newQuestions)
    
    // Update the range to reflect the new question count
    updateRange(newQuestions.length)
    
    setQuestionCount(prev => prev + 1)
  }

  const updateRange = (questionCount: number) => {
    const currentRange = form.getFieldValue([...groupPath, 'range']) || ''
    const match = currentRange.match(/^(\d+)-(\d+)$/)
    
    if (match) {
      const startNum = parseInt(match[1])
      const newEndNum = startNum + questionCount - 1
      form.setFieldValue([...groupPath, 'range'], `${startNum}-${newEndNum}`)
    }
  }

  const removeQuestion = (index: number) => {
    const path = [...groupPath, 'questions']
    const currentQuestions = form.getFieldValue(path) || []
    const newQuestions = currentQuestions.filter((_: any, i: number) => i !== index)
    form.setFieldValue(path, newQuestions)
    
    // Update the range to reflect the new question count
    updateRange(newQuestions.length)
    
    setQuestionCount(prev => Math.max(0, prev - 1))
  }

  const handleQuestionTypeChange = (value: string) => {
    setSelectedType(value)
    
    // For SHORT_ANSWER, immediately create 1 question with empty text
    if (value === 'SHORT_ANSWER') {
      form.setFieldValue([...groupPath, 'questions'], [{ text: '' }])
      setQuestionCount(1)
    } else {
      // Reset questions when type changes for other types
      form.setFieldValue([...groupPath, 'questions'], [])
      setQuestionCount(0)
    }
  }

  const getQuestionNumber = (index: number): number => {
    // Parse question range (e.g., "1-5" or "14-20")
    const range = form.getFieldValue([...groupPath, 'range']) || questionRange
    if (range) {
      const match = range.match(/^(\d+)-(\d+)$/)
      if (match) {
        return parseInt(match[1]) + index
      }
    }
    return index + 1
  }

  const renderQuestion = (index: number) => {
    const qNum = getQuestionNumber(index)
    
    switch (selectedType) {
      case 'MULTIPLE_CHOICE':
        return <MultipleChoiceQuestion key={index} groupPath={groupPath} questionIndex={index} questionNumber={qNum} onRemove={() => removeQuestion(index)} onAnswerChange={onAnswerChange} form={form} />
      case 'TRUE_FALSE_NOT_GIVEN':
      case 'YES_NO_NOT_GIVEN':
        return <TrueFalseQuestion key={index} groupPath={groupPath} questionIndex={index} questionNumber={qNum} type={selectedType} onRemove={() => removeQuestion(index)} onAnswerChange={onAnswerChange} />
      case 'MATCH_HEADING':
        return <MatchHeadingQuestion key={index} groupPath={groupPath} questionIndex={index} questionNumber={qNum} onRemove={() => removeQuestion(index)} onAnswerChange={onAnswerChange} />
      case 'SHORT_ANSWER':
        return <ShortAnswerQuestion key={index} groupPath={groupPath} questionIndex={index} questionNumber={qNum} onRemove={() => removeQuestion(index)} onAnswerChange={onAnswerChange} form={form} />
      case 'IMAGE_INPUTS':
        return <ImageInputsQuestion key={index} groupPath={groupPath} questionIndex={index} questionNumber={qNum} onRemove={() => removeQuestion(index)} />
      default:
        return null
    }
  }

  return (
    <Card size="small" title={groupLabel}>
      <Form.Item
        label="Question Type"
        name={[...groupPath, 'type']}
      >
        <Select 
          placeholder="Select question type" 
          options={questionTypes}
          onChange={handleQuestionTypeChange}
        />
      </Form.Item>
      <Form.Item
        label="Question Range"
        name={[...groupPath, 'range']}
        initialValue={defaultQuestionRange}
      >
        <Input 
          placeholder="e.g., 1-5" 
          onChange={(e) => setQuestionRange(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label="Instructions"
        name={[...groupPath, 'instruction']}
      >
        <TextArea rows={2} placeholder="Instructions for this group" />
      </Form.Item>

      {/* Heading options for Match Heading question type */}
      {selectedType === 'MATCH_HEADING' && (
        <Form.Item
          label="Available Headings"
          name={[...groupPath, 'headingOptions']}
          help="Enter all available headings (one per line). Format: 'i. Heading text'"
          rules={[{ required: true, message: 'Please enter the list of headings' }]}
        >
          <TextArea 
            rows={6} 
            placeholder={`i. Introduction to the topic
ii. Historical background
iii. Current developments
iv. Future predictions
v. Conclusion and summary`}
          />
        </Form.Item>
      )}

      {showImageUpload && (
        <Form.Item
          label="Image/Illustration"
          name={[...groupPath, 'imageId']}
          help="Upload an image to accompany this question group"
        >
          <ImageUpload label="Upload Image" />
        </Form.Item>
      )}
      
      {selectedType && questionCount > 0 && (
        <>
          <Divider orientation="left">Questions</Divider>
          <div className="space-y-3">
            {Array.from({ length: questionCount }).map((_, index) => renderQuestion(index))}
          </div>
        </>
      )}
      
      {selectedType && selectedType !== 'SHORT_ANSWER' && (
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />}
          onClick={addQuestion}
          className="mt-3"
        >
          Add Question
        </Button>
      )}
    </Card>
  )
}
