'use client';

import { useState } from 'react';
import { Container } from '../components/Container';

const RATINGS = [
  { value: 5, label: '非常滿意', emoji: '😍' },
  { value: 4, label: '滿意', emoji: '🙂' },
  { value: 3, label: '普通', emoji: '😐' },
  { value: 2, label: '不滿意', emoji: '😕' },
  { value: 1, label: '非常不滿意', emoji: '😞' },
];

/** 滿意度調查區塊（client；提交後顯示感謝訊息） */
export function SatisfactionSurvey({
  title = '滿意度調查',
  question = '您對本網站的整體滿意度為何？',
}: {
  title?: string;
  question?: string;
}) {
  const [submitted, setSubmitted] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: '40px 0',
        background: 'var(--color-bg-alt, #FFFFFF)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Container>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: 0,
                marginBottom: 4,
              }}
            >
              {title}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 14 }}>
              {question}
            </p>
          </div>

          {submitted == null ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSubmitted(r.value)}
                  aria-label={r.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    minWidth: 72,
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div
              role="status"
              style={{
                color: 'var(--color-success, #059669)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ✓ 感謝您的回饋！
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
