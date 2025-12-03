'use client'

import { useEffect, useState, forwardRef } from 'react'

interface AuthenticatedAudioProps {
  src?: string
  style?: React.CSSProperties
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLAudioElement>) => void
  onEnded?: (e: React.SyntheticEvent<HTMLAudioElement>) => void
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLAudioElement>) => void
  onError?: (e: React.SyntheticEvent<HTMLAudioElement>) => void
}

const AuthenticatedAudio = forwardRef<HTMLAudioElement, AuthenticatedAudioProps>(
  ({ src, style, onLoadedMetadata, onEnded, onTimeUpdate, onError }, ref) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (!src) {
        setBlobUrl(null)
        setLoading(false)
        return
      }

      const fetchAudio = async () => {
        try {
          setLoading(true)
          // Clear old blob URL
          setBlobUrl(null)

          const token = localStorage.getItem('authToken')
          const headers: HeadersInit = {}

          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const response = await fetch(src, { headers })

          if (!response.ok) {
            throw new Error('Failed to load audio')
          }

          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setBlobUrl(url)
        } catch (err) {
          console.error('Error loading audio:', err)
          if (onError) {
            // Create a synthetic event for error callback
            onError(err as any)
          }
        } finally {
          setLoading(false)
        }
      }

      fetchAudio()

      // Cleanup blob URL when src changes or component unmounts
      return () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
        }
      }
    }, [src])

    // Always render the audio element (even if blobUrl is not ready yet)
    // This ensures the ref is always valid
    return (
      <audio
        ref={ref}
        src={blobUrl || undefined}
        style={style}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onError={onError}
      />
    )
  }
)

AuthenticatedAudio.displayName = 'AuthenticatedAudio'

export default AuthenticatedAudio
