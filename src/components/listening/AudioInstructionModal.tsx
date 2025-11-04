'use client'

import { Modal, Button } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'

interface AudioInstructionModalProps {
  visible: boolean
  onStart: () => void
  loading?: boolean
  ready?: boolean
  error?: string | null
}

const AudioInstructionModal = ({ visible, onStart, loading, ready, error }: AudioInstructionModalProps) => {
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={600}
      styles={{
        body: { padding: '48px 24px' }
      }}
    >
      <div className="flex flex-col items-center text-center">
        {/* Headphone Icon */}
        <div className="mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-700"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        </div>

        {/* Text */}
        <p className="text-base text-gray-800 mb-4 max-w-md leading-relaxed">
          You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
        </p>

        {error ? (
          <p className="text-sm text-red-600 mb-6">{error}</p>
        ) : loading ? (
          <p className="text-sm text-gray-600 mb-6">Preparing audio files…</p>
        ) : ready ? (
          <p className="text-sm text-gray-600 mb-6">All audios are ready. Click Play to start.</p>
        ) : (
          <p className="text-sm text-gray-600 mb-6">Preparing audio files…</p>
        )}

        {/* Play Button */}
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          disabled={!ready}
          className="bg-gray-800 hover:bg-gray-700 px-8 py-2 h-auto text-base"
        >
          Play
        </Button>
      </div>
    </Modal>
  )
}

export default AudioInstructionModal
