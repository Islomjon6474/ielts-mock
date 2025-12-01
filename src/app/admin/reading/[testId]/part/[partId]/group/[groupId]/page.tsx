'use client'

import { useState } from 'react'
import { Layout, Card, Button, Typography, Form, Input, Select, Space, Divider, List, Radio } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

// Type-specific question editors
const MultipleChoiceEditor = ({ questionNumber }: { questionNumber: number }) => {
  return (
    <Card className="mb-4">
      <Form layout="vertical">
        <Form.Item label={`Question ${questionNumber}`} required>
          <TextArea
            rows={2}
            placeholder="Enter the question text..."
          />
        </Form.Item>
        <Form.Item label="Options" required>
          <Space direction="vertical" className="w-full">
            <Input placeholder="A: Option A" />
            <Input placeholder="B: Option B" />
            <Input placeholder="C: Option C" />
            <Input placeholder="D: Option D" />
          </Space>
        </Form.Item>
        <Form.Item label="Correct Answer" required>
          <Radio.Group>
            <Radio value="A">A</Radio>
            <Radio value="B">B</Radio>
            <Radio value="C">C</Radio>
            <Radio value="D">D</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Card>
  )
}

const TrueFalseEditor = ({ questionNumber }: { questionNumber: number }) => {
  return (
    <Card className="mb-4">
      <Form layout="vertical">
        <Form.Item label={`Statement ${questionNumber}`} required>
          <TextArea
            rows={2}
            placeholder="Enter the statement..."
          />
        </Form.Item>
        <Form.Item label="Correct Answer" required>
          <Radio.Group>
            <Radio value="TRUE">TRUE</Radio>
            <Radio value="FALSE">FALSE</Radio>
            <Radio value="NOT_GIVEN">NOT GIVEN</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Card>
  )
}

const MatchHeadingEditor = ({ questionNumber }: { questionNumber: number }) => {
  return (
    <Card className="mb-4">
      <Form layout="vertical">
        <Form.Item label={`Section ${questionNumber}`} required>
          <Input placeholder="Section identifier (e.g., A, B, C)" />
        </Form.Item>
        <Form.Item label="Section Text" required>
          <TextArea
            rows={4}
            placeholder="Enter the section text from the passage..."
          />
        </Form.Item>
        <Form.Item label="Correct Heading" required>
          <Select placeholder="Select the matching heading">
            <Select.Option value="i">i - Heading 1</Select.Option>
            <Select.Option value="ii">ii - Heading 2</Select.Option>
            <Select.Option value="iii">iii - Heading 3</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Card>
  )
}

const SentenceCompletionEditor = ({ questionNumber }: { questionNumber: number }) => {
  return (
    <Card className="mb-4">
      <Form layout="vertical">
        <Form.Item label={`Question ${questionNumber}`} required>
          <TextArea
            rows={2}
            placeholder="Enter sentence with ___ for blanks..."
          />
        </Form.Item>
        <Form.Item label="Correct Answer(s)" required>
          <Input placeholder="Enter the correct word(s)" />
        </Form.Item>
        <Form.Item label="Word Limit">
          <Select defaultValue="THREE">
            <Select.Option value="ONE">ONE WORD ONLY</Select.Option>
            <Select.Option value="TWO">NO MORE THAN TWO WORDS</Select.Option>
            <Select.Option value="THREE">NO MORE THAN THREE WORDS</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Card>
  )
}

const QuestionGroupEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  const { testId, partId, groupId } = params
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE')

  // Mock data
  const group = {
    id: groupId,
    type: 'MULTIPLE_CHOICE',
    instruction: 'Choose the correct answer A, B, C or D',
    questionRange: [1, 5],
    questions: [1, 2, 3, 4, 5],
  }

  const renderQuestionEditor = (qNum: number) => {
    switch (questionType) {
      case 'MULTIPLE_CHOICE':
        return <MultipleChoiceEditor key={qNum} questionNumber={qNum} />
      case 'TRUE_FALSE_NOT_GIVEN':
        return <TrueFalseEditor key={qNum} questionNumber={qNum} />
      case 'MATCH_HEADING':
        return <MatchHeadingEditor key={qNum} questionNumber={qNum} />
      case 'SENTENCE_COMPLETION':
        return <SentenceCompletionEditor key={qNum} questionNumber={qNum} />
      default:
        return null
    }
  }

  return (
    <Layout className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <Header style={{ background: 'var(--header-background)', borderBottom: '1px solid var(--border-color)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/admin/reading/${testId}/part/${partId}`)}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>Edit Question Group</Title>
            <Text type="secondary">Questions {group.questionRange[0]}-{group.questionRange[1]}</Text>
          </div>
        </div>
        <Button type="primary" icon={<SaveOutlined />}>
          Save Questions
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Group Settings */}
          <Card title="Group Settings">
            <Form layout="vertical">
              <Form.Item label="Question Type">
                <Select
                  value={questionType}
                  onChange={setQuestionType}
                  options={[
                    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
                    { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
                    { value: 'MATCH_HEADING', label: 'Match Headings' },
                    { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Instructions for this group" required>
                <TextArea
                  rows={2}
                  defaultValue={group.instruction}
                  placeholder="Instructions that will appear before all questions in this group"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Questions */}
          <Card
            title={`Questions (${group.questions.length})`}
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Question
              </Button>
            }
          >
            <div className="space-y-4">
              {group.questions.map((qNum) => renderQuestionEditor(qNum))}
            </div>
          </Card>

          {/* Additional Options for specific types */}
          {questionType === 'MATCH_HEADING' && (
            <Card title="Available Headings">
              <Text type="secondary" className="block mb-4">
                Define the list of headings that students can choose from
              </Text>
              <List
                dataSource={['i', 'ii', 'iii', 'iv', 'v']}
                renderItem={(item) => (
                  <List.Item
                      key={item}
                    actions={[
                      <Button key={item} type="link" danger icon={<DeleteOutlined />}>
                        Remove
                      </Button>
                    ]}
                  >
                    <Input
                      addonBefore={item}
                      placeholder="Enter heading text"
                      defaultValue="Sample heading"
                    />
                  </List.Item>
                )}
              />
              <Button type="dashed" block className="mt-4" icon={<PlusOutlined />}>
                Add Heading
              </Button>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  )
}

export default QuestionGroupEditorPage
