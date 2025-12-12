'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Button, Space } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons'

interface AnswerRichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  minHeight?: string
}

/**
 * Simple rich text editor for answer input
 * Supports basic formatting: bold, italic, underline, strikethrough
 * Outputs HTML that can be stored and displayed
 */
export const AnswerRichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Enter the correct answer...',
  minHeight = '80px',
}: AnswerRichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
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

  return (
    <div
      className="border rounded-md transition-colors"
      style={{
        borderColor: isFocused ? '#1890ff' : 'var(--border-color)',
        boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : undefined
      }}
    >
      {/* Compact Toolbar */}
      <div
        className="p-1 flex flex-wrap gap-1"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--card-background)'
        }}
      >
        <Space.Compact size="small">
          <Button
            size="small"
            type={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={<BoldOutlined />}
            title="Bold (Ctrl+B)"
          />
          <Button
            size="small"
            type={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={<ItalicOutlined />}
            title="Italic (Ctrl+I)"
          />
          <Button
            size="small"
            type={editor.isActive('underline') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            icon={<UnderlineOutlined />}
            title="Underline (Ctrl+U)"
          />
          <Button
            size="small"
            type={editor.isActive('strike') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon={<StrikethroughOutlined />}
            title="Strikethrough"
          />
        </Space.Compact>

        <Space.Compact size="small">
          <Button
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={<UndoOutlined />}
            title="Undo"
          />
          <Button
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={<RedoOutlined />}
            title="Redo"
          />
        </Space.Compact>
      </div>

      {/* Editor Content */}
      <div
        style={{
          backgroundColor: 'var(--input-background)',
          minHeight,
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <EditorContent
          editor={editor}
          className="prose max-w-none p-2 focus:outline-none"
        />
      </div>

      <style jsx global>{`
        .answer-editor .ProseMirror {
          outline: none;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--text-primary);
          min-height: ${minHeight};
        }

        .answer-editor .ProseMirror p {
          margin: 0.25em 0;
        }

        .answer-editor .ProseMirror strong {
          font-weight: 700;
        }

        .answer-editor .ProseMirror em {
          font-style: italic;
        }

        .answer-editor .ProseMirror u {
          text-decoration: underline;
        }

        .answer-editor .ProseMirror s {
          text-decoration: line-through;
        }

        /* Placeholder styling */
        .answer-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-secondary);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
