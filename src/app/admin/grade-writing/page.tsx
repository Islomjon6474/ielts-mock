'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Typography, 
  Card, 
  Button, 
  Table, 
  message, 
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Divider,
  Spin,
  Row,
  Col,
  Statistic
} from 'antd'
import { 
  HomeOutlined, 
  ReloadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { mockResultApi, MockResultDto, GradeWritingDto, WritingGradeResult } from '@/services/mockResultApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const GradeWritingPage = () => {
  const router = useRouter()
  const [results, setResults] = useState<MockResultDto[]>([])
  const [loading, setLoading] = useState(false)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<MockResultDto | null>(null)
  const [grading, setGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState<WritingGradeResult | null>(null)
  const [gradeForm] = Form.useForm()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    fetchResults(currentPage - 1, pageSize)
  }, [currentPage, pageSize])

  const fetchResults = async (page: number, size: number) => {
    try {
      setLoading(true)
      const response = await mockResultApi.getAllMockResults(page, size)
      console.log('Results response:', response)
      
      // Filter results that need writing grading (no writing score or status is completed)
      const resultsList = (response.data || []).filter(r => 
        r.status === 'COMPLETED' && (!r.writingScore || r.writingScore === 0)
      )
      
      setResults(resultsList)
      setTotalResults(resultsList.length)
    } catch (error: any) {
      console.error('Error fetching results:', error)
      message.error(error.response?.data?.reason || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const openGradeModal = (result: MockResultDto) => {
    setSelectedResult(result)
    setGradeResult(null)
    setIsGradeModalOpen(true)
    gradeForm.resetFields()
  }

  const handleGradeWriting = async () => {
    try {
      const values = await gradeForm.validateFields()
      
      if (!selectedResult) {
        message.error('No result selected')
        return
      }

      setGrading(true)

      const gradeData: GradeWritingDto = {
        writingAnswer: values.writingAnswer,
        writingQuestion: values.writingQuestion,
        writingType: values.writingType
      }

      const response = await mockResultApi.gradeWriting(gradeData)
      
      console.log('Grade response:', response)
      
      // Extract grade result from response
      const result = response.data || response
      setGradeResult(result as WritingGradeResult)
      
      message.success('Writing graded successfully!')
      
      // Refresh the results list
      fetchResults(currentPage - 1, pageSize)
    } catch (error: any) {
      console.error('Error grading writing:', error)
      if (error.errorFields) {
        // Validation error
        return
      }
      message.error(error.response?.data?.reason || 'Failed to grade writing')
    } finally {
      setGrading(false)
    }
  }

  const closeGradeModal = () => {
    setIsGradeModalOpen(false)
    setSelectedResult(null)
    setGradeResult(null)
    gradeForm.resetFields()
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'COMPLETED': { color: 'success', text: 'Completed' },
      'IN_PROGRESS': { color: 'processing', text: 'In Progress' },
      'STARTED': { color: 'warning', text: 'Started' }
    }
    
    const statusInfo = statusMap[status] || { color: 'default', text: status }
    
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'testName',
      key: 'testName',
      render: (text: string, record: MockResultDto) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || 'Unnamed Test'}</Text>
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>
            ID: {record.testId?.substring(0, 8)}...
          </Text>
        </Space>
      )
    },
    {
      title: 'Student',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string, record: MockResultDto) => (
        <Text>{text || record.userId}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Listening',
      dataIndex: 'listeningScore',
      key: 'listeningScore',
      align: 'center' as const,
      render: (score: number) => (
        <Text strong style={{ color: score > 0 ? '#52c41a' : '#8c8c8c' }}>
          {score > 0 ? score.toFixed(1) : '-'}
        </Text>
      )
    },
    {
      title: 'Reading',
      dataIndex: 'readingScore',
      key: 'readingScore',
      align: 'center' as const,
      render: (score: number) => (
        <Text strong style={{ color: score > 0 ? '#52c41a' : '#8c8c8c' }}>
          {score > 0 ? score.toFixed(1) : '-'}
        </Text>
      )
    },
    {
      title: 'Writing',
      dataIndex: 'writingScore',
      key: 'writingScore',
      align: 'center' as const,
      render: (score: number) => (
        <Tag color={score > 0 ? 'success' : 'warning'}>
          {score > 0 ? score.toFixed(1) : 'Pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: MockResultDto) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => openGradeModal(record)}
          size="small"
        >
          Grade Writing
        </Button>
      )
    }
  ]

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
          Grade Writing
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            icon={<HomeOutlined />}
            onClick={() => router.push('/admin')}
            size="large"
          >
            Back to Admin
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
          {/* Page Title and Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <Title level={2} style={{ marginBottom: '8px' }}>
                Writing Submissions
              </Title>
              <Text type="secondary" style={{ fontSize: '1rem' }}>
                Grade student writing submissions using AI-powered analysis
              </Text>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchResults(currentPage - 1, pageSize)}
              loading={loading}
              size="large"
            >
              Refresh
            </Button>
          </div>

          {/* Pending Grading Count */}
          <Card style={{ marginBottom: '24px' }}>
            <Statistic
              title="Pending Writing Submissions"
              value={totalResults}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>

          {/* Results Table */}
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <Table
              columns={columns}
              dataSource={results}
              loading={loading}
              rowKey={(record) => record.id}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalResults,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} submissions`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, newPageSize) => {
                  if (newPageSize && newPageSize !== pageSize) {
                    setPageSize(newPageSize)
                    setCurrentPage(1)
                  } else {
                    setCurrentPage(page)
                  }
                }
              }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </div>
      </Content>

      {/* Grade Writing Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Grade Writing Submission</span>
          </Space>
        }
        open={isGradeModalOpen}
        onOk={handleGradeWriting}
        onCancel={closeGradeModal}
        okText={gradeResult ? "Close" : "Grade Writing"}
        cancelText="Cancel"
        width={900}
        okButtonProps={{ loading: grading, disabled: !!gradeResult }}
        cancelButtonProps={{ disabled: grading }}
      >
        {selectedResult && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--card-background)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Student: </Text>
                <Text>{selectedResult.userName || selectedResult.userId}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Test: </Text>
                <Text>{selectedResult.testName || 'Unnamed Test'}</Text>
              </Col>
            </Row>
          </div>
        )}

        {!gradeResult ? (
          <Form
            form={gradeForm}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              label="Writing Type"
              name="writingType"
              rules={[{ required: true, message: 'Please select writing type' }]}
            >
              <Select size="large" placeholder="Select writing type">
                <Select.Option value="TASK_1">Task 1 (Report/Letter)</Select.Option>
                <Select.Option value="TASK_2">Task 2 (Essay)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Writing Question/Prompt"
              name="writingQuestion"
              rules={[
                { required: true, message: 'Please enter the writing question' },
                { min: 10, message: 'Question must be at least 10 characters' }
              ]}
            >
              <TextArea
                placeholder="Enter the writing task prompt/question..."
                rows={4}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Student's Writing Answer"
              name="writingAnswer"
              rules={[
                { required: true, message: 'Please enter the student\'s answer' },
                { min: 50, message: 'Answer must be at least 50 characters' }
              ]}
            >
              <TextArea
                placeholder="Paste the student's writing response here..."
                rows={10}
                size="large"
              />
            </Form.Item>
          </Form>
        ) : (
          <div>
            <Divider>Grading Results</Divider>
            
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card>
                  <Statistic
                    title="Overall Writing Score"
                    value={gradeResult.score}
                    precision={1}
                    suffix="/ 9.0"
                    valueStyle={{ color: '#52c41a', fontSize: '2.25rem' }}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {(gradeResult.taskAchievement || gradeResult.coherenceCohesion || 
              gradeResult.lexicalResource || gradeResult.grammaticalRange) && (
              <>
                <Divider>Band Score Breakdown</Divider>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  {gradeResult.taskAchievement && (
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Task Achievement"
                          value={gradeResult.taskAchievement}
                          precision={1}
                          suffix="/ 9.0"
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                  )}
                  {gradeResult.coherenceCohesion && (
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Coherence & Cohesion"
                          value={gradeResult.coherenceCohesion}
                          precision={1}
                          suffix="/ 9.0"
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                  )}
                  {gradeResult.lexicalResource && (
                    <Col span={12} style={{ marginTop: '16px' }}>
                      <Card size="small">
                        <Statistic
                          title="Lexical Resource"
                          value={gradeResult.lexicalResource}
                          precision={1}
                          suffix="/ 9.0"
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                  )}
                  {gradeResult.grammaticalRange && (
                    <Col span={12} style={{ marginTop: '16px' }}>
                      <Card size="small">
                        <Statistic
                          title="Grammatical Range & Accuracy"
                          value={gradeResult.grammaticalRange}
                          precision={1}
                          suffix="/ 9.0"
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                  )}
                </Row>
              </>
            )}

            {gradeResult.feedback && (
              <>
                <Divider>Detailed Feedback</Divider>
                <Card>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {gradeResult.feedback}
                  </Paragraph>
                </Card>
              </>
            )}

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '3rem', color: '#52c41a' }} />
              <Title level={4} style={{ marginTop: '16px', color: '#52c41a' }}>
                Writing Graded Successfully!
              </Title>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

export default withAuth(GradeWritingPage, { requireAdmin: true })
