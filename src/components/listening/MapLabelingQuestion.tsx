'use client'

import { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Input } from 'antd'

interface MapPosition {
  id: number
  label: string
  x?: number // Optional fallback if SVG parsing fails
  y?: number // Optional fallback if SVG parsing fails
}

interface MapLabelingQuestionProps {
  positions: MapPosition[]
  options: string[]
  instruction: string
  title: string
  mapUrl: string
  isPreviewMode?: boolean
}

const MapLabelingQuestion = observer(({
  positions,
  options,
  instruction,
  title,
  mapUrl,
  isPreviewMode = false
}: MapLabelingQuestionProps) => {
  const { listeningStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [svgPositions, setSvgPositions] = useState<Map<number, { x: number, y: number }>>(new Map())
  const [svgDimensions, setSvgDimensions] = useState({ width: 640, height: 480 })
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load and parse SVG to extract positions
    const loadSvgPositions = async () => {
      try {
        const response = await fetch(mapUrl)
        const svgText = await response.text()
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
        
        // Get SVG dimensions from viewBox or width/height attributes
        const svgElement = svgDoc.querySelector('svg')
        if (svgElement) {
          const viewBox = svgElement.getAttribute('viewBox')
          if (viewBox) {
            const [, , width, height] = viewBox.split(' ').map(Number)
            setSvgDimensions({ width, height })
          } else {
            const width = parseFloat(svgElement.getAttribute('width') || '640')
            const height = parseFloat(svgElement.getAttribute('height') || '480')
            setSvgDimensions({ width, height })
          }
        }
        
        const posMap = new Map<number, { x: number, y: number }>()
        
        // Find all groups with data-container-id
        const containers = svgDoc.querySelectorAll('[data-container-id]')
        containers.forEach((container) => {
          const containerId = container.getAttribute('data-container-id')
          const rect = container.querySelector('rect')
          
          if (containerId && rect) {
            const x = parseFloat(rect.getAttribute('x') || '0')
            const y = parseFloat(rect.getAttribute('y') || '0')
            const width = parseFloat(rect.getAttribute('width') || '0')
            const height = parseFloat(rect.getAttribute('height') || '0')
            
            // Map container IDs to question IDs
            // container 1 -> question 16, 2 -> 17, 3 -> 18, 4 -> 19, 5 -> 20
            const questionId = parseInt(containerId) + 15
            
            posMap.set(questionId, {
              x: x + width / 2,
              y: y + height / 2
            })
          }
        })
        
        setSvgPositions(posMap)
      } catch (error) {
        console.error('Error loading SVG positions:', error)
      }
    }
    
    loadSvgPositions()
  }, [mapUrl])

  const handleDragStart = (e: React.DragEvent, option: string) => {
    document.body.classList.add('ielts-dragging')
    setDraggedItem(option)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    document.body.classList.remove('ielts-dragging')
    setDraggedItem(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    document.body.classList.remove('ielts-dragging')
    if (draggedItem) {
      listeningStore.setAnswer(questionId, draggedItem)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    listeningStore.setAnswer(questionId, '')
  }

  // Get used options
  const usedOptions = positions
    .map((pos: MapPosition) => listeningStore.getAnswer(pos.id) as string)
    .filter(Boolean)

  return (
    <div className="space-y-4">
      <h3 style={{ color: 'var(--text-primary)' }} className="font-bold text-base mb-2">{title}</h3>
      <p style={{ color: 'var(--text-primary)' }} className="text-sm mb-4">{instruction}</p>

      <div className="flex gap-8">
        {/* Left side - Map */}
        <div className="flex-1">
          <div ref={svgContainerRef} className="relative border" style={{ width: '450px', height: '500px', borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background)' }}>
            {/* Map image */}
            <AuthenticatedImage
              src={mapUrl}
              alt="Map"
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Drop zones on map */}
            {positions.map((pos: MapPosition) => {
              const svgPos = svgPositions.get(pos.id)

              // Use SVG positions if available, otherwise fall back to percentage positions
              const style = svgPos
                ? {
                    left: `${(svgPos.x / svgDimensions.width) * 100}%`,
                    top: `${(svgPos.y / svgDimensions.height) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }
                : {
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }

              // In preview mode with submitted answers, show submitted answer with correctness styling
              if (isPreviewMode) {
                const submittedAnswer = listeningStore.getSubmittedAnswer(pos.id)
                const isCorrect = listeningStore.isAnswerCorrect(pos.id)

                // Determine border and background color based on correctness
                let borderColor = 'var(--input-border)'
                let backgroundColor = 'var(--input-background)'

                if (submittedAnswer) {
                  if (isCorrect === true) {
                    borderColor = '#52c41a' // Green for correct
                    backgroundColor = '#f6ffed' // Light green background
                  } else if (isCorrect === false) {
                    borderColor = '#ff4d4f' // Red for incorrect
                    backgroundColor = '#fff2f0' // Light red background
                  }
                }

                return (
                  <div
                    key={pos.id}
                    className="absolute"
                    style={style}
                  >
                    <div className="flex items-center gap-1">
                      <Input
                        value={submittedAnswer as string || ''}
                        placeholder={pos.label}
                        className="text-center"
                        style={{
                          width: '120px',
                          backgroundColor,
                          borderColor,
                          borderWidth: '2px',
                          color: 'var(--text-primary)'
                        }}
                        disabled={true}
                      />
                    </div>
                  </div>
                )
              }

              // Normal mode - editable
              const answer = listeningStore.getAnswer(pos.id) as string || ''

              return (
                <div
                  key={pos.id}
                  className="absolute"
                  style={style}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, pos.id)}
                    className="flex items-center gap-1"
                  >
                    <Input
                      value={answer}
                      onChange={(e) => listeningStore.setAnswer(pos.id, e.target.value)}
                      placeholder={pos.label}
                      className="text-center"
                      style={{ width: '120px', backgroundColor: 'var(--input-background)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      disabled={false}
                    />
                    {answer && (
                      <button
                        onClick={() => handleRemove(pos.id)}
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--card-background)' }}
                        className="hover:opacity-70 text-sm font-bold px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right side - Options */}
        <div className="w-64">
          <div className="space-y-2">
            {options.map((option: string, index: number) => {
              const isUsed = usedOptions.includes(option)

              return (
                <div
                  key={index}
                  draggable={!isUsed && !isPreviewMode}
                  onDragStart={(e) => !isUsed && !isPreviewMode && handleDragStart(e, option)}
                  onDragEnd={handleDragEnd}
                  style={{
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border-color)',
                    color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    opacity: isUsed ? 0.5 : 1
                  }}
                  className={`px-3 py-2 border rounded text-sm ${
                    isUsed
                      ? 'cursor-not-allowed'
                      : isPreviewMode
                      ? 'cursor-default'
                      : 'cursor-move hover:opacity-80'
                  }`}
                >
                  {option}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

export default MapLabelingQuestion
