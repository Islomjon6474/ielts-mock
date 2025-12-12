'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import Logo from '@/components/common/Logo'

const { Title, Text } = Typography

const SignInPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const response = await authStore.signIn(values)
      
      // Wait for auth state to fully update
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Log for debugging
      console.log('🔐 Sign-in complete, user:', authStore.user)
      console.log('🔐 Is admin:', authStore.isAdmin)
      
      message.success('Successfully signed in!')
      
      // Use replace instead of push to force fresh mount
      if (authStore.isAdmin) {
        router.replace('/admin')
      } else {
        router.replace('/')
      }
    } catch (error: any) {
      message.error(authStore.error || 'Failed to sign in')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}
    >
      <Card
        className="w-full max-w-md shadow-2xl"
        style={{
          backgroundColor: 'var(--card-background)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <Title level={3} className="!mb-2" style={{ color: 'var(--text-primary)' }}>Welcome Back</Title>
          <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</Text>
        </div>

        <Form
          form={form}
          name="signin"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={authStore.isLoading}
              className="w-full"
              size="large"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
})

export default SignInPage
