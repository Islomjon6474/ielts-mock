'use client'

import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface MapInputPosition {
  questionId: number
  questionNumber: number
  x: number // percentage from left
  y: number // percentage from top
  label?: string
}

interface MapDiagramQuestionProps {
  mapUrl: string
  inputPositions: MapInputPosition[]
  instruction?: string
}

const MapDiagramQuestion = observer(({ mapUrl, inputPositions, instruction }: MapDiagramQuestionProps) => {
  const { listeningStore } = useStore()

  const handleInputChange = (questionId: number, value: string) => {
    listeningStore.setAnswer(questionId, value)
  }

  return (
    <div className="space-y-4">
      {instruction && (
        <p className="text-sm mb-4">{instruction}</p>
      )}
      
      {/* Map Container */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* SVG Map */}
        <AuthenticatedImage 
          src={mapUrl} 
          alt="Diagram" 
          className="w-full h-auto"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
        
        {/* Positioned Input Fields */}
        {inputPositions.map((position: MapInputPosition) => {
          const answer = listeningStore.getAnswer(position.questionId) as string || ''
          return (
            <div
              key={position.questionId}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center gap-1">
                {position.label && (
                  <span className="text-xs font-semibold text-gray-700 bg-white px-1 rounded">
                    {position.label}
                  </span>
                )}
                <Input
                  value={answer}
                  onChange={(e) => handleInputChange(position.questionId, e.target.value)}
                  placeholder={position.questionNumber.toString()}
                  className="w-24 text-center font-medium"
                  size="small"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default MapDiagramQuestion
