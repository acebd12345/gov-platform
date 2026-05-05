import type { ReactNode } from 'react';

/**
 * 渲染 Tiptap JSON 文件結構為 HTML。
 *
 * 後台的 RichEditor 用 Tiptap 編輯，存的 bodyJson 形如：
 *   { type: 'doc', content: [{ type: 'paragraph', content: [...] }] }
 *
 * 我們在前台用 SSG/ISR 把它直接渲染成靜態 HTML，不在 client 重新跑 Tiptap，
 * 這樣 LCP/SEO 友善。
 */

type TiptapMark =
  | { type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' }
  | { type: 'link'; attrs?: { href?: string; target?: string } };

type TiptapNode =
  | { type: 'doc'; content?: TiptapNode[] }
  | { type: 'paragraph'; content?: TiptapNode[]; attrs?: { textAlign?: string } }
  | { type: 'heading'; attrs?: { level?: number; textAlign?: string }; content?: TiptapNode[] }
  | { type: 'bulletList'; content?: TiptapNode[] }
  | { type: 'orderedList'; content?: TiptapNode[] }
  | { type: 'listItem'; content?: TiptapNode[] }
  | { type: 'blockquote'; content?: TiptapNode[] }
  | { type: 'horizontalRule' }
  | { type: 'hardBreak' }
  | {
      type: 'image';
      attrs?: { src?: string; alt?: string; title?: string };
    }
  | { type: 'table'; content?: TiptapNode[] }
  | { type: 'tableRow'; content?: TiptapNode[] }
  | { type: 'tableCell'; content?: TiptapNode[]; attrs?: Record<string, unknown> }
  | { type: 'tableHeader'; content?: TiptapNode[]; attrs?: Record<string, unknown> }
  | { type: 'text'; text: string; marks?: TiptapMark[] }
  | { type: string; [k: string]: unknown };

export function ArticleBody({ body }: { body: unknown }) {
  if (!body || typeof body !== 'object') return null;
  return (
    <div
      className="gov-article-body"
      style={{
        fontSize: '1rem',
        lineHeight: 1.8,
        color: 'var(--color-text)',
      }}
    >
      <BodyStyles />
      {renderNode(body as TiptapNode, 'root')}
    </div>
  );
}

function renderNode(node: TiptapNode, key: string): ReactNode {
  if (!node || typeof node !== 'object') return null;

  switch (node.type) {
    case 'doc':
      return (
        <>
          {node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}
        </>
      );

    case 'paragraph': {
      const align = node.attrs?.textAlign;
      return (
        <p key={key} style={align ? { textAlign: align as 'left' | 'center' | 'right' } : undefined}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </p>
      );
    }

    case 'heading': {
      const level = Math.min(6, Math.max(1, node.attrs?.level ?? 2));
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const align = node.attrs?.textAlign;
      return (
        <Tag key={key} style={align ? { textAlign: align as 'left' | 'center' | 'right' } : undefined}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </Tag>
      );
    }

    case 'bulletList':
      return (
        <ul key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </blockquote>
      );

    case 'horizontalRule':
      return <hr key={key} />;

    case 'hardBreak':
      return <br key={key} />;

    case 'image': {
      const src = node.attrs?.src;
      if (!src) return null;
      return (
        <img
          key={key}
          src={src}
          alt={node.attrs?.alt ?? ''}
          title={node.attrs?.title}
          loading="lazy"
        />
      );
    }

    case 'table':
      return (
        <table key={key}>
          <tbody>
            {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
          </tbody>
        </table>
      );

    case 'tableRow':
      return (
        <tr key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </tr>
      );

    case 'tableCell':
      return (
        <td key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </td>
      );

    case 'tableHeader':
      return (
        <th key={key}>
          {node.content?.map((c, i) => renderNode(c, `${key}-${i}`))}
        </th>
      );

    case 'text':
      return renderText(node as Extract<TiptapNode, { type: 'text' }>, key);

    default:
      return null;
  }
}

function renderText(node: { text: string; marks?: TiptapMark[] }, key: string): ReactNode {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') el = <strong>{el}</strong>;
    else if (mark.type === 'italic') el = <em>{el}</em>;
    else if (mark.type === 'underline') el = <u>{el}</u>;
    else if (mark.type === 'strike') el = <s>{el}</s>;
    else if (mark.type === 'code') el = <code>{el}</code>;
    else if (mark.type === 'link') {
      const href = mark.attrs?.href ?? '#';
      const target = mark.attrs?.target;
      el = (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        >
          {el}
        </a>
      );
    }
  }
  return <span key={key}>{el}</span>;
}

function BodyStyles() {
  return (
    <style>{`
      .gov-article-body h1, .gov-article-body h2, .gov-article-body h3,
      .gov-article-body h4, .gov-article-body h5, .gov-article-body h6 {
        font-family: var(--font-heading);
        font-weight: 700;
        margin: 1.5em 0 0.6em;
        line-height: 1.3;
      }
      .gov-article-body h1 { font-size: 1.875rem; }
      .gov-article-body h2 { font-size: 1.5rem; }
      .gov-article-body h3 { font-size: 1.25rem; }
      .gov-article-body p { margin: 0 0 1em; }
      .gov-article-body ul, .gov-article-body ol { margin: 0 0 1em 1.5em; }
      .gov-article-body li { margin-bottom: 0.25em; }
      .gov-article-body img {
        max-width: 100%;
        height: auto;
        margin: 1em 0;
        border-radius: var(--radius-sm);
      }
      .gov-article-body blockquote {
        border-left: 4px solid var(--color-brand-primary);
        background: var(--color-brand-secondary);
        padding: 12px 16px;
        margin: 1em 0;
        color: var(--color-text);
      }
      .gov-article-body table {
        border-collapse: collapse;
        margin: 1em 0;
        width: 100%;
      }
      .gov-article-body th, .gov-article-body td {
        border: 1px solid var(--color-border);
        padding: 8px 12px;
        text-align: left;
      }
      .gov-article-body th {
        background: var(--color-bg-alt);
        font-weight: 600;
      }
    `}</style>
  );
}
