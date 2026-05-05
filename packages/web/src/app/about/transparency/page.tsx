import Link from 'next/link';
import { Container, Card } from '@gov/ui';

export const revalidate = 3600;

export const metadata = {
  title: '政府公開資訊',
  description: '法令、預算與決算、業務統計、人事公告、施政報告、會議紀錄',
};

const GROUPS = [
  {
    title: '法令公告',
    items: [
      '本機關權責及法規',
      '主管法規查詢',
      '法規異動公告',
      '釋示函令',
    ],
  },
  {
    title: '施政與計畫',
    items: ['年度施政計畫', '中長程計畫', '績效報告', '統計年報'],
  },
  {
    title: '預算與決算',
    items: ['年度預算書', '決算報告', '半年度報告', '預算執行情形'],
  },
  {
    title: '業務統計',
    items: ['統計通報', '統計年表', '業務量統計', '研究報告'],
  },
  {
    title: '會議紀錄',
    items: ['局務會議', '委員會會議', '專案會議', '公民參與會議'],
  },
  {
    title: '人事資訊',
    items: ['首長簡介', '組織編制', '人員職稱表', '徵才公告'],
  },
  {
    title: '採購與委外',
    items: ['招標資訊', '採購結果公告', '委外服務契約', '促參案件'],
  },
  {
    title: '個資保護',
    items: ['個資保護政策', '個資蒐集目的', '當事人權利行使', '聯絡窗口'],
  },
];

export default function TransparencyPage() {
  return (
    <Container>
      <Breadcrumb />
      <header
        style={{
          padding: '32px 0 16px',
          borderBottom: '2px solid var(--color-brand-primary)',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
          政府公開資訊
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
          依《政府資訊公開法》主動公開本機關職權範圍內之資訊。市民可依法申請閱覽其他資料。
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {GROUPS.map((g) => (
          <Card key={g.title} padding="md" style={{ borderLeft: '3px solid var(--color-brand-primary)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>
              {g.title}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {g.items.map((it) => (
                <li key={it} style={{ marginBottom: 4 }}>
                  <a href="#" style={{ fontSize: 13, color: 'var(--color-text)' }}>
                    › {it}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          政府資訊公開申請
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: 16 }}>
          未列入主動公開範圍之資料，市民得依《政府資訊公開法》第 9 條提出申請。本機關依法於 15 日內處理；
          必要時得延長 15 日。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="#"
            style={{
              padding: '10px 20px',
              background: 'var(--color-brand-primary)',
              color: '#FFFFFF',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            線上申請
          </a>
          <a
            href="#"
            style={{
              padding: '10px 20px',
              border: '1px solid var(--color-brand-primary)',
              color: 'var(--color-brand-primary)',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            下載申請書
          </a>
        </div>
      </Card>
    </Container>
  );
}

function Breadcrumb() {
  return (
    <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>
      <Link href="/">首頁</Link> / <span>政府公開資訊</span>
    </nav>
  );
}
