'use client'

import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface TableCell {
  type: 'text' | 'input'
  content?: string
  questionId?: number
  questionNumber?: number
  colSpan?: number
  rowSpan?: number
  className?: string
}

interface TableRow {
  cells: TableCell[]
}

interface TableQuestionProps {
  headers?: string[]
  rows: TableRow[]
  instruction?: string
  isPreviewMode?: boolean
}

const TableQuestion = observer(({ headers, rows, instruction, isPreviewMode = false }: TableQuestionProps) => {
  const { listeningStore } = useStore()

  const handleInputChange = (questionId: number, value: string) => {
    listeningStore.setAnswer(questionId, value)
  }

  return (
    <div className="space-y-4">
      {instruction && (
        <p style={{ color: 'var(--text-primary)' }} className="font-medium">{instruction}</p>
      )}

      <div className="overflow-x-auto">
        <table style={{ borderColor: 'var(--border-color)' }} className="w-full border-collapse border">
          {headers && headers.length > 0 && (
            <thead>
              <tr style={{ backgroundColor: 'var(--card-background)' }}>
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    className="border px-4 py-2 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row: TableRow, rowIndex: number) => (
              <tr key={rowIndex} style={{ backgroundColor: 'var(--card-background)' }}>
                {row.cells.map((cell: TableCell, cellIndex: number) => {
                  const cellClass = `border px-4 py-2 ${cell.className || ''}`

                  if (cell.type === 'input' && cell.questionId !== undefined) {
                    // In preview mode with submitted answers, show submitted answer with correctness styling
                    if (isPreviewMode) {
                      const submittedAnswer = listeningStore.getSubmittedAnswer(cell.questionId)
                      const isCorrect = listeningStore.isAnswerCorrect(cell.questionId)

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
                        <td
                          key={cellIndex}
                          className={cellClass}
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background)' }}
                          colSpan={cell.colSpan}
                          rowSpan={cell.rowSpan}
                        >
                          <Input
                            value={submittedAnswer as string || ''}
                            placeholder={cell.questionNumber?.toString() || ''}
                            className="w-full"
                            style={{
                              backgroundColor,
                              borderColor,
                              borderWidth: '2px',
                              color: 'var(--text-primary)'
                            }}
                            size="small"
                            disabled={true}
                          />
                        </td>
                      )
                    }

                    // Normal mode - editable
                    const answer = listeningStore.getAnswer(cell.questionId) as string || ''

                    return (
                      <td
                        key={cellIndex}
                        className={cellClass}
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background)' }}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                      >
                        <Input
                          value={answer}
                          onChange={(e) => handleInputChange(cell.questionId!, e.target.value)}
                          placeholder={cell.questionNumber?.toString() || ''}
                          className="w-full"
                          style={{ backgroundColor: 'var(--input-background)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                          size="small"
                          disabled={false}
                        />
                      </td>
                    )
                  }

                  return (
                    <td
                      key={cellIndex}
                      className={cellClass}
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background)', color: 'var(--text-primary)' }}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                    >
                      {cell.content}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default TableQuestion
