'use client'

import { useState } from 'react'
import { Layout, Card, Button, Typography, List, Tag, Space, Empty } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'

const { Header, Content } = Layout
const { Title, Text } = Typography

const TestPartsPage = () => {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId

  // Mock test data
  const test = {
    id: testId,
    title: 'IELTS Reading Practice Test 1',
    parts: [
      {
        id: 1,
        title: 'Part 1',
        questionRange: [1, 13],
        hasPassage: true,
        questionGroups: 2,
      },
      {
        id: 2,
        title: 'Part 2',
        questionRange: [14, 26],
        hasPassage: true,
        questionGroups: 3,
      },
      {
        id: 3,
        title: 'Part 3',
        questionRange: [27, 40],
        hasPassage: true,
        questionGroups: 2,
      },
    ],
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
          <div>
            <Title level={3} style={{ margin: 0 }}>{test.title}</Title>
            <Text type="secondary" className="text-sm">Manage test parts and questions</Text>
          </div>
        </div>
        <Space>
          <Button icon={<EyeOutlined />}>
            Preview Test
          </Button>
          <Button type="primary">
            Save Changes
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <Title level={4} className="mb-0">Test Parts</Title>
            <Text type="secondary">
              Reading tests must have exactly 3 parts
            </Text>
          </div>

          <List
            dataSource={test.parts}
            renderItem={(part) => (
              <List.Item key={part.id}
                actions={[
                  <Button
                      key={part.id}
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/admin/reading/${testId}/part/${part.id}`)}
                  >
                    Edit Part
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">{part.title}</span>
                      <Tag color="blue">Questions {part.questionRange[0]}-{part.questionRange[1]}</Tag>
                      <Tag color={part.hasPassage ? 'green' : 'orange'}>
                        {part.hasPassage ? 'Passage Added' : 'No Passage'}
                      </Tag>
                    </div>
                  }
                  description={
                    <Text type="secondary">
                      {part.questionGroups} question group(s) • {part.questionRange[1] - part.questionRange[0] + 1} questions total
                    </Text>
                  }
                />
              </List.Item>
            )}
          />

          {test.parts.length === 0 && (
            <Empty
              description="No parts added yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Add First Part
              </Button>
            </Empty>
          )}
        </Card>
      </Content>
    </Layout>
  )
}

export default TestPartsPage
