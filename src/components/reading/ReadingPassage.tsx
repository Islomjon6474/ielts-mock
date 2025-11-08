'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Card, Image } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Section } from '@/stores/ReadingStore'
import { useStore } from '@/stores/StoreContext'

interface ReadingPassageProps {
  passage: string
  imageUrl?: string
  sections?: Section[]
  onHeadingDrop?: (sectionNumber: number, heading: string) => void
  getHeadingForSection?: (sectionNumber: number) => string | undefined
  hasMatchHeading?: boolean
  matchHeadingQuestions?: any[]
}

const ReadingPassage = observer(({ passage, imageUrl, sections, onHeadingDrop, getHeadingForSection, hasMatchHeading, matchHeadingQuestions }: ReadingPassageProps) => {
  const [dragOverSection, setDragOverSection] = useState<number | null>(null)
  const { readingStore } = useStore()
  const [draggedHeading, setDraggedHeading] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent, sectionNumber: number) => {
    e.preventDefault()
    setDragOverSection(sectionNumber)
  }

  const handleHeadingDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleHeadingDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    const heading = e.dataTransfer.getData('heading')
    if (heading) {
      readingStore.setAnswer(questionId, heading)
    }
    setDraggedHeading(null)
  }

  const handleRemoveHeading = (questionId: number) => {
    readingStore.setAnswer(questionId, '')
  }

  // Strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Render passage with inline drop zones for MATCH_HEADING
  const renderPassageWithDropZones = () => {
    if (!hasMatchHeading || !matchHeadingQuestions) {
      return <div className="prose max-w-none passage-content" dangerouslySetInnerHTML={{ __html: passage }} />
    }

    // Parse passage and replace placeholders with drop zones
    let processedPassage = passage
    const placeholderRegex = /\[(\d+)\]/g
    const matches = [...passage.matchAll(placeholderRegex)]
    
    if (matches.length === 0) {
      return <div className="prose max-w-none passage-content" dangerouslySetInnerHTML={{ __html: passage }} />
    }

    // Get the actual question IDs from matchHeadingQuestions in order
    const actualQuestionIds = matchHeadingQuestions
      .map(q => q.id)
      .sort((a, b) => a - b)

    // Split passage by placeholders and create elements
    const parts: JSX.Element[] = []
    let lastIndex = 0

    matches.forEach((match, idx) => {
      // Use the actual question ID from the sorted list instead of the placeholder number
      const questionNum = actualQuestionIds[idx] || parseInt(match[1])
      const matchIndex = match.index!
      
      // Add text before placeholder
      if (matchIndex > lastIndex) {
        const textBefore = passage.substring(lastIndex, matchIndex)
        parts.push(
          <span key={`text-${idx}`} dangerouslySetInnerHTML={{ __html: textBefore }} />
        )
      }

      // Add drop zone
      const answer = readingStore.getAnswer(questionNum) as string || ''
      const cleanAnswer = answer ? stripHtml(answer) : ''

      parts.push(
        <span
          key={`drop-${idx}`}
          onDragOver={handleHeadingDragOver}
          onDrop={(e) => handleHeadingDrop(e, questionNum)}
          className={`inline-flex items-center border-2 border-dashed rounded px-3 py-1 mx-1 min-w-[120px] ${
            answer ? 'border-blue-400 bg-blue-50' : 'border-gray-400'
          }`}
          style={{ verticalAlign: 'middle' }}
        >
          {answer ? (
            <span className="flex items-center gap-2">
              <strong className="text-sm">{questionNum}.</strong>
              <span className="text-sm font-medium">{cleanAnswer}</span>
              <button
                onClick={() => handleRemoveHeading(questionNum)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            </span>
          ) : (
            <span className="text-gray-400 text-xs">{questionNum}. Drag heading here</span>
          )}
        </span>
      )

      lastIndex = matchIndex + match[0].length
    })

    // Add remaining text
    if (lastIndex < passage.length) {
      const textAfter = passage.substring(lastIndex)
      parts.push(
        <span key="text-end" dangerouslySetInnerHTML={{ __html: textAfter }} />
      )
    }

    return <div className="prose max-w-none passage-content">{parts}</div>
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
        
        {/* Display part-level image if available */}
        {imageUrl && (
          <div className="mb-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <Image
                src={imageUrl}
                alt="Passage illustration"
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                preview={true}
              />
            </div>
          </div>
        )}
        
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

  // Check if passage is HTML (contains HTML tags) or plain text
  const isHtml = /<[^>]+>/.test(passage)

  // If it's HTML, render it directly with dangerouslySetInnerHTML or with drop zones
  if (isHtml) {
    return (
      <div className="p-6">
        {/* Display part-level image if available */}
        {imageUrl && (
          <div className="mb-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <Image
                src={imageUrl}
                alt="Passage illustration"
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                preview={true}
              />
            </div>
          </div>
        )}
        
        {renderPassageWithDropZones()}

        <style jsx>{`
          .passage-content {
            font-family: serif;
            font-size: 15px;
            line-height: 1.7;
            color: #1f2937;
          }
          
          .passage-content :global(p) {
            margin: 0.75em 0;
          }
          
          .passage-content :global(h2) {
            font-size: 1.5em;
            font-weight: 700;
            margin: 1em 0 0.5em 0;
            line-height: 1.3;
          }
          
          .passage-content :global(h3) {
            font-size: 1.25em;
            font-weight: 600;
            margin: 0.9em 0 0.4em 0;
            line-height: 1.4;
          }
          
          .passage-content :global(ul),
          .passage-content :global(ol) {
            padding-left: 1.5em;
            margin: 0.75em 0;
          }
          
          .passage-content :global(li) {
            margin: 0.25em 0;
          }
          
          .passage-content :global(strong) {
            font-weight: 700;
          }
          
          .passage-content :global(em) {
            font-style: italic;
          }
          
          .passage-content :global([style*="text-align: center"]) {
            text-align: center;
          }
          
          .passage-content :global([style*="text-align: right"]) {
            text-align: right;
          }
          
          .passage-content :global([style*="text-align: left"]) {
            text-align: left;
          }
        `}</style>
      </div>
    )
  }

  // Plain text rendering (legacy format)
  const paragraphs = passage.split('\n\n').filter(p => p.trim())

  return (
    <div className="p-6">
      {/* Display part-level image if available */}
      {imageUrl && (
        <div className="mb-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <Image
              src={imageUrl}
              alt="Passage illustration"
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              preview={true}
            />
          </div>
        </div>
      )}
      
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
