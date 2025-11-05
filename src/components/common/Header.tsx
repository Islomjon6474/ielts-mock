'use client'

import { Button } from 'antd'
import { WifiOutlined, BellOutlined, MenuOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  testTakerId?: string
  isPreviewMode?: boolean
  previewSectionType?: string
  onBackClick?: () => void
}

const Header = ({ 
  testTakerId = 'Test taker ID', 
  isPreviewMode = false,
  previewSectionType = '',
  onBackClick
}: HeaderProps) => {
  const router = useRouter()

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    }
  }

  return (
    <header className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
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
        <h1 className="text-red-600 text-lg font-bold tracking-wide">IELTS</h1>
        <span className="text-gray-700 text-xs font-medium">{testTakerId}</span>
        {isPreviewMode && previewSectionType && (
          <span className="text-red-600 font-semibold text-xs ml-2">
            PREVIEW MODE - {previewSectionType.toUpperCase()} - All inputs are disabled
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="text" icon={<WifiOutlined />} size="small" className="text-gray-600" />
        <Button type="text" icon={<BellOutlined />} size="small" className="text-gray-600" />
        <Button type="text" icon={<MenuOutlined />} size="small" className="text-gray-600" />
      </div>
    </header>
  )
}

export default Header
