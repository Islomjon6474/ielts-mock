'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Card, Row, Col, Button, Empty, Spin } from 'antd'
import { FileTextOutlined, SettingOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { mockSubmissionApi } from '@/services/testManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Title, Paragraph } = Typography

const HomePage = observer(() => {
  const { appStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const resp = await mockSubmissionApi.getAllTests(0, 20)
        const list = resp?.data || resp?.content || resp || []
        const arr = Array.isArray(list) ? list : (list?.data || [])
        setTests(arr)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  const router = useRouter()

  const handleOpenTest = (test: any) => {
    const id = test.id || test.testId || test?.uuid || test?.ID
    if (!id) return
    router.push(`/test/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 border-b">
        <div className="text-center mb-12">
          <div className="flex justify-end items-center gap-3 mb-4">
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => router.push('/admin')}
              size="large"
              style={{ background: '#cf1322', borderColor: '#cf1322' }}
            >
              Admin Panel
            </Button>
            <UserMenu />
          </div>
          <Title level={1} className="mb-4">
            IELTS Mock Assessment Platform
          </Title>
          <Paragraph className="text-lg text-gray-600">
            Prepare for your IELTS exam with realistic practice tests
          </Paragraph>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : tests.length === 0 ? (
          <Empty description="No tests available" />
        ) : (
          <Row gutter={[24, 24]}>
            {tests.map((t) => (
              <Col xs={24} sm={12} lg={8} key={t.id || t.testId}>
                <Card hoverable onClick={() => handleOpenTest(t)}>
                  <div className="flex items-center gap-3">
                    <FileTextOutlined className="text-2xl" />
                    <div>
                      <Title level={4} className="m-0">{t.name || t.title || `Test ${t.id}`}</Title>
                      <Paragraph className="m-0 text-gray-600">{t.description || 'Mock IELTS test'}</Paragraph>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <div className="mt-12 text-center">
          <Card>
            <Title level={4}>Welcome to IELTS Mock Assessment</Title>
            <Paragraph>
              This platform helps you prepare for all four modules of the IELTS exam.
              Select a module above to start your practice session.
            </Paragraph>
          </Card>
        </div>
      </div>
    </div>
  )
})

export default withAuth(HomePage)
