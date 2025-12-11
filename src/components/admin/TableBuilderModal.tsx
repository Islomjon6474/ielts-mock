'use client'

import { useState, useCallback } from 'react'
import { Modal, InputNumber, Button, Tooltip, Space, Divider } from 'antd'
import {
  TableOutlined,
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  DeleteColumnOutlined,
  MergeCellsOutlined,
  SplitCellsOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons'

interface TableBuilderModalProps {
  open: boolean
  onCancel: () => void
  onInsert: (rows: number, cols: number) => void
}

export const TableBuilderModal = ({ open, onCancel, onInsert }: TableBuilderModalProps) => {
  const [rows, setRows] = useState(4)
  const [cols, setCols] = useState(2)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [useGridSelector, setUseGridSelector] = useState(true)

  const maxGridRows = 8
  const maxGridCols = 6

  const handleGridHover = (row: number, col: number) => {
    setHoveredCell({ row, col })
    setRows(row + 1)
    setCols(col + 1)
  }

  const handleGridClick = () => {
    if (hoveredCell) {
      onInsert(hoveredCell.row + 1, hoveredCell.col + 1)
      resetAndClose()
    }
  }

  const handleManualInsert = () => {
    if (rows > 0 && cols > 0) {
      onInsert(rows, cols)
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setRows(4)
    setCols(2)
    setHoveredCell(null)
    onCancel()
  }

  const isHighlighted = (row: number, col: number) => {
    if (!hoveredCell) return false
    return row <= hoveredCell.row && col <= hoveredCell.col
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <TableOutlined />
          <span>Insert Table</span>
        </div>
      }
      open={open}
      onCancel={resetAndClose}
      footer={null}
      width={520}
      centered
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
      style={{ maxHeight: '80vh' }}
    >
      <div className="py-4">
        {/* Grid Selector */}
        <div className="mb-6 flex justify-center flex-col">
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Click on the grid to select table size:
          </div>

          <div
            className="inline-block p-3 rounded-lg flex items-center flex-col"
            style={{ backgroundColor: '#f0f5ff', border: '2px solid #d6e4ff' }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${maxGridCols}, 36px)`,
                gridTemplateRows: `repeat(${maxGridRows}, 36px)`,
                gap: '4px',
              }}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {Array.from({ length: maxGridRows }).map((_, rowIndex) => (
                Array.from({ length: maxGridCols }).map((_, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="border-2 rounded cursor-pointer transition-all duration-100"
                    style={{
                      backgroundColor: isHighlighted(rowIndex, colIndex)
                        ? '#1890ff'
                        : '#ffffff',
                      borderColor: isHighlighted(rowIndex, colIndex)
                        ? '#1890ff'
                        : '#adc6ff',
                      boxShadow: isHighlighted(rowIndex, colIndex)
                        ? '0 0 0 2px rgba(24, 144, 255, 0.2)'
                        : 'inset 0 1px 2px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={() => handleGridHover(rowIndex, colIndex)}
                    onClick={handleGridClick}
                  />
                ))
              ))}
            </div>

            {/* Size indicator */}
            <div
              className="text-center mt-3 text-sm font-semibold py-1.5 px-3 rounded"
              style={{
                color: hoveredCell ? '#ffffff' : '#1890ff',
                backgroundColor: hoveredCell ? '#1890ff' : '#e6f7ff',
              }}
            >
              {hoveredCell ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1} Table` : 'Hover to select size'}
            </div>
          </div>
        </div>

        <Divider>or specify manually</Divider>

        {/* Manual Input */}
        <div className="flex items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rows:</span>
            <InputNumber
              min={1}
              max={20}
              value={rows}
              onChange={(val) => setRows(val || 1)}
              style={{ width: 70 }}
            />
          </div>

          <span style={{ color: 'var(--text-secondary)' }}>×</span>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Columns:</span>
            <InputNumber
              min={1}
              max={10}
              value={cols}
              onChange={(val) => setCols(val || 1)}
              style={{ width: 70 }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Preview ({rows} × {cols}):
          </div>
          <div
            className="overflow-auto max-h-32"
            style={{ maxWidth: '100%' }}
          >
            <table className="border-collapse w-full" style={{ minWidth: cols * 60 }}>
              <tbody>
                {Array.from({ length: Math.min(rows, 6) }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: Math.min(cols, 6) }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="border p-2 text-xs text-center"
                        style={{
                          borderColor: 'var(--border-color)',
                          backgroundColor: rowIndex === 0 ? 'var(--table-header-bg, #fafafa)' : 'transparent',
                          fontWeight: rowIndex === 0 ? 'bold' : 'normal',
                          minWidth: 60,
                        }}
                      >
                        {rowIndex === 0 ? `Header ${colIndex + 1}` : `Cell`}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows > 6 && (
                  <tr>
                    <td
                      colSpan={Math.min(cols, 6)}
                      className="text-center text-xs py-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      ... {rows - 6} more row(s)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleManualInsert}
            icon={<TableOutlined />}
          >
            Insert {rows} × {cols} Table
          </Button>
        </div>

        {/* Help text */}
        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{ backgroundColor: 'rgba(24, 144, 255, 0.1)', color: 'var(--text-secondary)' }}
        >
          <strong>Tip:</strong> After inserting the table, you can:
          <ul className="mt-1 ml-4 list-disc">
            <li>Select cells and use <strong>Merge Cells</strong> button to combine them (colspan/rowspan)</li>
            <li>Use <strong>Add Row/Column</strong> buttons to expand the table</li>
            <li>Click <strong>Insert Placeholder [n]</strong> to add fill-in blanks</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}

// Cell Selection Helper Modal for Merge operations
interface CellMergeModalProps {
  open: boolean
  onCancel: () => void
  onMerge: (direction: 'right' | 'down' | 'both', count: number) => void
}

export const CellMergeModal = ({ open, onCancel, onMerge }: CellMergeModalProps) => {
  const [direction, setDirection] = useState<'right' | 'down' | 'both'>('right')
  const [count, setCount] = useState(2)

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MergeCellsOutlined />
          <span>Merge Cells</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <div className="py-4">
        <div className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Select cells in the table first, then click Merge to combine them.
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Merge Direction:</div>
            <Space>
              <Button
                type={direction === 'right' ? 'primary' : 'default'}
                onClick={() => setDirection('right')}
              >
                → Horizontal (Colspan)
              </Button>
              <Button
                type={direction === 'down' ? 'primary' : 'default'}
                onClick={() => setDirection('down')}
              >
                ↓ Vertical (Rowspan)
              </Button>
            </Space>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => {
              onMerge(direction, count)
              onCancel()
            }}
            icon={<MergeCellsOutlined />}
          >
            Merge Selected Cells
          </Button>
        </div>

        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{ backgroundColor: 'rgba(24, 144, 255, 0.1)', color: 'var(--text-secondary)' }}
        >
          <strong>How to merge cells:</strong>
          <ol className="mt-1 ml-4 list-decimal">
            <li>Click and drag to select multiple cells in the table</li>
            <li>Click the "Merge Cells" button in the toolbar</li>
            <li>The selected cells will be combined into one</li>
          </ol>
        </div>
      </div>
    </Modal>
  )
}
