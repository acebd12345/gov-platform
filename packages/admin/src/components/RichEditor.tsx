'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import MediaPicker from './MediaPicker';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const UPLOAD_BASE = API_BASE.replace('/api/v1', '');

interface RichEditorProps {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
  disabled?: boolean;
}

export default function RichEditor({ content, onChange, disabled = false }: RichEditorProps) {
  const { tenant } = useAuth();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload a file to the media API and return its URL
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert(`不支援的圖片格式：${file.type}`);
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('圖片大小不可超過 10MB');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    try {
      const res = await fetch(`${API_BASE}/content/media/upload`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenant ?? 'portal',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message ?? '上傳失敗');
      }

      const data = await res.json();
      return `${UPLOAD_BASE}${data.data.cdnUrl}`;
    } catch (err: any) {
      alert('圖片上傳失敗：' + err.message);
      return null;
    }
  }, [tenant]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '開始撰寫內容...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: isValidTiptapJson(content) ? content : convertToTiptapDoc(content),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        if (disabled || moved || !event.dataTransfer?.files?.length) return false;

        const files = Array.from(event.dataTransfer.files).filter((f) =>
          f.type.startsWith('image/')
        );
        if (files.length === 0) return false;

        event.preventDefault();
        setUploading(true);

        Promise.all(files.map((f) => uploadFile(f))).then((urls) => {
          urls.forEach((url) => {
            if (url) {
              // Insert at drop position
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (coordinates) {
                const { tr } = view.state;
                const node = view.state.schema.nodes.image.create({ src: url });
                const transaction = tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            }
          });
          setUploading(false);
        });

        return true;
      },
      handlePaste: (view, event) => {
        if (disabled) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageItems = Array.from(items).filter((item) =>
          item.type.startsWith('image/')
        );
        if (imageItems.length === 0) return false;

        event.preventDefault();
        setUploading(true);

        const files = imageItems
          .map((item) => item.getAsFile())
          .filter((f): f is File => f !== null);

        Promise.all(files.map((f) => uploadFile(f))).then((urls) => {
          urls.forEach((url) => {
            if (url) {
              const { tr, selection } = view.state;
              const node = view.state.schema.nodes.image.create({ src: url });
              const transaction = tr.insert(selection.from, node);
              view.dispatch(transaction);
            }
          });
          setUploading(false);
        });

        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && disabled !== undefined) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Handle file input (fallback upload button)
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length || !editor) return;

      setUploading(true);
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
      setUploading(false);
      // Reset input so re-selecting the same file fires onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [editor, uploadFile]
  );

  if (!editor) return null;

  return (
    <div style={styles.wrapper}>
      {/* Hidden file input for upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Toolbar */}
      {!disabled && (
        <div style={styles.toolbar}>
          <div style={styles.toolGroup}>
            <ToolBtn
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              label="H1"
            />
            <ToolBtn
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              label="H2"
            />
            <ToolBtn
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              label="H3"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.toolGroup}>
            <ToolBtn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              label="B"
              style={{ fontWeight: 700 }}
            />
            <ToolBtn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              label="I"
              style={{ fontStyle: 'italic' }}
            />
            <ToolBtn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              label="U"
              style={{ textDecoration: 'underline' }}
            />
            <ToolBtn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              label="S"
              style={{ textDecoration: 'line-through' }}
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.toolGroup}>
            <ToolBtn
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              label="• 列表"
            />
            <ToolBtn
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              label="1. 列表"
            />
            <ToolBtn
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              label="引用"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.toolGroup}>
            <ToolBtn
              active={false}
              onClick={() => {
                const url = prompt('請輸入連結 URL：');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              label="🔗"
            />
            {/* Image upload button */}
            <ToolBtn
              active={false}
              onClick={() => fileInputRef.current?.click()}
              label="📤 上傳"
            />
            {/* Media library picker */}
            <ToolBtn
              active={false}
              onClick={() => setMediaPickerOpen(true)}
              label="🖼 媒體庫"
            />
            <ToolBtn
              active={false}
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              label="表格"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.toolGroup}>
            <ToolBtn
              active={false}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              label="—"
            />
            <ToolBtn
              active={false}
              onClick={() => editor.chain().focus().undo().run()}
              label="↩"
            />
            <ToolBtn
              active={false}
              onClick={() => editor.chain().focus().redo().run()}
              label="↪"
            />
          </div>
        </div>
      )}

      {/* Upload indicator */}
      {uploading && (
        <div style={styles.uploadBar}>
          <span style={styles.uploadDot} />
          圖片上傳中...
        </div>
      )}

      {/* Editor content with drag-drop zone */}
      <div
        style={styles.editorArea}
        onDragOver={(e) => {
          if (!disabled) {
            e.preventDefault();
            e.currentTarget.style.background = 'rgba(0,100,200,0.04)';
          }
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.background = '';
        }}
        onDrop={(e) => {
          e.currentTarget.style.background = '';
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Media picker modal */}
      <MediaPicker
        open={mediaPickerOpen}
        tenant={tenant ?? 'portal'}
        onSelect={(url) => {
          editor.chain().focus().setImage({ src: url }).run();
        }}
        onClose={() => setMediaPickerOpen(false)}
      />

      {/* Editor styles */}
      <style>{editorCSS}</style>
    </div>
  );
}

