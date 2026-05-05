import Link from 'next/link';
import { Container, Card } from '@gov/ui';

export const revalidate = 3600;

export const metadata = {
  title: '無障礙服務專區',
  description: '本網站依無障礙網站開發規範通過 WCAG 2.1 AA 等級檢測',
};

export default function AccessibilityPage() {
  return (
    <Container width="narrow">
      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>
        <Link href="/">首頁</Link> / <span>無障礙服務專區</span>
      </nav>

      <header
        style={{
          padding: '32px 0 16px',
          borderBottom: '2px solid var(--color-brand-primary)',
          marginBottom: 32,
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
          無障礙服務專區
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
          本網站依 W3C 「網頁內容無障礙準則」（WCAG 2.1）AA 等級開發，確保所有市民皆能順利使用。
        </p>
      </header>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          快速鍵
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.2, fontSize: 14 }}>
          <li>
            <strong style={{ display: 'inline-block', width: 100, color: 'var(--color-brand-primary)' }}>
              Alt + U
            </strong>
            上方功能區（網站導覽 / 字級調整 / 搜尋）
          </li>
          <li>
            <strong style={{ display: 'inline-block', width: 100, color: 'var(--color-brand-primary)' }}>
              Alt + L
            </strong>
            主選單區
          </li>
          <li>
            <strong style={{ display: 'inline-block', width: 100, color: 'var(--color-brand-primary)' }}>
              Alt + C
            </strong>
            主要內容區
          </li>
          <li>
            <strong style={{ display: 'inline-block', width: 100, color: 'var(--color-brand-primary)' }}>
              Alt + R
            </strong>
            右側選單
          </li>
          <li>
            <strong style={{ display: 'inline-block', width: 100, color: 'var(--color-brand-primary)' }}>
              Alt + B
            </strong>
            頁尾資訊
          </li>
        </ul>
      </Card>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          無障礙設計原則
        </h2>
        <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 14 }}>
          <li>所有功能皆可由鍵盤操作（Tab / Shift+Tab / Enter）</li>
          <li>圖片均提供 alt 替代文字，供螢幕閱讀器使用</li>
          <li>影片附逐字稿與字幕，支援聽障使用者</li>
          <li>色彩對比度符合 WCAG AA 標準（一般文字 4.5:1、大文字 3:1）</li>
          <li>提供小、中、大三段字級調整（header 右上「字級」）</li>
          <li>跳至主要內容連結（按 Tab 進入網站時第一個可聚焦元素）</li>
          <li>表單欄位均有對應 label 與錯誤提示</li>
        </ul>
      </Card>

      <Card padding="lg" style={{ marginBottom: 16, background: 'var(--color-bg-alt, #F8FAFB)' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          無障礙檢測標章
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
          本網站經國家通訊傳播委員會（NCC）認可之無障礙檢測單位檢測，並通過第 2 級（AA）規範。
        </p>
        <a
          href="https://accessibility.ncc.gov.tw/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'var(--color-brand-primary)',
            color: '#FFFFFF',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          查看檢測證明 ↗
        </a>
      </Card>

      <Card padding="lg">
        <h2 style={{ marginTop: 0, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          意見回饋
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8 }}>
          若您在使用上遇到困難，或對無障礙設計有任何建議，歡迎透過下列管道與我們聯繫，我們將儘速處理。
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 2 }}>
          <li>
            <Link href="/feedback">線上意見信箱</Link>
          </li>
          <li>1999 臺北市民熱線</li>
        </ul>
      </Card>
    </Container>
  );
}
