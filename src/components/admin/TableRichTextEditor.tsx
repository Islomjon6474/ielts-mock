'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Button, Space, Tooltip, Divider } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
  TableOutlined,
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  DeleteColumnOutlined,
  MergeCellsOutlined,
  SplitCellsOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Node, mergeAttributes } from '@tiptap/core'
import { TableBuilderModal } from './TableBuilderModal'

// Extend Tiptap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    questionPlaceholder: {
      insertPlaceholder: (number: number) => ReturnType
    }
  }
}

// Custom extension for placeholders
const QuestionPlaceholder = Node.create({
  name: 'questionPlaceholder',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      number: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-number'),
        renderHTML: (attributes) => {
          return {
            'data-number': attributes.number,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-placeholder': '',
        class: 'question-placeholder',
        style: 'background-color: #e6f7ff; color: #1890ff; padding: 2px 6px; border-radius: 3px; font-weight: 500;',
      }),
      `[${HTMLAttributes['data-number']}]`,
    ]
  },

  addCommands() {
    return {
      insertPlaceholder:
        (number: number) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { number },
          })
        },
    }
  },
})

interface TableRichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  onPlaceholdersChange?: (placeholders: number[]) => void
  questionNumber?: number
  placeholder?: string
}

export const TableRichTextEditor = ({
  value = '',
  onChange,
  onPlaceholdersChange,
  questionNumber,
  placeholder = 'Create a table and add placeholders...',
}: TableRichTextEditorProps) => {
  const [tableModalOpen, setTableModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-completion-editor',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      QuestionPlaceholder,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)

      // Extract placeholder numbers from HTML
      const placeholders: number[] = []
      const regex = /<span[^>]*data-number="(\d+)"[^>]*>/g
      let match
      while ((match = regex.exec(html)) !== null) {
        placeholders.push(parseInt(match[1]))
      }
      onPlaceholdersChange?.(placeholders.sort((a, b) => a - b))
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const getNextPlaceholderNumber = () => {
    const html = editor.getHTML()
    const placeholders: number[] = []
    const regex = /<span[^>]*data-number="(\d+)"[^>]*>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      placeholders.push(parseInt(match[1]))
    }
    return placeholders.length > 0 ? Math.max(...placeholders) + 1 : (questionNumber || 1)
  }

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  }

  const handleInsertTable = (rows: number, cols: number) => {
    insertTable(rows, cols)
    setTableModalOpen(false)
  }

  return (
    <div className="border rounded-md" style={{ borderColor: 'var(--border-color)' }}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-2" style={{ borderColor: 'var(--border-color)', background: 'var(--card-background)' }}>
        {/* Text Formatting */}
        <Space.Compact>
          <Tooltip title="Bold">
            <Button
              size="small"
              type={editor.isActive('bold') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<BoldOutlined />}
            />
          </Tooltip>
          <Tooltip title="Italic">
            <Button
              size="small"
              type={editor.isActive('italic') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<ItalicOutlined />}
            />
          </Tooltip>
          <Tooltip title="Strikethrough">
            <Button
              size="small"
              type={editor.isActive('strike') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={<StrikethroughOutlined />}
            />
          </Tooltip>
        </Space.Compact>

        {/* Text Alignment */}
        <Space.Compact>
          <Tooltip title="Align Left">
            <Button
              size="small"
              type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              icon={<AlignLeftOutlined />}
            />
          </Tooltip>
          <Tooltip title="Align Center">
            <Button
              size="small"
              type={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              icon={<AlignCenterOutlined />}
            />
          </Tooltip>
          <Tooltip title="Align Right">
            <Button
              size="small"
              type={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              icon={<AlignRightOutlined />}
            />
          </Tooltip>
        </Space.Compact>

        {/* Undo/Redo */}
        <Space.Compact>
          <Tooltip title="Undo">
            <Button
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              icon={<UndoOutlined />}
            />
          </Tooltip>
          <Tooltip title="Redo">
            <Button
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              icon={<RedoOutlined />}
            />
          </Tooltip>
        </Space.Compact>

        {/* Table Insert Button */}
        <Button
          size="small"
          icon={<TableOutlined />}
          onClick={() => setTableModalOpen(true)}
        >
          Insert Table
        </Button>

        {/* Table Row/Column Controls - only show when in table */}
        {editor.isActive('table') && (
          <>
            <Divider type="vertical" style={{ height: 'auto', margin: '0 4px' }} />

            <Space.Compact>
              <Tooltip title="Add row above">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  icon={<InsertRowAboveOutlined />}
                />
              </Tooltip>
              <Tooltip title="Add row below">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  icon={<InsertRowBelowOutlined />}
                />
              </Tooltip>
              <Tooltip title="Delete row">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  icon={<DeleteRowOutlined />}
                  danger
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Add column before">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  <PlusOutlined /> Col
                </Button>
              </Tooltip>
              <Tooltip title="Add column after">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  Col <PlusOutlined />
                </Button>
              </Tooltip>
              <Tooltip title="Delete column">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  icon={<DeleteColumnOutlined />}
                  danger
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Merge selected cells (select multiple cells first)">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  icon={<MergeCellsOutlined />}
                >
                  Merge
                </Button>
              </Tooltip>
              <Tooltip title="Split merged cell">
                <Button
                  size="small"
                  onClick={() => editor.chain().focus().splitCell().run()}
                  icon={<SplitCellsOutlined />}
                >
                  Split
                </Button>
              </Tooltip>
            </Space.Compact>

            <Tooltip title="Delete entire table">
              <Button
                size="small"
                danger
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                Delete Table
              </Button>
            </Tooltip>
          </>
        )}

        {/* Insert Placeholder */}
        <Button
          size="small"
          type="primary"
          onClick={() => {
            const num = getNextPlaceholderNumber()
            editor.chain().focus().insertPlaceholder(num).run()
          }}
        >
          Insert Placeholder [{getNextPlaceholderNumber()}]
        </Button>
      </div>

      {/* Editor Content */}
      <div style={{ background: 'var(--input-background)' }}>
        <EditorContent
          editor={editor}
          className="prose max-w-none p-3 min-h-[200px] focus:outline-none"
        />
      </div>

      {/* Help text when no table */}
      {!editor.isActive('table') && !editor.getHTML().includes('<table') && (
        <div
          className="px-3 py-2 text-xs border-t"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--card-background)' }}
        >
          <strong>Tip:</strong> Click "Insert Table" to create a table, then use "Insert Placeholder [n]" to add fill-in blanks.
          Select multiple cells and click "Merge" to combine them (colspan/rowspan).
        </div>
      )}

      {/* Table Builder Modal */}
      <TableBuilderModal
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        onInsert={handleInsertTable}
      />

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          color: var(--text-primary);
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .question-placeholder {
          cursor: pointer;
          user-select: none;
        }

        /* Table Styles */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1em 0;
          overflow: hidden;
        }

        .ProseMirror td,
        .ProseMirror th {
          min-width: 1em;
          border: 2px solid var(--border-color, #d9d9d9);
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: var(--table-header-bg, #fafafa);
        }

        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(24, 144, 255, 0.15);
          pointer-events: none;
        }

        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #1890ff;
          pointer-events: none;
        }

        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }

        /* Dark mode table adjustments */
        [data-theme="dark"] .ProseMirror th {
          background-color: #1f1f1f;
        }

        [data-theme="yellow"] .ProseMirror th {
          background-color: #fffbe6;
        }
      `}</style>
    </div>
  )
}
