'use client'

import { useRouter } from 'next/navigation'
import { Typography, Card, Row, Col, Button } from 'antd'
import { BookOutlined, SoundOutlined, EditOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

const { Title, Paragraph } = Typography

const HomePage = observer(() => {
  const { appStore } = useStore()
  const router = useRouter()

  const modules = [
    {
      title: 'Listening',
      icon: <SoundOutlined className="text-4xl text-blue-500" />,
      description: 'Practice your listening skills with authentic IELTS audio materials',
      duration: '30 minutes',
      path: '/listening',
    },
    {
      title: 'Reading',
      icon: <BookOutlined className="text-4xl text-green-500" />,
      description: 'Improve your reading comprehension with real IELTS passages',
      duration: '60 minutes',
      path: '/reading' as string | undefined,
    },
    {
      title: 'Writing',
      icon: <EditOutlined className="text-4xl text-purple-500" />,
      description: 'Master IELTS writing tasks with Task 1 and Task 2 practice',
      duration: '60 minutes',
      path: '/writing',
    },
    {
      title: 'Speaking',
      icon: <MessageOutlined className="text-4xl text-orange-500" />,
      description: 'Prepare for the speaking test with structured practice sessions',
      duration: '11-14 minutes',
      path: undefined as string | undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 border-b">
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => router.push('/admin')}
              size="large"
              style={{ background: '#cf1322', borderColor: '#cf1322' }}
            >
              Admin Panel
            </Button>
          </div>
          <Title level={1} className="mb-4">
            IELTS Mock Assessment Platform
          </Title>
          <Paragraph className="text-lg text-gray-600">
            Prepare for your IELTS exam with realistic practice tests
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {modules.map((module) => (
            <Col xs={24} sm={12} lg={6} key={module.title}>
              <Card
                hoverable
                className="h-full"
                bodyStyle={{ padding: '24px' }}
              >
                <div className="text-center">
                  <div className="mb-4">{module.icon}</div>
                  <Title level={3} className="mb-2">
                    {module.title}
                  </Title>
                  <Paragraph className="text-gray-600 mb-4">
                    {module.description}
                  </Paragraph>
                  <div className="text-sm text-gray-500 mb-4">
                    Duration: {module.duration}
                  </div>
                  <Button 
                    type="primary" 
                    block
                    disabled={!module.path}
                    onClick={() => module.path && router.push(module.path)}
                  >
                    {module.path ? 'Start Practice' : 'Coming Soon'}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

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

export default HomePage
