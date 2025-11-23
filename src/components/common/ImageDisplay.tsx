import { Spin } from 'antd'
import { useState, useEffect } from 'react'
import { fileApi } from '@/services/testManagementApi'
import AuthenticatedImage from './AuthenticatedImage'

interface ImageDisplayProps {
  fileId?: string
  alt?: string
  style?: React.CSSProperties
  className?: string
}

export const ImageDisplay = ({ fileId, alt = 'Image', style, className }: ImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (fileId) {
      const url = fileApi.getDownloadUrl(fileId)
      setImageUrl(url)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [fileId])

  if (!fileId) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Spin />
      </div>
    )
  }

  return (
    <AuthenticatedImage
      src={imageUrl}
      alt={alt}
      style={{ maxWidth: '100%', ...style }}
      className={className}
    />
  )
}
