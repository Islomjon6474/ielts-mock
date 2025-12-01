'use client'

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Button, Space } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons'

interface PassageRichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export interface PassageRichTextEditorRef {
  insertText: (text: string) => void
}

/**
 * Rich text editor for reading passages
 * Supports formatting, indentation, lists, and alignment
 * No placeholder functionality - pure content editor
 */
export const PassageRichTextEditor = forwardRef<PassageRichTextEditorRef, PassageRichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Enter the reading passage...',
  minHeight = '400px',
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
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

  // Expose insertText method via ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run()
      }
    }
  }), [editor])

  if (!editor) {
    return null
  }

  return (
    <div
      className="border-2 rounded-md shadow-sm transition-colors"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight,
        borderColor: isFocused ? '#1890ff' : 'var(--border-color)',
        boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : undefined
      }}
    >
      {/* Toolbar */}
      <div className="p-2 flex flex-wrap gap-2" style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--card-background)' }}>
        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={<BoldOutlined />}
            title="Bold"
          />
          <Button
            size="small"
            type={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={<ItalicOutlined />}
            title="Italic"
          />
          <Button
            size="small"
            type={editor.isActive('strike') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon={<StrikethroughOutlined />}
            title="Strikethrough"
          />
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            H2
          </Button>
          <Button
            size="small"
            type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            H3
          </Button>
          <Button
            size="small"
            type={editor.isActive('paragraph') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            P
          </Button>
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive('bulletList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={<UnorderedListOutlined />}
            title="Bullet List"
          />
          <Button
            size="small"
            type={editor.isActive('orderedList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={<OrderedListOutlined />}
            title="Numbered List"
          />
        </Space.Compact>

        <Space.Compact>
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            icon={<AlignLeftOutlined />}
            title="Align Left"
          />
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            icon={<AlignCenterOutlined />}
            title="Align Center"
          />
          <Button
            size="small"
            type={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            icon={<AlignRightOutlined />}
            title="Align Right"
          />
        </Space.Compact>

        <Space.Compact>
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
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--input-background)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <EditorContent
          editor={editor}
          className="prose max-w-none p-4 focus:outline-none"
          style={{ flex: 1 }}
        />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          font-family: serif;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--text-primary);
          min-height: 100%;
        }
        
        .ProseMirror p {
          margin: 0.75em 0;
        }
        
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
          line-height: 1.3;
        }
        
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.9em 0 0.4em 0;
          line-height: 1.4;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.75em 0;
        }
        
        .ProseMirror li {
          margin: 0.25em 0;
        }
        
        .ProseMirror strong {
          font-weight: 700;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror [style*="text-align: center"] {
          text-align: center;
        }
        
        .ProseMirror [style*="text-align: right"] {
          text-align: right;
        }
        
        .ProseMirror [style*="text-align: left"] {
          text-align: left;
        }
        
        /* Placeholder styling */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-secondary);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
})

PassageRichTextEditor.displayName = 'PassageRichTextEditor'
