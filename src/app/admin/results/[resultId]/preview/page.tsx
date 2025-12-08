'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Layout, Typography, Card, Button, Space, message, Spin, Tag } from 'antd'
import { HomeOutlined, ArrowLeftOutlined, SoundOutlined, BookOutlined, EditOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'
import { mockSubmissionApi } from '@/services/mockSubmissionApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'
import { useStore } from '@/stores/StoreContext'
import { observer } from 'mobx-react-lite'
import { SectionResultsTable } from '@/components/admin/SectionResultsTable'

const { Header, Content } = Layout
const { Title, Text } = Typography

const ResultPreviewPage = observer(() => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { adminStore } = useStore()
  const resultId = params.resultId as string
  const testId = searchParams.get('testId')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [sectionsData, setSectionsData] = useState<any[]>([])

  useEffect(() => {
    if (resultId) {
      fetchResultDetails()
    }
  }, [resultId])

  useEffect(() => {
    if (testId && resultId) {
      fetchSectionsData()
    }
  }, [testId, resultId])

  const fetchResultDetails = async () => {
    try {
      setLoading(true)

      // Get result from adminStore cache (optimized - no API call)
      const foundResult = adminStore.getMockResult(resultId)

      if (foundResult) {
        console.log('📦 Using cached result from adminStore:', foundResult)
        setResult(foundResult)
      } else {
        console.error('⚠️ Result not found in cache. Please navigate from the results page.')
        message.error('Result data not found. Please return to the results page and try again.')
      }
    } catch (error: any) {
      console.error('Error loading result:', error)
      message.error(error.message || 'Failed to load result details')
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionsData = async () => {
    try {
      console.log('🔍 Fetching sections for testId:', testId, 'mockId:', resultId)

      // Fetch all sections for this test to get proper section IDs
      const response = await mockSubmissionApi.getAllSections(testId!, resultId)

      if (response.success && response.data) {
        console.log('✅ Fetched sections:', response.data)
        setSectionsData(response.data)
      } else {
        console.error('❌ Failed to fetch sections')
      }
    } catch (error: any) {
      console.error('❌ Error fetching sections:', error)
    }
  }

  const handleSectionClick = (sectionType: string) => {
    // mockId is the same as resultId - layouts will get student name and test name from adminStore
    const mockIdParam = `&mockId=${resultId}`

    if (sectionType === 'LISTENING') {
      router.push(`/admin/reading/preview/${testId}/LISTENING?resultId=${resultId}${mockIdParam}`)
    } else if (sectionType === 'READING') {
      router.push(`/admin/reading/preview/${testId}/READING?resultId=${resultId}${mockIdParam}`)
    } else if (sectionType === 'WRITING') {
      router.push(`/admin/results/${resultId}/grade-writing?testId=${testId}${mockIdParam}`)
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

  const handleToggleResults = (sectionType: string) => {
    if (expandedSection === sectionType) {
      setExpandedSection(null)
    } else {
      setExpandedSection(sectionType)
    }
  }

  const handleScoreUpdate = async () => {
    // Refresh the result data to show updated scores by fetching from API
    try {
      console.log('🔄 Refreshing scores after recalculation...')

      // Fetch fresh data from API
      const response = await mockResultApi.getAllMockResults(0, 100)

      if (response.success && response.data) {
        // Update adminStore cache with fresh data
        adminStore.storeMockResults(response.data)

        // Then update local state with fresh data from cache
        fetchResultDetails()

        console.log('✅ Scores refreshed successfully')
      }
    } catch (error) {
      console.error('❌ Error refreshing scores:', error)
    }
  }

  const getSectionId = (sectionType: string): string | null => {
    const section = sectionsData.find(s => s.sectionType === sectionType)
    return section?.id || null
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <Header style={{
        background: 'var(--header-background)',
        borderBottom: '1px solid var(--border-color)', 
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
        background: 'var(--background)', 
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

                    {/* Results Button */}
                    {section.sectionType !== 'WRITING' && (
                      <div style={{ marginTop: 16 }}>
                        <Button
                          type={expandedSection === section.sectionType ? 'primary' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleResults(section.sectionType)
                          }}
                          block
                        >
                          {expandedSection === section.sectionType ? 'Hide Results' : 'View Results'}
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Expandable Results Table - spans full width below all cards */}
              {expandedSection && expandedSection !== 'WRITING' && getSectionId(expandedSection) && (
                <div style={{ marginTop: 24, width: '100%' }}>
                  <SectionResultsTable
                    mockId={resultId}
                    sectionId={getSectionId(expandedSection)!}
                    sectionType={expandedSection}
                    onScoreUpdate={handleScoreUpdate}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Content>
    </Layout>
  )
})

export default withAuth(ResultPreviewPage, { requireAdmin: true })
