import type { CSSProperties, ReactNode } from 'react';

export function Card({
  children,
  padding = 'md',
  className,
  style,
}: {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  className?: string;
  style?: CSSProperties;
}) {
  const pad = padding === 'none' ? 0 : padding === 'sm' ? 12 : padding === 'lg' ? 32 : 20;
  return (
    <div
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: pad,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
