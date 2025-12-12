'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import Logo from '@/components/common/Logo'
import Link from 'next/link'

const { Title, Text } = Typography

const SignUpPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
  const [form] = Form.useForm()

  const onFinish = async (values: {
    firstName: string
    lastName: string
    username: string
    password: string
    confirmPassword: string
  }) => {
    try {
      await authStore.signUp({
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        password: values.password,
      })
      message.success('Account created successfully!')
      
      // Redirect based on role
      if (authStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (error: any) {
      message.error(authStore.error || 'Failed to sign up')
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
          <Title level={3} className="!mb-2" style={{ color: 'var(--text-primary)' }}>Create Account</Title>
          <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>Join Sirius Academy</Text>
        </div>

        <Form
          form={form}
          name="signup"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please input your first name!' }]}
          >
            <Input placeholder="John" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please input your last name!' }]}
          >
            <Input placeholder="Doe" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please input your username!' },
              { min: 3, message: 'Username must be at least 3 characters!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="johndoe"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match!'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
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
              Sign Up
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
})

export default SignUpPage
