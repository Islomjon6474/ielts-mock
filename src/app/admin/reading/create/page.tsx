'use client'

import { useState } from 'react'
import { Layout, Card, Button, Form, Input, Typography, message, Select, Divider, Space, Radio } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
  { value: 'YES_NO_NOT_GIVEN', label: 'Yes/No/Not Given' },
  { value: 'MATCH_HEADING', label: 'Match Headings' },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion' },
  { value: 'SHORT_ANSWER', label: 'Short Answer Questions' },
]

// Question component for Multiple Choice
const MultipleChoiceQuestion = ({ groupPath, questionIndex, onRemove }: any) => {
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
        <Radio.Group>
          <Radio value="A">A</Radio>
          <Radio value="B">B</Radio>
          <Radio value="C">C</Radio>
          <Radio value="D">D</Radio>
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}

// Question component for True/False/Not Given
const TrueFalseQuestion = ({ groupPath, questionIndex, onRemove, type }: any) => {
  const options = type === 'YES_NO_NOT_GIVEN' 
    ? [{ value: 'YES', label: 'YES' }, { value: 'NO', label: 'NO' }, { value: 'NOT_GIVEN', label: 'NOT GIVEN' }]
    : [{ value: 'TRUE', label: 'TRUE' }, { value: 'FALSE', label: 'FALSE' }, { value: 'NOT_GIVEN', label: 'NOT GIVEN' }]

  return (
    <Card size="small" className="mb-3" title={`Statement ${questionIndex + 1}`} extra={
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label="Statement"
        name={[...groupPath, 'questions', questionIndex, 'text']}
        rules={[{ required: true, message: 'Please enter statement' }]}
      >
        <TextArea rows={2} placeholder="Enter the statement..." />
      </Form.Item>
      <Form.Item
        label="Correct Answer"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Radio.Group>
          {options.map(opt => (
            <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}

// Question component for Sentence Completion
const SentenceCompletionQuestion = ({ groupPath, questionIndex, onRemove }: any) => {
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
        <Input placeholder="Enter the correct word(s)" />
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

// Question component for Match Headings
const MatchHeadingQuestion = ({ groupPath, questionIndex, onRemove }: any) => {
  return (
    <Card size="small" className="mb-3" title={`Section ${questionIndex + 1}`} extra={
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    }>
      <Form.Item
        label="Section Identifier"
        name={[...groupPath, 'questions', questionIndex, 'sectionId']}
        rules={[{ required: true }]}
      >
        <Input placeholder="e.g., A, B, C" style={{ width: 100 }} />
      </Form.Item>
      <Form.Item
        label="Correct Heading"
        name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
        rules={[{ required: true }]}
      >
        <Input placeholder="e.g., i, ii, iii" style={{ width: 100 }} />
      </Form.Item>
    </Card>
  )
}

// Question component for Short Answer
const ShortAnswerQuestion = ({ groupPath, questionIndex, onRemove }: any) => {
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
        <Input placeholder="Enter the correct answer" />
      </Form.Item>
    </Card>
  )
}

const CreateReadingTestPage = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  
  // Track question counts for each group
  const [questionCounts, setQuestionCounts] = useState({
    part1: { group1: 0, group2: 0 },
    part2: { group1: 0, group2: 0 },
    part3: { group1: 0, group2: 0 },
  })

  // Track selected question types (renamed to avoid conflict with questionTypes constant)
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    part1: { group1: '', group2: '' },
    part2: { group1: '', group2: '' },
    part3: { group1: '', group2: '' },
  })

  const addQuestion = (part: string, group: string) => {
    setQuestionCounts(prev => ({
      ...prev,
      [part]: {
        ...prev[part as keyof typeof prev],
        [group]: prev[part as keyof typeof prev][group as keyof typeof prev.part1] + 1
      }
    }))
  }

  const removeQuestion = (part: string, group: string, index: number) => {
    const path = [part, group, 'questions']
    const currentQuestions = form.getFieldValue(path) || []
    const newQuestions = currentQuestions.filter((_: any, i: number) => i !== index)
    form.setFieldValue(path, newQuestions)
    
    setQuestionCounts(prev => ({
      ...prev,
      [part]: {
        ...prev[part as keyof typeof prev],
        [group]: Math.max(0, prev[part as keyof typeof prev][group as keyof typeof prev.part1] - 1)
      }
    }))
  }

  const handleQuestionTypeChange = (part: string, group: string, value: string) => {
    setSelectedQuestionTypes(prev => ({
      ...prev,
      [part]: {
        ...prev[part as keyof typeof prev],
        [group]: value
      }
    }))
  }

  const renderQuestions = (part: string, group: string) => {
    const count = questionCounts[part as keyof typeof questionCounts][group as keyof typeof questionCounts.part1]
    const type = selectedQuestionTypes[part as keyof typeof selectedQuestionTypes][group as keyof typeof selectedQuestionTypes.part1]
    const groupPath = [part, group]

    if (!type || count === 0) return null

    return (
      <div className="mt-4">
        <Divider orientation="left">Questions</Divider>
        {Array.from({ length: count }).map((_, index) => {
          switch (type) {
            case 'MULTIPLE_CHOICE':
              return <MultipleChoiceQuestion key={index} groupPath={groupPath} questionIndex={index} onRemove={() => removeQuestion(part, group, index)} />
            case 'TRUE_FALSE_NOT_GIVEN':
            case 'YES_NO_NOT_GIVEN':
              return <TrueFalseQuestion key={index} groupPath={groupPath} questionIndex={index} type={type} onRemove={() => removeQuestion(part, group, index)} />
            case 'SENTENCE_COMPLETION':
            case 'SUMMARY_COMPLETION':
              return <SentenceCompletionQuestion key={index} groupPath={groupPath} questionIndex={index} onRemove={() => removeQuestion(part, group, index)} />
            case 'MATCH_HEADING':
              return <MatchHeadingQuestion key={index} groupPath={groupPath} questionIndex={index} onRemove={() => removeQuestion(part, group, index)} />
            case 'SHORT_ANSWER':
              return <ShortAnswerQuestion key={index} groupPath={groupPath} questionIndex={index} onRemove={() => removeQuestion(part, group, index)} />
            default:
              return null
          }
        })}
      </div>
    )
  }

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      
      // Step 1: Create the test
      const testResponse = await testManagementApi.createTest(values.title)
      const testId = testResponse.id || testResponse.data?.id
      
      if (!testId) {
        throw new Error('Failed to create test - no ID returned')
      }

      message.success(`Test created with ID: ${testId}`)
      
      // Step 2: Get sections for this test
      const sections = await testManagementApi.getAllSections(testId)
      
      if (sections && sections.length > 0) {
        // Step 3: For each section, get parts and save content
        for (const section of sections) {
          const parts = await testManagementApi.getAllParts(section.id)
          
          // Save the test content for each part
          for (const part of parts) {
            await testManagementApi.savePartQuestionContent(part.id, values)
          }
        }
      }
      
      message.success('Test data saved successfully!')
      router.push('/admin')
      
    } catch (error: any) {
      console.error('Error saving test:', error)
      message.error(error.message || 'Failed to save test. Please fill in all required fields.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout className="min-h-screen" style={{ background: '#fff' }}>
      {/* Header */}
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin')}
          />
          <Title level={3} style={{ margin: 0 }}>Create Reading Test</Title>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          size="large"
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Test'}
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5', overflowY: 'auto' }}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Test Information */}
          <Card title="Test Information">
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                label="Test Title"
                name="title"
                rules={[{ required: true, message: 'Please enter test title' }]}
              >
                <Input placeholder="e.g., IELTS Reading Practice Test 1" size="large" />
              </Form.Item>

              <Form.Item
                label="Test Description"
                name="description"
              >
                <TextArea
                  placeholder="Brief description of the test"
                  rows={3}
                />
              </Form.Item>

              <Divider />

              {/* Part 1 */}
              <Card type="inner" title="Part 1 (Questions 1-13)" className="mb-6">
                <Form.Item
                  label="Part 1 Instruction"
                  name={['part1', 'instruction']}
                  initialValue="Read the passage and answer questions 1-13."
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Reading Passage"
                  name={['part1', 'passage']}
                  rules={[{ required: true, message: 'Please enter the passage' }]}
                >
                  <TextArea
                    rows={15}
                    placeholder="Paste Part 1 reading passage here..."
                    className="font-serif"
                  />
                </Form.Item>

                <Divider orientation="left">Question Groups</Divider>

                <Space direction="vertical" className="w-full" size="large">
                  <Card size="small" title="Question Group 1">
                    <Form.Item
                      label="Question Type"
                      name={['part1', 'group1', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part1', 'group1', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part1', 'group1', 'range']}
                      initialValue="1-5"
                    >
                      <Input placeholder="e.g., 1-5" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part1', 'group1', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part1', 'group1')}
                    
                    {selectedQuestionTypes.part1.group1 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part1', 'group1')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>

                  <Card size="small" title="Question Group 2">
                    <Form.Item
                      label="Question Type"
                      name={['part1', 'group2', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part1', 'group2', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part1', 'group2', 'range']}
                      initialValue="6-13"
                    >
                      <Input placeholder="e.g., 6-13" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part1', 'group2', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part1', 'group2')}
                    
                    {selectedQuestionTypes.part1.group2 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part1', 'group2')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>
                </Space>
              </Card>

              {/* Part 2 */}
              <Card type="inner" title="Part 2 (Questions 14-26)" className="mb-6">
                <Form.Item
                  label="Part 2 Instruction"
                  name={['part2', 'instruction']}
                  initialValue="Read the passage and answer questions 14-26."
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Reading Passage"
                  name={['part2', 'passage']}
                  rules={[{ required: true, message: 'Please enter the passage' }]}
                >
                  <TextArea
                    rows={15}
                    placeholder="Paste Part 2 reading passage here..."
                    className="font-serif"
                  />
                </Form.Item>

                <Divider orientation="left">Question Groups</Divider>

                <Space direction="vertical" className="w-full" size="large">
                  <Card size="small" title="Question Group 1">
                    <Form.Item
                      label="Question Type"
                      name={['part2', 'group1', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part2', 'group1', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part2', 'group1', 'range']}
                      initialValue="14-20"
                    >
                      <Input placeholder="e.g., 14-20" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part2', 'group1', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part2', 'group1')}
                    
                    {selectedQuestionTypes.part2.group1 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part2', 'group1')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>

                  <Card size="small" title="Question Group 2">
                    <Form.Item
                      label="Question Type"
                      name={['part2', 'group2', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part2', 'group2', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part2', 'group2', 'range']}
                      initialValue="21-26"
                    >
                      <Input placeholder="e.g., 21-26" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part2', 'group2', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part2', 'group2')}
                    
                    {selectedQuestionTypes.part2.group2 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part2', 'group2')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>
                </Space>
              </Card>

              {/* Part 3 */}
              <Card type="inner" title="Part 3 (Questions 27-40)" className="mb-6">
                <Form.Item
                  label="Part 3 Instruction"
                  name={['part3', 'instruction']}
                  initialValue="Read the passage and answer questions 27-40."
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Reading Passage"
                  name={['part3', 'passage']}
                  rules={[{ required: true, message: 'Please enter the passage' }]}
                >
                  <TextArea
                    rows={15}
                    placeholder="Paste Part 3 reading passage here..."
                    className="font-serif"
                  />
                </Form.Item>

                <Divider orientation="left">Question Groups</Divider>

                <Space direction="vertical" className="w-full" size="large">
                  <Card size="small" title="Question Group 1">
                    <Form.Item
                      label="Question Type"
                      name={['part3', 'group1', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part3', 'group1', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part3', 'group1', 'range']}
                      initialValue="27-35"
                    >
                      <Input placeholder="e.g., 27-35" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part3', 'group1', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part3', 'group1')}
                    
                    {selectedQuestionTypes.part3.group1 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part3', 'group1')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>

                  <Card size="small" title="Question Group 2">
                    <Form.Item
                      label="Question Type"
                      name={['part3', 'group2', 'type']}
                    >
                      <Select 
                        placeholder="Select question type" 
                        options={questionTypes}
                        onChange={(value) => handleQuestionTypeChange('part3', 'group2', value)}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Question Range"
                      name={['part3', 'group2', 'range']}
                      initialValue="36-40"
                    >
                      <Input placeholder="e.g., 36-40" />
                    </Form.Item>
                    <Form.Item
                      label="Instructions"
                      name={['part3', 'group2', 'instruction']}
                    >
                      <TextArea rows={2} placeholder="Instructions for this group" />
                    </Form.Item>
                    
                    {renderQuestions('part3', 'group2')}
                    
                    {selectedQuestionTypes.part3.group2 && (
                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />}
                        onClick={() => addQuestion('part3', 'group2')}
                        className="mt-3"
                      >
                        Add Question
                      </Button>
                    )}
                  </Card>
                </Space>
              </Card>

            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default CreateReadingTestPage
