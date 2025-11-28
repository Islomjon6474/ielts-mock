'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Button, Row, Col, message, Modal, Form, Input, Tag, Pagination, Space, Skeleton, Switch } from 'antd'
import { PlusOutlined, HomeOutlined, FileTextOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, DeleteOutlined, ExclamationCircleOutlined, UserOutlined, TeamOutlined, TrophyOutlined, EditOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'
import { parseCustomDate } from '@/utils/dateUtils'

const { Header, Content } = Layout
const { Title, Text } = Typography

const AdminPage = () => {
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTests, setTotalTests] = useState(0)
  const [pageSize, setPageSize] = useState(9) // 3x3 grid

  useEffect(() => {
    fetchTests(currentPage - 1)
  }, [currentPage, pageSize])

  const fetchTests = async (page: number) => {
    try {
      setLoading(true)
      const response = await testManagementApi.getAllTests(page, pageSize)
      
      console.log('API Response:', response)
      
      // Response format: { success: true, data: [tests], totalCount: X }
      const tests = response.data || []
      const total = response.totalCount || 0
      
      console.log('Tests:', tests)
      console.log('Total Count:', total)
      
      setTests(tests)
      setTotalTests(total)
    } catch (error) {
      console.error('Error fetching tests:', error)
      message.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTest = async () => {
    try {
      const values = await createForm.validateFields()
      const response = await testManagementApi.createTest(values.name)
      
      // Response format: { success: boolean, data: UUID }
      const testId = response.data
      
      if (!testId) {
        throw new Error('Failed to create test - no ID returned')
      }

      message.success('Test created successfully!')
      setIsCreateModalOpen(false)
      createForm.resetFields()
      
      // Navigate to the new test
      router.push(`/admin/test/${testId}`)
    } catch (error: any) {
      console.error('Error creating test:', error)
      if (error.errorFields) {
        // Validation error
        return
      }
      message.error('Failed to create test')
    }
  }

  const handleTestClick = (testId: string) => {
    router.push(`/admin/test/${testId}`)
  }

  const handleDeleteTest = (testId: string, testName: string) => {
    Modal.confirm({
      title: 'Delete Test',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${testName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await testManagementApi.deleteTest(testId)
          message.success('Test deleted successfully')
          // Refresh the tests list
          fetchTests(currentPage - 1)
        } catch (error) {
          console.error('Error deleting test:', error)
          message.error('Failed to delete test')
        }
      },
    })
  }

  const handleToggleStatus = async (testId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    
    // Optimistically update the UI
    setTests(prevTests => 
      prevTests.map(test => 
        test.id === testId 
          ? { ...test, isActive: newStatus }
          : test
      )
    )
    
    try {
      await testManagementApi.updateTestActive(testId, newStatus)
      message.success(`Test ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating test status:', error)
      message.error('Failed to update test status')
      // Revert on error
      setTests(prevTests => 
        prevTests.map(test => 
          test.id === testId 
            ? { ...test, isActive: currentStatus }
            : test
        )
      )
    }
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
          IELTS Admin Panel
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            icon={<TeamOutlined />}
            onClick={() => router.push('/admin/users')}
            size="large"
            type="default"
          >
            Users
          </Button>
          <Button 
            icon={<TrophyOutlined />}
            onClick={() => router.push('/admin/results')}
            size="large"
            type="default"
          >
            Mock Management
          </Button>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
            size="large"
          >
            Home
          </Button>
          <UserMenu />
        </div>
      </Header>

      <Content style={{ 
        padding: '48px', 
        background: '#f5f5f5', 
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="max-w-7xl mx-auto" style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          {/* Page Title and Create Button - Only show button when tests exist */}
          <div className="text-center mb-12">
            <Title level={2} style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>
              Available Mock Examinations
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Practice with realistic IELTS mock exams from your test library
            </Text>
            {!loading && tests.length > 0 && (
              <div className="mt-6">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ 
                    background: '#1677ff',
                    borderColor: '#1677ff',
                    height: 48,
                    paddingLeft: 32,
                    paddingRight: 32,
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  Create New Test
                </Button>
              </div>
            )}
          </div>

          {/* Test Cards Grid - 3 per row */}
          <div style={{ flex: 1, marginBottom: '24px' }}>
            <Row gutter={[24, 24]}>
              {loading ? (
                // Loading skeleton - show minimum of 6 cards for better UX
                Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                  <Col xs={24} sm={12} lg={8} key={`skeleton-${index}`}>
                    <Card style={{ 
                      borderRadius: '12px',
                      height: '280px'
                    }}>
                      <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>
                  </Col>
                ))
              ) : (
                tests.map((test) => (
              <Col xs={24} sm={12} lg={8} key={test.id}>
                <Card
                  hoverable
                  style={{ 
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '100%'
                  }}
                  bodyStyle={{ 
                    padding: '20px'
                  }}
                  className="test-card"
                >
                  {/* Header: Title and Delete Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '20px'
                  }}>
                    <Title 
                      level={4} 
                      style={{ 
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 600,
                        flex: 1,
                        paddingRight: '12px'
                      }}
                      ellipsis={{ rows: 1 }}
                    >
                      {test.name}
                    </Title>
                    <Button 
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTest(test.id, test.name)
                      }}
                      style={{
                        color: '#ff4d4f',
                        fontSize: '16px'
                      }}
                      title="Delete test"
                    />
                  </div>

                  {/* Metadata */}
                  <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileTextOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Available Tests: 3 sections
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarOutlined style={{ color: '#8c8c8c', fontSize: '14px' }} />
                      <Text style={{ fontSize: '14px', color: '#52c41a', fontWeight: 500 }}>
                        Created {(() => {
                          if (!test.createdDate) return 'N/A'
                          const date = parseCustomDate(test.createdDate)
                          if (!date) return 'Invalid Date'
                          // Format as "7 Nov 2025" (day first, then month) to match DD.MM.YYYY format
                          return date.toLocaleDateString('en-GB', { 
                            day: 'numeric',
                            month: 'short', 
                            year: 'numeric' 
                          })
                        })()}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                        Status:
                      </Text>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={test.isActive === 1}
                          onChange={() => handleToggleStatus(test.id, test.isActive)}
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                        />
                      </div>
                    </div>
                  </Space>

                  {/* Footer: Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Button 
                      onClick={() => window.open(`/admin/reading/preview/${test.id}`, '_blank')}
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        fontWeight: 500,
                        height: '36px'
                      }}
                    >
                      Preview
                    </Button>
                    <Button 
                      type="primary"
                      onClick={() => window.open(`/admin/test/${test.id}`, '_blank')}
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        fontWeight: 500,
                        height: '36px'
                      }}
                    >
                      Manage →
                    </Button>
                  </div>
                </Card>
              </Col>
            ))
            )}
            </Row>
          </div>

          {/* Pagination */}
          {!loading && tests.length > 0 && (
            <div style={{ 
              marginTop: 'auto',
              padding: '24px',
              background: '#fff',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
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

          {/* Empty State */}
          {!loading && tests.length === 0 && (
            <Card 
              className="text-center" 
              style={{ 
                padding: '80px 40px',
                borderRadius: '12px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                fontSize: 64, 
                color: '#d9d9d9', 
                marginBottom: 24 
              }}>
                📝
              </div>
              <Title level={3} style={{ marginBottom: 12 }}>
                No tests yet
              </Title>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: 32 }}>
                Create your first test to get started with your IELTS mock examinations
              </Text>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                style={{ 
                  background: '#1677ff',
                  borderColor: '#1677ff',
                  height: 48,
                  paddingLeft: 32,
                  paddingRight: 32,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Create New Test
              </Button>
            </Card>
          )}
        </div>
      </Content>

      {/* Create Test Modal */}
      <Modal
        title="Create New Test"
        open={isCreateModalOpen}
        onOk={handleCreateTest}
        onCancel={() => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={createForm}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="Test Name"
            name="name"
            rules={[{ required: true, message: 'Please enter test name' }]}
          >
            <Input 
              placeholder="e.g., IELTS Practice Test 1" 
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default withAuth(AdminPage, { requireAdmin: true })
