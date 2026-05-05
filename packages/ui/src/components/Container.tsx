import type { CSSProperties, ElementType, ReactNode } from 'react';

export function Container({
  children,
  as,
  width = 'default',
  className,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  style?: CSSProperties;
}) {
  const Tag: ElementType = as ?? 'div';
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
