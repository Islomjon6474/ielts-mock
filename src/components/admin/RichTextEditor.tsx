'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Button, Space } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import { Node, mergeAttributes } from '@tiptap/core'

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

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  onPlaceholdersChange?: (placeholders: number[]) => void
  questionNumber?: number
  placeholder?: string
}

export const RichTextEditor = ({
  value = '',
  onChange,
  onPlaceholdersChange,
  questionNumber,
  placeholder = 'Enter question text...',
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
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

  return (
    <div className="border rounded-md" style={{ borderColor: 'var(--border-color)' }}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-2" style={{ borderColor: 'var(--border-color)', background: 'var(--card-background)' }}>
        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={<BoldOutlined />}
          />
          <Button
            size="small"
            type={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={<ItalicOutlined />}
          />
          <Button
            size="small"
            type={editor.isActive('strike') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon={<StrikethroughOutlined />}
          />
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive('bulletList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={<UnorderedListOutlined />}
          />
          <Button
            size="small"
            type={editor.isActive('orderedList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={<OrderedListOutlined />}
          />
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            icon={<AlignLeftOutlined />}
          />
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            icon={<AlignCenterOutlined />}
          />
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            icon={<AlignRightOutlined />}
          />
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={<UndoOutlined />}
          />
          <Button
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={<RedoOutlined />}
          />
        </Space.Compact>

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
          className="prose max-w-none p-3 min-h-[120px] focus:outline-none"
        />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          color: var(--text-primary);
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .question-placeholder {
          cursor: pointer;
          user-select: none;
        }
      `}</style>
    </div>
  )
}
