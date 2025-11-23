'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Typography, 
  Card, 
  Button, 
  Table, 
  message, 
  Space,
  Tag,
  Tooltip,
  Statistic,
  Row,
  Col
} from 'antd'
import { 
  HomeOutlined, 
  ReloadOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { mockResultApi, MockResultDto } from '@/services/mockResultApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Header, Content } = Layout
const { Title, Text } = Typography

const ResultsManagementPage = () => {
  const router = useRouter()
  const [results, setResults] = useState<MockResultDto[]>([])
  const [loading, setLoading] = useState(false)
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
      
      const resultsList = response.data || []
      setResults(resultsList)
      setTotalResults(response.totalCount || 0)
    } catch (error: any) {
      console.error('Error fetching results:', error)
      message.error(error.response?.data?.reason || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      'COMPLETED': { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      'IN_PROGRESS': { color: 'processing', icon: <ClockCircleOutlined />, text: 'In Progress' },
      'STARTED': { color: 'warning', icon: <ClockCircleOutlined />, text: 'Started' },
      'ABANDONED': { color: 'default', icon: <ClockCircleOutlined />, text: 'Abandoned' }
    }
    
    const statusInfo = statusMap[status] || { color: 'default', icon: null, text: status }
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    )
  }

  const calculateTotalScore = (record: MockResultDto) => {
    const listening = record.listeningScore || 0
    const reading = record.readingScore || 0
    const writing = record.writingScore || 0
    
    if (listening === 0 && reading === 0 && writing === 0) {
      return 'N/A'
    }
    
    const count = (listening > 0 ? 1 : 0) + (reading > 0 ? 1 : 0) + (writing > 0 ? 1 : 0)
    const total = (listening + reading + writing) / (count || 1)
    
    return total.toFixed(1)
  }

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'testName',
      key: 'testName',
      render: (text: string, record: MockResultDto) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || 'Unnamed Test'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
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
        <Space>
          <UserOutlined style={{ color: '#1677ff' }} />
          <Text>{text || record.userId}</Text>
        </Space>
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
        <Text strong style={{ color: score > 0 ? '#52c41a' : '#8c8c8c' }}>
          {score > 0 ? score.toFixed(1) : '-'}
        </Text>
      )
    },
    {
      title: 'Overall',
      key: 'totalScore',
      align: 'center' as const,
      render: (_: any, record: MockResultDto) => {
        const total = calculateTotalScore(record)
        return (
          <Text strong style={{ color: total !== 'N/A' ? '#1677ff' : '#8c8c8c', fontSize: '16px' }}>
            {total}
          </Text>
        )
      }
    },
    {
      title: 'Started',
      dataIndex: 'startedDate',
      key: 'startedDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text>
            {date ? new Date(date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Finished',
      dataIndex: 'finishedDate',
      key: 'finishedDate',
      render: (date: string) => (
        date ? (
          <Space>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <Text>
              {new Date(date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    }
  ]

  // Calculate statistics
  const completedTests = results.filter(r => r.status === 'COMPLETED').length
  const inProgressTests = results.filter(r => r.status === 'IN_PROGRESS' || r.status === 'STARTED').length
  const averageScore = results.length > 0 
    ? results.reduce((sum, r) => {
        const total = calculateTotalScore(r)
        return sum + (total !== 'N/A' ? parseFloat(total) : 0)
      }, 0) / results.filter(r => calculateTotalScore(r) !== 'N/A').length
    : 0

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
          Results Management
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
        background: '#f5f5f5', 
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
                Mock Test Results
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                View and analyze student test results and performance
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

          {/* Statistics Cards */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Results"
                  value={totalResults}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Completed Tests"
                  value={completedTests}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average Score"
                  value={averageScore.toFixed(1)}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  suffix="/ 9.0"
                />
              </Card>
            </Col>
          </Row>

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
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} results`,
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
    </Layout>
  )
}

export default withAuth(ResultsManagementPage, { requireAdmin: true })
