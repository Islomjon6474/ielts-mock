'use client'

import { useState } from 'react'
import { Button } from 'antd'
import { WifiOutlined, BellOutlined, MenuOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Logo from './Logo'
import SettingsDrawer from './SettingsDrawer'

interface HeaderProps {
  testTakerId?: string
  isPreviewMode?: boolean
  previewSectionType?: string
  onBackClick?: () => void
  children?: React.ReactNode
}

const Header = ({
  testTakerId = 'Test taker ID',
  isPreviewMode = false,
  previewSectionType = '',
  onBackClick,
  children
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

  return (
    <header
      className="border-b shadow-sm px-4 py-2 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--header-background)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="flex items-center gap-3">
        {isPreviewMode && onBackClick && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackClick}
            size="small"
          >
            Back to Sections
          </Button>
        )}
        <Logo size="small" showText={true} />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {testTakerId}
        </span>
        {isPreviewMode && previewSectionType && (
          <span
            className="font-semibold text-xs ml-2"
            style={{ color: '#cf1322' }}
          >
            PREVIEW MODE - {previewSectionType.toUpperCase()} - All inputs are disabled
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <Button
          type="text"
          icon={<WifiOutlined />}
          size="small"
          style={{ color: 'var(--text-secondary)' }}
        />
        <Button
          type="text"
          icon={<BellOutlined />}
          size="small"
          style={{ color: 'var(--text-secondary)' }}
        />
        <Button
          type="text"
          icon={<MenuOutlined />}
          size="small"
          style={{ color: 'var(--text-secondary)' }}
          onClick={handleSettingsClick}
        />
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer open={settingsOpen} onClose={handleSettingsClose} />
    </header>
  )
}

export default Header
