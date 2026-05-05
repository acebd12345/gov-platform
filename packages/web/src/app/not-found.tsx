import Link from 'next/link';
import { Container, Card } from '@gov/ui';

export default function NotFound() {
  return (
    <Container width="narrow">
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          404
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '8px 0 24px' }}>
          找不到您要的頁面。可能已被移除或網址有誤。
        </p>
        <Link href="/" style={{ fontSize: 14 }}>
          ← 返回首頁
        </Link>
      </Card>
    </Container>
  );
}
