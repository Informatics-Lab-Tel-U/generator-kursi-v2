import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './TiptapEditor.css';

interface Props {
  content: string;
  onUpdate: (html: string) => void;
}

export default function TiptapEditor({ content, onUpdate }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

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
    <div className="tiptap-wrapper">
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
      <EditorContent editor={editor} />
    </div>
  );
}
