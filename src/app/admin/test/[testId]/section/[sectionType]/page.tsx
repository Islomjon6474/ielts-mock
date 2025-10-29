'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Button, Table, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface Part {
  id: string
  ord: number
  questionCount: number
}

const SectionPartsPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const testId = params.testId as string
  const sectionType = params.sectionType as string
  const sectionId = searchParams.get('sectionId') || ''

  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sectionId) {
      fetchParts()
    }
  }, [sectionId])

  const fetchParts = async () => {
    try {
      setLoading(true)
      const response = await testManagementApi.getAllParts(sectionId)
      const partsData = response.data || response || []
      setParts(partsData)
    } catch (error) {
      console.error('Error fetching parts:', error)
      message.error('Failed to load parts')
    } finally {
      setLoading(false)
    }
  }

  const handlePartClick = (partId: string) => {
    router.push(`/admin/test/${testId}/section/${sectionType}/part/${partId}?sectionId=${sectionId}`)
  }

  const columns = [
    {
      title: 'Parts',
      dataIndex: 'ord',
      key: 'ord',
      render: (ord: number) => (
        <Text strong>
          Part {ord}
        </Text>
      ),
    },
    {
      title: 'Questions Count',
      dataIndex: 'questionCount',
      key: 'questionCount',
      align: 'center' as const,
      render: (count: number) => (
        <Text style={{ fontSize: '16px' }}>
          {count || 0}
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Part) => (
        <Button
          type="link"
          onClick={() => handlePartClick(record.id)}
        >
          Edit →
        </Button>
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/admin/test/${testId}`)}
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <Title level={3} style={{ margin: 0, marginBottom: '4px', lineHeight: '1.3' }}>
            {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
            Manage parts and questions
          </Text>
        </div>
      </Header>

      <Content style={{ padding: '48px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <Title level={4} className="mb-4">Parts</Title>
            
            {loading ? (
              <div className="text-center py-12">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={parts}
                rowKey="id"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => handlePartClick(record.id),
                  style: { cursor: 'pointer' }
                })}
              />
            )}

            {!loading && parts.length === 0 && (
              <div className="text-center py-12">
                <Text type="secondary">No parts found for this section</Text>
              </div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default SectionPartsPage
