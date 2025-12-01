'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Button, Table, message, Spin, Tabs, Space, List, Upload, Modal } from 'antd'
import { ArrowLeftOutlined, SoundOutlined, DeleteOutlined, UploadOutlined, MenuOutlined } from '@ant-design/icons'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { testManagementApi, listeningAudioApi, fileApi } from '@/services/testManagementApi'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface Part {
  id: string
  ord: number
  questionCount: number
}

interface AudioFile {
  id: string
  fileId: string
  name: string
  contentType: string
  size: number
  ord?: number
}

const SectionPartsPage = observer(() => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { adminStore } = useStore()
  
  const testId = params.testId as string
  const sectionType = params.sectionType as string
  const sectionId = searchParams.get('sectionId') || ''

  const [parts, setParts] = useState<Part[]>([])
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('parts')

  const isListening = sectionType.toLowerCase() === 'listening'

  useEffect(() => {
    if (sectionId) {
      fetchParts()
      if (isListening) {
        fetchAudioFiles()
      }
    }
  }, [sectionId, isListening])

  const fetchParts = async () => {
    try {
      setLoading(true)
      
      // Load parts into AdminStore
      await adminStore.loadParts(sectionId)
      const partsData = adminStore.getParts(sectionId)
      
      const isWriting = sectionType.toLowerCase() === 'writing'
      
      // Fetch content and calculate question count for each part
      const partsWithCount = await Promise.all(
        partsData.map(async (part: Part) => {
          let questionCount = 0
          
          try {
            // Fetch part content separately
            const contentResponse = await testManagementApi.getPartQuestionContent(part.id)
            const content = contentResponse?.data?.content || contentResponse?.content
            
            if (content) {
              const parsed = typeof content === 'string' ? JSON.parse(content) : content
              const contentData = parsed?.user || parsed?.admin || parsed
              
              // For Writing: count as 1 if there's any content (instruction, passage, or imageId)
              if (isWriting) {
                const hasContent = contentData?.instruction || contentData?.passage || contentData?.imageId
                questionCount = hasContent ? 1 : 0
              }
              // For Reading/Listening: Count from flat questions array (properly expanded)
              else if (contentData?.questions && Array.isArray(contentData.questions)) {
                questionCount = contentData.questions.length
              }
              // Fallback: count from question groups
              else if (contentData?.questionGroups && Array.isArray(contentData.questionGroups)) {
                contentData.questionGroups.forEach((group: any) => {
                  if (group.questions && Array.isArray(group.questions)) {
                    questionCount += group.questions.length
                  }
                })
              }
            }
          } catch (e) {
            console.error(`Error fetching content for part ${part.id}:`, e)
          }
          
          return {
            ...part,
            questionCount
          }
        })
      )
      
      setParts(partsWithCount)
    } catch (error) {
      console.error('Error fetching parts:', error)
      message.error('Failed to load parts')
    } finally {
      setLoading(false)
    }
  }

  const fetchAudioFiles = async () => {
    try {
      setAudioLoading(true)
      const response = await listeningAudioApi.getAllListeningAudio(testId)
      const audioData = response.data || response || []
      setAudioFiles(audioData)
    } catch (error) {
      console.error('Error fetching audio files:', error)
      message.error('Failed to load audio files')
    } finally {
      setAudioLoading(false)
    }
  }

  const handleAudioUpload = async (file: File) => {
    try {
      setUploading(true)
      
      // Step 1: Upload file to get fileId
      const uploadResponse = await fileApi.uploadFile(file)
      const fileId = uploadResponse.data?.id || uploadResponse.id
      
      if (!fileId) {
        throw new Error('Failed to upload file - no file ID returned')
      }
      
      // Step 2: Save listening audio (link file to test)
      await listeningAudioApi.saveListeningAudio(testId, fileId)
      
      message.success(`${file.name} uploaded and saved successfully`)
      
      // Refresh audio list
      await fetchAudioFiles()
      
      return false // Prevent default upload behavior
    } catch (error: any) {
      console.error('Error uploading audio:', error)
      message.error(error.message || 'Failed to upload audio file')
      return false
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAudio = async (audioId: string) => {
    Modal.confirm({
      title: 'Delete Audio File',
      content: 'Are you sure you want to delete this audio file?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await listeningAudioApi.deleteListeningAudio(audioId)
          message.success('Audio file deleted')
          await fetchAudioFiles()
        } catch (error) {
          console.error('Error deleting audio:', error)
          message.error('Failed to delete audio file')
        }
      }
    })
  }

  const handleReorderAudio = async (newOrder: string[]) => {
    try {
      await listeningAudioApi.changeListeningAudioOrder(newOrder)
      message.success('Audio order updated')
      await fetchAudioFiles()
    } catch (error) {
      console.error('Error reordering audio:', error)
      message.error('Failed to update audio order')
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
        <Text style={{ fontSize: '1rem' }}>
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
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <Header style={{
        background: 'var(--header-background)',
        borderBottom: '1px solid var(--border-color)',
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
          <Text type="secondary" style={{ fontSize: '0.875rem', display: 'block' }}>
            {isListening ? 'Manage parts, questions, and audio files' : 'Manage parts and questions'}
          </Text>
        </div>
      </Header>

      <Content style={{ padding: '48px', background: 'var(--background)', minHeight: 'calc(100vh - 64px)' }}>
        <div className="max-w-4xl mx-auto">
          {isListening ? (
            <Card>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'parts',
                    label: 'Parts',
                    children: (
                      <div>
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
                      </div>
                    )
                  },
                  {
                    key: 'audio',
                    label: (
                      <span>
                        <SoundOutlined /> Audio Files
                      </span>
                    ),
                    children: (
                      <div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                          <div>
                            <Title level={5}>Listening Section Audio Files</Title>
                            <Text type="secondary">
                              Upload audio files for this listening section. You can upload multiple files and reorder them.
                              Students will listen to these during the test.
                            </Text>
                          </div>

                          <Upload
                            accept="audio/*"
                            beforeUpload={handleAudioUpload}
                            showUploadList={false}
                            disabled={uploading}
                          >
                            <Button icon={<UploadOutlined />} loading={uploading} size="large" type="primary">
                              Upload Audio File
                            </Button>
                          </Upload>

                          <div style={{
                            padding: '16px',
                            background: 'var(--card-background)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <Text strong>📝 Audio Guidelines:</Text>
                            <ul style={{ marginTop: '8px', paddingLeft: '20px', marginBottom: 0 }}>
                              <li>Upload clear, high-quality audio files</li>
                              <li>Recommended format: MP3 (better compatibility)</li>
                              <li>File size: Keep under 50MB per file</li>
                              <li>You can upload multiple audio files for different parts</li>
                              <li>Drag to reorder audio files</li>
                            </ul>
                          </div>

                          {audioLoading ? (
                            <div className="text-center py-8">
                              <Spin />
                            </div>
                          ) : audioFiles.length > 0 ? (
                            <List
                              header={<Text strong>Uploaded Audio Files ({audioFiles.length})</Text>}
                              bordered
                              dataSource={audioFiles}
                              renderItem={(item, index) => (
                                <List.Item
                                  actions={[
                                    <Button
                                      key="play"
                                      type="link"
                                      icon={<SoundOutlined />}
                                      onClick={() => {
                                        const url = fileApi.getDownloadUrl(item.fileId)
                                        window.open(url, '_blank')
                                      }}
                                    >
                                      Play
                                    </Button>,
                                    <Button
                                      key="delete"
                                      type="link"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteAudio(item.id)}
                                    >
                                      Delete
                                    </Button>
                                  ]}
                                >
                                  <List.Item.Meta
                                    avatar={<SoundOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                    title={
                                      <Space>
                                        <Text strong>#{index + 1}</Text>
                                        <Text>{item.name || `Audio File ${index + 1}`}</Text>
                                      </Space>
                                    }
                                    description={
                                      <Space split="|">
                                        <Text type="secondary">{item.contentType || 'audio/mpeg'}</Text>
                                        <Text type="secondary">{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Card className="text-center py-8">
                              <SoundOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                              <div>
                                <Text type="secondary">No audio files uploaded yet</Text>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Click &quot;Upload Audio File&quot; button above to add audio
                                </Text>
                              </div>
                            </Card>
                          )}
                        </Space>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          ) : (
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
          )}
        </div>
      </Content>
    </Layout>
  )
})

export default SectionPartsPage
