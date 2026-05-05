import type { ElementType, ReactNode } from 'react';

/**
 * 渲染 Tiptap JSON 文件結構為 HTML。
 *
 * 後台的 RichEditor 用 Tiptap 編輯，存的 bodyJson 形如：
 *   { type: 'doc', content: [{ type: 'paragraph', content: [...] }] }
 *
 * 我們在前台用 SSG/ISR 把它直接渲染成靜態 HTML，不在 client 重新跑 Tiptap，
 * 這樣 LCP/SEO 友善。
 */

interface AnyNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: AnyNode[];
}

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
      {renderNode(body as AnyNode, 'root')}
    </div>
  );
}

function renderChildren(node: AnyNode, parentKey: string): ReactNode {
  if (!Array.isArray(node.content)) return null;
  return node.content.map((c, i) => renderNode(c, `${parentKey}-${i}`));
}

function renderNode(node: AnyNode, key: string): ReactNode {
  if (!node || typeof node !== 'object') return null;

  switch (node.type) {
    case 'doc':
      return <>{renderChildren(node, key)}</>;

    case 'paragraph': {
      const align = node.attrs?.textAlign as string | undefined;
      return (
        <p
          key={key}
          style={align ? { textAlign: align as 'left' | 'center' | 'right' } : undefined}
        >
          {renderChildren(node, key)}
        </p>
      );
    }

    case 'heading': {
      const levelRaw = (node.attrs?.level as number | undefined) ?? 2;
      const level = Math.min(6, Math.max(1, levelRaw));
      const Tag = `h${level}` as ElementType;
      const align = node.attrs?.textAlign as string | undefined;
      return (
        <Tag
          key={key}
          style={align ? { textAlign: align as 'left' | 'center' | 'right' } : undefined}
        >
          {renderChildren(node, key)}
        </Tag>
      );
    }

    case 'bulletList':
      return <ul key={key}>{renderChildren(node, key)}</ul>;

    case 'orderedList':
      return <ol key={key}>{renderChildren(node, key)}</ol>;

    case 'listItem':
      return <li key={key}>{renderChildren(node, key)}</li>;

    case 'blockquote':
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;

    case 'horizontalRule':
      return <hr key={key} />;

    case 'hardBreak':
      return <br key={key} />;

    case 'image': {
      const src = node.attrs?.src as string | undefined;
      if (!src) return null;
      return (
        <img
          key={key}
          src={src}
          alt={(node.attrs?.alt as string | undefined) ?? ''}
          title={node.attrs?.title as string | undefined}
          loading="lazy"
        />
      );
    }

    case 'table':
      return (
        <table key={key}>
          <tbody>{renderChildren(node, key)}</tbody>
        </table>
      );

    case 'tableRow':
      return <tr key={key}>{renderChildren(node, key)}</tr>;

    case 'tableCell':
      return <td key={key}>{renderChildren(node, key)}</td>;

    case 'tableHeader':
      return <th key={key}>{renderChildren(node, key)}</th>;

    case 'text':
      return renderText(node, key);

    default:
      return null;
  }
}

function renderText(node: AnyNode, key: string): ReactNode {
  let el: ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') el = <strong>{el}</strong>;
    else if (mark.type === 'italic') el = <em>{el}</em>;
    else if (mark.type === 'underline') el = <u>{el}</u>;
    else if (mark.type === 'strike') el = <s>{el}</s>;
    else if (mark.type === 'code') el = <code>{el}</code>;
    else if (mark.type === 'link') {
      const href = (mark.attrs?.href as string | undefined) ?? '#';
      const target = mark.attrs?.target as string | undefined;
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
