'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Layout, Typography, Card, Button, Space, message, Spin, Tag } from 'antd'
import { HomeOutlined, ArrowLeftOutlined, SoundOutlined, BookOutlined, EditOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Header, Content } = Layout
const { Title, Text } = Typography

const ResultPreviewPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const resultId = params.resultId as string
  const testId = searchParams.get('testId')
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (resultId) {
      fetchResultDetails()
    }
  }, [resultId])

  const fetchResultDetails = async () => {
    try {
      setLoading(true)
      // Fetch all results and find the one we need
      const response = await mockResultApi.getAllMockResults(0, 1000)
      const foundResult = response.data?.find(r => r.id === resultId)
      
      if (foundResult) {
        console.log('Result data:', foundResult)
        setResult(foundResult)
      } else {
        message.error('Result not found')
      }
    } catch (error: any) {
      console.error('Error fetching result:', error)
      message.error(error.response?.data?.reason || 'Failed to load result details')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (sectionType: string) => {
    // Get student name from result
    const studentName = result?.userName || 
      (result?.firstName && result?.lastName ? `${result.firstName} ${result.lastName}` : '') ||
      (result?.userFirstName && result?.userLastName ? `${result.userFirstName} ${result.userLastName}` : '') ||
      result?.userId || ''
    
    const studentParam = studentName ? `&studentName=${encodeURIComponent(studentName)}` : ''
    const testNameParam = result?.testName ? `&testName=${encodeURIComponent(result.testName)}` : ''
    
    if (sectionType === 'LISTENING') {
      router.push(`/admin/reading/preview/${testId}/LISTENING?resultId=${resultId}${studentParam}${testNameParam}`)
    } else if (sectionType === 'READING') {
      router.push(`/admin/reading/preview/${testId}/READING?resultId=${resultId}${studentParam}${testNameParam}`)
    } else if (sectionType === 'WRITING') {
      router.push(`/admin/results/${resultId}/grade-writing?testId=${testId}${studentParam}${testNameParam}`)
    }
  }

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'LISTENING':
        return <SoundOutlined style={{ fontSize: 48, color: '#1677ff' }} />
      case 'READING':
        return <BookOutlined style={{ fontSize: 48, color: '#52c41a' }} />
      case 'WRITING':
        return <EditOutlined style={{ fontSize: 48, color: '#722ed1' }} />
      default:
        return null
    }
  }

  const getSectionTitle = (sectionType: string) => {
    switch (sectionType) {
      case 'LISTENING':
        return 'Listening'
      case 'READING':
        return 'Reading'
      case 'WRITING':
        return 'Writing'
      default:
        return sectionType
    }
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <Title level={2} style={{ margin: 0, color: '#cf1322', lineHeight: '1.3' }}>
          Test Result Preview
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/results')}
            size="large"
          >
            Back to Results
          </Button>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => router.push('/admin')}
            size="large"
          >
            Admin Home
          </Button>
          <UserMenu />
        </div>
      </Header>

      <Content style={{ 
        padding: '48px', 
        background: '#f5f5f5', 
        minHeight: 'calc(100vh - 64px)'
      }}>
        <div className="max-w-7xl mx-auto" style={{ width: '100%' }}>
          {/* Student Info */}
          {result && (
            <>
              <Card style={{ marginBottom: 24 }}>
                <Space direction="vertical" size={8}>
                  <Title level={3} style={{ margin: 0 }}>{result.testName}</Title>
                  <Text type="secondary">
                    Student: {
                      result.userName || 
                      (result.firstName && result.lastName ? `${result.firstName} ${result.lastName}` : '') ||
                      (result.userFirstName && result.userLastName ? `${result.userFirstName} ${result.userLastName}` : '') ||
                      result.userId || 
                      'Unknown'
                    }
                  </Text>
                  <Text type="secondary">Status: <Tag color="success">{result.status}</Tag></Text>
                </Space>
              </Card>

              {/* Section Cards */}
              <Title level={3} style={{ marginBottom: 24 }}>Select a section to view answers</Title>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {result.sections?.map((section: any) => (
                  <Card
                    key={section.sectionType}
                    hoverable
                    onClick={() => handleSectionClick(section.sectionType)}
                    style={{
                      textAlign: 'center',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    bodyStyle={{ padding: 40 }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      {getSectionIcon(section.sectionType)}
                    </div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {getSectionTitle(section.sectionType)}
                    </Title>
                    <Space direction="vertical" size={4}>
                      <Tag color={section.status === 'FINISHED' ? 'success' : 'warning'}>
                        {section.status}
                      </Tag>
                      {section.correctAnswers !== null && section.correctAnswers !== undefined && (
                        <Text type="secondary">Correct: {section.correctAnswers}</Text>
                      )}
                      {section.score !== null && section.score !== undefined && (
                        <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                          Score: {section.score.toFixed(1)}
                        </Text>
                      )}
                      {section.sectionType === 'WRITING' && (section.score === null || section.score === undefined) && (
                        <Text type="warning">Not graded yet</Text>
                      )}
                    </Space>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </Content>
    </Layout>
  )
}

export default withAuth(ResultPreviewPage, { requireAdmin: true })
