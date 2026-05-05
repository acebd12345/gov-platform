'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState({ id: '', svg: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function loadCaptcha() {
    try {
      const res = await apiGet<{ data: { id: string; svg: string } }>('/auth/captcha');
      setCaptcha(res.data);
      setCaptchaInput('');
    } catch {
      setError('無法載入驗證碼');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost<{
        data: {
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; role: string; isSuperAdmin: boolean };
        };
      }>('/auth/admin/login', {
        email,
        password,
        captchaId: captcha.id,
        captchaValue: captchaInput
      });

      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? '登入失敗');
      loadCaptcha(); // Refresh captcha on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandArea}>
          <div style={styles.logoMark}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.15" />
              <path d="M14 18h20v2H14zm0 5h16v2H14zm0 5h12v2H14z" fill="white" />
            </svg>
          </div>
          <h1 style={styles.brandTitle}>臺北市政府</h1>
          <p style={styles.brandSubtitle}>多租戶網站管理平台</p>
          <div style={styles.divider} />
          <p style={styles.brandDesc}>
            統一管理所有局處網站內容、<br />
            品牌設定與使用者權限。
          </p>
        </div>
        <div style={styles.wave} />
      </div>

      <div style={styles.rightPanel}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>後台登入</h2>
          <p style={styles.formSubtitle}>請輸入您的帳號密碼</p>

          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>
            <span style={styles.labelText}>電子信箱</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gov.taipei"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>密碼</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>驗證碼</span>
            <div style={styles.captchaRow}>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="輸入驗證碼"
                required
                style={{ ...styles.input, flex: 1 }}
              />
              <div
                style={styles.captchaImg}
                dangerouslySetInnerHTML={{ __html: captcha.svg }}
                onClick={loadCaptcha}
                title="點擊更換驗證碼"
              />
            </div>
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '登入中...' : '登入'}
          </button>

        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  leftPanel: {
    flex: '0 0 420px',
    background: 'linear-gradient(160deg, #0C5299 0%, #083B6E 60%, #062D54 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px',
    position: 'relative',
    overflow: 'hidden',
  },
  brandArea: { position: 'relative', zIndex: 1 },
  logoMark: { marginBottom: 24 },
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 700,
    color: 'white',
    letterSpacing: '0.02em',
  },
  brandSubtitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 3,
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    margin: '24px 0',
  },
  brandDesc: {
    fontSize: 14,
    lineHeight: 1.8,
    color: 'rgba(255,255,255,0.6)',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.15))',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    background: 'var(--color-surface)',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  formSubtitle: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    marginTop: -12,
  },
  error: {
    padding: '12px 16px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    color: 'var(--color-danger)',
    fontSize: 14,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  labelText: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text)',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    background: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px',
    background: 'var(--color-brand)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: 4,
  },
  devHint: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
  },
  captchaRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  captchaImg: {
    height: 50,
    minWidth: 150,
    background: '#f0f0f0',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
  },
};
