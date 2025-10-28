'use client'

import { useState, useEffect } from 'react'
import { Layout, Card, Button, Typography, List, Tag, Space, Spin, Empty } from 'antd'
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const { Header, Content } = Layout
const { Title, Text } = Typography

const TestManagementPage = () => {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string

  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [testName, setTestName] = useState('')

  useEffect(() => {
    if (testId) {
      fetchSections()
    }
  }, [testId])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const sectionsData = await testManagementApi.getAllSections(testId)
      setSections(sectionsData || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPartContent = async (partId: string) => {
    try {
      const content = await testManagementApi.getPartQuestionContent(partId)
      console.log('Part content:', content)
      // You can display this in a modal or navigate to a detail page
    } catch (error) {
      console.error('Error fetching part content:', error)
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
          <div>
            <Title level={3} style={{ margin: 0 }}>Test Management</Title>
            <Text type="secondary" className="text-sm">Test ID: {testId}</Text>
          </div>
        </div>
        <Button icon={<EyeOutlined />}>
          Preview Test
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Card>
          <Title level={4} className="mb-4">Sections & Parts</Title>
          
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : sections.length === 0 ? (
            <Empty description="No sections found for this test" />
          ) : (
            <Space direction="vertical" className="w-full" size="large">
              {sections.map((section: any) => (
                <Card key={section.id} type="inner" title={`Section: ${section.name || section.id}`}>
                  <SectionParts sectionId={section.id} onViewContent={viewPartContent} />
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </Content>
    </Layout>
  )
}

// Component to fetch and display parts for a section
const SectionParts = ({ sectionId, onViewContent }: { sectionId: string, onViewContent: (partId: string) => void }) => {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParts()
  }, [sectionId])

  const fetchParts = async () => {
    try {
      setLoading(true)
      const partsData = await testManagementApi.getAllParts(sectionId)
      setParts(partsData || [])
    } catch (error) {
      console.error('Error fetching parts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spin />
  }

  if (parts.length === 0) {
    return <Empty description="No parts found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <List
      dataSource={parts}
      renderItem={(part: any) => (
        <List.Item
          actions={[
            <Button
              type="link"
              onClick={() => onViewContent(part.id)}
            >
              View Content
            </Button>
          ]}
        >
          <List.Item.Meta
            title={
              <Space>
                <Text strong>{part.name || `Part ${part.id}`}</Text>
                <Tag color="blue">Part ID: {part.id.substring(0, 8)}...</Tag>
              </Space>
            }
            description={part.description || 'No description'}
          />
        </List.Item>
      )}
    />
  )
}

export default TestManagementPage
