'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Card, Button, Table, Space, message } from 'antd'
import { PlusOutlined, BookOutlined, SoundOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const { Header, Sider, Content } = Layout
const { Title, Paragraph } = Typography

const AdminPage = () => {
  const router = useRouter()
  const [selectedMenu, setSelectedMenu] = useState('reading')
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch tests from API
  useEffect(() => {
    if (selectedMenu === 'reading') {
      fetchTests()
    }
  }, [selectedMenu])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const response = await testManagementApi.getAllTests(0, 10)
      setTests(response.content || response || [])
    } catch (error) {
      console.error('Error fetching tests:', error)
      message.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (testId: string) => {
    // Note: Delete API is not in the provided list, but we can add it later
    message.info('Delete functionality will be implemented when API is available')
  }

  const columns = [
    {
      title: 'Test Title',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Test ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => router.push(`/admin/reading/test/${record.id}`)}
          >
            Manage
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const renderContent = () => {
    switch (selectedMenu) {
      case 'reading':
        return (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <Title level={4} className="mb-0">Reading Tests</Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/admin/reading/create')}
              >
                Create New Test
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={tests}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        )
      case 'listening':
        return (
          <Card>
            <Title level={4}>Listening Tests</Title>
            <Paragraph type="secondary">Coming soon...</Paragraph>
          </Card>
        )
      case 'writing':
        return (
          <Card>
            <Title level={4}>Writing Tasks</Title>
            <Paragraph type="secondary">Coming soon...</Paragraph>
          </Card>
        )
      case 'settings':
        return (
          <Card>
            <Title level={4}>Settings</Title>
            <Paragraph type="secondary">Application settings...</Paragraph>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <Layout className="min-h-screen" style={{ background: '#fff' }}>
      {/* Header */}
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0, color: '#cf1322' }}>IELTS Admin Panel</Title>
        <Button type="primary" onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </Header>

      <Layout style={{ background: '#fff' }}>
        {/* Sidebar */}
        <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            style={{ height: '100%', borderRight: 0, background: '#fff' }}
            items={[
              {
                key: 'reading',
                icon: <BookOutlined />,
                label: 'Reading Tests',
                onClick: () => setSelectedMenu('reading'),
              },
              {
                key: 'listening',
                icon: <SoundOutlined />,
                label: 'Listening Tests',
                onClick: () => setSelectedMenu('listening'),
              },
              {
                key: 'writing',
                icon: <EditOutlined />,
                label: 'Writing Tasks',
                onClick: () => setSelectedMenu('writing'),
              },
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Settings',
                onClick: () => setSelectedMenu('settings'),
              },
            ]}
          />
        </Sider>

        {/* Main Content */}
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminPage
