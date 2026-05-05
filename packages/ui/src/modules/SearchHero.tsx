'use client';

import { useState, type FormEvent } from 'react';
import { Container } from '../components/Container';

export interface SearchHeroProps {
  placeholder?: string;
  /** 表單送出時 GET 的目標路徑，預設 /search */
  action?: string;
  /** 熱門關鍵字（每個是一個快捷查詢） */
  hotKeywords?: string[];
  title?: string;
}

/**
 * 政府網站慣例的搜尋區塊：搜尋框 + 熱門關鍵字。
 * 通常放 hero 下方。Client 元件以便將來掛 client-side suggestion。
 */
export function SearchHero({
  placeholder = '請輸入關鍵字',
  action = '/search',
  hotKeywords = [],
  title,
}: SearchHeroProps) {
  const [q, setQ] = useState('');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!q.trim()) return;
    window.location.href = `${action}?q=${encodeURIComponent(q)}`;
  };

  return (
    <section
      style={{
        background: 'var(--color-bg-alt, #F8FAFB)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '32px 0',
      }}
    >
      <Container>
        {title && (
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              textAlign: 'center',
              margin: '0 0 16px',
            }}
          >
            {title}
          </h2>
        )}

        <form
          onSubmit={submit}
          role="search"
          style={{
            display: 'flex',
            maxWidth: 640,
            margin: '0 auto',
            background: 'var(--color-surface, #FFFFFF)',
            border: '2px solid var(--color-brand-primary)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="搜尋關鍵字"
            style={{
              flex: 1,
              padding: '12px 20px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              fontFamily: 'inherit',
              color: 'var(--color-text)',
            }}
          />
          <button
            type="submit"
            aria-label="搜尋"
            style={{
              padding: '0 24px',
              background: 'var(--color-brand-primary)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            搜尋
          </button>
        </form>

        {hotKeywords.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>熱門關鍵字：</span>
            {hotKeywords.map((kw) => (
              <a
                key={kw}
                href={`${action}?q=${encodeURIComponent(kw)}`}
                style={{
                  padding: '4px 12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                  fontSize: 12.5,
                }}
              >
                {kw}
              </a>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
