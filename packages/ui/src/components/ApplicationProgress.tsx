export interface ProgressStep {
  label: string;
  date?: string;
}

/** 申辦進度查詢：5 步驟橫條，目前步驟金色高亮。 */
export function ApplicationProgress({
  steps,
  currentIndex,
  caseInfo,
}: {
  steps: ProgressStep[];
  currentIndex: number;
  caseInfo: { id: string; title: string };
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 4,
          padding: '20px 0',
        }}
      >
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          const stepColor = isActive
            ? 'var(--color-brand-accent, var(--color-brand-primary))'
            : isDone
            ? 'var(--color-success, #059669)'
            : 'var(--color-border)';
          const textColor = isActive
            ? 'var(--color-brand-accent, var(--color-brand-primary))'
            : 'var(--color-text-muted)';

          return (
            <div
              key={step.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* connecting line (right side, except last) */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    width: '100%',
                    height: 2,
                    background: idx < currentIndex
                      ? 'var(--color-success, #059669)'
                      : 'var(--color-border)',
                  }}
                  aria-hidden
                />
              )}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: stepColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: textColor,
                  marginTop: 8,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {step.label}
              </div>
              {step.date && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {step.date}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: 'var(--color-bg-alt, #FFFFFF)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 8,
        }}
      >
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div>案件編號：<strong>{caseInfo.id}</strong></div>
          <div>申請項目：{caseInfo.title}</div>
        </div>
        <button
          style={{
            background: 'var(--color-brand-accent, var(--color-brand-primary))',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          查看詳細
        </button>
      </div>
    </div>
  );
}
