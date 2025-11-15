'use client'

import { useState, useEffect, useRef } from 'react'
import { Layout, Typography, Tabs, Button, Form, Input, message, Spin, Space, Card, Divider, Modal } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'
import { safeMultiParseJson, normalizeArrayMaybeStringOrObject } from '@/utils/json'
import { AdminPartContent, AdminQuestionGroup, AdminQuestion, PersistedPartContentEnvelope } from '@/types/testContent'
import { QuestionGroupEditor } from '@/components/admin/questions'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { AudioUpload } from '@/components/admin/AudioUpload'
import { PassageRichTextEditor, PassageRichTextEditorRef } from '@/components/admin/PassageRichTextEditor'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const PartEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const testId = params.testId as string
  const sectionType = params.sectionType as string
  const partId = params.partId as string
  const sectionId = searchParams.get('sectionId') || ''

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [questionGroupCount, setQuestionGroupCount] = useState(0)
  const [loadedData, setLoadedData] = useState<AdminPartContent | null>(null)
  const [pendingAnswers, setPendingAnswers] = useState<Map<number, string[]>>(new Map())
  const [questionOffset, setQuestionOffset] = useState(0) // Offset based on previous parts
  const passageEditorRef = useRef<PassageRichTextEditorRef>(null)

  useEffect(() => {
    if (partId && sectionId) {
      calculateQuestionOffset()
      fetchPartContent()
      fetchCorrectAnswers()
    }
  }, [partId, sectionId])

  // Calculate question offset based on previous parts
  const calculateQuestionOffset = async () => {
    try {
      console.log('🔢 Calculating question offset for part:', partId)
      
      // Get all parts in this section
      const partsResponse = await testManagementApi.getAllParts(sectionId)
      const allParts = partsResponse?.data || partsResponse || []
      
      // Find current part's index
      const currentPartIndex = allParts.findIndex((p: any) => p.id === partId)
      
      if (currentPartIndex === -1) {
        console.log('⚠️ Current part not found in parts list')
        setQuestionOffset(0)
        return
      }
      
      // Calculate total questions from all previous parts
      let totalQuestions = 0
      
      for (let i = 0; i < currentPartIndex; i++) {
        const part = allParts[i]
        try {
          // Fetch content for this part
          const contentResponse = await testManagementApi.getPartQuestionContent(part.id)
          const contentString = contentResponse.data?.content || contentResponse.content
          
          if (!contentString) continue
          
          const parsedContent = safeMultiParseJson<PersistedPartContentEnvelope>(contentString, 10)
          
          // Extract admin content
          let adminContent: any = null
          if (parsedContent && parsedContent.admin) {
            adminContent = safeMultiParseJson(parsedContent.admin, 10)
          } else if (parsedContent && parsedContent.questionGroups) {
            adminContent = parsedContent
          }
          
          if (!adminContent || !adminContent.questionGroups) continue
          
          // Count questions in this part
          const questionGroups = normalizeArrayMaybeStringOrObject(adminContent.questionGroups)
          
          questionGroups.forEach((group: any) => {
            if (group.range) {
              // Parse range like "1-5" to get count
              const match = group.range.match(/^(\d+)-(\d+)$/)
              if (match) {
                const start = parseInt(match[1])
                const end = parseInt(match[2])
                const count = end - start + 1
                totalQuestions += count
              }
            } else if (group.questions) {
              // For SHORT_ANSWER, count placeholders
              if (group.type === 'SHORT_ANSWER') {
                group.questions.forEach((q: any) => {
                  if (q.text) {
                    const matches = q.text.match(/\[(\d+)\]/g) || []
                    totalQuestions += matches.length
                  }
                })
              } else {
                // For other types, count question objects
                const questions = normalizeArrayMaybeStringOrObject(group.questions)
                totalQuestions += questions.length
              }
            }
          })
        } catch (error) {
          console.error(`Error processing part ${i}:`, error)
        }
      }
      
      console.log(`✅ Question offset calculated: ${totalQuestions} (from ${currentPartIndex} previous parts)`)
      setQuestionOffset(totalQuestions)
      
    } catch (error) {
      console.error('❌ Error calculating question offset:', error)
      setQuestionOffset(0)
    }
  }

  // Effect to set form values after question groups are rendered
  useEffect(() => {
    if (loadedData && questionGroupCount > 0) {
      console.log('📝 Setting form values now that components are rendered')
      form.setFieldsValue(loadedData)
      console.log(`✅ Form populated with ${questionGroupCount} question groups`)
      setLoadedData(null) // Clear to prevent re-setting
    }
  }, [questionGroupCount, loadedData, form])

  // Recalculate all ranges when question groups change
  const recalculateAllRanges = () => {
    const questionGroups = form.getFieldValue('questionGroups') || []
    if (questionGroups.length === 0) return

    console.log('🔄 Recalculating ranges for all question groups...')
    
    let currentStart = questionOffset + 1
    const updatedGroups = questionGroups.map((group: any, index: number) => {
      if (!group) return group

      // Calculate question count for this group
      let questionCount = 0
      
      if (group.range) {
        // Parse existing range to get count
        const match = group.range.match(/^(\d+)-(\d+)$/)
        if (match) {
          const start = parseInt(match[1])
          const end = parseInt(match[2])
          questionCount = end - start + 1
        }
      } else if (group.questions && group.questions.length > 0) {
        // Count based on question type
        if (group.type === 'SHORT_ANSWER') {
          group.questions.forEach((q: any) => {
            if (q.text) {
              const matches = q.text.match(/\[(\d+)\]/g) || []
              questionCount += matches.length
            }
          })
        } else {
          questionCount = group.questions.length
        }
      }

      // Default to 5 if no questions yet
      if (questionCount === 0) {
        questionCount = 5
      }

      // Calculate new range
      const newRange = `${currentStart}-${currentStart + questionCount - 1}`
      console.log(`  Group ${index + 1}: ${group.range || 'no range'} → ${newRange}`)
      
      // Update for next group
      currentStart += questionCount

      return {
        ...group,
        range: newRange
      }
    })

    form.setFieldValue('questionGroups', updatedGroups)
    console.log('✅ All ranges recalculated')
  }

  const fetchCorrectAnswers = async () => {
    try {
      console.log('📥 Fetching correct answers for section:', sectionId)
      const response = await testManagementApi.getAllQuestions(sectionId)
      console.log('✅ Correct answers response:', response)
      
      // Response format: { success: true, data: [{ id, partId, ord, answers: [...] }] }
      const questions = response.data || response || []
      
      // Build a map of question number (ord) to answers
      const answersMap = new Map<number, string[]>()
      questions.forEach((q: any) => {
        if (q.ord && q.answers && Array.isArray(q.answers)) {
          answersMap.set(q.ord, q.answers)
          console.log(`📝 Loaded answer for Q${q.ord}:`, q.answers)
        }
      })
      
      // Set answers in form for each question
      if (answersMap.size > 0) {
        const questionGroups = form.getFieldValue('questionGroups') || []
        questionGroups.forEach((group: any, groupIndex: number) => {
          if (group.questions) {
            group.questions.forEach((question: any, questionIndex: number) => {
              // For SHORT_ANSWER with placeholders
              if (group.type === 'SHORT_ANSWER') {
                const matches = (question.text || '').match(/\[(\d+)\]/g) || []
                const placeholderNumbers = matches.map((m: string) => {
                  const num = m.match(/\[(\d+)\]/)
                  return num ? parseInt(num[1]) : 0
                }).filter((n: number) => n > 0)
                
                placeholderNumbers.forEach((placeholderNum: number) => {
                  const answers = answersMap.get(placeholderNum)
                  if (answers && answers.length > 0) {
                    form.setFieldValue(
                      ['questionGroups', groupIndex, 'questions', questionIndex, 'answers', placeholderNum],
                      answers[0] // First answer for this placeholder
                    )
                  }
                })
              } else {
                // For other question types
                const rangeMatch = group.range?.match(/(\d+)-(\d+)/)
                if (rangeMatch) {
                  const startNum = parseInt(rangeMatch[1])
                  const questionNum = startNum + questionIndex
                  const answers = answersMap.get(questionNum)
                  if (answers) {
                    form.setFieldValue(
                      ['questionGroups', groupIndex, 'questions', questionIndex, 'correctAnswer'],
                      answers.join(', ')
                    )
                  }
                }
              }
            })
          }
        })
      }
    } catch (error) {
      console.error('❌ Error fetching correct answers:', error)
    }
  }

  const fetchPartContent = async () => {
    try {
      setLoading(true)
      const response = await testManagementApi.getPartQuestionContent(partId)
      
      console.log('Raw API response:', response)
      
      // Extract content from response
      // Backend format: { success: true, data: { content: "JSON string" } }
      const contentString = response.data?.content || response.content || null
      
      console.log('Content string:', contentString)
      
      if (!contentString) {
        console.log('No content found for this part')
        setLoading(false)
        return
      }
      
      const parsedContent = safeMultiParseJson<PersistedPartContentEnvelope>(contentString, 10) as PersistedPartContentEnvelope
      
      console.log('Parsed content structure:', parsedContent)
      
      // Check if content has admin/user structure (new format)
      let dataToLoad: AdminPartContent | string | null
      if (parsedContent && parsedContent.admin !== undefined) {
        // New format: admin may be object or string
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent.admin, 10)
        console.log('✅ Loading admin format (with answers)')
      } else if (parsedContent && parsedContent.questionGroups !== undefined) {
        // Old format: direct object with questionGroups (may be stringified)
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent as any, 10)
        console.log('⚠️ Loading old format (no admin/user split)')
      } else {
        // Fallback: try to parse once more if it's a string
        dataToLoad = safeMultiParseJson<AdminPartContent>(parsedContent as any, 10)
        console.warn('⚠️ Unknown content format, using as-is after parse attempt')
      }

      // If somehow still a string, parse again (deep legacy cases)
      for (let i = 0; i < 5 && typeof dataToLoad === 'string'; i++) {
        console.warn('dataToLoad is still string, parsing again (iteration', i + 1, ')...')
        dataToLoad = safeMultiParseJson(dataToLoad, 10)
      }
      // If root is an array, assume it's actually questionGroups array
      if (Array.isArray(dataToLoad)) {
        dataToLoad = { questionGroups: dataToLoad }
      }
      console.log('Type of dataToLoad:', typeof dataToLoad)
      
      // Normalize questionGroups which may be a string or object map
      const rawGroups = (dataToLoad as AdminPartContent | null)?.questionGroups
      let normalizedGroups: AdminQuestionGroup[] = normalizeArrayMaybeStringOrObject<AdminQuestionGroup>(rawGroups)
      

      // Normalize nested questions arrays too (they might be strings)
      normalizedGroups = normalizedGroups.map((g) => {
        const ng: AdminQuestionGroup = { ...g }
        ng.questions = normalizeArrayMaybeStringOrObject<AdminQuestion>(ng.questions)
        return ng
      })

      // If we successfully normalized, replace in dataToLoad
      if (normalizedGroups.length > 0) {
        const base: AdminPartContent = (typeof dataToLoad === 'object' && dataToLoad) ? (dataToLoad as AdminPartContent) : {}
        dataToLoad = { ...base, questionGroups: normalizedGroups }
      }

      // dataToLoad = JSON.parse(dataToLoad)

      console.log('Data to load into form (normalized):', dataToLoad, (dataToLoad as any)?.questionGroups)

      // Count question groups and store data
      const groups = Array.isArray((dataToLoad as AdminPartContent | null)?.questionGroups)
        ? (dataToLoad as AdminPartContent).questionGroups as AdminQuestionGroup[]
        : []
      console.log(`Found ${groups.length} question groups in data`)
      
      if (groups.length > 0) {
        // Store data and set count - useEffect will populate form after render
        if (typeof dataToLoad === 'object' && dataToLoad) {
          setLoadedData(dataToLoad as AdminPartContent)
        } else {
          console.warn('Normalized groups exist but dataToLoad is not an object; skipping setLoadedData')
        }
        setQuestionGroupCount(groups.length)
        // Fetch correct answers after content is loaded
        setTimeout(() => fetchCorrectAnswers(), 500)
      } else {
        // For Writing section or other sections without question groups, load data directly
        console.warn('No question groups found in data - loading data directly (Writing section)')
        if (typeof dataToLoad === 'object' && dataToLoad) {
          form.setFieldsValue(dataToLoad as AdminPartContent)
          console.log('✅ Form populated directly with data:', dataToLoad)
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching part content:', error)
      // Not an error if content doesn't exist yet (first time creating)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Recalculate all ranges before saving
      recalculateAllRanges()
      
      // Wait a bit for the recalculation to apply
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const values = await form.validateFields()
      
      console.log('📝 Form values before save:', values)
      
      // Remove answers from both admin and user formats
      // Answers are stored separately via saveQuestion API (with ord parameter)
      const cleanedContent = removeAnswersFromContent(values)
      
      console.log('✅ Cleaned content (no answers):', cleanedContent)
      console.log('📖 Passage field:', cleanedContent.passage)
      console.log('❓ Questions array:', cleanedContent.questions)
      
      const contentToSave = {
        admin: cleanedContent,  // Without answers - for re-editing structure only
        user: cleanedContent    // Without answers - for user-side rendering
      }
      
      // Note: API function already does JSON.stringify, so pass the object directly
      await testManagementApi.savePartQuestionContent(partId, contentToSave)
      
      // Save all pending answers
      await savePendingAnswers()
      
      // Recalculate and update ranges for ALL parts in the section
      await recalculateAndUpdateAllParts()
      
      message.success('Content and answers saved successfully!')
    } catch (error: any) {
      console.error('Error saving content:', error)
      if (error.errorFields) {
        message.error('Please fill in all required fields')
        return
      }
      message.error('Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  // Recalculate and update ranges for all parts in the section
  const recalculateAndUpdateAllParts = async () => {
    try {
      console.log('🔄 Recalculating ranges for all parts in section...')
      
      const partsResponse = await testManagementApi.getAllParts(sectionId)
      const allParts = partsResponse?.data || partsResponse || []
      
      let cumulativeQuestions = 0
      
      for (const part of allParts) {
        try {
          const contentResponse = await testManagementApi.getPartQuestionContent(part.id)
          const contentString = contentResponse.data?.content || contentResponse.content
          
          if (!contentString) continue
          
          const parsedContent = safeMultiParseJson<PersistedPartContentEnvelope>(contentString, 10)
          
          let adminContent: any = null
          if (parsedContent && parsedContent.admin) {
            adminContent = safeMultiParseJson(parsedContent.admin, 10)
          } else if (parsedContent && parsedContent.questionGroups) {
            adminContent = parsedContent
          }
          
          if (!adminContent || !adminContent.questionGroups) continue
          
          const questionGroups = normalizeArrayMaybeStringOrObject(adminContent.questionGroups)
          let currentStart = cumulativeQuestions + 1
          let partUpdated = false
          
          const updatedGroups = questionGroups.map((group: any) => {
            if (!group) return group
            
            let questionCount = 0
            
            if (group.range) {
              const match = group.range.match(/^(\d+)-(\d+)$/)
              if (match) {
                questionCount = parseInt(match[2]) - parseInt(match[1]) + 1
              }
            } else if (group.questions) {
              if (group.type === 'SHORT_ANSWER') {
                group.questions.forEach((q: any) => {
                  if (q.text) {
                    const matches = q.text.match(/\[(\d+)\]/g) || []
                    questionCount += matches.length
                  }
                })
              } else {
                const questions = normalizeArrayMaybeStringOrObject(group.questions)
                questionCount = questions.length
              }
            }
            
            if (questionCount === 0) questionCount = 5
            
            const newRange = `${currentStart}-${currentStart + questionCount - 1}`
            
            if (group.range !== newRange) {
              partUpdated = true
              console.log(`  Part ${part.id}: ${group.range || 'no range'} → ${newRange}`)
            }
            
            currentStart += questionCount
            
            return { ...group, range: newRange }
          })
          
          cumulativeQuestions = currentStart - 1
          
          if (partUpdated) {
            const updatedContent = { ...adminContent, questionGroups: updatedGroups }
            await testManagementApi.savePartQuestionContent(part.id, {
              admin: updatedContent,
              user: updatedContent
            })
            console.log(`✅ Updated part ${part.id}`)
          }
          
        } catch (error) {
          console.error(`Error processing part ${part.id}:`, error)
        }
      }
      
      console.log('✅ All parts updated')
      
    } catch (error) {
      console.error('❌ Error recalculating all parts:', error)
    }
  }

  const savePendingAnswers = async () => {
    if (pendingAnswers.size === 0) {
      console.log('No pending answers to save')
      return
    }
    
    console.log('💾 Saving pending answers:', Array.from(pendingAnswers.entries()))
    
    const savePromises: Promise<any>[] = []
    pendingAnswers.forEach((answers, questionNumber) => {
      if (answers.length > 0) {
        savePromises.push(
          testManagementApi.saveQuestion(sectionId, partId, questionNumber, answers)
            .then(() => console.log(`✅ Saved answer for Q${questionNumber}:`, answers))
            .catch((error) => console.error(`❌ Failed to save answer for Q${questionNumber}:`, error))
        )
      }
    })
    
    await Promise.all(savePromises)
    setPendingAnswers(new Map()) // Clear pending answers after save
  }

  // Remove answers from content (they're saved separately via saveQuestion API)
  // Also prepares flat questions array for user-side rendering
  const removeAnswersFromContent = (formData: any) => {
    const contentWithoutAnswers = { ...formData }
    const flatQuestions: any[] = []

    // Process question groups to remove answers
    if (contentWithoutAnswers.questionGroups) {
      contentWithoutAnswers.questionGroups = contentWithoutAnswers.questionGroups.map((group: any, groupIndex: number) => {
        // Parse the range to get starting question number
        let startNumber = 1
        if (group.range) {
          const rangeMatch = group.range.match(/(\d+)-(\d+)/)
          if (rangeMatch) {
            startNumber = parseInt(rangeMatch[1])
          }
        }
        
        // For MATCH_HEADING, headingOptions is already an array from Form.List
        let headingOptionsArray: string[] = []
        if (group.type === 'MATCH_HEADING' && group.headingOptions) {
          // headingOptions is now an array, not a string
          headingOptionsArray = Array.isArray(group.headingOptions) 
            ? group.headingOptions 
            : []
        }

        if (group.questions) {
          const cleanQuestions = group.questions.map((question: any, index: number) => {
            // Remove both correctAnswer and answers fields
            const { correctAnswer, answers, ...questionWithoutAnswer } = question
            
            // For SHORT_ANSWER type, expand ONLY the flat questions array (user-side)
            // Keep single question object in questionGroups (admin-side)
            if (group.type === 'SHORT_ANSWER') {
              // Extract all placeholders [1], [2], [3] from the text
              const matches = (questionWithoutAnswer.text || '').match(/\[(\d+)\]/g) || []
              const placeholderNumbers = matches.map((m: string) => {
                const num = m.match(/\[(\d+)\]/)
                return num ? parseInt(num[1]) : 0
              }).filter((n: number) => n > 0)
              
              // Create separate flat question objects for user-side (1 per placeholder)
              placeholderNumbers.forEach((placeholderNum: number) => {
                flatQuestions.push({
                  id: placeholderNum,
                  type: 'FILL_IN_BLANK',
                  text: questionWithoutAnswer.text || '',
                })
              })
            } else {
              // For other types, one question object = one flat question
              const questionType = group.type
              const questionId = startNumber + index
              
              const flatQuestion: any = {
                id: questionId,
                type: questionType,
                text: questionWithoutAnswer.text || '',
              }
              
              // Add type-specific fields
              if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTIPLE_CHOICE_SINGLE') {
                flatQuestion.options = questionWithoutAnswer.options
                if (questionType === 'MULTIPLE_CHOICE') {
                  flatQuestion.maxAnswers = questionWithoutAnswer.maxAnswers
                }
              } else if (questionType === 'MATCH_HEADING') {
                // Heading options are now an array from Form.List (like SENTENCE_COMPLETION)
                const groupHeadings = group.headingOptions || []
                flatQuestion.options = Array.isArray(groupHeadings) ? groupHeadings : []
              } else if (questionType === 'SENTENCE_COMPLETION') {
                // Options are already an array from Form.List
                const groupOptions = group.options || []
                flatQuestion.options = Array.isArray(groupOptions) ? groupOptions : []
              } else if (questionType === 'IMAGE_INPUTS') {
                // For IMAGE_INPUTS, add imageUrl from group's imageId
                if (group.imageId) {
                  flatQuestion.imageUrl = `/api/file/download/${group.imageId}`
                }
              }
              
              flatQuestions.push(flatQuestion)
            }
            
            // Return single question object (keeps admin UI clean)
            return questionWithoutAnswer
          })
          
          return { ...group, questions: cleanQuestions }
        }
        return group
      })
    }

    // Add flat questions array for user-side rendering
    contentWithoutAnswers.questions = flatQuestions
    
    // Set questionRange based on all questions
    if (flatQuestions.length > 0) {
      const allIds = flatQuestions.map(q => q.id)
      contentWithoutAnswers.questionRange = [Math.min(...allIds), Math.max(...allIds)]
    }

    return contentWithoutAnswers
  }

  // Handle answer change - store in pending state instead of saving immediately
  const handleAnswerChange = (questionNumber: number, answer: string | string[]) => {
    if (!answer) return
    
    // Convert to array if it's a string
    const answers = Array.isArray(answer) ? answer : [answer]
    
    // Filter out empty answers
    const validAnswers = answers.filter(a => a && a.trim().length > 0)
    if (validAnswers.length === 0) return
    
    // Store in pending answers map
    setPendingAnswers(prev => {
      const newMap = new Map(prev)
      newMap.set(questionNumber, validAnswers)
      console.log(`📝 Pending answer for Q${questionNumber}:`, validAnswers)
      return newMap
    })
  }

  // Calculate the next question range based on existing groups AND previous parts
  const getNextQuestionRange = (groupIndex: number): string => {
    const questionGroups = form.getFieldValue('questionGroups') || []
    
    // Start from the question offset (questions from previous parts)
    let nextStart = questionOffset + 1
    
    // Calculate based on all previous groups in THIS part
    for (let i = 0; i < groupIndex; i++) {
      const group = questionGroups[i]
      if (group && group.range) {
        // Parse range like "1-5" to get the end number
        const match = group.range.match(/^(\d+)-(\d+)$/)
        if (match) {
          nextStart = parseInt(match[2]) + 1
        }
      } else if (group && group.questions) {
        // For SHORT_ANSWER, count placeholders, not question objects
        if (group.type === 'SHORT_ANSWER') {
          group.questions.forEach((question: any) => {
            if (question.text) {
              const matches = question.text.match(/\[(\d+)\]/g) || []
              nextStart += matches.length
            }
          })
        } else {
          // For other types, count question objects
          nextStart += group.questions.length
        }
      }
    }
    
    // Default to 5 questions per group, can be adjusted
    const defaultGroupSize = 5
    return `${nextStart}-${nextStart + defaultGroupSize - 1}`
  }

  const addQuestionGroup = () => {
    const newIndex = questionGroupCount
    const nextRange = getNextQuestionRange(newIndex)
    
    // Get current question groups
    const currentGroups = form.getFieldValue('questionGroups') || []
    
    // Add new group with calculated range
    const newGroup = {
      type: '',
      range: nextRange,
      instruction: '',
      questions: []
    }
    
    form.setFieldValue('questionGroups', [...currentGroups, newGroup])
    setQuestionGroupCount(prev => prev + 1)
    
    // Recalculate all ranges after adding
    setTimeout(() => recalculateAllRanges(), 100)
  }

  const deleteQuestionGroup = async (groupIndex: number) => {
    const currentGroups = form.getFieldValue('questionGroups') || []
    const groupToDelete = currentGroups[groupIndex]
    
    if (!groupToDelete) {
      message.error('Question group not found')
      return
    }

    // Parse the range to get question numbers
    const range = groupToDelete.range
    const match = range?.match(/^(\d+)-(\d+)$/)
    const questionCount = match ? parseInt(match[2]) - parseInt(match[1]) + 1 : 0

    Modal.confirm({
      title: 'Delete Question Group?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>Question Group {groupIndex + 1}</strong>?</p>
          {range && <p>This will delete questions <strong>{range}</strong> ({questionCount} question{questionCount !== 1 ? 's' : ''}).</p>}
          <p className="text-red-600">This action cannot be undone!</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (match) {
            const startNum = parseInt(match[1])
            const endNum = parseInt(match[2])
            
            // Fetch all questions to get their IDs
            console.log('📥 Fetching questions to get IDs for deletion...')
            const questionsResponse = await testManagementApi.getAllQuestions(sectionId)
            const allQuestions = questionsResponse?.data || []
            
            // Filter questions in this part and range
            const questionsToDelete = allQuestions.filter((q: any) => 
              q.partId === partId && 
              q.ord >= startNum && 
              q.ord <= endNum
            )
            
            console.log(`🗑️ Found ${questionsToDelete.length} questions to delete in range ${startNum}-${endNum}`)
            
            // Delete all questions in this range from the backend
            const deletePromises = questionsToDelete.map((q: any) => {
              console.log(`🗑️ Deleting question ${q.ord} (ID: ${q.id}) from backend...`)
              return testManagementApi.deleteQuestion(q.id)
                .then(() => console.log(`✅ Deleted question ${q.ord}`))
                .catch((error) => {
                  console.error(`❌ Failed to delete question ${q.ord}:`, error)
                  // Don't throw - continue with other deletions
                })
            })
            
            // Wait for all deletions to complete
            await Promise.all(deletePromises)
          }

          // Remove the group from the form
          const updatedGroups = currentGroups.filter((_: any, index: number) => index !== groupIndex)
          form.setFieldValue('questionGroups', updatedGroups)
          setQuestionGroupCount(prev => Math.max(0, prev - 1))
          
          // Remove from pending answers
          if (match) {
            const startNum = parseInt(match[1])
            const endNum = parseInt(match[2])
            const newPendingAnswers = new Map(pendingAnswers)
            for (let qNum = startNum; qNum <= endNum; qNum++) {
              newPendingAnswers.delete(qNum)
            }
            setPendingAnswers(newPendingAnswers)
          }
          
          // Recalculate all ranges after deletion
          setTimeout(() => recalculateAllRanges(), 100)
          
          message.success('Question group deleted successfully')
        } catch (error) {
          console.error('❌ Error deleting question group:', error)
          message.error('Failed to delete question group')
        }
      }
    })
  }

  const isReading = sectionType.toLowerCase() === 'reading'
  const isWriting = sectionType.toLowerCase() === 'writing'
  const isListening = sectionType.toLowerCase() === 'listening'

  const renderContentTab = () => {
    if (isReading) {
      // Split view (side-by-side) for Reading ONLY
      return (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
          {/* Left Side - Passage */}
          <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column' }}>
            <Card
              title="Passage (Rich Text)"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
              extra={
                <Space>
                  {/* Add placeholder buttons for MATCH_HEADING questions */}
                  {form.getFieldValue('questionGroups')?.some((g: any) => g?.type === 'MATCH_HEADING') && (
                    <Space.Compact>
                      {(() => {
                        const questionGroups = form.getFieldValue('questionGroups') || []
                        const buttons: JSX.Element[] = []
                        
                        questionGroups.forEach((group: any) => {
                          if (group?.type === 'MATCH_HEADING' && group?.range) {
                            // Parse the range like "10-11"
                            const rangeMatch = group.range.match(/^(\d+)-(\d+)$/)
                            if (rangeMatch) {
                              const startNum = parseInt(rangeMatch[1])
                              const endNum = parseInt(rangeMatch[2])
                              
                              // Create a button for each question in the range
                              for (let qNum = startNum; qNum <= endNum; qNum++) {
                                buttons.push(
                                  <Button
                                    key={qNum}
                                    size="small"
                                    type="dashed"
                                    onClick={() => {
                                      const placeholder = `[${qNum}]`
                                      passageEditorRef.current?.insertText(placeholder)
                                    }}
                                  >
                                    [{qNum}]
                                  </Button>
                                )
                              }
                            }
                          }
                        })
                        
                        return buttons
                      })()}
                    </Space.Compact>
                  )}
                </Space>
              }
            >
              <Form.Item
                name="passage"
                style={{ flex: 1, margin: 0, display: 'flex', flexDirection: 'column' }}
              >
                <PassageRichTextEditor
                  ref={passageEditorRef}
                  placeholder="Enter the reading passage with formatting... Use buttons above to insert placeholders for Match Heading questions."
                  minHeight="600px"
                />
              </Form.Item>
              
              <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Form.Item
                  label="Passage Image (Optional)"
                  name="imageId"
                  help="Upload an image/diagram that accompanies the entire passage"
                  style={{ marginBottom: 0 }}
                >
                  <ImageUpload label="Upload Passage Image" />
                </Form.Item>
              </div>
            </Card>
          </div>

          {/* Right Side - Questions Section */}
          <div style={{ flex: 1 }}>
            <Card title="Question Groups" extra={
              questionOffset > 0 && (
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  📊 Questions start from: <strong>{questionOffset + 1}</strong> (previous parts have {questionOffset} questions)
                </Text>
              )
            }>
              <Form.Item
                label="Instructions"
                name="instruction"
              >
                <PassageRichTextEditor
                  placeholder="General instructions for this part..."
                  minHeight="120px"
                />
              </Form.Item>

              <Divider />

              <Space direction="vertical" className="w-full" size="small">
                {Array.from({ length: questionGroupCount }).map((_, index) => (
                  <QuestionGroupEditor
                    key={index}
                    groupPath={['questionGroups', index]}
                    groupLabel={`Question Group ${index + 1}`}
                    form={form}
                    defaultQuestionRange={getNextQuestionRange(index)}
                    showImageUpload={true}
                    onAnswerChange={handleAnswerChange}
                    onRecalculateRanges={recalculateAllRanges}
                    onDelete={() => deleteQuestionGroup(index)}
                  />
                ))}
              </Space>

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={addQuestionGroup}
                className="mt-4"
                size="large"
              >
                Add Question Group
              </Button>
            </Card>
          </div>
        </div>
      )
    } else if (isWriting) {
      // Single column for Writing (no questions, just task description and image)
      return (
        <div>
          <Form.Item
            label="Instructions"
            name="instruction"
          >
            <PassageRichTextEditor
              placeholder="General instructions for this writing task..."
              minHeight="120px"
            />
          </Form.Item>

          <Divider />

          <Card title="Task Description">
            <Form.Item
              label="Task Description"
              name="passage"
            >
              <TextArea
                placeholder="Enter the writing task description (e.g., 'The chart shows...', 'Some people believe...')"
                rows={10}
                style={{ fontFamily: 'serif' }}
              />
            </Form.Item>
          </Card>

          {/* Image Upload for Writing Part 1 */}
          <Card title="Task Image/Chart" className="mt-4">
            <Form.Item
              name="imageId"
              help="Upload a chart, graph, diagram, or table for Task 1 (optional for Task 2)"
            >
              <ImageUpload label="Upload Task Image" />
            </Form.Item>
          </Card>
        </div>
      )
    } else {
      // Full width for Listening
      return (
        <div>
          {questionOffset > 0 && (
            <Card size="small" style={{ marginBottom: '16px', background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Text>
                📊 <strong>Question Numbering:</strong> This part starts from question <strong>{questionOffset + 1}</strong> 
                {' '}(previous parts have {questionOffset} questions)
              </Text>
            </Card>
          )}
          
          <Form.Item
            label="Instructions"
            name="instruction"
          >
            <PassageRichTextEditor
              placeholder="General instructions for this part..."
              minHeight="120px"
            />
          </Form.Item>

          <Divider />

          <Space direction="vertical" className="w-full" size="small">
            {Array.from({ length: questionGroupCount }).map((_, index) => (
              <QuestionGroupEditor
                key={index}
                groupPath={['questionGroups', index]}
                groupLabel={`Question Group ${index + 1}`}
                form={form}
                defaultQuestionRange={getNextQuestionRange(index)}
                showImageUpload={isListening}
                onAnswerChange={handleAnswerChange}
                onRecalculateRanges={recalculateAllRanges}
                onDelete={() => deleteQuestionGroup(index)}
              />
            ))}
          </Space>

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={addQuestionGroup}
            className="mt-4"
            size="large"
          >
            Add Question Group
          </Button>
        </div>
      )
    }
  }

  const renderListeningAudioTab = () => {
    return (
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Listening Audio</Title>
            <Text type="secondary">
              Upload the audio file for this part of the listening test.
              Students will listen to this audio while answering the questions.
            </Text>
          </div>

          <Form.Item
            name="audioFileId"
            label="Audio File"
            help="Supported formats: MP3, WAV, OGG, M4A"
          >
            <AudioUpload label="Upload Audio File" />
          </Form.Item>

          <div style={{ 
            padding: '16px', 
            background: '#f6f8fa', 
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
          }}>
            <Text strong>📝 Audio Guidelines:</Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Upload clear, high-quality audio</li>
              <li>Recommended format: MP3 (better compatibility)</li>
              <li>File size: Keep under 50MB for faster loading</li>
              <li>Test the audio before publishing</li>
            </ul>
          </div>
        </Space>
      </Card>
    )
  }

  const renderAnswersTab = () => {
    return (
      <Card>
        <Title level={5}>Correct Answers</Title>
        <Text type="secondary">
          Answers are stored within each question. Use the Content tab to edit answers.
        </Text>
        {/* This tab can show a summary of all answers for review */}
      </Card>
    )
  }

  const tabs = [
    {
      key: 'content',
      label: 'Content',
      children: renderContentTab(),
    },
  ]

  // Audio upload moved to section level for listening
  // No longer needed at part level

  tabs.push({
    key: 'answers',
    label: 'Answers',
    children: renderAnswersTab(),
  })

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0', 
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        lineHeight: 'normal',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <Title level={4} style={{ margin: 0, marginBottom: '4px', lineHeight: '1.3' }}>
              {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} - Part {partId.slice(0, 8)}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
              Edit part content and questions
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          size="large"
          style={{
            background: '#52c41a',
            borderColor: '#52c41a',
            flexShrink: 0
          }}
        >
          Save
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : (isListening || isWriting) ? (
          // Paper container for Listening and Writing
          <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '1400px',
              margin: '0 auto'
            }} className="paper-container">
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '32px'
              }}>
                <Form
                  form={form}
                  layout="vertical"
                >
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabs}
                    size="large"
                  />
                </Form>
              </div>
            </div>
          </div>
        ) : (
          // Full width for Reading (for split view)
          <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '32px',
              maxWidth: '1600px',
              margin: '0 auto'
            }}>
              <Form
                form={form}
                layout="vertical"
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabs}
                  size="large"
                />
              </Form>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}

export default PartEditorPage
