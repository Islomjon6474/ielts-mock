'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Space, message, Tag, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { mockResultApi } from '@/services/mockResultApi'
import { mockSubmissionApi } from '@/services/mockSubmissionApi'
import type { MockQuestionSubmittedAndCorrectAnswerDto } from '@/types/api'

const { Text, Title } = Typography

interface SectionResultsTableProps {
  mockId: string
  sectionId: string
  sectionType: string
  onScoreUpdate?: () => void
}

interface TableDataItem extends MockQuestionSubmittedAndCorrectAnswerDto {
  key: string
}

export const SectionResultsTable = ({
  mockId,
  sectionId,
  sectionType,
  onScoreUpdate
}: SectionResultsTableProps) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TableDataItem[]>([])
  const [markingQuestion, setMarkingQuestion] = useState<number | null>(null)
  const [recalculating, setRecalculating] = useState(false)

  // Auto-load data when component mounts
  useEffect(() => {
    fetchResults()
  }, [mockId, sectionId])

  const parseHtmlContent = (content: string): string => {
    if (!content) return ''
    // Remove HTML tags but preserve text content
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const fetchResults = async () => {
    try {
      setLoading(true)

      console.log('🔍 Fetching results for:', { mockId, sectionId })

      // Fetch submitted answers with correctness info
      const answersResponse = await mockSubmissionApi.getSubmittedAndCorrectAnswers(mockId, sectionId)

      console.log('📊 Answers Response:', answersResponse)

      if (!answersResponse.success || !answersResponse.data) {
        message.error('Failed to load results')
        setLoading(false)
        return
      }

      // Map answers with parsed HTML content
      const tableData: TableDataItem[] = answersResponse.data.map(item => ({
        ...item,
        key: `q-${item.questionOrd}`,
        answer: parseHtmlContent(item.answer), // Parse HTML from answer
        correctAnswers: item.correctAnswers?.map(ans => parseHtmlContent(ans)) || [] // Parse HTML from correct answers
      }))

      setData(tableData)
      console.log('✅ Loaded', tableData.length, 'questions')
    } catch (error: any) {
      console.error('❌ Error fetching results:', error)
      message.error(error.response?.data?.reason || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAnswer = async (questionOrd: number, isCorrect: boolean) => {
    try {
      setMarkingQuestion(questionOrd)

      await mockResultApi.setAnswerAsCorrect({
        mockId,
        sectionId,
        questionOrd,
        isCorrect: isCorrect ? 1 : 0
      })

      message.success(`Question ${questionOrd} marked as ${isCorrect ? 'correct' : 'incorrect'}`)

      // Recalculate score
      await mockResultApi.calcScore({ mockId, sectionId })
      message.success('Score recalculated')

      // Refresh data
      await fetchResults()

      // Notify parent to update scores
      onScoreUpdate?.()
    } catch (error: any) {
      console.error('Failed to mark answer:', error)
      message.error(error.response?.data?.reason || 'Failed to mark answer')
    } finally {
      setMarkingQuestion(null)
    }
  }

  const handleRecalculateScore = async () => {
    try {
      setRecalculating(true)

      await mockResultApi.calcScore({ mockId, sectionId })
      message.success('Score recalculated successfully')

      // Refresh data
      await fetchResults()

      // Notify parent to update scores
      onScoreUpdate?.()
    } catch (error: any) {
      console.error('Failed to recalculate score:', error)
      message.error(error.response?.data?.reason || 'Failed to recalculate score')
    } finally {
      setRecalculating(false)
    }
  }

  const columns = [
    {
      title: 'Question #',
      dataIndex: 'questionOrd',
      key: 'questionOrd',
      width: 120,
      render: (ord: number) => (
        <Text strong>Q{ord}</Text>
      )
    },
    {
      title: 'Student Answer',
      dataIndex: 'answer',
      key: 'answer',
      width: 250,
      render: (answer: string, record: TableDataItem) => (
        <Space direction="vertical" size={4}>
          <Text strong>{answer || '—'}</Text>
          {record.isCorrect !== null && (
            <Tag color={record.isCorrect === 1 ? 'success' : 'error'}>
              {record.isCorrect === 1 ? 'Correct' : 'Incorrect'}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Correct Answer(s)',
      dataIndex: 'correctAnswers',
      key: 'correctAnswers',
      width: 200,
      render: (answers: string[]) => (
        <Space direction="vertical" size={2}>
          {answers?.map((ans, idx) => (
            <Tag key={idx} color="green">{ans}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: TableDataItem) => (
        <Space size="small">
          <Button
            size="small"
            type={record.isCorrect === 1 ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            loading={markingQuestion === record.questionOrd}
            onClick={() => handleMarkAnswer(record.questionOrd, true)}
            style={{
              backgroundColor: record.isCorrect === 1 ? '#52c41a' : undefined,
              borderColor: record.isCorrect === 1 ? '#52c41a' : undefined,
            }}
          >
            ✓
          </Button>
          <Button
            size="small"
            type={record.isCorrect === 0 ? 'primary' : 'default'}
            danger={record.isCorrect === 0}
            icon={<CloseCircleOutlined />}
            loading={markingQuestion === record.questionOrd}
            onClick={() => handleMarkAnswer(record.questionOrd, false)}
          >
            ✗
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header with Recalculate Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {sectionType.charAt(0).toUpperCase() + sectionType.slice(1).toLowerCase()} Results
        </Title>
        <Button
          type="primary"
          onClick={handleRecalculateScore}
          loading={recalculating}
          icon={<CheckCircleOutlined />}
        >
          Recalculate Score
        </Button>
      </div>

      {/* Results Table */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        size="middle"
        bordered
        style={{ width: '100%' }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default SectionResultsTable
