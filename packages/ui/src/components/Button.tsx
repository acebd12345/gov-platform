import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const padding = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 18px';
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--color-brand-primary)',
          color: 'var(--color-text-on-brand)',
          border: '1px solid var(--color-brand-primary)',
        }
      : variant === 'secondary'
      ? {
          background: 'var(--color-surface)',
          color: 'var(--color-brand-primary)',
          border: '1px solid var(--color-brand-primary)',
        }
      : {
          background: 'transparent',
          color: 'var(--color-text)',
          border: '1px solid transparent',
        };

  return (
    <button
      {...rest}
      style={{
        padding,
        fontSize,
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        ...variantStyle,
        ...style,
      }}
    />
  );
}
