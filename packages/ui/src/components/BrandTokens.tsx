/**
 * 將 tenant.brand_tokens 注入為 CSS variables。
 *
 * 接收的 tokens 物件 key 可以是：
 *   - "--color-brand-primary"（已是 CSS var 名）→ 直接套
 *   - "logo_url" / "favicon_url" / "ga_id" / "address" 等非 CSS 用 key → 忽略
 *
 * 這個元件本身只負責把 CSS vars 注進 <style>；其他像 logo / favicon / GA 由 layout
 * 直接從 brandTokens 物件取用。
 */
export function BrandTokens({ tokens }: { tokens: Record<string, string> | null | undefined }) {
  if (!tokens) return null;

  const cssLines = Object.entries(tokens)
    .filter(([k]) => k.startsWith('--'))
    .map(([k, v]) => `  ${k}: ${escapeCssValue(v)};`)
    .join('\n');

  if (!cssLines) return null;

  // 用 :root 覆蓋 base tokens.css 的預設值
  const css = `:root {\n${cssLines}\n}`;

  return <style data-brand-tokens dangerouslySetInnerHTML={{ __html: css }} />;
}

/** 防止 JSON 內混進 } 或 </style> 之類字元造成 CSS injection。 */
function escapeCssValue(v: string): string {
  return String(v).replace(/[<>{};]/g, '');
}
