import type { CSSProperties, ReactNode } from 'react';

export function Container({
  children,
  as: Tag = 'div',
  width = 'default',
  className,
  style,
}: {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  style?: CSSProperties;
}) {
  const max = width === 'narrow' ? 800 : width === 'wide' ? 1400 : 1200;
  return (
    <Tag
      className={className}
      style={{
        maxWidth: `min(${max}px, 100%)`,
        margin: '0 auto',
        padding: '0 1rem',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
