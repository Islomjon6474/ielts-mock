'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Typography, Card, Row, Col, Button, Empty, Spin, Space, Tag, Pagination, Skeleton, Modal, Tabs } from 'antd'
import { FileTextOutlined, SettingOutlined, CalendarOutlined, ArrowRightOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { mockSubmissionApi, testManagementApi } from '@/services/testManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Title, Paragraph, Text } = Typography

const HomePage = observer(() => {
  const { appStore, authStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])
  const [mocks, setMocks] = useState<any[]>([])
  const [lastUnfinishedMock, setLastUnfinishedMock] = useState<any>(null)
  const [testNamesMap, setTestNamesMap] = useState<Record<string, string>>({})
  const pathname = usePathname()
  const [renderKey, setRenderKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTests, setTotalTests] = useState(0)
  const [totalMocks, setTotalMocks] = useState(0)
  const [pageSize, setPageSize] = useState(9) // 3x3 grid
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [startingTest, setStartingTest] = useState(false)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    console.log("lastUnfinishedMock", lastUnfinishedMock)
  }, [lastUnfinishedMock]);

  // Force component re-render when pathname changes (navigation)
  useEffect(() => {
    console.log('🏠 HomePage: Pathname changed, forcing re-render')
    setRenderKey(prev => prev + 1)
  }, [pathname])

  // Force re-verification of auth state on mount to ensure latest user data
  useEffect(() => {
    const verifyAuthOnMount = async () => {
      if (authStore.isAuthenticated) {
        console.log('🏠 HomePage: Verifying auth state on mount')
        try {
          await authStore.verifyAuth()
          console.log('🏠 HomePage: Auth verified', {
            user: authStore.user,
            isAdmin: authStore.isAdmin,
            role: authStore.user?.role
          })
          // Force re-render after verification
          setRenderKey(prev => prev + 1)
        } catch (error) {
          console.error('🏠 HomePage: Auth verification failed', error)
        }
      }
    }
    verifyAuthOnMount()
  }, [authStore])

  // Log auth state changes for debugging
  useEffect(() => {
    console.log('🏠 HomePage: Auth state changed', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      isAdmin: authStore.isAdmin,
      role: authStore.user?.role,
      renderKey
    })
  }, [authStore.isAuthenticated, authStore.user, authStore.isAdmin, renderKey])

  // Fetch last unfinished mock on mount
  useEffect(() => {
    const fetchLastUnfinishedMock = async () => {
      try {
        const response = await mockSubmissionApi.getAllMocks(0, 1) // Get first mock only
        const firstMock = response?.data?.[0]
        
        if (firstMock && firstMock.isFinished === 0) {
          // Fetch test name for the unfinished mock
          try {
            const testResponse = await testManagementApi.getTest(firstMock.testId)
            const testName = testResponse?.data?.name || `Test ${firstMock.testId.substring(0, 8)}`
            setTestNamesMap(prev => ({ ...prev, [firstMock.testId]: testName }))
          } catch (error) {
            console.error('Error fetching test name for unfinished mock:', error)
          }
          
          setLastUnfinishedMock(firstMock)
        } else {
          setLastUnfinishedMock(null)
        }
      } catch (error) {
        console.error('Error fetching last unfinished mock:', error)
        setLastUnfinishedMock(null)
      }
    }
    
    if (authStore.isAuthenticated) {
      fetchLastUnfinishedMock()
    }
  }, [authStore.isAuthenticated])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        
        // Scroll to top on page change for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        if (activeTab === 'available') {
          const response = await mockSubmissionApi.getAllTests(currentPage - 1, pageSize)
          
          // Response format: { success: true, data: [tests], totalCount: X }
          const testsData = response?.data || []
          const total = response?.totalCount || 0
          
          setTests(testsData)
          setTotalTests(total)
        } else {
          const response = await mockSubmissionApi.getAllMocks(currentPage - 1, pageSize)
          
          // Response format: { success: true, data: [mocks], totalCount: X }
          const mocksData = response?.data || []
          const total = response?.totalCount || 0
          
          // Fetch test names for all unique testIds
          const uniqueTestIds = [...new Set(mocksData.map((m: any) => m.testId))]
          const newTestNames: Record<string, string> = { ...testNamesMap }
          
          await Promise.all(
            uniqueTestIds.map(async (testId: string) => {
              if (!newTestNames[testId]) {
                try {
                  const testResponse = await testManagementApi.getTest(testId)
                  newTestNames[testId] = testResponse?.data?.name || `Test ${testId.substring(0, 8)}`
                } catch (error) {
                  console.error(`Error fetching test ${testId}:`, error)
                  newTestNames[testId] = `Test ${testId.substring(0, 8)}`
                }
              }
            })
          )
          
          setTestNamesMap(newTestNames)
          setMocks(mocksData)
          setTotalMocks(total)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        if (activeTab === 'available') {
          setTests([])
          setTotalTests(0)
        } else {
          setMocks([])
          setTotalMocks(0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentPage, pageSize, activeTab])
  const router = useRouter()

  const handleOpenTest = (test: any) => {
    setSelectedTest(test)
    setShowConfirmModal(true)
  }

  const handleConfirmStart = async () => {
    if (!selectedTest) return

    const id = selectedTest.id || selectedTest.testId || selectedTest?.uuid || selectedTest?.ID
    if (!id) return

    try {
      setStartingTest(true)
      // Start the mock test
      const response = await mockSubmissionApi.startMock(id)
      const mockId = response.data // Get the mockId from response
      console.log('✅ Mock test started:', mockId)

      // Check user role - only auto-start for USER role (students)
      const isStudent = authStore.user?.role === 'USER'
      const isAdmin = authStore.user?.role === 'ADMIN'

      if (isStudent) {
        // STUDENT: Auto-start listening section and go directly to test
        const sectionsResp = await mockSubmissionApi.getAllSections(id, mockId)
        const sections = sectionsResp.data

        // Find listening section
        const listeningSection = sections.find((s: any) =>
          String(s.sectionType).toLowerCase() === 'listening'
        )

        if (!listeningSection) {
          Modal.error({
            title: 'Section Not Found',
            content: 'Listening section not found for this test.',
          })
          return
        }

        // Start listening section
        await mockSubmissionApi.startSection(mockId, listeningSection.id)
        console.log('✅ Started listening section:', listeningSection.id)

        // Navigate directly to listening page
        router.push(`/listening?testId=${id}&mockId=${mockId}`)
      } else {
        // ADMIN or other roles: Show section selection page
        console.log('✅ Navigating to section selection page for admin')
        router.push(`/test/${id}?mockId=${mockId}`)
      }
    } catch (error) {
      console.error('Error starting test:', error)
      Modal.error({
        title: 'Failed to Start Test',
        content: 'There was an error starting the test. Please try again.',
      })
    } finally {
      setStartingTest(false)
      setShowConfirmModal(false)
    }
  }

  const handleCancelStart = () => {
    setShowConfirmModal(false)
    setSelectedTest(null)
  }

  const handleContinueTest = async (mock: any) => {
    // Find the first unfinished section and navigate to it
    const testId = mock.testId
    const mockId = mock.id

    try {
      const sectionsResp = await mockSubmissionApi.getAllSections(testId, mockId)
      const sections = sectionsResp.data

      // Check user role
      const isStudent = authStore.user?.role === 'USER'
      const isAdmin = authStore.user?.role === 'ADMIN'

      // Find first unfinished section (isFinished !== 1)
      const unfinishedSection = sections.find((s: any) => s.isFinished !== 1)

      if (!unfinishedSection) {
        // All sections finished
        if (isStudent) {
          // STUDENT: Go to first section in preview mode
          const firstSection = sections[0]
          if (firstSection) {
            const sectionType = String(firstSection.sectionType).toLowerCase()
            router.push(`/${sectionType}?testId=${testId}&mockId=${mockId}&preview=true`)
          } else {
            router.push('/')
          }
        } else {
          // ADMIN: Show section selection page in preview mode
          router.push(`/test/${testId}?mockId=${mockId}`)
        }
        return
      }

      if (isStudent) {
        // STUDENT: Navigate directly to the unfinished section
        const sectionType = String(unfinishedSection.sectionType).toLowerCase()
        router.push(`/${sectionType}?testId=${testId}&mockId=${mockId}`)
      } else {
        // ADMIN: Show section selection page
        router.push(`/test/${testId}?mockId=${mockId}`)
      }
    } catch (error) {
      console.error('Error continuing test:', error)
      // Fallback to test page
      router.push(`/test/${testId}?mockId=${mockId}`)
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setCurrentPage(1) // Reset to first page when switching tabs
  }

  // Compute admin status directly from user object for reactivity
  const isAdmin = authStore.user?.role === 'ADMIN'
  
  console.log('🏠 HomePage RENDER:', {
    user: authStore.user,
    role: authStore.user?.role,
    isAdmin,
    authStoreIsAdmin: authStore.isAdmin,
    renderKey
  })
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-8">
          <div key={`header-${renderKey}-${authStore.user?.role}`} className="flex justify-end items-center gap-3 mb-6">
            {isAdmin && (
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => router.push('/admin')}
                size="large"
                style={{ background: '#cf1322', borderColor: '#cf1322' }}
              >
                Admin Panel
              </Button>
            )}
            <UserMenu />
          </div>
          
          {/* Header with Last Unfinished Mock on the left */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '16px' }}>
            {/* Last Unfinished Mock - Compact Card */}
            {lastUnfinishedMock && (
              <Card
                style={{
                  width: '240px',
                  borderRadius: '8px',
                  border: '2px solid #faad14',
                  boxShadow: '0 2px 6px rgba(250, 173, 20, 0.15)',
                  backgroundColor: 'var(--card-background)',
                  color: 'var(--text-primary)'
                }}
                bodyStyle={{ padding: '12px', textAlign: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ClockCircleOutlined style={{ fontSize: '16px', color: '#faad14' }} />
                  <Text strong style={{ fontSize: '0.75rem', color: '#d46b08' }}>
                    Continue Last Test
                  </Text>
                </div>
                <Title
                  level={5}
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textAlign: 'center'
                  }}
                  ellipsis={{ rows: 1 }}
                >
                  {testNamesMap[lastUnfinishedMock.testId] || `Test ${lastUnfinishedMock.testId?.substring(0, 8)}`}
                </Title>
                <Text type="secondary" style={{ fontSize: '0.6875rem', display: 'block', marginBottom: '10px' }}>
                  {lastUnfinishedMock.startDate}
                </Text>
                <Button 
                  type="primary"
                  size="small"
                  block
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  onClick={() => handleContinueTest(lastUnfinishedMock)}
                  style={{
                    borderRadius: '6px',
                    fontWeight: 500,
                    background: '#faad14',
                    borderColor: '#faad14',
                    fontSize: '0.75rem'
                  }}
                >
                  Continue
                </Button>
              </Card>
            )}
            
            {/* Title Section */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Title level={1} style={{ marginBottom: '12px', fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                IELTS Mock Assessment Platform
              </Title>
              <Paragraph style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
                Prepare for your IELTS exam with realistic practice tests
              </Paragraph>
            </div>
          </div>
        </div>

        {/* Tabs for Available Tests and My Mock Exams */}
        <Card style={{
          marginBottom: '24px',
          borderRadius: '12px',
          backgroundColor: 'var(--card-background)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            size="large"
            items={[
              {
                key: 'available',
                label: 'Available Mock Exams',
              },
              {
                key: 'my-mocks',
                label: 'My Mock Exams',
              },
            ]}
          />
        </Card>

        {loading ? (
          <Row gutter={[24, 24]}>
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
              <Col xs={24} sm={12} lg={8} key={`skeleton-${index}`}>
                <Card style={{
                  borderRadius: '12px',
                  height: '180px',
                  backgroundColor: 'var(--card-background)',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : activeTab === 'available' && tests.length === 0 ? (
          <Card
            style={{
              padding: '80px 40px',
              borderRadius: '12px',
              textAlign: 'center',
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ fontSize: 64, color: 'var(--text-secondary)', marginBottom: 24 }}>
              📝
            </div>
            <Title level={3} style={{ marginBottom: 12, color: 'var(--text-primary)' }}>
              No tests available yet
            </Title>
            <Paragraph style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
              Tests will appear here once they are created by administrators.
            </Paragraph>
          </Card>
        ) : activeTab === 'my-mocks' && mocks.length === 0 ? (
          <Card
            style={{
              padding: '80px 40px',
              borderRadius: '12px',
              textAlign: 'center',
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ fontSize: 64, color: 'var(--text-secondary)', marginBottom: 24 }}>
              📋
            </div>
            <Title level={3} style={{ marginBottom: 12, color: 'var(--text-primary)' }}>
              No mock exams yet
            </Title>
            <Paragraph style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
              Start a test from "Available Mock Exams" to see your progress here.
            </Paragraph>
          </Card>
        ) : activeTab === 'available' ? (
          <Row gutter={[12, 12]}>
            {tests.map((t) => (
              <Col xs={24} sm={12} lg={8} key={t.id || t.testId}>
                <Card
                  hoverable
                  className="test-card"
                  style={{
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '70%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  bodyStyle={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1
                  }}
                >
                  {/* Header: Title */}
                  <div style={{ marginBottom: '20px' }}>
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}
                      ellipsis={{ rows: 1 }}
                    >
                      {t.name || t.title || `Test ${t.id}`}
                    </Title>
                  </div>

                  {/* Metadata */}
                  <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileTextOutlined style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {t.description || 'Full IELTS Mock Test'}
                      </span>
                    </div>

                    {t.createdDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarOutlined style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }} />
                        <span style={{ fontSize: '0.875rem', color: '#52c41a', fontWeight: 500 }}>
                          Created {new Date(t.createdDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {t.isActive === 1 && (
                      <div>
                        <Tag color="success">Active</Tag>
                      </div>
                    )}
                  </Space>

                  {/* Footer: Button */}
                  <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto'
                  }}>
                    <Button 
                      type="primary"
                      block
                      size="large"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                      onClick={() => handleOpenTest(t)}
                      style={{
                        borderRadius: '6px',
                        fontWeight: 500,
                        height: '40px',
                        background: '#1677ff',
                        borderColor: '#1677ff'
                      }}
                    >
                      Start Test
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            {mocks.map((mock) => (
              <Col xs={24} sm={12} lg={8} key={mock.id}>
                <Card
                  hoverable
                  className="mock-card"
                  style={{
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  bodyStyle={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1
                  }}
                >
                  {/* Header: Status Badge */}
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag
                      icon={mock.isFinished === 1 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      color={mock.isFinished === 1 ? 'success' : 'processing'}
                      style={{ fontSize: '0.875rem', padding: '4px 12px' }}
                    >
                      {mock.isFinished === 1 ? 'Completed' : 'In Progress'}
                    </Tag>
                    {mock.startDate}
                  </div>

                  {/* Test Title */}
                  <Title
                    level={4}
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                    ellipsis={{ rows: 1 }}
                  >
                    {testNamesMap[mock.testId] || mock.testId?.substring(0, 8) || 'Test'}
                  </Title>

                  {/* Sections with Scores */}
                  {mock.sections && mock.sections.length > 0 && (
                    <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: '16px' }}>
                      {mock.sections.map((section: any) => (
                        <div
                          key={section.id}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                              {section.sectionType}
                            </Text>
                            <Tag
                              color={section.status === 'FINISHED' ? 'success' : section.status === 'IN_PROGRESS' ? 'processing' : 'default'}
                              style={{ fontSize: '0.6875rem', padding: '0 6px', margin: 0 }}
                            >
                              {section.status || 'N/A'}
                            </Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                              {section.correctAnswers !== undefined && section.correctAnswers !== null
                                ? `Correct: ${section.correctAnswers}`
                                : ''}
                            </Text>
                            <Text style={{ fontSize: '0.8125rem', color: '#52c41a', fontWeight: 500 }}>
                              {section.score !== undefined && section.score !== null
                                ? `${section.score}/9.0`
                                : 'Not graded'}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </Space>
                  )}

                  {/* Footer: Action Button */}
                  <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto'
                  }}>
                    {mock.isFinished === 0 ? (
                      <Button 
                        type="primary"
                        block
                        size="large"
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        onClick={() => handleContinueTest(mock)}
                        style={{
                          borderRadius: '6px',
                          fontWeight: 500,
                          height: '40px',
                          background: '#52c41a',
                          borderColor: '#52c41a'
                        }}
                      >
                        Continue Test
                      </Button>
                    ) : (
                      <Button 
                        type="default"
                        block
                        size="large"
                        onClick={() => router.push(`/test/${mock.testId}?mockId=${mock.id}`)}
                        style={{
                          borderRadius: '6px',
                          fontWeight: 500,
                          height: '40px'
                        }}
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {!loading && ((activeTab === 'available' && tests.length > 0) || (activeTab === 'my-mocks' && mocks.length > 0)) && (
          <div style={{
            marginTop: '24px',
            padding: '24px',
            backgroundColor: 'var(--card-background)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderColor: 'var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Text type="secondary" style={{ fontSize: '0.875rem' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, activeTab === 'available' ? totalTests : totalMocks)} of {activeTab === 'available' ? totalTests : totalMocks} {activeTab === 'available' ? 'tests' : 'mocks'}
            </Text>
            <Pagination
              current={currentPage}
              total={activeTab === 'available' ? totalTests : totalMocks}
              pageSize={pageSize}
              onChange={(page, newPageSize) => {
                console.log('Page changed:', page, 'New page size:', newPageSize)
                if (newPageSize && newPageSize !== pageSize) {
                  // Page size changed
                  setPageSize(newPageSize)
                  setCurrentPage(1) // Reset to first page when page size changes
                } else {
                  // Just page changed
                  setCurrentPage(page)
                }
              }}
              showSizeChanger
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
              pageSizeOptions={['6', '9', '12', '18', '24']}
              style={{ display: 'flex', alignItems: 'center' }}
            />
          </div>
        )}

        {activeTab === 'available' && tests.length > 0 && (
          <div className="mt-6 text-center">
            <Card style={{
              borderRadius: '12px',
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Title level={4} style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Welcome to IELTS Mock Assessment</Title>
              <Paragraph style={{ marginBottom: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                This platform helps you prepare for all four modules of the IELTS exam.
                Select a test above to start your practice session.
              </Paragraph>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleOutlined style={{ color: '#1677ff', fontSize: '20px' }} />
            <span>Start Test</span>
          </div>
        }
        open={showConfirmModal}
        onOk={handleConfirmStart}
        onCancel={handleCancelStart}
        okText="Start Test"
        cancelText="Cancel"
        confirmLoading={startingTest}
        okButtonProps={{
          size: 'large',
          style: { minWidth: '120px' }
        }}
        cancelButtonProps={{
          size: 'large',
          style: { minWidth: '120px' }
        }}
      >
        <div style={{ padding: '16px 0' }}>
          <Paragraph style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
            You are about to start:
          </Paragraph>
          <Title level={5} style={{ marginBottom: '16px', color: '#1677ff' }}>
            {selectedTest?.name || selectedTest?.title || 'IELTS Mock Test'}
          </Title>
          <Paragraph style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Once you start the test:
          </Paragraph>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: 0 }}>
            <li>Your test session will begin</li>
            <li>You can complete sections at your own pace</li>
            <li>Your answers will be automatically saved</li>
          </ul>
        </div>
      </Modal>
    </div>
  )
})

export default withAuth(HomePage)
