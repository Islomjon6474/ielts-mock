'use client'

import { useState } from 'react'
import { Button } from 'antd'
import { WifiOutlined, BellOutlined, MenuOutlined, ArrowLeftOutlined, SoundOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Logo from './Logo'
import SettingsDrawer from './SettingsDrawer'

interface HeaderProps {
  testTakerId?: string
  isPreviewMode?: boolean
  previewSectionType?: string
  onBackClick?: () => void
  children?: React.ReactNode
  showAudioControls?: boolean
  volume?: number
  onVolumeChange?: (volume: number) => void
  isAudioPlaying?: boolean
}

const Header = ({
  testTakerId = 'Test taker ID',
  isPreviewMode = false,
  previewSectionType = '',
  onBackClick,
  children,
  showAudioControls = false,
  volume = 100,
  onVolumeChange,
  isAudioPlaying = false
}: HeaderProps) => {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    }
  }

  const handleSettingsClick = () => {
    setSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setSettingsOpen(false)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onVolumeChange) {
      onVolumeChange(Number(e.target.value))
    }
  }

  return (
    <header className="ielts-header">
      <div className="header-left">
        {isPreviewMode && onBackClick ? (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackClick}
            size="small"
            style={{
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
          >
            Back
          </Button>
        ) : (
          <Logo size="small" />
        )}

        {/* Test Taker Info Section */}
        <div className="test-taker-info">
          {children ? (
            <div className="timer-container">{children}</div>
          ) : (
            <span className="test-taker-id">{testTakerId}</span>
          )}
          {isAudioPlaying && (
            <span className="audio-status">
              <SoundOutlined />
              Audio is playing
            </span>
          )}
        </div>

        {isPreviewMode && previewSectionType && (
          <span
            style={{
              color: '#cf1322',
              fontWeight: 600,
              fontSize: '12px',
              marginLeft: '10px'
            }}
          >
            PREVIEW MODE - {previewSectionType.toUpperCase()}
          </span>
        )}
      </div>

      <div className="header-icons">
        {/* Audio Controls - Volume slider */}
        {showAudioControls && (
          <div className="audio-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SoundOutlined style={{ fontSize: '18px', color: 'var(--text-primary)' }} />
            <input
              type="range"
              id="volume-slider"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: '80px',
                height: '4px',
                cursor: 'pointer'
              }}
            />
          </div>
        )}

        <button className="icon" title="Network Status">
          <WifiOutlined />
        </button>
        <button className="icon" title="Notifications">
          <BellOutlined />
        </button>
        <button className="icon" onClick={handleSettingsClick} title="Settings">
          <MenuOutlined />
        </button>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer open={settingsOpen} onClose={handleSettingsClose} />
    </header>
  )
}

export default Header
