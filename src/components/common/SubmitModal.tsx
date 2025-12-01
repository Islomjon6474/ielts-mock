'use client'

import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface SubmitModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

const SubmitModal = ({ visible, onClose, onConfirm, loading = false }: SubmitModalProps) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Submit Section"
      cancelText="Cancel"
      confirmLoading={loading}
      centered
      width={480}
      okButtonProps={{
        danger: false,
        type: 'primary',
        size: 'large',
        style: { minWidth: '140px', background: '#52c41a', borderColor: '#52c41a' }
      }}
      cancelButtonProps={{
        size: 'large',
        style: { minWidth: '100px' }
      }}
      styles={{
        content: {
          backgroundColor: 'var(--card-background)',
          color: 'var(--text-primary)'
        }
      }}
    >
      <div className="py-4">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationCircleOutlined className="text-orange-500 text-3xl" />
          <h2 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>Submit Section</h2>
        </div>
        <p className="mb-3 text-base" style={{ color: 'var(--text-primary)' }}>
          Are you sure you want to submit this section?
        </p>
        <div className="p-3 rounded border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border-color)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            <strong>Please note:</strong>
          </p>
          <ul className="text-sm pl-5 mb-0 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>Your answers will be saved and submitted</li>
            <li>You cannot change your answers after submission</li>
            <li>Make sure you have reviewed all questions</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}

export default SubmitModal
