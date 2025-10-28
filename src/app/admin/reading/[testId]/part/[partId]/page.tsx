'use client'

import { useState } from 'react'
import { Layout, Card, Button, Typography, Form, Input, Select, Divider, Space, List, Tag, Modal } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
  { value: 'YES_NO_NOT_GIVEN', label: 'Yes/No/Not Given' },
  { value: 'MATCH_HEADING', label: 'Match Headings' },
  { value: 'MATCH_INFORMATION', label: 'Match Information' },
  { value: 'MATCH_FEATURES', label: 'Match Features' },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion' },
  { value: 'SHORT_ANSWER', label: 'Short Answer Questions' },
]

const PartEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  const { testId, partId } = params
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Mock data
  const part = {
    id: partId,
    title: `Part ${partId}`,
    passage: '',
    instruction: 'Read the passage and answer the questions below.',
    questionGroups: [
      {
        id: '1',
        type: 'MULTIPLE_CHOICE',
        instruction: 'Choose the correct answer A, B, C or D',
        questionRange: [1, 5],
        questionsCount: 5,
      },
      {
        id: '2',
        type: 'TRUE_FALSE_NOT_GIVEN',
        instruction: 'Do the following statements agree with the information in the passage?',
        questionRange: [6, 13],
        questionsCount: 8,
      },
    ],
  }

  const handleAddQuestionGroup = () => {
    setIsModalVisible(true)
  }

  return (
    <Layout className="min-h-screen" style={{ background: '#fff' }}>
      {/* Header */}
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/admin/reading/${testId}`)}
          />
          <Title level={3} style={{ margin: 0 }}>Edit {part.title}</Title>
        </div>
        <Button type="primary" icon={<SaveOutlined />}>
          Save Part
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Passage Section */}
          <Card title="Reading Passage">
            <Form form={form} layout="vertical">
              <Form.Item
                label="Part Instruction"
                name="instruction"
                initialValue={part.instruction}
              >
                <Input placeholder="e.g., Read the passage and answer the questions below." />
              </Form.Item>

              <Form.Item
                label="Passage Text"
                name="passage"
                initialValue={part.passage}
                rules={[{ required: true, message: 'Please enter the passage text' }]}
              >
                <TextArea
                  rows={20}
                  placeholder="Paste the reading passage here..."
                  className="font-serif"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Question Groups Section */}
          <Card
            title="Question Groups"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddQuestionGroup}
              >
                Add Question Group
              </Button>
            }
          >
            <List
              dataSource={part.questionGroups}
              renderItem={(group) => (
                <List.Item
                    key={group.id}
                  actions={[
                    <Button
                        key={group.id + 'edit'}
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => router.push(`/admin/reading/${testId}/part/${partId}/group/${group.id}`)}
                    >
                      Edit Questions
                    </Button>,
                    <Button key={group.id + 'delete'} type="link" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{group.type.replace(/_/g, ' ')}</Text>
                        <Tag color="blue">Q {group.questionRange[0]}-{group.questionRange[1]}</Tag>
                        <Tag>{group.questionsCount} questions</Tag>
                      </Space>
                    }
                    description={group.instruction}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>

        {/* Add Question Group Modal */}
        <Modal
          title="Add Question Group"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => {
            setIsModalVisible(false)
            // Navigate to question group editor
          }}
        >
          <Form layout="vertical">
            <Form.Item label="Question Type" required>
              <Select
                placeholder="Select question type"
                options={questionTypes}
              />
            </Form.Item>
            <Form.Item label="Start Question Number" required>
              <Input type="number" placeholder="e.g., 14" />
            </Form.Item>
            <Form.Item label="Number of Questions" required>
              <Input type="number" placeholder="e.g., 5" />
            </Form.Item>
            <Form.Item label="Instructions" required>
              <TextArea
                rows={3}
                placeholder="Instructions for this group of questions"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default PartEditorPage
