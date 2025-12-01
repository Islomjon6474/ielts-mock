'use client'

import { Drawer, Radio, Slider, Typography, Divider } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import type { ThemeType } from '@/stores/ThemeStore'

const { Title, Text } = Typography

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

const SettingsDrawer = observer(({ open, onClose }: SettingsDrawerProps) => {
  const { themeStore } = useStore()

  const handleThemeChange = (theme: ThemeType) => {
    themeStore.setTheme(theme)
  }

  const handleFontSizeChange = (size: number) => {
    themeStore.setFontSize(size)
  }

  return (
    <Drawer
      title="Settings"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      style={{
        backgroundColor: 'var(--card-background)',
      }}
    >
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <Title level={5} style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            Colour Scheme
          </Title>
          <Radio.Group
            value={themeStore.currentTheme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
            className="w-full"
          >
            <div className="space-y-2">
              <Radio value="light" className="w-full">
                <span style={{ color: 'var(--text-primary)' }}>Black on White</span>
              </Radio>
              <Radio value="dark" className="w-full">
                <span style={{ color: 'var(--text-primary)' }}>White on Black</span>
              </Radio>
              <Radio value="yellow" className="w-full">
                <span style={{ color: 'var(--text-primary)' }}>Yellow on Black</span>
              </Radio>
            </div>
          </Radio.Group>
        </div>

        <Divider style={{ borderColor: 'var(--border-color)' }} />

        {/* Font Size Selection */}
        <div>
          <Title level={5} style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            Font Size
          </Title>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Text style={{ color: 'var(--text-secondary)' }}>Current:</Text>
              <Text strong style={{ color: 'var(--text-primary)' }}>
                {themeStore.fontSizeLabel} ({themeStore.fontSize}px)
              </Text>
            </div>
            <Slider
              min={14}
              max={22}
              value={themeStore.fontSize}
              onChange={handleFontSizeChange}
              marks={{
                14: '14',
                16: '16',
                18: '18',
                20: '20',
                22: '22',
              }}
              tooltip={{
                formatter: (value) => `${value}px`,
              }}
            />
            <div className="flex justify-between">
              <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Small</Text>
              <Text style={{ color: 'var(--text-secondary)', fontSize: '22px' }}>Extra Large</Text>
            </div>
          </div>
        </div>

        <Divider style={{ borderColor: 'var(--border-color)' }} />

        {/* Preview Text */}
        <div>
          <Title level={5} style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            Preview
          </Title>
          <div
            className="p-4 rounded border"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Text style={{ color: 'var(--text-primary)' }}>
              This is a sample text to preview your theme and font size settings. The quick brown fox jumps over the lazy dog.
            </Text>
          </div>
        </div>
      </div>
    </Drawer>
  )
})

export default SettingsDrawer
