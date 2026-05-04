'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  role?: string;
}

const navItems = [
  { href: '/dashboard', label: '儀表板', icon: '📊' },
  { href: '/pages', label: '頁面管理', icon: '📄' },
  { href: '/media', label: '媒體庫', icon: '🖼' },
  { href: '/categories', label: '分類管理', icon: '📁' },
  { href: '/navigation', label: '導覽管理', icon: '🔗' },
  { href: '/members', label: '成員管理', icon: '👥' },
  { href: '/settings', label: '版型設定', icon: '🎨' },
  { href: '/audit', label: '稽核日誌', icon: '📋' },
];

const superAdminItems = [
  { href: '/tenants', label: '租戶管理', icon: '🏢' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout, setTenant } = useAuth();

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tenant list on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${API_BASE}/auth/me/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setTenants(res.data);
        }
      })
      .catch((err) => console.error('Failed to load tenants:', err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTenant = tenants.find((t) => t.slug === tenant);
  const displayName = currentTenant?.name ?? tenant;

  const handleSwitch = (slug: string) => {
    setTenant(slug);
    setDropdownOpen(false);
    router.push('/dashboard');
  };

  return (
    <aside style={styles.sidebar}>
      {/* Brand header with tenant switcher */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--color-brand)" />
            <path d="M8 10h12v1.5H8zm0 3h10v1.5H8zm0 3h7v1.5H8z" fill="white" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.brandName}>Gov CMS</div>

          {/* Tenant switcher */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="tenant-switcher-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={styles.tenantSwitcher}
              title="切換租戶"
            >
              <span style={styles.tenantSwitcherText}>{displayName}</span>
              <span style={styles.tenantSwitcherArrow}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {dropdownOpen && tenants.length > 0 && (
              <div style={styles.dropdown}>
                {tenants.map((t) => (
                  <button
                    key={t.slug}
                    className="tenant-dropdown-item"
                    onClick={() => handleSwitch(t.slug)}
                    style={{
                      ...styles.dropdownItem,
                      ...(t.slug === tenant ? styles.dropdownItemActive : {}),
                    }}
                  >
                    <div style={styles.dropdownItemMain}>
                      <span style={styles.dropdownItemName}>{t.name}</span>
                      {t.slug === tenant && <span style={styles.checkMark}>✓</span>}
                    </div>
                    <div style={styles.dropdownItemMeta}>
                      {t.slug}
                      {t.role ? ` · ${roleLabel(t.role)}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            }}>
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Super admin only */}
        {user?.isSuperAdmin && (
          <>
            <div style={styles.navDivider} />
            {superAdminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}>
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userEmail}>{user?.email ?? ''}</div>
            <div style={styles.userRole}>
              {user?.isSuperAdmin ? '超級管理員' : user?.role ?? ''}
            </div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} style={styles.logoutBtn}>登出</button>
      </div>

      {/* Hover styles for dropdown & buttons */}
      <style>{`
        .tenant-dropdown-item:hover {
          background: var(--color-brand-light) !important;
        }
        .tenant-switcher-btn:hover {
          border-color: var(--color-brand) !important;
        }
        .sidebar-nav-link:hover {
          background: var(--color-surface);
        }
        .sidebar-logout:hover {
          border-color: var(--color-text-muted) !important;
        }
      `}</style>
    </aside>
  );
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: '管理員',
    editor_in_chief: '總編輯',
    editor: '編輯',
    viewer: '檢視者',
  };
  return map[role] ?? role;
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    background: 'white',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '20px 16px 16px',
    borderBottom: '1px solid var(--color-border)',
  },
  brandIcon: { paddingTop: 2 },
  brandName: { fontSize: 15, fontWeight: 700, color: 'var(--color-text)' },

  // Tenant switcher
  tenantSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    padding: '2px 8px 2px 6px',
    background: 'var(--color-brand-light)',
    border: '1px solid transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-brand)',
    fontFamily: 'var(--font-body)',
    maxWidth: '100%',
    transition: 'border-color 0.15s',
  },
  tenantSwitcherText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tenantSwitcherArrow: {
    fontSize: 8,
    flexShrink: 0,
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 200,
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 100,
    padding: '4px',
    maxHeight: 280,
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'background 0.1s',
  },
  dropdownItemActive: {
    background: 'var(--color-brand-light)',
  },
  dropdownItemMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text)',
  },
  checkMark: {
    fontSize: 12,
    color: 'var(--color-brand)',
    fontWeight: 700,
  },
  dropdownItemMeta: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },

  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 6,
    fontSize: 13.5,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'var(--color-brand-light)',
    color: 'var(--color-brand)',
    fontWeight: 600,
  },
  navDivider: {
    height: 1,
    background: 'var(--color-border)',
    margin: '6px 12px',
  },
  navIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  userSection: {
    padding: '12px 12px 16px',
    borderTop: '1px solid var(--color-border)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--color-brand)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  userDetails: { flex: 1, overflow: 'hidden' },
  userEmail: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: { fontSize: 11, color: 'var(--color-text-muted)' },
  logoutBtn: {
    width: '100%',
    padding: '6px',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
};
