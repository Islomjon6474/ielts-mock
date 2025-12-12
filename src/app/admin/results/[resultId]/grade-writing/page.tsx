'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { 
  Layout, 
  Typography, 
  Card, 
  Button, 
  message, 
  Form,
  Input,
  Space,
  Divider,
  Spin,
  Row,
  Col,
  Statistic,
  Tag,
  Modal,
  InputNumber
} from 'antd'
import {
  HomeOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import Logo from '@/components/common/Logo'
import { mockResultApi, SaveWritingGradeDto, WritingGradeResult, MockResultDto } from '@/services/mockResultApi'
import { mockSubmissionApi } from '@/services/testManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface WritingPart {
  id: string
  type: 'TASK_1' | 'TASK_2'
  question: string
  answer: string
  graded: boolean
  score?: number
  feedback?: string
}

const GradeWritingResultPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const resultId = params.resultId as string
  const testId = searchParams.get('testId')
  const studentNameParam = searchParams.get('studentName')
  const testNameParam = searchParams.get('testName')
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [writingParts, setWritingParts] = useState<WritingPart[]>([])
  const [saving, setSaving] = useState(false)
  const [gradeResults, setGradeResults] = useState<Record<string, WritingGradeResult>>({})
  const [sectionId, setSectionId] = useState<string>('')
  const [gradeForm] = Form.useForm()

  useEffect(() => {
    if (resultId && testId) {
      fetchWritingData()
    }
  }, [resultId, testId])

  const fetchWritingData = async () => {
    try {
      setLoading(true)
      
      // Fetch result details from API
      const response = await mockResultApi.getAllMockResults(0, 1000)
      const resultData = (response.data || []).find((r: MockResultDto) => r.id === resultId)
      
      if (!resultData) {
        message.error('Result not found')
        return
      }
      
      setResult(resultData)
      
      // Get writing section from mock submission API
      const sectionsResp = await mockSubmissionApi.getAllSections(testId || '')
      const sections = sectionsResp.data || []
      const writingSection = sections.find((s: any) => s.sectionType === 'WRITING')
      
      if (!writingSection) {
        message.error('Writing section not found')
        return
      }
      
      setSectionId(writingSection.id)
      
      // Fetch submitted answers for writing section
      const answersResp = await mockSubmissionApi.getSubmittedAnswers(resultId, writingSection.id)
      const answers = answersResp.data || []
      
      console.log('📝 Writing answers:', answers)
      
      // Fetch writing questions/prompts from test content
      const partsResp = await mockSubmissionApi.getAllParts(writingSection.id)
      const parts = partsResp.data || []
      
      console.log('📄 Writing parts:', parts)
      
      const writingTasksData: WritingPart[] = []
      
      for (const part of parts) {
        const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
        const content = contentResp.data?.content
        
        console.log(`📄 Part ${part.ord} content:`, content)
        
        if (content) {
          let parsed
          try {
            parsed = JSON.parse(content)
          } catch (e) {
            console.error('Failed to parse content:', e)
            continue
          }
          
          console.log(`📄 Part ${part.ord} parsed:`, parsed)
          
          const taskData = parsed.user || parsed.admin || parsed
          const taskNum = part.ord // 1 for Task 1, 2 for Task 2
          
          // Find the corresponding answer
          const answer = answers.find((a: any) => a.questionOrd === taskNum)
          
          // For writing: 'passage' contains the task description/question
          // 'instruction' contains general instructions (time limits, etc.)
          let questionText = 'No question text available'
          
          if (taskData.passage) {
            // This is the actual writing task question/description
            questionText = taskData.passage
          } else if (taskData.description) {
            questionText = taskData.description
          } else if (taskData.question) {
            questionText = taskData.question
          } else if (taskData.text) {
            questionText = taskData.text
          } else if (taskData.instruction) {
            // Fallback to instruction if nothing else available
            questionText = taskData.instruction
          } else if (typeof taskData === 'string') {
            questionText = taskData
          }
          
          console.log(`📄 Task ${taskNum} question text:`, questionText?.substring(0, 100))
          
          writingTasksData.push({
            id: `task${taskNum}`,
            type: taskNum === 1 ? 'TASK_1' : 'TASK_2',
            question: questionText,
            answer: answer?.answer || '',
            graded: false
          })
        }
      }
      
      setWritingParts(writingTasksData)
      
      if (writingTasksData.length === 0) {
        // Fallback: create tasks from answers even without questions
        const task1Answer = answers.find((a: any) => a.questionOrd === 1)
        const task2Answer = answers.find((a: any) => a.questionOrd === 2)
        
        if (task1Answer) {
          writingTasksData.push({
            id: 'task1',
            type: 'TASK_1',
            question: 'Writing Task 1',
            answer: task1Answer.answer || '',
            graded: false
          })
        }
        
        if (task2Answer) {
          writingTasksData.push({
            id: 'task2',
            type: 'TASK_2',
            question: 'Writing Task 2',
            answer: task2Answer.answer || '',
            graded: false
          })
        }
        
        setWritingParts(writingTasksData)
      }
    } catch (error) {
      console.error('Error fetching writing data:', error)
      message.error('Failed to load writing data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGrades = async () => {
    try {
      const values = await gradeForm.validateFields()
      setSaving(true)

      // Prepare data for API - send both scores together
      const gradeData: SaveWritingGradeDto = {
        mockId: resultId,
        sectionId: sectionId,
        writingPartOneScore: values.task1Score || 0,
        writingPartTwoScore: values.task2Score || 0
      }

      // Send to backend
      await mockResultApi.saveWritingGrade(gradeData)

      // Update local state
      if (values.task1Score) {
        setWritingParts(prev => prev.map(p => 
          p.type === 'TASK_1' ? { ...p, graded: true, score: values.task1Score } : p
        ))
      }
      if (values.task2Score) {
        setWritingParts(prev => prev.map(p => 
          p.type === 'TASK_2' ? { ...p, graded: true, score: values.task2Score } : p
        ))
      }
      
      message.success('Writing grades saved successfully!')
    } catch (error: any) {
      console.error('Error saving grades:', error)
      if (error.errorFields) {
        return
      }
      message.error(error.response?.data?.reason || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const getTaskTitle = (type: string) => {
    return type === 'TASK_1' ? 'Writing Task 1' : 'Writing Task 2'
  }

  const allGraded = writingParts.every(p => p.graded)
  const averageScore = allGraded && writingParts.length > 0
    ? writingParts.reduce((sum, p) => sum + (p.score || 0), 0) / writingParts.length
    : null

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </Layout>
    )
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Logo size="medium" />
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.3' }}>
            Grade Writing
          </Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/admin/results/${resultId}/preview?testId=${testId}`)}
            size="large"
          >
            Back to Preview
          </Button>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => router.push('/admin')}
            size="large"
          >
            Admin Home
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
          {/* Student Info */}
          {result && (
            <Card style={{ marginBottom: 24 }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space direction="vertical" size={4}>
                    <Title level={3} style={{ margin: 0 }}>
                      {testNameParam || result?.testName || 'Test'}
                    </Title>
                    <Text type="secondary">
                      Student: {
                        studentNameParam ||
                        result?.userName || 
                        (result?.firstName && result?.lastName ? `${result.firstName} ${result.lastName}` : '') ||
                        (result?.userFirstName && result?.userLastName ? `${result.userFirstName} ${result.userLastName}` : '') ||
                        result?.userId || 
                        'Unknown'
                      }
                    </Text>
                  </Space>
                </Col>
                {allGraded && averageScore !== null && (
                  <Col>
                    <Statistic
                      title="Overall Writing Score"
                      value={averageScore}
                      precision={1}
                      suffix="/ 9.0"
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* Writing Parts */}
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {writingParts.map((part) => {
              const gradeResult = gradeResults[part.id]
              
              return (
                <Card 
                  key={part.id}
                  title={
                    <Space>
                      <EditOutlined />
                      <span>{getTaskTitle(part.type)}</span>
                      {part.graded && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Graded
                        </Tag>
                      )}
                    </Space>
                  }
                  extra={
                    part.graded && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Score: {part.score}
                      </Tag>
                    )
                  }
                >
                  {/* Question */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Question:</Text>
                    <Card size="small" style={{ background: 'var(--card-background)' }}>
                      <div 
                        style={{ marginBottom: 0 }}
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: part.question }}
                      />
                    </Card>
                  </div>

                  {/* Answer */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Student's Answer:</Text>
                    <Card size="small" style={{ background: 'var(--card-background)' }}>
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {part.answer}
                      </Paragraph>
                    </Card>
                  </div>

                  {/* Grading Results */}
                  {gradeResult && (
                    <>
                      <Divider>Grading Results</Divider>
                      
                      <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                          <Card style={{ background: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
                            <Statistic
                              title="Score"
                              value={gradeResult.score}
                              precision={1}
                              suffix="/ 9.0"
                              valueStyle={{ color: '#52c41a', fontSize: '2rem' }}
                              prefix={<TrophyOutlined />}
                            />
                          </Card>
                        </Col>
                      </Row>

                      {(gradeResult.taskAchievement || gradeResult.coherenceCohesion || 
                        gradeResult.lexicalResource || gradeResult.grammaticalRange) && (
                        <>
                          <Text strong style={{ display: 'block', marginBottom: 12 }}>Band Score Breakdown:</Text>
                          <Row gutter={[16, 16]}>
                            {gradeResult.taskAchievement && (
                              <Col xs={24} sm={12}>
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
                              <Col xs={24} sm={12}>
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
                              <Col xs={24} sm={12}>
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
                              <Col xs={24} sm={12}>
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
                        <div style={{ marginTop: 16 }}>
                          <Text strong style={{ display: 'block', marginBottom: 8 }}>Detailed Feedback:</Text>
                          <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                            <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                              {gradeResult.feedback}
                            </Paragraph>
                          </Card>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )
            })}
          </Space>

          {/* Grading Form */}
          <Card style={{ marginTop: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Enter Scores</Title>
            <Form
              form={gradeForm}
              layout="vertical"
              onFinish={handleSaveGrades}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Writing Task 1 Score"
                    name="task1Score"
                    rules={[
                      { type: 'number', min: 0, max: 9, message: 'Score must be between 0 and 9' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={9}
                      step={0.5}
                      placeholder="e.g., 7.5"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Writing Task 2 Score"
                    name="task2Score"
                    rules={[
                      { type: 'number', min: 0, max: 9, message: 'Score must be between 0 and 9' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={9}
                      step={0.5}
                      placeholder="e.g., 8.0"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={saving}
                  icon={<CheckCircleOutlined />}
                >
                  Save Grades
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Content>

    </Layout>
  )
}

export default withAuth(GradeWritingResultPage, { requireAdmin: true })
