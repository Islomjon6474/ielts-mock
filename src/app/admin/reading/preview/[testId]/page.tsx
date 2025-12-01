'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Typography, Row, Col, Spin, message, Button } from 'antd'
import { ArrowLeftOutlined, BookOutlined, SoundOutlined, EditOutlined } from '@ant-design/icons'
import { testManagementApi } from '@/services/testManagementApi'

const { Title, Text } = Typography

const TestPreviewPage = () => {
  const params = useParams()
  const router = useRouter()
  const testId = params.testId as string
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<any[]>([])
  const [testName, setTestName] = useState('')

  useEffect(() => {
    if (testId) {
      fetchSections()
    }
  }, [testId])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const sectionsResponse = await testManagementApi.getAllSections(testId)
      const sectionsData = sectionsResponse?.data || sectionsResponse || []
      setSections(sectionsData)
    } catch (error) {
      console.error('Error fetching sections:', error)
      message.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (sectionType: string) => {
    const sectionTypeLower = sectionType.toLowerCase()
    router.push(`/admin/reading/preview/${testId}/${sectionTypeLower}`)
  }

  const getSectionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LISTENING':
        return <SoundOutlined style={{ fontSize: 64 }} />
      case 'READING':
        return <BookOutlined style={{ fontSize: 64 }} />
      case 'WRITING':
        return <EditOutlined style={{ fontSize: 64 }} />
      default:
        return <BookOutlined style={{ fontSize: 64 }} />
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
        return '4 parts • 30 minutes'
      case 'READING':
        return '3 parts • 60 minutes'
      case 'WRITING':
        return '2 tasks • 60 minutes'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--header-background)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin')}
          size="large"
        >
          Back to Admin
        </Button>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
            Test Preview
          </Title>
          <Text type="secondary">Select a section to preview</Text>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '48px' }}>
        <div className="max-w-5xl mx-auto">
          <div style={{
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px 24px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: 24 }}>ℹ️</span>
            <div>
              <Text strong style={{ color: '#856404' }}>Preview Mode</Text>
              <br />
              <Text style={{ color: '#856404' }}>
                All inputs are disabled in preview mode. This shows how the test will appear to students.
              </Text>
            </div>
          </div>

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
                    onClick={() => handleSectionClick(section.sectionType)}
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '12px',
                      height: '280px',
                      border: '2px solid #e8e8e8',
                      transition: 'all 0.3s'
                    }}
                    bodyStyle={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      padding: '32px'
                    }}
                    className="hover:shadow-lg"
                  >
                    <div 
                      style={{ 
                        color: getSectionColor(section.sectionType),
                        marginBottom: '24px'
                      }}
                    >
                      {getSectionIcon(section.sectionType)}
                    </div>
                    <Title level={2} style={{ marginBottom: '12px', textAlign: 'center' }}>
                      {section.sectionType.charAt(0).toUpperCase() + section.sectionType.slice(1).toLowerCase()}
                    </Title>
                    <Text type="secondary" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
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
                This test doesn&apos;t have any sections yet
              </Text>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestPreviewPage
