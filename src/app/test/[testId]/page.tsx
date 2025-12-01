'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, Row, Col, Typography, Button, Spin, Empty, Modal, message, Tag } from 'antd'
import { BookOutlined, SoundOutlined, EditOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { mockSubmissionApi } from '@/services/testManagementApi'
import type { TestDto, SectionDto, PartDto } from '@/types/api'

const { Title, Paragraph } = Typography

function TestSectionsContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const testId = params?.testId as string
  const mockId = searchParams.get('mockId') // Get mockId from URL
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<SectionDto[]>([])
  const [testName, setTestName] = useState<string>('Test')
  const [startingSection, setStartingSection] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Load sections for this test
        const testsResp = await mockSubmissionApi.getAllTests(0, 100)
        const tests: TestDto[] = testsResp.data
        const found = tests.find((t) => t.id === testId)
        if (found) setTestName(found.name)

        // Get sections with mockId to check isStarted and isFinished status
        const sectionsResp = await mockSubmissionApi.getAllSections(testId, mockId || undefined)
        const list: SectionDto[] = sectionsResp.data
        console.log('Sections list', list)

        // Check if mock is finished (check from first section or make separate API call)
        // For now, we'll check if all sections are finished
        const allFinished = list.every((s: any) => s.isFinished === 1)
        console.log('Setting is finished', allFinished)
        setIsFinished(allFinished)
        
        // Filter sections that have content
        const sectionsWithContent: SectionDto[] = []
        for (const section of list) {
          try {
            const partsResp = await mockSubmissionApi.getAllParts(section.id)
            const parts: PartDto[] = partsResp.data
            
            // Check if section has at least one part with content
            if (parts && parts.length > 0) {
              let hasContent = false
              for (const part of parts) {
                try {
                  const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
                  const content = contentResp.data.content
                  if (content) {
                    hasContent = true
                    break
                  }
                } catch (e) {
                  // Skip this part
                }
              }
              
              if (hasContent) {
                sectionsWithContent.push(section)
              }
            }
          } catch (e) {
            console.error(`Error checking section ${section.id}:`, e)
          }
        }
        
        console.log(`📋 Sections with content: ${sectionsWithContent.length}/${list.length}`)
        setSections(sectionsWithContent)
      } finally {
        setLoading(false)
      }
    }
    if (testId) load()
  }, [testId])

  const go = async (section: any) => {
    if (!mockId) {
      message.error('Mock test ID not found. Please start the test again.')
      router.push('/')
      return
    }

    const sectionType = String(section.sectionType)
    const sectionId = section.id
    const lower = sectionType.toLowerCase()
    const isStarted = section.isStarted === 1

    try {
      setStartingSection(true)
      
      // Only call start-section API if section hasn't been started yet
      if (!isStarted) {
        await mockSubmissionApi.startSection(mockId, sectionId)
        console.log(`✅ Started section: ${sectionType} (${sectionId})`)
      } else {
        console.log(`📌 Section already started, skipping start-section API: ${sectionType} (${sectionId})`)
      }
      
      // Navigate to section pages with testId and mockId parameters
      // Add preview mode if THIS SPECIFIC section is finished
      const isSectionFinished = section.isFinished === 1
      const mockIdParam = mockId ? `&mockId=${mockId}` : ''
      console.log('Is section finished:', isSectionFinished, 'for section:', sectionType)
      const previewParam = isSectionFinished ? '&preview=true' : ''
      if (lower === 'listening') router.push(`/listening?testId=${testId}${mockIdParam}${previewParam}`)
      else if (lower === 'reading') router.push(`/reading?testId=${testId}${mockIdParam}${previewParam}`)
      else if (lower === 'writing') router.push(`/writing?testId=${testId}${mockIdParam}${previewParam}`)
    } catch (error) {
      console.error('Error starting section:', error)
      Modal.error({
        title: 'Failed to Start Section',
        content: 'There was an error starting this section. Please try again.',
      })
    } finally {
      setStartingSection(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto py-12">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>{testName}</Title>
          {isFinished && (
            <Tag icon={<EyeOutlined />} color="blue">
              Preview Mode
            </Tag>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : sections.length === 0 ? (
          <Empty description="No sections available for this test" />
        ) : (
          <Row gutter={[24, 24]}>
            {sections.map((s: any) => (
              <Col xs={24} md={12} lg={8} key={s.id}>
                <Card
                  hoverable
                  onClick={() => go(s)}
                  style={{
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border-color)',
                    cursor: startingSection ? 'not-allowed' : 'pointer',
                    opacity: startingSection ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center gap-3">
                    {`${s.sectionType}`.toLowerCase() === 'listening' && <SoundOutlined className="text-2xl text-blue-500" />}
                    {`${s.sectionType}`.toLowerCase() === 'reading' && <BookOutlined className="text-2xl text-green-600" />}
                    {`${s.sectionType}`.toLowerCase() === 'writing' && <EditOutlined className="text-2xl text-purple-600" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Title level={4} className="m-0" style={{ color: 'var(--text-primary)' }}>{String(s.sectionType)}</Title>
                        {s.isStarted === 1 && (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                            Started
                          </Tag>
                        )}
                        {s.isFinished === 1 && (
                          <Tag color="default" style={{ margin: 0 }}>
                            Completed
                          </Tag>
                        )}
                      </div>
                      <Paragraph className="m-0" style={{ color: 'var(--text-secondary)' }}>
                        {startingSection ? 'Starting...' :
                         isFinished ? 'View your answers' :
                         s.isStarted === 1 ? 'Continue section' :
                         'Start practicing this section'}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <div className="mt-8">
          <Button onClick={() => router.push('/')}>Back to tests</Button>
        </div>
      </div>
    </div>
  )
}

export default function TestSectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <Spin size="large" />
      </div>
    }>
      <TestSectionsContent />
    </Suspense>
  )
}
