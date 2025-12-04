'use client'

import { useState } from 'react'
import { Card, Button, Space, Typography, message, Statistic, Row, Col } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'

const { Text, Title } = Typography

interface AdminGradingPanelProps {
  mockId: string
  sectionId: string
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  notAnswered: number
  studentName?: string
  testName?: string
  onRecalculate?: () => void
}

export const AdminGradingPanel = ({
  mockId,
  sectionId,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  notAnswered,
  studentName,
  testName,
  onRecalculate
}: AdminGradingPanelProps) => {
  const [recalculating, setRecalculating] = useState(false)

  const handleRecalculate = async () => {
    try {
      setRecalculating(true)
      await mockResultApi.calcScore({
        mockId,
        sectionId
      })
      message.success('Score recalculated successfully')
      onRecalculate?.()
    } catch (error: any) {
      console.error('Failed to recalculate score:', error)
      message.error(error.response?.data?.reason || 'Failed to recalculate score')
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <Card
      style={{
        marginBottom: 24,
        borderColor: '#1677ff',
        backgroundColor: 'var(--card-background)'
      }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <Row gutter={24} align="middle">
        <Col flex="auto">
          <Space direction="vertical" size={4}>
            <Title level={5} style={{ margin: 0 }}>Admin Grading Panel</Title>
            {(studentName || testName) && (
              <Text type="secondary">
                {studentName && `Student: ${studentName}`}
                {studentName && testName && ' | '}
                {testName && `Test: ${testName}`}
              </Text>
            )}
          </Space>
        </Col>

        <Col>
          <Space size="large">
            <Statistic
              title="Total"
              value={totalQuestions}
              valueStyle={{ fontSize: 24, color: 'var(--text-primary)' }}
            />
            <Statistic
              title="Correct"
              value={correctAnswers}
              valueStyle={{ fontSize: 24, color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            <Statistic
              title="Incorrect"
              value={incorrectAnswers}
              valueStyle={{ fontSize: 24, color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
            {notAnswered > 0 && (
              <Statistic
                title="Not Answered"
                value={notAnswered}
                valueStyle={{ fontSize: 24, color: '#8c8c8c' }}
              />
            )}
          </Space>
        </Col>

        <Col>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            loading={recalculating}
            onClick={handleRecalculate}
          >
            Recalculate Score
          </Button>
        </Col>
      </Row>
    </Card>
  )
}

export default AdminGradingPanel
