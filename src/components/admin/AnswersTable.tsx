'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Tag, Typography, message, Spin, Empty, Select, Checkbox } from 'antd'
import { EditOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { testManagementApi } from '@/services/testManagementApi'
import { QuestionDto } from '@/types/api'
import { safeMultiParseJson, normalizeArrayMaybeStringOrObject } from '@/utils/json'
import { PersistedPartContentEnvelope, AdminPartContent, AdminQuestionGroup, AdminQuestion } from '@/types/testContent'
import { AnswerRichTextEditor } from './AnswerRichTextEditor'

const { Text, Title } = Typography

interface QuestionWithContent {
  id: string
  ord: number
  partId: string
  partOrd: number
  answers: string[]
  // Content data (extracted from part content)
  text?: string
  type?: string
  options?: string[]
  matrixOptions?: string[]
  groupInstruction?: string
}

interface AnswersTableProps {
  sectionId: string
  partId: string
  onAnswerSaved?: () => void
}

export const AnswersTable = ({ sectionId, partId, onAnswerSaved }: AnswersTableProps) => {
  const [questions, setQuestions] = useState<QuestionWithContent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string[]>>({})
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])

  // Load questions and content
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch questions from API
      const questionsResponse = await testManagementApi.getAllQuestions(sectionId)
      const allQuestions: QuestionDto[] = questionsResponse.data || questionsResponse || []

      // Filter questions for this part
      const partQuestions = allQuestions.filter((q: QuestionDto) => q.partId === partId)

      // Fetch content for this part to get question text
      let contentData: AdminPartContent | null = null
      try {
        const contentResponse = await testManagementApi.getPartQuestionContent(partId)
        const contentString = contentResponse?.data?.content || contentResponse?.content

        if (contentString) {
          const parsed = safeMultiParseJson<PersistedPartContentEnvelope>(contentString, 10)

          if (parsed?.admin) {
            contentData = safeMultiParseJson<AdminPartContent>(parsed.admin, 10)
          } else if (parsed?.questionGroups) {
            contentData = parsed as unknown as AdminPartContent
          }
        }
      } catch (e) {
        console.error('Error fetching content:', e)
      }

      // Build a map of question numbers to content
      const questionContentMap = new Map<number, { text?: string; type?: string; options?: string[]; matrixOptions?: string[]; groupInstruction?: string }>()

      if (contentData?.questionGroups) {
        const groups = normalizeArrayMaybeStringOrObject<AdminQuestionGroup>(contentData.questionGroups)

        groups.forEach((group) => {
          if (!group) return

          const groupType = group.type
          const groupInstruction = group.instruction
          const matrixOptions = group.matrixOptions

          // Parse range to get starting question number
          let startNum = 1
          if (group.range) {
            const match = group.range.match(/^(\d+)-(\d+)$/)
            if (match) {
              startNum = parseInt(match[1])
            }
          }

          if (group.questions) {
            const questions = normalizeArrayMaybeStringOrObject<AdminQuestion>(group.questions)

            questions.forEach((q, idx) => {
              // For SHORT_ANSWER, extract placeholders
              if (groupType === 'SHORT_ANSWER' && q.text) {
                const placeholders = (q.text.match(/\[(\d+)\]/g) || []).map((m: string) => {
                  const num = m.match(/\[(\d+)\]/)
                  return num ? parseInt(num[1]) : 0
                }).filter((n: number) => n > 0)

                placeholders.forEach((placeholderNum: number) => {
                  questionContentMap.set(placeholderNum, {
                    text: q.text,
                    type: 'SHORT_ANSWER',
                    groupInstruction
                  })
                })
              } else {
                // For other types, one question = one question number
                const qNum = startNum + idx
                questionContentMap.set(qNum, {
                  text: q.text || (q as any).paragraphText,
                  type: groupType,
                  options: Array.isArray(q.options) ? q.options : undefined,
                  matrixOptions,
                  groupInstruction
                })
              }
            })
          }
        })
      }

      // Merge question data with content
      const questionsWithContent: QuestionWithContent[] = partQuestions
        .sort((a, b) => a.ord - b.ord)
        .map((q) => {
          const content = questionContentMap.get(q.ord) || {}
          return {
            ...q,
            ...content
          }
        })

      setQuestions(questionsWithContent)

      // Auto-expand rows that don't have answers
      const unansweredRows = questionsWithContent
        .filter((q) => !q.answers || q.answers.length === 0)
        .map((q) => q.ord)
      setExpandedRowKeys(unansweredRows)

    } catch (error) {
      console.error('Error loading questions:', error)
      message.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [sectionId, partId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Start editing a row
  const startEditing = (ord: number, currentAnswers: string[]) => {
    setEditingRow(ord)
    setEditValues({ ...editValues, [ord]: currentAnswers.length > 0 ? [...currentAnswers] : [''] })

    // Expand the row if not already expanded
    if (!expandedRowKeys.includes(ord)) {
      setExpandedRowKeys([...expandedRowKeys, ord])
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingRow(null)
  }

  // Save answer for a question
  const saveAnswer = async (question: QuestionWithContent) => {
    const answers = editValues[question.ord] || []
    const validAnswers = answers.filter((a) => a && a.trim().length > 0)

    if (validAnswers.length === 0) {
      message.warning('Please enter at least one answer')
      return
    }

    try {
      setSaving({ ...saving, [question.ord]: true })

      if (question.id) {
        // Update existing question
        await testManagementApi.updateQuestion(question.id, partId, validAnswers)
      } else {
        // Create new question
        await testManagementApi.saveQuestion(sectionId, partId, question.ord, validAnswers)
      }

      message.success(`Answer for Question ${question.ord} saved successfully`)
      setEditingRow(null)

      // Reload data
      await loadData()

      onAnswerSaved?.()
    } catch (error) {
      console.error('Error saving answer:', error)
      message.error('Failed to save answer')
    } finally {
      setSaving({ ...saving, [question.ord]: false })
    }
  }

  // Update edit value
  const updateEditValue = (ord: number, index: number, value: string) => {
    const current = editValues[ord] || ['']
    const updated = [...current]
    updated[index] = value
    setEditValues({ ...editValues, [ord]: updated })
  }

  // Add another answer option
  const addAnswerOption = (ord: number) => {
    const current = editValues[ord] || ['']
    setEditValues({ ...editValues, [ord]: [...current, ''] })
  }

  // Remove an answer option
  const removeAnswerOption = (ord: number, index: number) => {
    const current = editValues[ord] || ['']
    if (current.length > 1) {
      const updated = current.filter((_, i) => i !== index)
      setEditValues({ ...editValues, [ord]: updated })
    }
  }

  // Get display text for question type
  const getTypeLabel = (type?: string) => {
    const typeLabels: Record<string, string> = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'MULTIPLE_CHOICE_SINGLE': 'Single Choice',
      'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE': 'Multi-Q MC',
      'TRUE_FALSE_NOT_GIVEN': 'True/False/NG',
      'YES_NO_NOT_GIVEN': 'Yes/No/NG',
      'MATCH_HEADING': 'Match Heading',
      'SHORT_ANSWER': 'Fill in Blank',
      'SENTENCE_COMPLETION': 'Sentence Completion',
      'MULTIPLE_CORRECT_ANSWERS': 'Multiple Correct',
      'MATRIX_TABLE': 'Matrix Table',
      'TABLE_COMPLETION': 'Table Completion',
      'IMAGE_INPUTS': 'Image Inputs'
    }
    return typeLabels[type || ''] || type || 'Unknown'
  }

  // Check if a question type requires rich text editor for answers
  const needsRichTextEditor = (type?: string) => {
    // Types that typically have simple answers (letters, TRUE/FALSE, etc.)
    const simpleAnswerTypes = [
      'TRUE_FALSE_NOT_GIVEN',
      'YES_NO_NOT_GIVEN',
      'MULTIPLE_CHOICE_SINGLE',
      'MULTIPLE_CHOICE',
      'MATCH_HEADING',
      'MATRIX_TABLE',
      'MULTIPLE_CORRECT_ANSWERS'
    ]
    return !simpleAnswerTypes.includes(type || '')
  }

  // Render expanded row content (editing form)
  const renderExpandedRow = (record: QuestionWithContent) => {
    const isEditing = editingRow === record.ord
    const currentValues = editValues[record.ord] || record.answers || ['']
    const isSaving = saving[record.ord]

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        {record.text && (
          <div className="mb-3">
            <Text strong>Question Text:</Text>
            <div
              className="mt-1 p-2 bg-white rounded border prose max-w-none"
              dangerouslySetInnerHTML={{ __html: record.text }}
            />
          </div>
        )}

        {record.options && record.options.length > 0 && (
          <div className="mb-3">
            <Text strong>Options:</Text>
            <div className="mt-1 space-y-1">
              {record.options.map((opt, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Tag color="blue" className="shrink-0">{String.fromCharCode(65 + idx)}</Tag>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: typeof opt === 'string' ? opt : String(opt) }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {record.matrixOptions && record.matrixOptions.length > 0 && (
          <div className="mb-3">
            <Text strong>Matrix Options:</Text>
            <div className="mt-1 space-y-1">
              {record.matrixOptions.map((opt, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Tag color="purple" className="shrink-0">{String.fromCharCode(65 + idx)}</Tag>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: typeof opt === 'string' ? opt : String(opt) }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <Text strong>Correct Answer(s):</Text>

          {isEditing ? (
            <div className="mt-2 space-y-3">
              {currentValues.map((value, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    {record.type === 'TRUE_FALSE_NOT_GIVEN' ? (
                      <Select
                        value={value}
                        onChange={(v) => updateEditValue(record.ord, idx, v)}
                        style={{ width: 200 }}
                        placeholder="Select answer"
                        options={[
                          { value: 'TRUE', label: 'TRUE' },
                          { value: 'FALSE', label: 'FALSE' },
                          { value: 'NOT GIVEN', label: 'NOT GIVEN' }
                        ]}
                      />
                    ) : record.type === 'YES_NO_NOT_GIVEN' ? (
                      <Select
                        value={value}
                        onChange={(v) => updateEditValue(record.ord, idx, v)}
                        style={{ width: 200 }}
                        placeholder="Select answer"
                        options={[
                          { value: 'YES', label: 'YES' },
                          { value: 'NO', label: 'NO' },
                          { value: 'NOT GIVEN', label: 'NOT GIVEN' }
                        ]}
                      />
                    ) : record.type === 'MULTIPLE_CHOICE_SINGLE' || record.type === 'MATCH_HEADING' ? (
                      <Select
                        value={value}
                        onChange={(v) => updateEditValue(record.ord, idx, v)}
                        style={{ width: 200 }}
                        placeholder="Select answer"
                        options={record.options?.map((_, i) => ({
                          value: String.fromCharCode(65 + i),
                          label: String.fromCharCode(65 + i)
                        })) || 'ABCDEFGHIJ'.split('').map((l) => ({ value: l, label: l }))}
                      />
                    ) : record.type === 'MULTIPLE_CHOICE' || record.type === 'MULTIPLE_CORRECT_ANSWERS' ? (
                      <Checkbox.Group
                        value={value ? value.split(',').map(v => v.trim()).filter(v => v) : []}
                        onChange={(checkedValues) => updateEditValue(record.ord, idx, (checkedValues as string[]).join(', '))}
                        options={record.options?.map((_, i) => ({
                          value: String.fromCharCode(65 + i),
                          label: String.fromCharCode(65 + i)
                        })) || 'ABCDEFGHIJ'.split('').map((l) => ({ value: l, label: l }))}
                      />
                    ) : record.type === 'MATRIX_TABLE' && record.matrixOptions ? (
                      <Checkbox.Group
                        value={value ? value.split(',').map(v => v.trim()).filter(v => v) : []}
                        onChange={(checkedValues) => updateEditValue(record.ord, idx, (checkedValues as string[]).join(', '))}
                        options={record.matrixOptions.map((opt, i) => ({
                          value: String.fromCharCode(65 + i),
                          label: `${String.fromCharCode(65 + i)}`
                        }))}
                      />
                    ) : needsRichTextEditor(record.type) ? (
                      <AnswerRichTextEditor
                        value={value}
                        onChange={(v) => updateEditValue(record.ord, idx, v)}
                        placeholder="Enter correct answer with formatting..."
                        minHeight="60px"
                      />
                    ) : (
                      <AnswerRichTextEditor
                        value={value}
                        onChange={(v) => updateEditValue(record.ord, idx, v)}
                        placeholder="Enter correct answer..."
                        minHeight="60px"
                      />
                    )}
                  </div>

                  {currentValues.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => removeAnswerOption(record.ord, idx)}
                      title="Remove this answer"
                    />
                  )}
                </div>
              ))}

              {/* Allow multiple answers for certain types */}
              {(record.type === 'SHORT_ANSWER' || record.type === 'SENTENCE_COMPLETION' || record.type === 'TABLE_COMPLETION' || !record.type) && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addAnswerOption(record.ord)}
                >
                  Add Alternative Answer
                </Button>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => saveAnswer(record)}
                  loading={isSaving}
                >
                  Save Answer
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {record.answers && record.answers.length > 0 ? (
                <div className="space-y-2">
                  {record.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="inline-block px-3 py-1 bg-green-50 border border-green-200 rounded-md prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: ans }}
                    />
                  ))}
                </div>
              ) : (
                <Text type="warning" className="italic">No answer set</Text>
              )}

              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => startEditing(record.ord, record.answers || [])}
                className="mt-2 p-0"
              >
                {record.answers && record.answers.length > 0 ? 'Edit Answer' : 'Set Answer'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Table columns
  const columns = [
    {
      title: 'Q#',
      dataIndex: 'ord',
      key: 'ord',
      width: 60,
      render: (ord: number) => (
        <Text strong className="text-lg">{ord}</Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color="blue">{getTypeLabel(type)}</Tag>
      )
    },
    {
      title: 'Question Preview',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text: string) => {
        if (!text) return <Text type="secondary" italic>No text available</Text>
        // Strip HTML and truncate
        const plainText = text.replace(/<[^>]*>/g, '').substring(0, 100)
        return <Text>{plainText}{text.length > 100 ? '...' : ''}</Text>
      }
    },
    {
      title: 'Correct Answer',
      dataIndex: 'answers',
      key: 'answers',
      width: 250,
      render: (answers: string[], record: QuestionWithContent) => {
        if (!answers || answers.length === 0) {
          return (
            <Button
              type="primary"
              size="small"
              ghost
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                startEditing(record.ord, [])
              }}
            >
              Set Answer
            </Button>
          )
        }
        return (
          <Space direction="vertical" size={4} className="w-full">
            {answers.map((ans, idx) => (
              <div
                key={idx}
                className="px-2 py-1 bg-green-50 border border-green-200 rounded text-sm prose prose-sm max-w-none"
                style={{ display: 'inline-block' }}
                dangerouslySetInnerHTML={{ __html: ans }}
              />
            ))}
          </Space>
        )
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: QuestionWithContent) => {
        const hasAnswer = record.answers && record.answers.length > 0
        return hasAnswer
          ? <Tag color="success">Answered</Tag>
          : <Tag color="warning">Pending</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: QuestionWithContent) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            startEditing(record.ord, record.answers || [])
          }}
        >
          Edit
        </Button>
      )
    }
  ]

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
        <div className="mt-2">
          <Text type="secondary">Loading questions...</Text>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <Empty
        description={
          <span>
            No questions found for this part.
            <br />
            <Text type="secondary">Add questions in the Content tab first.</Text>
          </span>
        }
      />
    )
  }

  const answeredCount = questions.filter((q) => q.answers && q.answers.length > 0).length
  const totalCount = questions.length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={5} className="mb-1">Question Answers</Title>
          <Text type="secondary">
            {answeredCount} of {totalCount} questions answered
            {answeredCount < totalCount && (
              <Tag color="warning" className="ml-2">
                {totalCount - answeredCount} pending
              </Tag>
            )}
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={questions}
        rowKey="ord"
        pagination={false}
        expandable={{
          expandedRowRender: renderExpandedRow,
          expandedRowKeys: expandedRowKeys,
          onExpand: (expanded, record) => {
            if (expanded) {
              setExpandedRowKeys([...expandedRowKeys, record.ord])
            } else {
              setExpandedRowKeys(expandedRowKeys.filter((k) => k !== record.ord))
            }
          },
          rowExpandable: () => true
        }}
        onRow={(record) => ({
          onClick: () => {
            // Toggle expansion on row click
            if (expandedRowKeys.includes(record.ord)) {
              setExpandedRowKeys(expandedRowKeys.filter((k) => k !== record.ord))
            } else {
              setExpandedRowKeys([...expandedRowKeys, record.ord])
            }
          },
          style: { cursor: 'pointer' }
        })}
        rowClassName={(record) => {
          const hasAnswer = record.answers && record.answers.length > 0
          return hasAnswer ? '' : 'bg-yellow-50'
        }}
      />
    </div>
  )
}
