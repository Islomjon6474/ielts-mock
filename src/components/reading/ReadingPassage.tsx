'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Card } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Section } from '@/stores/ReadingStore'

interface ReadingPassageProps {
  passage: string
  sections?: Section[]
  onHeadingDrop?: (sectionNumber: number, heading: string) => void
  getHeadingForSection?: (sectionNumber: number) => string | undefined
}

const ReadingPassage = observer(({ passage, sections, onHeadingDrop, getHeadingForSection }: ReadingPassageProps) => {
  const [dragOverSection, setDragOverSection] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent, sectionNumber: number) => {
    e.preventDefault()
    setDragOverSection(sectionNumber)
  }

  const handleDragLeave = () => {
    setDragOverSection(null)
  }

  const handleDrop = (e: React.DragEvent, sectionNumber: number) => {
    e.preventDefault()
    const heading = e.dataTransfer.getData('heading')
    if (heading && onHeadingDrop) {
      // Clear the old heading from this section if it exists
      const currentHeading = getHeadingForSection?.(sectionNumber)
      
      onHeadingDrop(sectionNumber, heading)
    }
    setDragOverSection(null)
  }

  // If sections array exists, use it for Match Heading questions
  if (sections && sections.length > 0 && onHeadingDrop) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">{passage}</h2>
        <div className="space-y-6">
          {sections.map((section) => {
            const assignedHeading = getHeadingForSection?.(section.number)
            const isDragOver = dragOverSection === section.number
            const paragraphs = section.content.split('\n\n').filter(p => p.trim())

            return (
              <div key={section.number} className="mb-8">
                {/* Drop Zone */}
                <div
                  className={`border-2 rounded-lg mb-4 transition-all relative group ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50 p-3'
                      : assignedHeading
                      ? 'border-gray-800 bg-white p-3'
                      : 'border-dashed border-gray-400 bg-gray-50 p-3'
                  }`}
                  onDragOver={(e) => handleDragOver(e, section.number)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, section.number)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="font-bold text-base flex-shrink-0">{section.number}</div>
                      {assignedHeading ? (
                        <div className="text-sm text-gray-700 font-medium truncate">{assignedHeading}</div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Drop heading here</div>
                      )}
                    </div>
                    {assignedHeading && (
                      <Button
                        type="default"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => onHeadingDrop?.(section.number, '')}
                        className="flex-shrink-0"
                        title="Remove heading"
                      />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                <div className="prose max-w-none">
                  {paragraphs.map((paragraph, pIndex) => (
                    <p key={pIndex} className="mb-4 text-gray-800 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Default passage view for other question types
  // Handle undefined or empty passage
  if (!passage) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          No passage content available
        </div>
      </div>
    )
  }

  const paragraphs = passage.split('\n\n').filter(p => p.trim())

  return (
    <div className="p-6">
      <div className="prose max-w-none">
        {paragraphs.map((paragraph, index) => {
          const match = paragraph.trim().match(/^(\d+)/)
          
          if (match) {
            return (
              <div key={index} className="mb-4">
                <div className="font-bold text-lg border border-gray-800 inline-block px-3 py-1 rounded">
                  {paragraph.trim()}
                </div>
              </div>
            )
          }
          
          return (
            <p key={index} className="mb-4 text-gray-800 leading-relaxed">
              {paragraph}
            </p>
          )
        })}
      </div>
    </div>
  )
})

export default ReadingPassage
