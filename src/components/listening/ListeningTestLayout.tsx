'use client'
import { useState, useRef, useEffect } from 'react'
import { Layout, Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import Timer from '@/components/common/Timer'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import AuthenticatedAudio from '@/components/common/AuthenticatedAudio'
import { ListeningQuestion } from '@/stores/ListeningStore'
import BottomNavigationComponent from '@/components/common/BottomNavigation'
import AudioInstructionModal from './AudioInstructionModal'
import MapDiagramQuestion from './MapDiagramQuestion'
import TableQuestion from './TableQuestion'
import MatchingQuestion from './MatchingQuestion'
import MapLabelingQuestion from './MapLabelingQuestion'
import FlowChartQuestion from './FlowChartQuestion'
import FillInBlankQuestion from './FillInBlankQuestion'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import MultipleChoiceSingleQuestion from './MultipleChoiceSingleQuestion'
import TrueFalseQuestion from './TrueFalseQuestion'
import SentenceCompletionQuestion from './SentenceCompletionQuestion'
import SubmitModal from '@/components/common/SubmitModal'

const { Content } = Layout

interface ListeningTestLayoutProps {
  isPreviewMode?: boolean
  onBackClick?: () => void
}

interface QuestionGroup {
  type?: string
  imageUrl?: string
  instruction?: string
  questions: ListeningQuestion[]
  options?: string[]
}

const ListeningTestLayout = observer(({ isPreviewMode = false, onBackClick }: ListeningTestLayoutProps) => {
  const { listeningStore } = useStore()
  const router = useRouter()
  const [showModal, setShowModal] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
  const [allAudioUrls, setAllAudioUrls] = useState<string[]>([])

  const currentPart = listeningStore.currentPartData

  // Use audio URLs from store (independent from parts)
  useEffect(() => {
    if (listeningStore.audioUrls && listeningStore.audioUrls.length > 0) {
      setAllAudioUrls(listeningStore.audioUrls)
      console.log(`🎵 ListeningTestLayout: Using ${listeningStore.audioUrls.length} audio URLs from store`)
    } else {
      // Fallback: collect from parts (for backward compatibility)
      const urls = listeningStore.parts
        .filter(part => part.audioUrl)
        .map(part => part.audioUrl!)
      setAllAudioUrls(urls)
      console.log(`🎵 ListeningTestLayout: Fallback - collected ${urls.length} audio URLs from parts`)
    }
  }, [listeningStore.audioUrls, listeningStore.parts])

  // Set initial audio source and auto-play when index changes
  useEffect(() => {
    if (audioRef.current && allAudioUrls.length > 0 && currentAudioIndex < allAudioUrls.length) {
      audioRef.current.src = allAudioUrls[currentAudioIndex]
      // Auto-play next audio if already playing
      if (listeningStore.isPlaying && listeningStore.hasStarted) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play next audio:', err)
        })
      }
    }
  }, [allAudioUrls, currentAudioIndex, listeningStore.isPlaying, listeningStore.hasStarted])

  // Handle audio ended - play next audio automatically
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (currentAudioIndex < allAudioUrls.length - 1) {
        setCurrentAudioIndex(prev => prev + 1)
      } else {
        listeningStore.setIsPlaying(false)
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [currentAudioIndex, allAudioUrls.length, listeningStore])

  // Play/pause audio based on isPlaying state (without changing source)
  useEffect(() => {
    if (listeningStore.hasStarted && listeningStore.allAudioReady && audioRef.current) {
      if (listeningStore.isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play audio:', err)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [listeningStore.isPlaying, listeningStore.hasStarted, listeningStore.allAudioReady])

  // Handler functions - defined before conditional returns
  const handleStart = () => {
    if (!listeningStore.allAudioReady) return
    setShowModal(false)
    listeningStore.setHasStarted(true)
    listeningStore.setIsPlaying(true)
    // Play audio after modal closes
    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }

  const handlePartClick = (partNumber: number) => {
    listeningStore.setCurrentPart(partNumber)
  }

  const handleQuestionClick = (questionNumber: number) => {
    listeningStore.goToQuestion(questionNumber)
    
    // Scroll and focus after navigation
    setTimeout(() => {
      scrollToQuestionAndFocus(questionNumber)
    }, 100)
  }

  const handleSubmit = () => {
    setShowSubmitModal(true)
  }

  const handleModalClose = () => {
    setShowSubmitModal(false)
  }

  const handleModalConfirm = async () => {
    try {
      await listeningStore.finishSection()
      setShowSubmitModal(false)
      router.push('/')
    } catch (error) {
      console.error('Failed to submit test:', error)
      // Still close modal and redirect even if submission fails
      setShowSubmitModal(false)
      router.push('/')
    }
  }

  const handlePrevious = () => {
    const allQuestions = listeningStore.allQuestions
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    const currentIndex = allQuestions.findIndex(q => q.id === currentQuestionNumber)
    
    if (currentIndex > 0) {
      // Try to find the previous unanswered question
      let foundUnanswered = false
      for (let i = currentIndex - 1; i >= 0; i--) {
        const question = allQuestions[i]
        if (!listeningStore.isQuestionAnswered(question.id)) {
          listeningStore.goToQuestion(question.id)
          foundUnanswered = true
          
          // Scroll and focus after navigation
          setTimeout(() => {
            scrollToQuestionAndFocus(question.id)
          }, 100)
          break
        }
      }
      
      // If no unanswered question found, just go to previous question
      if (!foundUnanswered) {
        const prevQuestion = allQuestions[currentIndex - 1]
        listeningStore.goToQuestion(prevQuestion.id)
        
        // Scroll and focus after navigation
        setTimeout(() => {
          scrollToQuestionAndFocus(prevQuestion.id)
        }, 100)
      }
    }
  }

  const handleNext = () => {
    const allQuestions = listeningStore.allQuestions
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    const currentIndex = allQuestions.findIndex(q => q.id === currentQuestionNumber)
    
    if (currentIndex < allQuestions.length - 1) {
      // Try to find the next unanswered question
      let foundUnanswered = false
      for (let i = currentIndex + 1; i < allQuestions.length; i++) {
        const question = allQuestions[i]
        if (!listeningStore.isQuestionAnswered(question.id)) {
          listeningStore.goToQuestion(question.id)
          foundUnanswered = true
          
          // Scroll and focus after navigation
          setTimeout(() => {
            scrollToQuestionAndFocus(question.id)
          }, 100)
          break
        }
      }
      
      // If no unanswered question found, just go to next question
      if (!foundUnanswered) {
        const nextQuestion = allQuestions[currentIndex + 1]
        listeningStore.goToQuestion(nextQuestion.id)
        
        // Scroll and focus after navigation
        setTimeout(() => {
          scrollToQuestionAndFocus(nextQuestion.id)
        }, 100)
      }
    }
  }

  const scrollToQuestionAndFocus = (questionId: number) => {
    // Find the question element by data attribute or id
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`) as HTMLElement
    
    if (questionElement) {
      questionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      
      // Focus on the first focusable element in the question
      setTimeout(() => {
        const input = questionElement.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea') as HTMLInputElement | null
        const radio = questionElement.querySelector('input[type="radio"]') as HTMLInputElement | null
        const checkbox = questionElement.querySelector('input[type="checkbox"]') as HTMLInputElement | null
        
        // Priority: text input > radio > checkbox
        if (input) {
          input.focus()
          if (input.select) {
            input.select()
          }
        } else if (radio) {
          radio.focus()
        } else if (checkbox) {
          checkbox.focus()
        }
      }, 400)
    }
  }

  // Check navigation availability
  const allQuestions = listeningStore.allQuestions
  const currentQuestionNumber = listeningStore.currentQuestionNumber
  const currentIndex = allQuestions.findIndex(q => q.id === currentQuestionNumber)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allQuestions.length - 1

  // Check if parts are loaded - conditional returns at the end
  if (!listeningStore.parts || listeningStore.parts.length === 0) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!currentPart) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <Layout className="h-screen flex flex-col">
      {/* Hidden Audio Player */}
      <AuthenticatedAudio ref={audioRef} style={{ display: 'none' }} />
      
      <Header 
        isPreviewMode={isPreviewMode}
        previewSectionType="listening"
        onBackClick={onBackClick}
      >
        {!isPreviewMode && listeningStore.hasStarted && (
          <Timer timeRemaining={listeningStore.timeRemaining} isTimeUp={listeningStore.isTimeUp} />
        )}
      </Header>
      
      {/* Part Title and Status */}
      <div className="bg-gray-50 px-4 py-1.5 border-b">
        <h2 className="font-semibold text-sm text-black inline-block mr-4">{currentPart.title}</h2>
        <span className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: currentPart.instruction || '' }} />
        {listeningStore.isPlaying && (
          <div className="flex items-center gap-1.5 inline-flex ml-4">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-700">Audio is playing</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Content className="flex-1 overflow-hidden bg-gray-200 flex justify-center py-6 px-6">
        <div className="w-full bg-white p-8 rounded shadow overflow-y-auto">
          {/* Render questions based on part */}
          {/* Dynamic generic renderer: if questions are provided, show them; otherwise fall back to legacy hardcoded UI */}
          {Array.isArray(currentPart.questions) && currentPart.questions.length > 0 && (
            <div className="space-y-4">
              {(() => {
                // Group questions by imageUrl and type to show image once per group
                const grouped: QuestionGroup[] = []
                let currentGroup: QuestionGroup | null = null
                
                currentPart.questions.forEach((q: ListeningQuestion) => {
                  // Start a new group if imageUrl, type, groupInstruction, or groupIndex changes
                  const qGroupIndex = (q as any).groupIndex
                  const shouldStartNewGroup = !currentGroup || 
                    q.imageUrl !== currentGroup.imageUrl || 
                    q.type !== currentGroup.type ||
                    (q as any).groupInstruction !== currentGroup.instruction ||
                    (qGroupIndex !== undefined && qGroupIndex !== (currentGroup as any).groupIndex)
                  
                  if (shouldStartNewGroup) {
                    // Use groupInstruction from question data
                    const instruction = (q as any).groupInstruction || ''
                    
                    currentGroup = { 
                      type: q.type,
                      imageUrl: q.imageUrl, 
                      instruction, 
                      questions: [q],
                      options: q.options || [],
                      groupIndex: qGroupIndex
                    } as QuestionGroup
                    grouped.push(currentGroup)
                  } else {
                    if (currentGroup) {
                      currentGroup.questions.push(q)
                    }
                  }
                })
                
                return grouped.map((group: QuestionGroup, groupIdx: number) => {
                  // Calculate question range for this group
                  const questionIds = group.questions.map(q => q.id).filter(id => typeof id === 'number')
                  const startNum = questionIds.length > 0 ? Math.min(...questionIds) : 1
                  const endNum = questionIds.length > 0 ? Math.max(...questionIds) : 1
                  
                  // Handle SENTENCE_COMPLETION separately
                  if (group.type === 'SENTENCE_COMPLETION') {
                    const questionNumbers = group.questions.map(q => q.id)
                    const options = group.options || []
                    
                    return (
                      <div key={`group-${groupIdx}`} className="mb-8">
                        <div className="bg-gray-50 rounded-lg border-l-4 border-blue-500 px-4 py-2 mb-4">
                          <h3 className="font-bold text-base mb-1">
                            Questions {startNum}{endNum !== startNum && `–${endNum}`}
                          </h3>
                          {group.instruction && (
                            <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: group.instruction }} />
                          )}
                        </div>
                        
                        <SentenceCompletionQuestion
                          questions={group.questions}
                          questionNumbers={questionNumbers}
                          options={options}
                          imageUrl={group.imageUrl}
                          isPreviewMode={isPreviewMode}
                        />
                      </div>
                    )
                  }
                  
                  return (
                  <div key={`group-${groupIdx}`} className="mb-6">
                    {/* Question range header - like in reading */}
                    <div className="bg-gray-50 rounded-lg border-l-4 border-blue-500 px-4 py-2 mb-4">
                      <h3 className="font-bold text-base mb-1">
                        Questions {startNum}{endNum !== startNum && `–${endNum}`}
                      </h3>
                      {/* Show instruction if available */}
                      {group.instruction && (
                        <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: group.instruction }} />
                      )}
                    </div>
                    
                    {/* Image and questions side by side */}
                    {group.imageUrl ? (
                      <div className="flex gap-6">
                        {/* Image on the left - fixed width */}
                        <div className="flex-shrink-0">
                          <AuthenticatedImage 
                            src={group.imageUrl} 
                            alt={`Question group ${groupIdx + 1}`} 
                            className="rounded border"
                            style={{ maxWidth: '450px', maxHeight: '500px', objectFit: 'contain' }}
                          />
                        </div>
                        
                        {/* Questions on the right */}
                        <div className="flex-1 space-y-4">
                          {(() => {
                            // For FILL_IN_BLANK, deduplicate questions with same text
                            let questionsToRender = group.questions
                            if (group.questions.length > 0 && group.questions[0].type === 'FILL_IN_BLANK') {
                              const seenTexts = new Set<string>()
                              questionsToRender = group.questions.filter((q: ListeningQuestion) => {
                                if (seenTexts.has(q.text)) {
                                  return false
                                }
                                seenTexts.add(q.text)
                                return true
                              })
                            }
                            
                            return questionsToRender.map((q: ListeningQuestion) => {
                              switch (q.type) {
                                case 'MULTIPLE_CHOICE':
                                  return <MultipleChoiceQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                                
                                case 'MULTIPLE_CHOICE_SINGLE':
                                  return <MultipleChoiceSingleQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                                
                                case 'TRUE_FALSE_NOT_GIVEN':
                                case 'YES_NO_NOT_GIVEN':
                                  return <TrueFalseQuestion key={q.id} question={q} questionNumber={q.id} type={q.type as 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'} isPreviewMode={isPreviewMode} />
                                
                                case 'FILL_IN_BLANK':
                                case 'SHORT_ANSWER':
                                  return <FillInBlankQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                                
                                case 'IMAGE_INPUTS':
                                  return (
                                    <div key={q.id} className="flex items-center gap-2 mb-3" data-question-id={q.id}>
                                      <span className="font-semibold text-gray-700">{q.id}.</span>
                                      <Input
                                        value={(listeningStore.getAnswer(q.id) as string) || ''}
                                        onChange={(e) => listeningStore.setAnswer(q.id, e.target.value)}
                                        placeholder="Your answer"
                                        className="inline-block"
                                        style={{ width: '200px' }}
                                        disabled={isPreviewMode}
                                      />
                                    </div>
                                  )
                                
                                default:
                                  return (
                                    <div key={q.id} className="border-b pb-4" data-question-id={q.id}>
                                      <p className="mb-2 text-sm"><strong>{q.id}.</strong> {q.text}</p>
                                      <Input
                                        value={(listeningStore.getAnswer(q.id) as string) || ''}
                                        onChange={(e) => listeningStore.setAnswer(q.id, e.target.value)}
                                        placeholder="Your answer"
                                        className="inline-block text-center"
                                        style={{ width: '200px' }}
                                        disabled={isPreviewMode}
                                      />
                                    </div>
                                  )
                              }
                            })
                          })()}
                        </div>
                      </div>
                    ) : (
                      // No image - render questions normally
                      <div className="space-y-4">
                        {(() => {
                          // For FILL_IN_BLANK, deduplicate questions with same text
                          let questionsToRender = group.questions
                          if (group.questions.length > 0 && group.questions[0].type === 'FILL_IN_BLANK') {
                            const seenTexts = new Set<string>()
                            questionsToRender = group.questions.filter((q: ListeningQuestion) => {
                              if (seenTexts.has(q.text)) {
                                return false
                              }
                              seenTexts.add(q.text)
                              return true
                            })
                          }
                          
                          return questionsToRender.map((q: ListeningQuestion) => {
                            // Render based on question type
                            switch (q.type) {
                              case 'MULTIPLE_CHOICE':
                                return <MultipleChoiceQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                              case 'MULTIPLE_CHOICE_SINGLE':
                                return <MultipleChoiceSingleQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                              
                              case 'TRUE_FALSE_NOT_GIVEN':
                              case 'YES_NO_NOT_GIVEN':
                                return <TrueFalseQuestion key={q.id} question={q} questionNumber={q.id} type={q.type as 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'} isPreviewMode={isPreviewMode} />
                              
                              case 'FILL_IN_BLANK':
                              case 'SHORT_ANSWER':
                                return <FillInBlankQuestion key={q.id} question={q} questionNumber={q.id} isPreviewMode={isPreviewMode} />
                              
                              case 'IMAGE_INPUTS':
                                return (
                                  <div key={q.id} className="flex items-center gap-2 mb-3" data-question-id={q.id}>
                                    <span className="font-semibold text-gray-700">{q.id}.</span>
                                    <Input
                                      value={(listeningStore.getAnswer(q.id) as string) || ''}
                                      onChange={(e) => listeningStore.setAnswer(q.id, e.target.value)}
                                      placeholder="Your answer"
                                      className="inline-block"
                                      style={{ width: '200px' }}
                                      disabled={isPreviewMode}
                                    />
                                  </div>
                                )
                              
                              default:
                                // Fallback: basic input with question number
                                return (
                                  <div key={q.id} className="border-b pb-4" data-question-id={q.id}>
                                    <p className="mb-2 text-sm"><strong>{q.id}.</strong> {q.text}</p>
                                    <Input
                                      value={(listeningStore.getAnswer(q.id) as string) || ''}
                                      onChange={(e) => listeningStore.setAnswer(q.id, e.target.value)}
                                      placeholder="Your answer"
                                      className="inline-block text-center"
                                      style={{ width: '200px' }}
                                      disabled={isPreviewMode}
                                    />
                                  </div>
                                )
                            }
                          })
                        })()}
                      </div>
                    )}
                  </div>
                  )
                })
              })()}
            </div>
          )}
          <div style={{ display: Array.isArray(currentPart.questions) && currentPart.questions.length > 0 ? 'none' : 'block' }}>
            {/* Part 1: Fill in the blank questions */}
            {currentPart.id === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-base mb-2">Questions 1–10</h3>
                <p className="text-sm mb-4">
                  Complete the notes. Write <span className="font-bold">ONE WORD AND/OR A NUMBER</span> for each answer.
                </p>
                
                <p className="font-semibold text-sm mb-4">Phone call about second-hand furniture</p>
                
                <p className="font-semibold text-sm mb-2">Items:</p>
                
                {/* Dining table */}
                <div className="mb-6">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Dining table:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <Input
                          value={listeningStore.getAnswer(1) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(1, e.target.value)}
                          placeholder="1"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>shape</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>medium size</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <Input
                          value={listeningStore.getAnswer(2) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(2, e.target.value)}
                          placeholder="2"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>old</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £25.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dining chairs */}
                <div className="mb-6">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Dining chairs:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>set of</span>
                        <Input
                          value={listeningStore.getAnswer(3) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(3, e.target.value)}
                          placeholder="3"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>chairs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>seats covered in</span>
                        <Input
                          value={listeningStore.getAnswer(4) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(4, e.target.value)}
                          placeholder="4"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>material</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>in</span>
                        <Input
                          value={listeningStore.getAnswer(5) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(5, e.target.value)}
                          placeholder="5"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>condition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £20.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desk */}
                <div className="mb-8">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Desk:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>length: 1 metre 20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>3 drawers. Top drawer has a</span>
                        <Input
                          value={listeningStore.getAnswer(6) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(6, e.target.value)}
                          placeholder="6"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £</span>
                        <Input
                          value={listeningStore.getAnswer(7) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(7, e.target.value)}
                          placeholder="7"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <p className="font-semibold text-sm mb-2">Address:</p>
                  <div className="flex items-center gap-2 ml-20">
                    <Input
                      value={listeningStore.getAnswer(8) as string || ''}
                      onChange={(e) => listeningStore.setAnswer(8, e.target.value)}
                      placeholder="8"
                      className="inline-block mx-2 text-center"
                      style={{ width: '120px' }}
                    />
                    <span>Old Lane, Stonethorpe</span>
                  </div>
                </div>

                {/* Directions */}
                <div className="mb-6">
                  <p className="font-semibold text-sm mb-2">Directions:</p>
                  <div className="ml-20">
                    <p className="text-sm">
                      Take the Havcroft road out of Stonethorpe. Go past the secondary school, then turn{' '}
                      <Input
                        value={listeningStore.getAnswer(9) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(9, e.target.value)}
                        placeholder="9"
                        className="inline-block mx-2 text-center"
                        style={{ width: '120px' }}
                      />
                      {' '}at the crossroads. House is down this road, opposite the{' '}
                      <Input
                        value={listeningStore.getAnswer(10) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(10, e.target.value)}
                        placeholder="10"
                        className="inline-block mx-2 text-center"
                        style={{ width: '120px' }}
                      />
                      {' '}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Part 2: Matching and Map Labeling */}
            {currentPart.id === 2 && (
              <div className="space-y-8">
                {/* Questions 11-15: Matching */}
                <MatchingQuestion
                  questionStart={11}
                  questionEnd={15}
                  leftItems={[
                    { id: 11, label: 'Mary Brown' },
                    { id: 12, label: 'John Stevens' },
                    { id: 13, label: 'Alison Jones' },
                    { id: 14, label: 'Tim Smith' },
                    { id: 15, label: 'Jenny James' }
                  ]}
                  rightOptions={[
                    'Finance',
                    'Food',
                    'Health',
                    'Kids\' Counselling',
                    'Organisation',
                    'Rooms',
                    'Sport',
                    'Trips'
                  ]}
                  instruction="Who is responsible for each area? Choose the correct answer for each person and move it into the gap."
                  title="Questions 11–15"
                />

                {/* Questions 16-20: Map Labeling */}
                <MapLabelingQuestion
                  positions={[
                    { id: 16, label: '16' },
                    { id: 17, label: '17' },
                    { id: 18, label: '18' },
                    { id: 19, label: '19' },
                    { id: 20, label: '20' }
                  ]}
                  options={[
                    'Cookery room',
                    'Games room',
                    'Kitchen',
                    'Pottery room',
                    'Sports complex',
                    'Staff accommodation'
                  ]}
                  instruction="Label the map. Choose the correct answer and move it into the gap."
                  title="Questions 16–20"
                  mapUrl="/map.svg"
                />
              </div>
            )}

            {/* Part 3: Matching and Flow Chart */}
            {currentPart.id === 3 && (
              <div className="space-y-8">
                {/* Questions 21-25: Matching */}
                <MatchingQuestion
                  questionStart={21}
                  questionEnd={25}
                  leftItems={[
                    { id: 21, label: 'Impression fossils' },
                    { id: 22, label: 'Cast fossils' },
                    { id: 23, label: 'Permineralisation fossils' },
                    { id: 24, label: 'Compaction fossils' },
                    { id: 25, label: 'Fusion fossils' }
                  ]}
                  rightOptions={[
                    'They are a new type of fossil best.',
                    'They do not contain any organic matter.',
                    'They are found in soft, wet ground.',
                    'They can be found in their normal fossil areas.',
                    'They are three-dimensional.',
                    'They provide information about plant cells.'
                  ]}
                  instruction="Which feature do the speakers identify for each of the following categories of fossil? Choose the correct answer for each fossil category and move it into the gap."
                  title="Questions 21–25"
                />

                {/* Questions 26-30: Flow Chart */}
                <FlowChartQuestion
                  questionStart={26}
                  questionEnd={30}
                  options={[
                    'contamination',
                    'vehicle',
                    'head',
                    'results',
                    'radiation',
                    'site',
                    'microbes',
                    'water'
                  ]}
                  instruction="Complete the flow-chart. Choose the correct answer and move it into the gap."
                  title="Questions 26–30"
                />
              </div>
            )}

            {/* Part 4: Multiple choice, Table, and Fill in blank */}
            {currentPart.id === 4 && (
              <div className="space-y-6">
                {/* Questions 31-32: Multiple Choice */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 31–32</h3>
                  <p className="text-sm mb-4">Choose the correct answer.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2"><span className="font-bold">31</span> Participants in the Learner Persistence study were all drawn from the same</p>
                      <div className="ml-6 space-y-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="age group"
                            checked={listeningStore.getAnswer(31) === 'age group'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          age group.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="geographical area"
                            checked={listeningStore.getAnswer(31) === 'geographical area'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          geographical area.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="socio-economic level"
                            checked={listeningStore.getAnswer(31) === 'socio-economic level'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          socio-economic level.
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm mb-2"><span className="font-bold">32</span> The study showed that when starting their course, older students were most concerned about</p>
                      <div className="ml-6 space-y-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="effects on their home life"
                            checked={listeningStore.getAnswer(32) === 'effects on their home life'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          effects on their home life.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="implications for their future career"
                            checked={listeningStore.getAnswer(32) === 'implications for their future career'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          implications for their future career.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="financial constraints"
                            checked={listeningStore.getAnswer(32) === 'financial constraints'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          financial constraints.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions 33-37: Table */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 33–37</h3>
                  <p className="text-sm mb-4">Complete the table. Write <span className="font-bold">ONE WORD ONLY</span> for each answer.</p>
                  
                  <table className="w-full border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-sm font-bold text-center" colSpan={4}>Research findings</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-2 text-sm font-semibold"></th>
                        <th className="border border-black p-2 text-sm font-semibold">Social and Environmental Factors</th>
                        <th className="border border-black p-2 text-sm font-semibold">Other Factors</th>
                        <th className="border border-black p-2 text-sm font-semibold">Personal Characteristics</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">First level of importance</td>
                        <td className="border border-black p-2 text-sm">Effective support</td>
                        <td className="border border-black p-2 text-sm">Perceived success in study</td>
                        <td className="border border-black p-2 text-sm">
                          <span>Enjoyment of </span>
                          <Input
                            value={listeningStore.getAnswer(33) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(33, e.target.value)}
                            placeholder="33"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">Second level of importance</td>
                        <td className="border border-black p-2 text-sm">Positive experience at school</td>
                        <td className="border border-black p-2 text-sm">
                          <Input
                            value={listeningStore.getAnswer(34) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(34, e.target.value)}
                            placeholder="34"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td className="border border-black p-2 text-sm">
                          <span>Main </span>
                          <Input
                            value={listeningStore.getAnswer(35) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(35, e.target.value)}
                            placeholder="35"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                          <span> is daily life</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">Third level of importance</td>
                        <td className="border border-black p-2 text-sm">
                          <span>Good interaction with the </span>
                          <Input
                            value={listeningStore.getAnswer(36) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(36, e.target.value)}
                            placeholder="36"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td className="border border-black p-2 text-sm">
                          <Input
                            value={listeningStore.getAnswer(37) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(37, e.target.value)}
                            placeholder="37"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                          <span> problems</span>
                        </td>
                        <td className="border border-black p-2 text-sm">Capacity for multi-tasking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Questions 38-40: Fill in blank */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 38–40</h3>
                  <p className="text-sm mb-4">Complete the notes. Write <span className="font-bold">ONE WORD ONLY</span> for each answer.</p>
                  
                  <p className="font-semibold text-sm mb-3">Recommendations</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li className="text-sm">
                      <span>Ask new students to complete questionnaires to gauge their level of </span>
                      <Input
                        value={listeningStore.getAnswer(38) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(38, e.target.value)}
                        placeholder="38"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                    </li>
                    <li className="text-sm">
                      <span>Train selected students to act as </span>
                      <Input
                        value={listeningStore.getAnswer(39) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(39, e.target.value)}
                        placeholder="39"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                    </li>
                    <li className="text-sm">
                      <span>Outside office hours, offer </span>
                      <Input
                        value={listeningStore.getAnswer(40) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(40, e.target.value)}
                        placeholder="40"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                      <span> help.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* Bottom Navigation */}
      <BottomNavigationComponent
        parts={listeningStore.parts}
        currentPart={listeningStore.currentPart}
        currentQuestionIndex={listeningStore.currentQuestionIndex}
        onPartClick={handlePartClick}
        onQuestionClick={handleQuestionClick}
        isQuestionAnswered={(qNum) => listeningStore.isQuestionAnswered(qNum)}
        onSubmit={handleSubmit}
        isPreviewMode={isPreviewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />

      {/* Audio Instruction Modal */}
      <AudioInstructionModal
        visible={showModal}
        onStart={handleStart}
        loading={listeningStore.audioLoading}
        ready={listeningStore.allAudioReady}
        error={listeningStore.audioError}
      />

      {/* Submit Modal */}
      <SubmitModal 
        visible={showSubmitModal} 
        onClose={handleModalClose} 
        onConfirm={handleModalConfirm}
        loading={listeningStore.isSubmitting}
      />
    </Layout>
  )
})

export default ListeningTestLayout
