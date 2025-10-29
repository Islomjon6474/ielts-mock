'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Button, Row, Col, message, Modal, Form, Input, Tag, Pagination, Space } from 'antd'
import { PlusOutlined, HomeOutlined, FileTextOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

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
  const pageSize = 9 // 3x3 grid

  useEffect(() => {
    fetchTests(currentPage - 1)
  }, [currentPage])

  const fetchTests = async (page: number) => {
    try {
      setLoading(true)
      const response = await testManagementApi.getAllTests(page, pageSize)
      const data = response.data || response
      setTests(Array.isArray(data) ? data : data.content || [])
      setTotalTests(data.totalCount || data.totalElements || 0)
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
        <Button 
          icon={<HomeOutlined />}
          onClick={() => router.push('/')}
          size="large"
        >
          Back to Home
        </Button>
      </Header>

      <Content style={{ padding: '48px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Page Title and Create Button */}
          <div className="text-center mb-12">
            <Title level={2} style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>
              Available Mock Examinations
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Practice with realistic IELTS mock exams from your test library
            </Text>
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
          </div>

          {/* Test Cards Grid - 3 per row */}
          <Row gutter={[24, 24]}>
            {tests.map((test) => (
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
                  {/* Header: Title and Status */}
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
                    <Tag 
                      color={test.isActive === 1 ? 'success' : 'default'}
                      style={{ 
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 8px',
                        margin: 0
                      }}
                    >
                      {test.isActive === 1 ? 'Active' : 'Inactive'}
                    </Tag>
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
                        Created {test.createdDate ? new Date(test.createdDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </Text>
                    </div>
                  </Space>

                  {/* Footer: Price and Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      Admin
                    </Text>
                    <Button 
                      type="primary"
                      onClick={() => handleTestClick(test.id)}
                      style={{
                        borderRadius: '6px',
                        fontWeight: 500,
                        height: '36px',
                        paddingLeft: '20px',
                        paddingRight: '20px'
                      }}
                    >
                      View Details →
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalTests > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={currentPage}
                total={totalTests}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </div>
          )}

          {/* Empty State */}
          {!loading && tests.length === 0 && (
            <Card className="text-center py-12">
              <Title level={4} type="secondary">No tests yet</Title>
              <Text type="secondary">Create your first test to get started</Text>
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create Test
                </Button>
              </div>
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

export default AdminPage
