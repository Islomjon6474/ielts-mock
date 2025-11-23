'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Typography, Card, Row, Col, Button, Empty, Spin, Space, Tag, Pagination, Skeleton, Modal } from 'antd'
import { FileTextOutlined, SettingOutlined, CalendarOutlined, ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { mockSubmissionApi } from '@/services/testManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Title, Paragraph, Text } = Typography

const HomePage = observer(() => {
  const { appStore, authStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])
  const pathname = usePathname()
  const [renderKey, setRenderKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTests, setTotalTests] = useState(0)
  const [pageSize, setPageSize] = useState(9) // 3x3 grid
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [startingTest, setStartingTest] = useState(false)

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        
        // Scroll to top on page change for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        const response = await mockSubmissionApi.getAllTests(currentPage - 1, pageSize)
        
        // Response format: { success: true, data: [tests], totalCount: X }
        const testsData = response?.data || []
        const total = response?.totalCount || 0
        
        setTests(testsData)
        setTotalTests(total)
      } catch (error) {
        console.error('Error fetching tests:', error)
        setTests([])
        setTotalTests(0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentPage, pageSize])
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
      
      // Navigate to test page with mockId
      router.push(`/test/${id}?mockId=${mockId}`)
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
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
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
          <Title level={1} style={{ marginBottom: '12px', fontSize: '36px', fontWeight: 700 }}>
            IELTS Mock Assessment Platform
          </Title>
          <Paragraph style={{ fontSize: '18px', color: '#595959', marginBottom: 0 }}>
            Prepare for your IELTS exam with realistic practice tests
          </Paragraph>
        </div>

        {loading ? (
          <Row gutter={[24, 24]}>
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
              <Col xs={24} sm={12} lg={8} key={`skeleton-${index}`}>
                <Card style={{ 
                  borderRadius: '12px',
                  height: '180px',
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : tests.length === 0 ? (
          <Card 
            style={{ 
              padding: '80px 40px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }}>
              📝
            </div>
            <Title level={3} style={{ marginBottom: 12 }}>
              No tests available yet
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: 0 }}>
              Tests will appear here once they are created by administrators.
            </Paragraph>
          </Card>
        ) : (
          <Row gutter={[12, 12]}>
            {tests.map((t) => (
              <Col xs={24} sm={12} lg={8} key={t.id || t.testId}>
                <Card
                  hoverable
                  className="test-card"
                  style={{ 
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8',
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
                        fontSize: '18px',
                        fontWeight: 600
                      }}
                      ellipsis={{ rows: 1 }}
                    >
                      {t.name || t.title || `Test ${t.id}`}
                    </Title>
                  </div>

                  {/* Metadata */}
                  <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileTextOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
                      <span style={{ fontSize: '14px', color: '#595959' }}>
                        {t.description || 'Full IELTS Mock Test'}
                      </span>
                    </div>
                    
                    {t.createdDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
                        <span style={{ fontSize: '14px', color: '#52c41a', fontWeight: 500 }}>
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
                    borderTop: '1px solid #f0f0f0',
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
        )}

        {/* Pagination */}
        {!loading && tests.length > 0 && (
          <div style={{ 
            marginTop: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            border: '1px solid #e8e8e8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTests)} of {totalTests} tests
            </Text>
            <Pagination
              current={currentPage}
              total={totalTests}
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

        {tests.length > 0 && (
          <div className="mt-6 text-center">
            <Card style={{ 
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Title level={4} style={{ marginBottom: '12px' }}>Welcome to IELTS Mock Assessment</Title>
              <Paragraph style={{ marginBottom: 0, fontSize: '16px', color: '#595959' }}>
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
          <Paragraph style={{ fontSize: '16px', marginBottom: '12px' }}>
            You are about to start:
          </Paragraph>
          <Title level={5} style={{ marginBottom: '16px', color: '#1677ff' }}>
            {selectedTest?.name || selectedTest?.title || 'IELTS Mock Test'}
          </Title>
          <Paragraph style={{ fontSize: '14px', color: '#595959', marginBottom: '8px' }}>
            Once you start the test:
          </Paragraph>
          <ul style={{ fontSize: '14px', color: '#595959', paddingLeft: '20px', marginBottom: 0 }}>
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
