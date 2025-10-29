import { useState } from 'react'
import { Upload, Button, message, List, Space, Progress } from 'antd'
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { fileApi } from '@/services/testManagementApi'

interface AudioUploadProps {
  value?: string // fileId
  onChange?: (fileId: string | undefined) => void
  label?: string
}

export const AudioUpload = ({ value, onChange, label = 'Upload Audio' }: AudioUploadProps) => {
  const [loading, setLoading] = useState(false)
  const [audioInfo, setAudioInfo] = useState<{ id: string; name: string } | null>(
    value ? { id: value, name: 'Audio file' } : null
  )

  const handleUpload = async (file: File) => {
    try {
      setLoading(true)
      
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        message.error('Please upload an audio file')
        return false
      }

      const response = await fileApi.uploadFile(file)
      
      // Response format: { success: boolean, data: { id: UUID, name, contentType, size } }
      const fileId = response.data?.id
      const fileName = response.data?.name
      
      if (!fileId) {
        throw new Error('No file ID returned from upload')
      }

      // Set the file ID
      onChange?.(fileId)
      
      // Store audio info
      setAudioInfo({ id: fileId, name: fileName || 'Audio file' })
      
      message.success('Audio uploaded successfully!')
    } catch (error) {
      console.error('Error uploading audio:', error)
      message.error('Failed to upload audio')
    } finally {
      setLoading(false)
    }
    
    // Prevent default upload behavior
    return false
  }

  const handleDelete = () => {
    onChange?.(undefined)
    setAudioInfo(null)
    message.success('Audio removed')
  }

  return (
    <div className="space-y-3">
      {audioInfo ? (
        <List
          size="small"
          bordered
          dataSource={[audioInfo]}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="delete"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Remove
                </Button>
              ]}
            >
              <Space>
                <PlayCircleOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <audio 
                    controls 
                    src={fileApi.getDownloadUrl(item.id)}
                    style={{ width: '300px', height: '32px', marginTop: '8px' }}
                  />
                </div>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Upload
          accept="audio/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} loading={loading} size="large">
            {label}
          </Button>
        </Upload>
      )}
    </div>
  )
}
