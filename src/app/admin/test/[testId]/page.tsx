'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Button, Row, Col, message, Spin } from 'antd'
import { ArrowLeftOutlined, BookOutlined, SoundOutlined, EditOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface Section {
  id: string
  sectionType: string
  isActive: number
}

const TestDetailPage = () => {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string

  const [sections, setSections] = useState<Section[]>([])
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
      const response = await testManagementApi.getAllSections(testId)
      const sectionsData = response.data || response || []
      setSections(sectionsData)
    } catch (error) {
      console.error('Error fetching sections:', error)
      message.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (sectionId: string, sectionType: string) => {
    router.push(`/admin/test/${testId}/section/${sectionType.toLowerCase()}?sectionId=${sectionId}`)
  }

  const getSectionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LISTENING':
        return <SoundOutlined style={{ fontSize: 48 }} />
      case 'READING':
        return <BookOutlined style={{ fontSize: 48 }} />
      case 'WRITING':
        return <EditOutlined style={{ fontSize: 48 }} />
      default:
        return <BookOutlined style={{ fontSize: 48 }} />
    }
  }

  const getSectionColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LISTENING':
        return '#1890ff'
      case 'READING':
        return '#52c41a'
      case 'WRITING':
        return '#722ed1'
      default:
        return '#1890ff'
    }
  }

  const getSectionDescription = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LISTENING':
        return '4 parts'
      case 'READING':
        return '3 parts'
      case 'WRITING':
        return '2 tasks'
      default:
        return ''
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin')}
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <Title level={3} style={{ margin: 0, marginBottom: '4px', lineHeight: '1.3' }}>
            {testName || 'Test Details'}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
            Select a section to manage
          </Text>
        </div>
      </Header>

      <Content style={{ padding: '48px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <div className="max-w-5xl mx-auto">
          <Title level={4} className="mb-6">Sections</Title>

          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {sections.map((section) => (
                <Col xs={24} md={8} key={section.id}>
                  <Card
                    hoverable
                    onClick={() => handleSectionClick(section.id, section.sectionType)}
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '8px',
                      height: '240px'
                    }}
                    bodyStyle={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      padding: '32px'
                    }}
                  >
                    <div 
                      style={{ 
                        color: getSectionColor(section.sectionType),
                        marginBottom: '16px'
                      }}
                    >
                      {getSectionIcon(section.sectionType)}
                    </div>
                    <Title level={3} style={{ marginBottom: '8px' }}>
                      {section.sectionType.charAt(0).toUpperCase() + section.sectionType.slice(1).toLowerCase()}
                    </Title>
                    <Text type="secondary">
                      {getSectionDescription(section.sectionType)}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {!loading && sections.length === 0 && (
            <Card className="text-center py-12">
              <Title level={4} type="secondary">No sections found</Title>
              <Text type="secondary">
                Sections should be automatically created when the test is created
              </Text>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  )
}

export default TestDetailPage
