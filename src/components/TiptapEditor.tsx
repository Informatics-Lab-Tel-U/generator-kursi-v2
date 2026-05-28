import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './TiptapEditor.css';

interface Props {
  content: string;
  onUpdate?: (html: string) => void;
  readOnly?: boolean;
}

export default function TiptapEditor({ content, onUpdate, readOnly = false }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const btn = (
    label: string,
    action: () => void,
    isActive: boolean,
    style?: React.CSSProperties,
  ) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={isActive ? 'active' : ''}
      style={style}
    >
      {label}
    </button>
  );

  return (
    <div className={`tiptap-wrapper ${readOnly ? 'readonly' : ''}`}>
      {!readOnly && (
        <div className="tiptap-toolbar">
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), { fontWeight: 700 })}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), { fontStyle: 'italic' })}
        {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), { textDecoration: 'line-through' })}
        <span className="toolbar-divider" />
        {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        <span className="toolbar-divider" />
        {btn('•', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1.', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {btn('”', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        <span className="toolbar-divider" />
        {btn('</>', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
        {btn('—', () => editor.chain().focus().setHorizontalRule().run(), false)}
        <span className="toolbar-divider" />
        {btn('↶', () => editor.chain().focus().undo().run(), false)}
        {btn('↷', () => editor.chain().focus().redo().run(), false)}
      </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
