import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from '../components/auth/LoginModal';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { AuditLogViewer } from '../components/modules/AuditLogViewer';
import { SystemHealthPanel } from '../components/modules/SystemHealthPanel';
import ProductionReadinessBoard from '../components/modules/ProductionReadinessBoard';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Database,
  Activity,
  HeartPulse,
  LogOut,
  Radio
} from 'lucide-react';

export const AdminApp = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [adminTab, setAdminTab] = useState('overview');
  const [showAuditModal, setShowAuditModal] = useState(false);

  // If a non-admin session is somehow loaded on the admin console, immediately terminate
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
      logout('unauthorized_domain');
    }
  }, [isAuthenticated, currentUser, logout]);

  if (!isAuthenticated || !currentUser) {
    return <LoginModal isAdminConsole={true} />;
  }

  return (
    <div className="admin-console-root" style={{ minHeight: '100vh', background: 'var(--bg-primary, #0b0f19)', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Top Operations Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Kuratech Operations Console
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                ADMIN REALM
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
              ops-konsole.kuratech.site · Isolated administrative infrastructure
            </div>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdminTab('overview')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <LayoutDashboard size={15} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'user_directory' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdminTab('user_directory')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <Users size={15} />
            <span>Accounts</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'geo_inspector' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdminTab('geo_inspector')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <Database size={15} />
            <span>Geo Inspector</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowAuditModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <Activity size={15} />
            <span>Audit Trail</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'health' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdminTab('health')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <HeartPulse size={15} />
            <span>System Health</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${adminTab === 'readiness' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdminTab('readiness')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <Radio size={15} />
            <span>Readiness</span>
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{currentUser.role}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => logout('manual')}
            title="Log out of Admin Console"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Console Body */}
      <main style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
        {adminTab === 'health' ? (
          <SystemHealthPanel />
        ) : adminTab === 'readiness' ? (
          <ProductionReadinessBoard userRole={currentUser.role} />
        ) : (
          <AdminDashboard
            adminPanel={adminTab}
            onOpenModule={(mod) => {
              if (mod === 'audit') setShowAuditModal(true);
            }}
          />
        )}
      </main>

      {showAuditModal && <AuditLogViewer onClose={() => setShowAuditModal(false)} />}
    </div>
  );
};
