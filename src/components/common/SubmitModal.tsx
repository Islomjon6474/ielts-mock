'use client'

import { Modal } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

interface SubmitModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

const SubmitModal = ({ visible, onClose, onConfirm }: SubmitModalProps) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onConfirm}
      okText="OK"
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      width={400}
    >
      <div className="text-center py-6">
        <CheckCircleOutlined className="text-green-500 text-6xl mb-4" />
        <h2 className="text-xl font-bold mb-2">Test Submitted Successfully!</h2>
        <p className="text-gray-600">
          Your answers have been sent for checking.
        </p>
      </div>
    </Modal>
  )
}

export default SubmitModal
