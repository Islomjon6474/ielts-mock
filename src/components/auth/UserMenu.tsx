'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Dropdown, Button, Avatar, Space, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'

const { Text } = Typography

export const UserMenu = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()

  if (!authStore.isAuthenticated || !authStore.user) {
    return (
      <Space>
        <Button type="link" onClick={() => router.push('/auth/signin')}>
          Sign In
        </Button>
        <Button type="primary" onClick={() => router.push('/auth/signup')}>
          Sign Up
        </Button>
      </Space>
    )
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1">
          <Text strong>{authStore.user.firstName} {authStore.user.lastName}</Text>
          <br />
          <Text type="secondary" className="text-xs">@{authStore.user.username}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            Role: <span className="font-semibold">{authStore.user.role}</span>
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
  ]

  // Only add admin dashboard link if user is actually an admin
  if (authStore.isAdmin) {
    menuItems.push({
      key: 'admin',
      label: 'Admin Dashboard',
      icon: <DashboardOutlined />,
      onClick: () => router.push('/admin'),
    })
  }

  // Add remaining menu items
  menuItems.push(
    {
      key: 'profile',
      label: 'Profile Settings',
      icon: <SettingOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => authStore.signOut(),
    }
  )

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <div className="cursor-pointer">
        <Space>
          <Avatar size="large" icon={<UserOutlined />} />
          <div className="hidden md:block">
            <Text strong>{authStore.user.firstName}</Text>
            {authStore.isAdmin && (
              <Text type="secondary" className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                Admin
              </Text>
            )}
          </div>
        </Space>
      </div>
    </Dropdown>
  )
})
