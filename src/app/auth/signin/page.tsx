'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import Link from 'next/link'

const { Title, Text } = Typography

const SignInPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await authStore.signIn(values)
      message.success('Successfully signed in!')
      
      // Redirect based on role
      if (authStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (error: any) {
      message.error(authStore.error || 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <Title level={2} className="!mb-2">Welcome Back</Title>
          <Text type="secondary">Sign in to your IELTS Mock account</Text>
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

          <div className="text-center">
            <Text type="secondary">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700">
                Sign up
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
})

export default SignInPage