function ToolBtn({ active, onClick, label, style: extraStyle }: {
  active: boolean;
  onClick: () => void;
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        ...styles.toolBtn,
        ...(active ? styles.toolBtnActive : {}),
        ...extraStyle,
      }}
    >
      {label}
    </button>
  );
}

function isValidTiptapJson(obj: Record<string, unknown>): boolean {
  return obj?.type === 'doc' && Array.isArray(obj?.content);
}

function convertToTiptapDoc(obj: Record<string, unknown>): Record<string, unknown> {
  let text = '';
  if (typeof obj?.text === 'string') {
    text = obj.text;
  } else if (Object.keys(obj).length === 0) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  } else {
    text = JSON.stringify(obj, null, 2);
  }

  const paragraphs = text.split(/\n\n|\n/).filter(Boolean).map((p) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: p.trim() }],
  }));

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }],
  };
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: 'white',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '6px 10px',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    flexWrap: 'wrap',
  },
  toolGroup: {
    display: 'flex',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--color-border)',
    margin: '0 4px',
  },
  toolBtn: {
    padding: '4px 8px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    minWidth: 28,
    textAlign: 'center',
    lineHeight: '18px',
  },
  toolBtnActive: {
    background: 'var(--color-brand-light)',
    color: 'var(--color-brand)',
    borderColor: 'var(--color-brand)',
  },
  editorArea: {
    padding: '16px 20px',
    minHeight: 400,
    transition: 'background 0.2s',
  },
  uploadBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    background: '#eff6ff',
    borderBottom: '1px solid #bfdbfe',
    fontSize: 13,
    color: '#1e40af',
    fontFamily: 'var(--font-body)',
  },
  uploadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'inline-block',
    animation: 'pulse 1s infinite',
  },
};

const editorCSS = `
.tiptap {
  outline: none;
  min-height: 360px;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text);
}

.tiptap h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 20px 0 8px;
  font-family: var(--font-display);
}

.tiptap h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 6px;
  font-family: var(--font-display);
}

.tiptap h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 14px 0 4px;
  font-family: var(--font-display);
}

.tiptap p {
  margin: 0 0 8px;
}

.tiptap ul, .tiptap ol {
  padding-left: 24px;
  margin: 4px 0 8px;
}

.tiptap li {
  margin: 2px 0;
}

.tiptap blockquote {
  border-left: 3px solid var(--color-brand);
  padding-left: 16px;
  margin: 8px 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.tiptap a {
  color: var(--color-brand);
  text-decoration: underline;
}

.tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 8px 0;
  cursor: pointer;
}

.tiptap img.ProseMirror-selectednode {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.tiptap hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 16px 0;
}

.tiptap table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.tiptap td, .tiptap th {
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  text-align: left;
  font-size: 14px;
}

.tiptap th {
  background: var(--color-surface);
  font-weight: 600;
}

.tiptap code {
  background: var(--color-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
}

.tiptap pre {
  background: #1a1d23;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-x: auto;
  margin: 8px 0;
}

.tiptap p.is-editor-empty:first-child::before {
  color: var(--color-text-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;
