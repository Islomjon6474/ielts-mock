import { useState } from 'react'
import { Upload, Button, message, Image, Space, Card } from 'antd'
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { fileApi } from '@/services/testManagementApi'

interface ImageUploadProps {
  value?: string // fileId
  onChange?: (fileId: string | undefined) => void
  label?: string
}

export const ImageUpload = ({ value, onChange, label = 'Upload Image' }: ImageUploadProps) => {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    value ? fileApi.getDownloadUrl(value) : undefined
  )

  const handleUpload = async (file: File) => {
    try {
      setLoading(true)
      const response = await fileApi.uploadFile(file)
      
      // Response format: { success: boolean, data: { id: UUID, name, contentType, size } }
      const fileId = response.data?.id
      
      if (!fileId) {
        throw new Error('No file ID returned from upload')
      }

      // Set the file ID
      onChange?.(fileId)
      
      // Set preview URL
      setPreviewUrl(fileApi.getDownloadUrl(fileId))
      
      message.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error('Failed to upload image')
    } finally {
      setLoading(false)
    }
    
    // Prevent default upload behavior
    return false
  }

  const handleDelete = () => {
    onChange?.(undefined)
    setPreviewUrl(undefined)
    message.success('Image removed')
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <Card
          size="small"
          style={{ width: 300 }}
          cover={
            <Image
              src={previewUrl}
              alt="Uploaded image"
              style={{ width: '100%', height: 200, objectFit: 'contain' }}
              preview={{
                mask: <EyeOutlined />
              }}
            />
          }
        >
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              size="small"
            >
              Remove
            </Button>
          </Space>
        </Card>
      ) : (
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            {label}
          </Button>
        </Upload>
      )}
    </div>
  )
}
