'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Typography, 
  Card, 
  Button, 
  Table, 
  message, 
  Modal, 
  Form, 
  Input, 
  Space,
  Tag,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  HomeOutlined, 
  KeyOutlined, 
  UserOutlined,
  ReloadOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { userManagementApi, StudentDto, ChangePasswordDto } from '@/services/userManagementApi'
import { UserMenu } from '@/components/auth/UserMenu'
import { withAuth } from '@/components/auth/withAuth'

const { Header, Content } = Layout
const { Title, Text } = Typography

const UserManagementPage = () => {
  const router = useRouter()
  const [students, setStudents] = useState<StudentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentDto | null>(null)
  const [createForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await userManagementApi.getAllStudents()
      console.log('Students response:', response)
      
      const studentsList = response.data || []
      setStudents(studentsList)
    } catch (error: any) {
      console.error('Error fetching students:', error)
      message.error(error.response?.data?.reason || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async () => {
    try {
      const values = await createForm.validateFields()
      
      const studentData: StudentDto = {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        password: values.password
      }

      await userManagementApi.createStudent(studentData)
      
      message.success('Student created successfully!')
      setIsCreateModalOpen(false)
      createForm.resetFields()
      
      // Refresh the students list
      fetchStudents()
    } catch (error: any) {
      console.error('Error creating student:', error)
      if (error.errorFields) {
        // Validation error
        return
      }
      message.error(error.response?.data?.reason || 'Failed to create student')
    }
  }

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      
      if (!selectedStudent) {
        message.error('No student selected')
        return
      }

      const changePasswordData: ChangePasswordDto = {
        id: selectedStudent.id || selectedStudent.username,
        password: values.password
      }

      await userManagementApi.changePassword(changePasswordData)
      
      message.success('Password changed successfully!')
      setIsPasswordModalOpen(false)
      passwordForm.resetFields()
      setSelectedStudent(null)
    } catch (error: any) {
      console.error('Error changing password:', error)
      if (error.errorFields) {
        // Validation error
        return
      }
      message.error(error.response?.data?.reason || 'Failed to change password')
    }
  }

  const openPasswordModal = (student: StudentDto) => {
    setSelectedStudent(student)
    setIsPasswordModalOpen(true)
  }

  // Helper function to parse date in DD.MM.YYYY HH:mm:ss format
  const parseCustomDate = (dateString: string): Date | null => {
    if (!dateString) return null
    try {
      // Format: "23.11.2025 10:32:07" or "DD.MM.YYYY HH:mm:ss"
      const parts = dateString.split(' ')
      if (parts.length !== 2) return null
      
      const dateParts = parts[0].split('.')
      const timeParts = parts[1].split(':')
      
      if (dateParts.length !== 3 || timeParts.length !== 3) return null
      
      const day = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 // Month is 0-indexed
      const year = parseInt(dateParts[2])
      const hour = parseInt(timeParts[0])
      const minute = parseInt(timeParts[1])
      const second = parseInt(timeParts[2])
      
      const date = new Date(year, month, day, hour, minute, second)
      return isNaN(date.getTime()) ? null : date
    } catch (error) {
      return null
    }
  }

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: '#1677ff' }} />
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <>
          {roles && roles.length > 0 ? (
            roles.map((role) => (
              <Tag key={role} color={role === 'ADMIN' ? 'red' : 'blue'}>
                {role}
              </Tag>
            ))
          ) : (
            <Tag color="blue">USER</Tag>
          )}
        </>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date: string) => {
        if (!date) return 'N/A'
        const dateObj = parseCustomDate(date)
        if (!dateObj) return 'Invalid Date'
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedDate',
      key: 'updatedDate',
      render: (date: string) => {
        if (!date) return 'N/A'
        const dateObj = parseCustomDate(date)
        if (!dateObj) return 'Invalid Date'
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StudentDto) => (
        <Space>
          <Tooltip title="Change Password">
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => openPasswordModal(record)}
              size="small"
            >
              Change Password
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <Title level={2} style={{ margin: 0, color: '#cf1322', lineHeight: '1.3' }}>
          User Management
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => router.push('/admin')}
            size="large"
          >
            Back to Admin
          </Button>
          <UserMenu />
        </div>
      </Header>

      <Content style={{ 
        padding: '48px', 
        background: '#f5f5f5', 
        minHeight: 'calc(100vh - 64px)'
      }}>
        <div className="max-w-7xl mx-auto" style={{ width: '100%' }}>
          {/* Page Title and Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <Title level={2} style={{ marginBottom: '8px' }}>
                Student Management
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Manage student accounts, create new students, and change passwords
              </Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchStudents}
                loading={loading}
                size="large"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                style={{ 
                  background: '#1677ff',
                  borderColor: '#1677ff',
                  height: 48,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Create New Student
              </Button>
            </Space>
          </div>

          {/* Students Table */}
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <Table
              columns={columns}
              dataSource={students}
              loading={loading}
              rowKey={(record) => record.id || record.username}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </div>
      </Content>

      {/* Create Student Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Create New Student</span>
          </Space>
        }
        open={isCreateModalOpen}
        onOk={handleCreateStudent}
        onCancel={() => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
        }}
        okText="Create Student"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[
              { required: true, message: 'Please enter first name' },
              { min: 2, message: 'First name must be at least 2 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., John" 
              size="large"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[
              { required: true, message: 'Please enter last name' },
              { min: 2, message: 'Last name must be at least 2 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., Doe" 
              size="large"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
            ]}
          >
            <Input 
              placeholder="e.g., john_doe" 
              size="large"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              placeholder="Enter password" 
              size="large"
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="Confirm password" 
              size="large"
              prefix={<KeyOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            <span>Change Password</span>
          </Space>
        }
        open={isPasswordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setIsPasswordModalOpen(false)
          passwordForm.resetFields()
          setSelectedStudent(null)
        }}
        okText="Change Password"
        cancelText="Cancel"
        width={500}
      >
        {selectedStudent && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Text strong>Student: </Text>
            <Text>{selectedStudent.firstName} {selectedStudent.lastName}</Text>
            <br />
            <Text strong>Username: </Text>
            <Text>{selectedStudent.username}</Text>
          </div>
        )}
        
        <Form
          form={passwordForm}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              placeholder="Enter new password" 
              size="large"
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="Confirm new password" 
              size="large"
              prefix={<KeyOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default withAuth(UserManagementPage, { requireAdmin: true })
