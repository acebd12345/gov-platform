import Link from 'next/link';
import { Container, Card } from '@gov/ui';

export const revalidate = 3600;

export const metadata = {
  title: '易讀專區',
  description: '以簡單文字、大字級、清楚圖示介紹本機關服務',
};

const ITEMS = [
  {
    title: '我們在做什麼',
    body: '我們是市政府的一個單位。\n我們服務臺北市的市民。\n我們的工作是把市政做好。',
    icon: '🏛',
  },
  {
    title: '我可以申請什麼',
    body: '你可以申請補助。\n你可以借用場地。\n你可以查資料。\n你可以提建議。',
    icon: '📝',
  },
  {
    title: '怎麼聯絡我們',
    body: '打電話：02-2720-8889\n寫 email：service@gov.taipei\n直接來：市府路 1 號\n上班時間：星期一到星期五 早上 8:30 到下午 5:30',
    icon: '☎️',
  },
  {
    title: '需要幫助',
    body: '如果你看不懂網站，可以打 1999。\n1999 是台北市民熱線。\n打電話有人會幫你。',
    icon: '🤝',
  },
];

export default function EasyReadPage() {
  return (
    <div
      style={{
        // 易讀專區字級調大、行距加寬
        fontSize: '1.25rem',
        lineHeight: 2,
      }}
    >
      <Container width="narrow">
        <nav style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 16 }}>
          <Link href="/">首頁</Link> / <span>易讀專區</span>
        </nav>

        <header
          style={{
            padding: '32px 0 16px',
            borderBottom: '3px solid var(--color-brand-primary)',
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
            易讀專區
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 12, fontSize: '1.1rem' }}>
            這個專區用簡單的文字、大大的字、清楚的圖。
            <br />
            讓不容易讀文字的人，也能看懂我們在做什麼。
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ITEMS.map((it) => (
            <Card key={it.title} padding="lg" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '3rem', flexShrink: 0, lineHeight: 1 }} aria-hidden>
                {it.icon}
              </span>
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: '0 0 12px',
                    color: 'var(--color-brand-accent, var(--color-brand-primary))',
                  }}
                >
                  {it.title}
                </h2>
                <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '1.15rem' }}>{it.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card padding="lg" style={{ marginTop: 32, background: 'var(--color-bg-alt, #F8FAFB)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, marginTop: 0 }}>
            什麼是易讀？
          </h2>
          <p style={{ fontSize: '1.1rem', margin: 0 }}>
            易讀就是讓所有人都讀得懂。
            <br />
            包括：認字困難的人、年長者、新住民、不熟中文的人。
            <br />
            我們把長句子改短，把難字改簡單，加上圖片幫助理解。
          </p>
        </Card>
      </Container>
    </div>
  );
}
