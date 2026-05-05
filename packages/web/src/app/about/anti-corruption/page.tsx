import Link from 'next/link';
import { Container, Card } from '@gov/ui';

export const revalidate = 3600;

export const metadata = {
  title: '廉政專區',
  description: '陽光法案、遊說法、檢舉管道、公益揭弊者保護',
};

const SECTIONS = [
  {
    title: '陽光法案',
    desc: '依《公職人員財產申報法》、《公職人員利益衝突迴避法》、《政治獻金法》、《遊說法》辦理。',
    items: [
      { label: '財產申報專區', href: 'https://www.cy.gov.tw/' },
      { label: '利益衝突迴避', href: '#' },
      { label: '政治獻金查詢', href: '#' },
    ],
  },
  {
    title: '遊說法',
    desc: '依《遊說法》規定揭露遊說登記與報告。',
    items: [
      { label: '遊說登記', href: '#' },
      { label: '遊說財務報告', href: '#' },
    ],
  },
  {
    title: '檢舉管道',
    desc: '檢舉公務員違法失職案件，可採書面、電話、電子郵件或親自送件。',
    items: [
      { label: '線上檢舉表單', href: '#' },
      { label: '實名檢舉信箱', href: 'mailto:report@gov.taipei' },
      { label: '法務部廉政署：0800-286-586', href: 'tel:0800286586' },
    ],
  },
  {
    title: '公益揭弊者保護',
    desc: '依《公益揭弊者保護法》保障揭弊者身分與權益。',
    items: [
      { label: '揭弊者保護法全文', href: '#' },
      { label: '揭弊申訴流程', href: '#' },
    ],
  },
  {
    title: '宣導與訓練',
    desc: '本機關每年辦理廉政宣導活動與公務員倫理訓練。',
    items: [
      { label: '本年度廉政訓練紀錄', href: '#' },
      { label: '公務員廉政倫理規範', href: '#' },
    ],
  },
];

export default function AntiCorruptionPage() {
  return (
    <Container>
      <Breadcrumb />
      <header
        style={{
          padding: '32px 0 16px',
          borderBottom: '2px solid var(--color-brand-primary)',
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          廉政專區
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          公開公職人員財產申報、利益衝突迴避、遊說登記等資訊，提供檢舉管道與揭弊者保護機制。
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {SECTIONS.map((sec) => (
          <Card key={sec.title} padding="lg">
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 700,
                marginTop: 0,
                marginBottom: 8,
                color: 'var(--color-brand-accent, var(--color-brand-primary))',
              }}
            >
              {sec.title}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            >
              {sec.desc}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sec.items.map((it) => (
                <li key={it.label} style={{ marginBottom: 6 }}>
                  <a href={it.href} style={{ fontSize: 14, color: 'var(--color-link, var(--color-brand-primary))' }}>
                    › {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card padding="lg" style={{ background: 'var(--color-bg-alt, #F8FAFB)' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700 }}>檢舉須知</h3>
        <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 13.5 }}>
          <li>請提供具體事證、時間、地點與當事人。</li>
          <li>檢舉人身分、檢舉內容均依法保密。</li>
          <li>匿名檢舉若無具體事證，恐難進行調查。</li>
          <li>惡意誣告、虛偽陳述者，依法究辦。</li>
        </ol>
      </Card>
    </Container>
  );
}

function Breadcrumb() {
  return (
    <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>
      <Link href="/">首頁</Link> / <span>廉政專區</span>
    </nav>
  );
}
