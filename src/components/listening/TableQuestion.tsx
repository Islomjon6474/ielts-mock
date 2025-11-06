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
}

const TableQuestion = observer(({ headers, rows, instruction }: TableQuestionProps) => {
  const { listeningStore } = useStore()

  const handleInputChange = (questionId: number, value: string) => {
    listeningStore.setAnswer(questionId, value)
  }

  return (
    <div className="space-y-4">
      {instruction && (
        <p className="text-gray-700 font-medium">{instruction}</p>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {headers && headers.length > 0 && (
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row: TableRow, rowIndex: number) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.cells.map((cell: TableCell, cellIndex: number) => {
                  const cellClass = `border border-gray-300 px-4 py-2 ${cell.className || ''}`
                  
                  if (cell.type === 'input' && cell.questionId !== undefined) {
                    const answer = listeningStore.getAnswer(cell.questionId) as string || ''
                    
                    return (
                      <td
                        key={cellIndex}
                        className={cellClass}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                      >
                        <Input
                          value={answer}
                          onChange={(e) => handleInputChange(cell.questionId!, e.target.value)}
                          placeholder={cell.questionNumber?.toString() || ''}
                          className="w-full"
                          size="small"
                        />
                      </td>
                    )
                  }
                  
                  return (
                    <td
                      key={cellIndex}
                      className={cellClass}
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
