'use client'

import { Button } from 'antd'
import { WifiOutlined, BellOutlined, MenuOutlined } from '@ant-design/icons'

interface HeaderProps {
  testTakerId?: string
}

const Header = ({ testTakerId = 'Test taker ID' }: HeaderProps) => {
  return (
    <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-red-600 text-xl font-bold tracking-wide">IELTS</h1>
        <span className="text-gray-700 text-sm font-medium">{testTakerId}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button type="text" icon={<WifiOutlined />} className="text-gray-600" />
        <Button type="text" icon={<BellOutlined />} className="text-gray-600" />
        <Button type="text" icon={<MenuOutlined />} className="text-gray-600" />
      </div>
    </header>
  )
}

export default Header
