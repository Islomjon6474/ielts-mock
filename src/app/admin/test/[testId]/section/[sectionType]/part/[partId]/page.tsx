'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Tabs, Button, Form, Input, message, Spin, Space, Card, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'
import { safeMultiParseJson, normalizeArrayMaybeStringOrObject } from '@/utils/json'
import { AdminPartContent, AdminQuestionGroup, AdminQuestion, PersistedPartContentEnvelope } from '@/types/testContent'
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
  const [loadedData, setLoadedData] = useState<AdminPartContent | null>(null)

  useEffect(() => {
    if (partId) {
      fetchPartContent()
    }
  }, [partId])

  // Effect to set form values after question groups are rendered
  useEffect(() => {
    if (loadedData && questionGroupCount > 0) {
      console.log('📝 Setting form values now that components are rendered')
      form.setFieldsValue(loadedData)
      console.log(`✅ Form populated with ${questionGroupCount} question groups`)
      setLoadedData(null) // Clear to prevent re-setting
    }
  }, [questionGroupCount, loadedData, form])

  const fetchPartContent = async () => {
    try {
      setLoading(true)
      const response = await testManagementApi.getPartQuestionContent(partId)
      
      console.log('Raw API response:', response)
      
      // Extract content from response
      // Backend format: { success: true, data: { content: "JSON string" } }
      const contentString = response.data?.content || response.content || null
      
      console.log('Content string:', contentString)
      
      if (!contentString) {
        console.log('No content found for this part')
        setLoading(false)
        return
      }
      
      const parsedContent = safeMultiParseJson<PersistedPartContentEnvelope>(contentString, 10) as PersistedPartContentEnvelope
      
      console.log('Parsed content structure:', parsedContent)
      
      // Check if content has admin/user structure (new format)
      let dataToLoad: AdminPartContent | string | null
      if (parsedContent && parsedContent.admin !== undefined) {
        // New format: admin may be object or string
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent.admin, 10)
        console.log('✅ Loading admin format (with answers)')
      } else if (parsedContent && parsedContent.questionGroups !== undefined) {
        // Old format: direct object with questionGroups (may be stringified)
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent as any, 10)
        console.log('⚠️ Loading old format (no admin/user split)')
      } else {
        // Fallback: try to parse once more if it's a string
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent as any, 10)
        console.warn('⚠️ Unknown content format, using as-is after parse attempt')
      }

      // If somehow still a string, parse again (deep legacy cases)
      for (let i = 0; i < 5 && typeof dataToLoad === 'string'; i++) {
        console.warn('dataToLoad is still string, parsing again (iteration', i + 1, ')...')
        dataToLoad = safeMultiParseJson(dataToLoad, 10)
      }
      // If root is an array, assume it's actually questionGroups array
      if (Array.isArray(dataToLoad)) {
        dataToLoad = { questionGroups: dataToLoad }
      }
      console.log('Type of dataToLoad:', typeof dataToLoad)
      
      // Normalize questionGroups which may be a string or object map
      const rawGroups = (dataToLoad as AdminPartContent | null)?.questionGroups
      let normalizedGroups: AdminQuestionGroup[] = normalizeArrayMaybeStringOrObject<AdminQuestionGroup>(rawGroups)
      

      // Normalize nested questions arrays too (they might be strings)
      normalizedGroups = normalizedGroups.map((g) => {
        const ng: AdminQuestionGroup = { ...g }
        ng.questions = normalizeArrayMaybeStringOrObject<AdminQuestion>(ng.questions)
        return ng
      })

      // If we successfully normalized, replace in dataToLoad
      if (normalizedGroups.length > 0) {
        const base: AdminPartContent = (typeof dataToLoad === 'object' && dataToLoad) ? (dataToLoad as AdminPartContent) : {}
        dataToLoad = { ...base, questionGroups: normalizedGroups }
      }

      // dataToLoad = JSON.parse(dataToLoad)

      console.log('Data to load into form (normalized):', dataToLoad, (dataToLoad as any)?.questionGroups)

      // Count question groups and store data
      const groups = Array.isArray((dataToLoad as AdminPartContent | null)?.questionGroups)
        ? (dataToLoad as AdminPartContent).questionGroups as AdminQuestionGroup[]
        : []
      console.log(`Found ${groups.length} question groups in data`)
      
      if (groups.length > 0) {
        // Store data and set count - useEffect will populate form after render
        if (typeof dataToLoad === 'object' && dataToLoad) {
          setLoadedData(dataToLoad as AdminPartContent)
        } else {
          console.warn('Normalized groups exist but dataToLoad is not an object; skipping setLoadedData')
        }
        setQuestionGroupCount(groups.length)
      } else {
        // For Writing section or other sections without question groups, load data directly
        console.warn('No question groups found in data - loading data directly (Writing section)')
        if (typeof dataToLoad === 'object' && dataToLoad) {
          form.setFieldsValue(dataToLoad as AdminPartContent)
          console.log('✅ Form populated directly with data:', dataToLoad)
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching part content:', error)
      // Not an error if content doesn't exist yet (first time creating)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      
      console.log('📝 Form values before save:', values)
      
      // Remove answers from both admin and user formats
      // Answers are stored separately via saveQuestion API (with ord parameter)
      const cleanedContent = removeAnswersFromContent(values)
      
      console.log('✅ Cleaned content (no answers):', cleanedContent)
      console.log('📖 Passage field:', cleanedContent.passage)
      console.log('❓ Questions array:', cleanedContent.questions)
      
      const contentToSave = {
        admin: cleanedContent,  // Without answers - for re-editing structure only
        user: cleanedContent    // Without answers - for user-side rendering
      }
      
      // Note: API function already does JSON.stringify, so pass the object directly
      await testManagementApi.savePartQuestionContent(partId, contentToSave)
      
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

  // Remove answers from content (they're saved separately via saveQuestion API)
  // Also prepares flat questions array for user-side rendering
  const removeAnswersFromContent = (formData: any) => {
    const contentWithoutAnswers = { ...formData }
    const flatQuestions: any[] = []

    // Process question groups to remove answers
    if (contentWithoutAnswers.questionGroups) {
      contentWithoutAnswers.questionGroups = contentWithoutAnswers.questionGroups.map((group: any) => {
        // Parse the range to get starting question number
        let startNumber = 1
        if (group.range) {
          const rangeMatch = group.range.match(/(\d+)-(\d+)/)
          if (rangeMatch) {
            startNumber = parseInt(rangeMatch[1])
          }
        }
        
        // For MATCH_HEADING, parse headingOptions into an array
        let headingOptionsArray: string[] = []
        if (group.type === 'MATCH_HEADING' && group.headingOptions) {
          headingOptionsArray = group.headingOptions
            .split('\n')
            .map((h: string) => h.trim())
            .filter((h: string) => h.length > 0)
        }

        if (group.questions) {
          const cleanQuestions = group.questions.map((question: any, index: number) => {
            // Remove both correctAnswer and answers fields
            const { correctAnswer, answers, ...questionWithoutAnswer } = question
            
            // For SHORT_ANSWER type, expand ONLY the flat questions array (user-side)
            // Keep single question object in questionGroups (admin-side)
            if (group.type === 'SHORT_ANSWER') {
              // Extract all placeholders [1], [2], [3] from the text
              const matches = (questionWithoutAnswer.text || '').match(/\[(\d+)\]/g) || []
              const placeholderNumbers = matches.map((m: string) => {
                const num = m.match(/\[(\d+)\]/)
                return num ? parseInt(num[1]) : 0
              }).filter((n: number) => n > 0)
              
              // Create separate flat question objects for user-side (1 per placeholder)
              placeholderNumbers.forEach((placeholderNum: number) => {
                flatQuestions.push({
                  id: placeholderNum,
                  type: 'FILL_IN_BLANK',
                  text: questionWithoutAnswer.text || '',
                })
              })
            } else {
              // For other types, one question object = one flat question
              const questionType = group.type
              const questionId = startNumber + index
              
              const flatQuestion: any = {
                id: questionId,
                type: questionType,
                text: questionWithoutAnswer.text || '',
              }
              
              // Add type-specific fields
              if (questionType === 'MULTIPLE_CHOICE') {
                flatQuestion.options = questionWithoutAnswer.options
                flatQuestion.maxAnswers = questionWithoutAnswer.maxAnswers
              } else if (questionType === 'MATCH_HEADING') {
                flatQuestion.sectionId = questionWithoutAnswer.sectionId
                flatQuestion.options = headingOptionsArray // Add heading options to each question
              }
              
              flatQuestions.push(flatQuestion)
            }
            
            // Return single question object (keeps admin UI clean)
            return questionWithoutAnswer
          })
          
          return { ...group, questions: cleanQuestions }
        }
        return group
      })
    }

    // Add flat questions array for user-side rendering
    contentWithoutAnswers.questions = flatQuestions
    
    // Set questionRange based on all questions
    if (flatQuestions.length > 0) {
      const allIds = flatQuestions.map(q => q.id)
      contentWithoutAnswers.questionRange = [Math.min(...allIds), Math.max(...allIds)]
    }

    return contentWithoutAnswers
  }

  // Handle real-time answer saving
  const handleAnswerChange = async (questionNumber: number, answer: string | string[]) => {
    if (!answer || !sectionId) return
    
    // Convert to array if it's a string
    const answers = Array.isArray(answer) ? answer : [answer]
    
    // Filter out empty answers
    const validAnswers = answers.filter(a => a && a.trim().length > 0)
    if (validAnswers.length === 0) return
    
    try {
      // Save with ord parameter (question number)
      await testManagementApi.saveQuestion(sectionId, partId, questionNumber, validAnswers)
      console.log(`Answer for question ${questionNumber} saved:`, validAnswers)
    } catch (error) {
      console.error('Error saving answer:', error)
      message.error(`Failed to save answer for question ${questionNumber}`)
    }
  }

  // Calculate the next question range based on existing groups
  const getNextQuestionRange = (groupIndex: number): string => {
    const questionGroups = form.getFieldValue('questionGroups') || []
    
    let nextStart = 1
    
    // Calculate based on all previous groups
    for (let i = 0; i < groupIndex; i++) {
      const group = questionGroups[i]
      if (group && group.range) {
        // Parse range like "1-5" to get the end number
        const match = group.range.match(/^(\d+)-(\d+)$/)
        if (match) {
          nextStart = parseInt(match[2]) + 1
        }
      } else if (group && group.questions) {
        // For SHORT_ANSWER, count placeholders, not question objects
        if (group.type === 'SHORT_ANSWER') {
          group.questions.forEach((question: any) => {
            if (question.text) {
              const matches = question.text.match(/\[(\d+)\]/g) || []
              nextStart += matches.length
            }
          })
        } else {
          // For other types, count question objects
          nextStart += group.questions.length
        }
      }
    }
    
    // Default to 5 questions per group, can be adjusted
    const defaultGroupSize = 5
    return `${nextStart}-${nextStart + defaultGroupSize - 1}`
  }

  const addQuestionGroup = () => {
    const newIndex = questionGroupCount
    const nextRange = getNextQuestionRange(newIndex)
    
    // Get current question groups
    const currentGroups = form.getFieldValue('questionGroups') || []
    
    // Add new group with calculated range
    const newGroup = {
      type: '',
      range: nextRange,
      instruction: '',
      questions: []
    }
    
    form.setFieldValue('questionGroups', [...currentGroups, newGroup])
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
                style={{ flex: 1, marginBottom: 16 }}
              >
                <TextArea
                  placeholder="Enter the reading passage..."
                  style={{ height: '100%', minHeight: '400px', fontFamily: 'serif' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Passage Image (Optional)"
                name="imageId"
                help="Upload an image/diagram that accompanies the entire passage"
              >
                <ImageUpload label="Upload Passage Image" />
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
                    defaultQuestionRange={getNextQuestionRange(index)}
                    showImageUpload={true}
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
                defaultQuestionRange={getNextQuestionRange(index)}
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

  // Audio upload moved to section level for listening
  // No longer needed at part level

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
        lineHeight: 'normal',
        position: 'sticky',
        top: 0,
        zIndex: 100
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
