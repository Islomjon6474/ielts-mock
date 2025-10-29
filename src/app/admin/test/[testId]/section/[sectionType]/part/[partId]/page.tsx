'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Tabs, Button, Form, Input, message, Spin, Space, Card, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'
import { QuestionGroupEditor } from '@/components/admin/questions'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { AudioUpload } from '@/components/admin/AudioUpload'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const PartEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const testId = params.testId as string
  const sectionType = params.sectionType as string
  const partId = params.partId as string
  const sectionId = searchParams.get('sectionId') || ''

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [questionGroupCount, setQuestionGroupCount] = useState(0)

  useEffect(() => {
    if (partId) {
      fetchPartContent()
    }
  }, [partId])

  const fetchPartContent = async () => {
    try {
      setLoading(true)
      const response = await testManagementApi.getPartQuestionContent(partId)
      const content = response.data?.content || response.content
      
      if (content) {
        try {
          const parsedContent = JSON.parse(content)
          form.setFieldsValue(parsedContent)
          
          // Count question groups
          const groups = parsedContent.questionGroups || []
          setQuestionGroupCount(groups.length)
        } catch (e) {
          console.error('Failed to parse content:', e)
        }
      }
    } catch (error) {
      console.error('Error fetching part content:', error)
      // Not an error if content doesn't exist yet
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      
      // Remove answers from content before saving
      const contentWithoutAnswers = removeAnswersFromContent(values)
      
      // Save content without answers (for user-side)
      await testManagementApi.savePartQuestionContent(partId, JSON.stringify(contentWithoutAnswers))
      
      message.success('Content saved successfully!')
    } catch (error: any) {
      console.error('Error saving content:', error)
      if (error.errorFields) {
        message.error('Please fill in all required fields')
        return
      }
      message.error('Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  // Remove answers from content (they're already saved via handleAnswerChange)
  const removeAnswersFromContent = (formData: any) => {
    const contentWithoutAnswers = { ...formData }

    // Process question groups to remove answers
    if (contentWithoutAnswers.questionGroups) {
      contentWithoutAnswers.questionGroups = contentWithoutAnswers.questionGroups.map((group: any) => {
        if (group.questions) {
          const cleanQuestions = group.questions.map((question: any) => {
            // Remove answer field
            const { correctAnswer, ...questionWithoutAnswer } = question
            return questionWithoutAnswer
          })
          
          return { ...group, questions: cleanQuestions }
        }
        return group
      })
    }

    return contentWithoutAnswers
  }

  // Handle real-time answer saving
  const handleAnswerChange = async (questionNumber: number, answer: string) => {
    if (!answer || !sectionId) return
    
    try {
      // Save this single answer immediately
      await testManagementApi.saveQuestion(sectionId, partId, [answer])
      console.log(`Answer for question ${questionNumber} saved:`, answer)
    } catch (error) {
      console.error('Error saving answer:', error)
      message.error(`Failed to save answer for question ${questionNumber}`)
    }
  }

  const addQuestionGroup = () => {
    setQuestionGroupCount(prev => prev + 1)
  }

  const isReading = sectionType.toLowerCase() === 'reading'
  const isWriting = sectionType.toLowerCase() === 'writing'
  const isListening = sectionType.toLowerCase() === 'listening'

  const renderContentTab = () => {
    if (isReading) {
      // Split view (side-by-side) for Reading ONLY
      return (
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
          {/* Left Side - Passage */}
          <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card 
              title="Passage"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Form.Item
                name="passage"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <TextArea
                  placeholder="Enter the reading passage..."
                  style={{ height: '100%', minHeight: '500px', fontFamily: 'serif' }}
                />
              </Form.Item>
            </Card>
          </div>

          {/* Right Side - Questions Section */}
          <div style={{ flex: 1 }}>
            <Card title="Question Groups">
              <Form.Item
                label="Instructions"
                name="instruction"
              >
                <Input placeholder="General instructions for this part" />
              </Form.Item>

              <Divider />

              <Space direction="vertical" className="w-full" size="large">
                {Array.from({ length: questionGroupCount }).map((_, index) => (
                  <QuestionGroupEditor
                    key={index}
                    groupPath={['questionGroups', index]}
                    groupLabel={`Question Group ${index + 1}`}
                    form={form}
                    showImageUpload={false}
                    onAnswerChange={handleAnswerChange}
                  />
                ))}
              </Space>

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={addQuestionGroup}
                className="mt-4"
                size="large"
              >
                Add Question Group
              </Button>
            </Card>
          </div>
        </div>
      )
    } else if (isWriting) {
      // Single column for Writing (no questions, just task description and image)
      return (
        <div>
          <Form.Item
            label="Instructions"
            name="instruction"
          >
            <Input placeholder="General instructions for this writing task" size="large" />
          </Form.Item>

          <Divider />

          <Card title="Task Description">
            <Form.Item
              label="Task Description"
              name="passage"
            >
              <TextArea
                placeholder="Enter the writing task description (e.g., 'The chart shows...', 'Some people believe...')"
                rows={10}
                style={{ fontFamily: 'serif' }}
              />
            </Form.Item>
          </Card>

          {/* Image Upload for Writing Part 1 */}
          <Card title="Task Image/Chart" className="mt-4">
            <Form.Item
              name="imageId"
              help="Upload a chart, graph, diagram, or table for Task 1 (optional for Task 2)"
            >
              <ImageUpload label="Upload Task Image" />
            </Form.Item>
          </Card>
        </div>
      )
    } else {
      // Full width for Listening
      return (
        <div>
          <Form.Item
            label="Instructions"
            name="instruction"
          >
            <Input placeholder="General instructions for this part" size="large" />
          </Form.Item>

          <Divider />

          <Space direction="vertical" className="w-full" size="large">
            {Array.from({ length: questionGroupCount }).map((_, index) => (
              <QuestionGroupEditor
                key={index}
                groupPath={['questionGroups', index]}
                groupLabel={`Question Group ${index + 1}`}
                form={form}
                showImageUpload={isListening}
                onAnswerChange={handleAnswerChange}
              />
            ))}
          </Space>

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={addQuestionGroup}
            className="mt-4"
            size="large"
          >
            Add Question Group
          </Button>
        </div>
      )
    }
  }

  const renderListeningAudioTab = () => {
    return (
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Listening Audio</Title>
            <Text type="secondary">
              Upload the audio file for this part of the listening test.
              Students will listen to this audio while answering the questions.
            </Text>
          </div>

          <Form.Item
            name="audioFileId"
            label="Audio File"
            help="Supported formats: MP3, WAV, OGG, M4A"
          >
            <AudioUpload label="Upload Audio File" />
          </Form.Item>

          <div style={{ 
            padding: '16px', 
            background: '#f6f8fa', 
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
          }}>
            <Text strong>📝 Audio Guidelines:</Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Upload clear, high-quality audio</li>
              <li>Recommended format: MP3 (better compatibility)</li>
              <li>File size: Keep under 50MB for faster loading</li>
              <li>Test the audio before publishing</li>
            </ul>
          </div>
        </Space>
      </Card>
    )
  }

  const renderAnswersTab = () => {
    return (
      <Card>
        <Title level={5}>Correct Answers</Title>
        <Text type="secondary">
          Answers are stored within each question. Use the Content tab to edit answers.
        </Text>
        {/* This tab can show a summary of all answers for review */}
      </Card>
    )
  }

  const tabs = [
    {
      key: 'content',
      label: 'Content',
      children: renderContentTab(),
    },
  ]

  // Add Listening Audio tab only for listening section
  if (sectionType.toLowerCase() === 'listening') {
    tabs.push({
      key: 'audio',
      label: 'Listening Audio',
      children: renderListeningAudioTab(),
    })
  }

  tabs.push({
    key: 'answers',
    label: 'Answers',
    children: renderAnswersTab(),
  })

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <Title level={4} style={{ margin: 0, marginBottom: '4px', lineHeight: '1.3' }}>
              {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} - Part {partId.slice(0, 8)}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
              Edit part content and questions
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          size="large"
          style={{
            background: '#52c41a',
            borderColor: '#52c41a',
            flexShrink: 0
          }}
        >
          Save
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : (isListening || isWriting) ? (
          // Paper container for Listening and Writing
          <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '1400px',
              margin: '0 auto'
            }} className="paper-container">
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '32px'
              }}>
                <Form
                  form={form}
                  layout="vertical"
                >
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabs}
                    size="large"
                  />
                </Form>
              </div>
            </div>
          </div>
        ) : (
          // Full width for Reading (for split view)
          <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '32px',
              maxWidth: '1600px',
              margin: '0 auto'
            }}>
              <Form
                form={form}
                layout="vertical"
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabs}
                  size="large"
                />
              </Form>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}

export default PartEditorPage
