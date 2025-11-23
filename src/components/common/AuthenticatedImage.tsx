'use client'

import { useEffect, useState } from 'react'
import { Spin } from 'antd'

interface AuthenticatedImageProps {
  src?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

const AuthenticatedImage = ({ src, alt, className, style }: AuthenticatedImageProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }

    const fetchImage = async () => {
      try {
        setLoading(true)
        setError(false)

        const token = localStorage.getItem('authToken')
        const headers: HeadersInit = {}
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(src, { headers })
        
        if (!response.ok) {
          throw new Error('Failed to load image')
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch (err) {
        console.error('Error loading image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [src])

  if (!src) return null

  if (loading) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    )
  }

  if (error) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <span style={{ color: '#999' }}>Failed to load image</span>
      </div>
    )
  }

  return <img src={blobUrl || ''} alt={alt} className={className} style={style} />
}

export default AuthenticatedImage
