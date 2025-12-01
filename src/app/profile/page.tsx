'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Card, Radio, Space, Typography, Divider, Layout, Slider } from 'antd'
import { BgColorsOutlined, FontSizeOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/common/Header'
import type { ThemeType } from '@/stores/ThemeStore'
import { themeLabels } from '@/stores/ThemeStore'

const { Title, Text } = Typography
const { Content } = Layout

const ProfilePage = observer(() => {
  const { authStore, themeStore } = useStore()
  const router = useRouter()

  useEffect(() => {
    // Redirect to signin if not authenticated
    if (!authStore.isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [authStore.isAuthenticated, router])

  const handleThemeChange = (theme: ThemeType) => {
    themeStore.setTheme(theme)
  }

  if (!authStore.isAuthenticated || !authStore.user) {
    return null
  }

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Header testTakerId={`${authStore.user.firstName} ${authStore.user.lastName}`} />
      <Content className="p-6">
        <div className="max-w-4xl mx-auto">
          <Title level={2} style={{ color: 'var(--text-primary)' }}>
            Profile Settings
          </Title>

          <Card
            className="mb-6"
            style={{
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Space direction="vertical" size="small" className="w-full">
              <Text strong style={{ color: 'var(--text-primary)' }}>Account Information</Text>
              <div>
                <Text style={{ color: 'var(--text-secondary)' }}>Name: </Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  {authStore.user.firstName} {authStore.user.lastName}
                </Text>
              </div>
              <div>
                <Text style={{ color: 'var(--text-secondary)' }}>Username: </Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  @{authStore.user.username}
                </Text>
              </div>
              <div>
                <Text style={{ color: 'var(--text-secondary)' }}>Role: </Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  {authStore.user.role}
                </Text>
              </div>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <BgColorsOutlined style={{ color: 'var(--primary)' }} />
                <Text strong style={{ color: 'var(--text-primary)' }}>Theme Settings</Text>
              </Space>
            }
            style={{
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
              Choose your preferred color theme for the platform
            </Text>

            <Radio.Group
              value={themeStore.currentTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" size="large" className="w-full">
                <Card
                  hoverable
                  className="cursor-pointer transition-all"
                  style={{
                    backgroundColor: themeStore.currentTheme === 'light' ? 'var(--secondary)' : 'var(--card-background)',
                    borderColor: themeStore.currentTheme === 'light' ? 'var(--primary)' : 'var(--border-color)',
                    borderWidth: themeStore.currentTheme === 'light' ? '2px' : '1px',
                  }}
                >
                  <Radio value="light">
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {themeLabels.light}
                      </Text>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Classic light theme with black text on white background
                      </Text>
                      <div className="flex gap-2 mt-2">
                        <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: '#ffffff' }} />
                        <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: '#000000' }} />
                      </div>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  className="cursor-pointer transition-all"
                  style={{
                    backgroundColor: themeStore.currentTheme === 'dark' ? 'var(--secondary)' : 'var(--card-background)',
                    borderColor: themeStore.currentTheme === 'dark' ? 'var(--primary)' : 'var(--border-color)',
                    borderWidth: themeStore.currentTheme === 'dark' ? '2px' : '1px',
                  }}
                >
                  <Radio value="dark">
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {themeLabels.dark}
                      </Text>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Dark theme with white text on black background for reduced eye strain
                      </Text>
                      <div className="flex gap-2 mt-2">
                        <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: '#000000' }} />
                        <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: '#ffffff' }} />
                      </div>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  className="cursor-pointer transition-all"
                  style={{
                    backgroundColor: themeStore.currentTheme === 'yellow' ? 'var(--secondary)' : 'var(--card-background)',
                    borderColor: themeStore.currentTheme === 'yellow' ? 'var(--primary)' : 'var(--border-color)',
                    borderWidth: themeStore.currentTheme === 'yellow' ? '2px' : '1px',
                  }}
                >
                  <Radio value="yellow">
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {themeLabels.yellow}
                      </Text>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        High contrast theme with yellow text on black background for maximum visibility
                      </Text>
                      <div className="flex gap-2 mt-2">
                        <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: '#000000' }} />
                        <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: '#ffff00' }} />
                      </div>
                    </Space>
                  </Radio>
                </Card>
              </Space>
            </Radio.Group>

            <Divider />

            <Text style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Your theme preference will be saved and applied across all pages of the platform.
            </Text>
          </Card>

          <Card
            title={
              <Space>
                <FontSizeOutlined style={{ color: 'var(--primary)' }} />
                <Text strong style={{ color: 'var(--text-primary)' }}>Font Size Settings</Text>
              </Space>
            }
            style={{
              backgroundColor: 'var(--card-background)',
              borderColor: 'var(--border-color)',
              marginTop: '24px'
            }}
          >
            <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '24px' }}>
              Adjust the font size for better readability across all test pages
            </Text>

            <div style={{ padding: '0 16px' }}>
              <Slider
                min={14}
                max={22}
                value={themeStore.fontSize}
                onChange={(value) => themeStore.setFontSize(value)}
                marks={{
                  14: { label: <span style={{ color: 'var(--text-secondary)' }}>Small</span>, style: { fontSize: '14px' } },
                  16: { label: <span style={{ color: 'var(--text-secondary)' }}>Medium</span>, style: { fontSize: '16px' } },
                  18: { label: <span style={{ color: 'var(--text-secondary)' }}>Large</span>, style: { fontSize: '18px' } },
                  22: { label: <span style={{ color: 'var(--text-secondary)' }}>X-Large</span>, style: { fontSize: '22px' } },
                }}
                tooltip={{
                  formatter: (value) => `${value}px`
                }}
              />
            </div>

            <Divider />

            <div style={{ padding: '16px', backgroundColor: 'var(--secondary)', borderRadius: '8px', marginTop: '16px' }}>
              <Text strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Preview Text ({themeStore.fontSize}px - {themeStore.fontSizeLabel})
              </Text>
              <Text style={{ color: 'var(--text-primary)', fontSize: `${themeStore.fontSize}px` }}>
                The quick brown fox jumps over the lazy dog. This is how your test content will appear with the selected font size.
              </Text>
            </div>

            <Divider />

            <Text style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Font size changes will be applied to all reading passages, questions, and test content. Your preference will be saved automatically.
            </Text>
          </Card>
        </div>
      </Content>
    </Layout>
  )
})

export default ProfilePage
