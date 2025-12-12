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
  Tag
} from 'antd'
import {
  HomeOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Logo from '@/components/common/Logo'
import { mockResultApi, MockResultDto, SectionResult } from '@/services/mockResultApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'
import { parseCustomDate } from '@/utils/dateUtils'
import { useStore } from '@/stores/StoreContext'
import { observer } from 'mobx-react-lite'

const { Header, Content } = Layout
const { Title, Text } = Typography

const ResultsManagementPage = observer(() => {
  const router = useRouter()
  const { adminStore } = useStore()
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
      const resultsList = response.data || []
      setResults(resultsList)
      setTotalResults(response.totalCount || 0)

      // Store results in AdminStore for later use
      adminStore.storeMockResults(resultsList)
    } catch (error: any) {
      console.error('Error fetching results:', error)
      message.error(error.response?.data?.reason || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  // Helper to get section by type
  const getSectionByType = (record: MockResultDto, sectionType: 'LISTENING' | 'READING' | 'WRITING'): SectionResult | undefined => {
    return record.sections?.find(s => s.sectionType === sectionType)
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      'COMPLETED': { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      'IN_PROGRESS': { color: 'processing', icon: <ClockCircleOutlined />, text: 'In Progress' },
      'STARTED': { color: 'warning', icon: <ClockCircleOutlined />, text: 'Started' },
      'ABANDONED': { color: 'default', icon: <ClockCircleOutlined />, text: 'Abandoned' },
      'NOT_STARTED': { color: 'default', icon: null, text: 'Not Started' },
      'FINISHED': { color: 'success', icon: <CheckCircleOutlined />, text: 'Finished' }
    }
    
    const statusInfo = statusMap[status] || { color: 'default', icon: null, text: status }
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    )
  }

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'testName',
      key: 'testName',
      render: (text: string, record: MockResultDto) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: 'var(--text-primary)' }}>{text || 'Unnamed Test'}</Text>
          <Text type="secondary" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ID: {record.testId?.substring(0, 8)}...
          </Text>
        </Space>
      )
    },
    {
      title: 'Student First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      render: (text: string, record: MockResultDto) => (
        <Text style={{ color: 'var(--text-primary)' }}>{text || record.userFirstName || record.userName?.split(' ')[0] || '-'}</Text>
      )
    },
    {
      title: 'Student Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      render: (text: string, record: MockResultDto) => (
        <Text style={{ color: 'var(--text-primary)' }}>{text || record.userLastName || record.userName?.split(' ')[1] || '-'}</Text>
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
      key: 'listening',
      align: 'center' as const,
      render: (_: any, record: MockResultDto) => {
        const section = getSectionByType(record, 'LISTENING')
        if (!section) return null
        
        return (
          <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
            {getStatusTag(section.status)}
            {section.correctAnswers !== null && section.correctAnswers !== undefined && (
              <Text type="secondary" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Correct: {section.correctAnswers}
              </Text>
            )}
            {section.score !== null && section.score !== undefined && (
              <Text strong style={{ color: '#52c41a' }}>
                {section.score.toFixed(1)}
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Reading',
      key: 'reading',
      align: 'center' as const,
      render: (_: any, record: MockResultDto) => {
        const section = getSectionByType(record, 'READING')
        if (!section) return null
        
        return (
          <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
            {getStatusTag(section.status)}
            {section.correctAnswers !== null && section.correctAnswers !== undefined && (
              <Text type="secondary" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Correct: {section.correctAnswers}
              </Text>
            )}
            {section.score !== null && section.score !== undefined && (
              <Text strong style={{ color: '#52c41a' }}>
                {section.score.toFixed(1)}
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Writing',
      key: 'writing',
      align: 'center' as const,
      render: (_: any, record: MockResultDto) => {
        const section = getSectionByType(record, 'WRITING')
        if (!section) return null
        
        return (
          <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
            {getStatusTag(section.status)}
            {section.score !== null && section.score !== undefined && (
              <Text strong style={{ color: '#52c41a' }}>
                {section.score.toFixed(1)}
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string, record: MockResultDto) => {
        console.log('Start Date - Raw value:', date, 'Record:', record)

        if (!date) return <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>N/A</Text>

        const dateObj = parseCustomDate(date)
        console.log('Start Date - Parsed:', dateObj)

        if (!dateObj) return <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>Invalid Date</Text>

        return (
          <Space>
            <CalendarOutlined style={{ color: 'var(--text-secondary)' }} />
            <Text style={{ color: 'var(--text-primary)' }}>
              {dateObj.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Space>
        )
      }
    },
  ]


  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <Header style={{
        backgroundColor: 'var(--header-background)',
        borderBottom: '1px solid var(--border-color)',
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Logo size="medium" />
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.3' }}>
            Results Management
          </Title>
        </div>
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
        backgroundColor: 'var(--background)',
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
              <Title level={2} style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
                Mock Test Results
              </Title>
              <Text type="secondary" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
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

          {/* Results Table */}
          <Card
            style={{
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <Table
              columns={columns}
              dataSource={results}
              loading={loading}
              rowKey={(record) => record.id}
              onRow={(record) => ({
                onClick: () => {
                  // Navigate to preview page with testId and result info
                  console.log("Test record", record)
                  router.push(`/admin/results/${record.id}/preview?testId=${record.testId}`)
                },
                style: { cursor: 'pointer' }
              })}
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
})

export default withAuth(ResultsManagementPage, { requireAdmin: true })
