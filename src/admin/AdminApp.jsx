import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LoginModal } from '../components/auth/LoginModal';
import { IdleTimeoutModal } from '../components/auth/IdleTimeoutModal';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { AuditLogViewer } from '../components/modules/AuditLogViewer';
import { SystemHealthPanel } from '../components/modules/SystemHealthPanel';
import ProductionReadinessBoard from '../components/modules/ProductionReadinessBoard';
import { ElectoralMapRoom } from '../components/modules/ElectoralMapRoom';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Map,
  Activity,
  HeartPulse,
  LogOut,
  Radio,
  Sliders,
  ShieldAlert,
  Menu,
  X,
  Lock
} from 'lucide-react';
import '../components/dashboards/AdminDashboard.css';

export const AdminApp = () => {
  const { currentUser, isAuthenticated, logout, users, getAccountLockState } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [adminTab, setAdminTab] = useState('overview');
  const [asideOpen, setAsideOpen] = useState(false);

  // If a non-admin session is somehow loaded on the admin console, immediately terminate
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
      logout('unauthorized_domain');
    }
  }, [isAuthenticated, currentUser, logout]);

  // 30-minute inactivity limit with 28-minute warning for Admin Console
  const { phase, secondsLeft, stayActive } = useIdleTimeout({
    isAuthenticated,
    onTimeout: () => logout('inactivity'),
    limitMs: 30 * 60 * 1000,
    warningMs: 28 * 60 * 1000
  });

  if (!isAuthenticated || !currentUser) {
    return <LoginModal isAdminConsole={true} />;
  }

  // Count locked accounts for the notification badge in sidebar
  const lockedAccountsCount = (users || []).filter((u) => getAccountLockState(u.email).locked).length;

  const closeAside = () => setAsideOpen(false);

  const navItems = [
    { id: 'overview', label: t('nav.dashboard', 'Overview'), icon: LayoutDashboard },
    { id: 'user_directory', label: t('nav.user_directory', 'Accounts & Directory'), icon: Users, badge: lockedAccountsCount > 0 ? `${lockedAccountsCount} Locked` : null, badgeColor: '#eab308' },
    { id: 'feature_settings', label: t('nav.settings', 'Campaign Features'), icon: Sliders },
    { id: 'interactive_map', label: t('nav.map_room', 'Electoral Map Room'), icon: Map },
    { id: 'audit', label: t('nav.audit_logs', 'Audit Trail'), icon: Activity },
    { id: 'health', label: t('nav.system_health', 'System Health'), icon: HeartPulse },
    { id: 'readiness', label: t('nav.readiness', 'Readiness Board'), icon: Radio }
  ];

  return (
    <div className={`admin-layout ${theme === 'dark' ? 'dark' : ''} is-admin-shell ${asideOpen ? 'is-aside-open' : ''}`}>
      {/* Mobile Top Bar */}
      <header className="admin-mobile-bar">
        <button
          type="button"
          className={`admin-menu-toggle ${asideOpen ? 'is-open' : ''}`}
          aria-label={asideOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setAsideOpen((v) => !v)}
        >
          {asideOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#0ea5e9" />
          <strong style={{ fontSize: '0.95rem', fontWeight: 800 }}>Kuratech Ops Console</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <LanguageSwitcher compact={true} />
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={() => logout('manual')}
            title="Logout"
            style={{ padding: '0.2rem 0.5rem' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Scrim */}
      {asideOpen && (
        <div
          className="admin-aside-scrim"
          style={{ display: 'block' }}
          onClick={closeAside}
        />
      )}

      {/* Left Menu Bar / Authoritative Admin Sidebar */}
      <aside className={`admin-aside ${asideOpen ? 'is-open' : ''}`}>
        <div className="admin-aside-brand">
          <div
            className="admin-aside-mark"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}
          >
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <strong>
              Kuratech <span className="admin-pro-badge" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', borderColor: 'rgba(14,165,233,0.3)' }}>OPS</span>
            </strong>
            <span>ADMIN REALM · Isolated</span>
          </div>
        </div>

        {/* Realm Telemetry Card */}
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '12px',
            background: 'var(--admin-hover)',
            border: '1px solid var(--admin-line)',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0ea5e9' }}>
            <ShieldCheck size={14} /> National Command HQ
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--admin-muted)', marginTop: '2px' }}>
            ops-konsole.kuratech.site
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="admin-nav-group" style={{ flex: 1, marginTop: '0.25rem' }}>
          <div className="admin-nav-label">Console Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setAdminTab(item.id);
                  closeAside();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? 'var(--admin-green-soft)' : 'transparent',
                  color: isActive ? 'var(--admin-green)' : 'var(--admin-ink)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? 'var(--admin-green)' : 'var(--admin-muted)' }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#eab308',
                      border: '1px solid rgba(234, 179, 8, 0.4)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Language & Theme Toggle & Admin Profile */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--admin-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted)', fontWeight: 600 }}>Language</span>
            <LanguageSwitcher compact={true} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted)', fontWeight: 600 }}>Appearance</span>
            <ThemeSwitcher compact={true} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.75rem',
              borderRadius: '12px',
              background: 'var(--admin-hover)',
              border: '1px solid var(--admin-line)'
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#0ea5e9', fontWeight: 600 }}>{currentUser.role}</div>
            </div>
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => logout('manual')}
              title="Log out of Admin Console"
              style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--admin-muted)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Console View Area */}
      <main className="admin-layout-main">
        {adminTab === 'health' ? (
          <SystemHealthPanel />
        ) : adminTab === 'readiness' ? (
          <ProductionReadinessBoard userRole={currentUser.role} />
        ) : adminTab === 'interactive_map' ? (
          <ElectoralMapRoom />
        ) : adminTab === 'audit' ? (
          <AuditLogViewer onClose={() => setAdminTab('overview')} />
        ) : (
          <AdminDashboard
            activeTab={adminTab}
            onTabChange={setAdminTab}
            onOpenGeographic={() => setAdminTab('interactive_map')}
            onOpenAuditLogs={() => setAdminTab('audit')}
            onOpenModule={(mod) => {
              if (mod === 'polling_stations' || mod === 'agents') {
                setAdminTab('user_directory');
              }
            }}
          />
        )}

        {phase === 'warning' && (
          <IdleTimeoutModal
            secondsLeft={secondsLeft}
            onStayActive={stayActive}
            onLogout={() => logout('manual')}
          />
        )}
      </main>
    </div>
  );
};

export default AdminApp;
