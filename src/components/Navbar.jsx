import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Shield, 
  ShieldCheck, 
  Users, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Lock,
  ChevronDown,
  Activity,
  FileCheck
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications, onOpenAuditLogs }) => {
  const { currentUser, users, switchUser, is2FAVerified, toggle2FAStatus } = useAuth();
  const { submissions } = useData();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingCount = submissions.filter(s => s.status === 'Submitted').length;
  const mismatchCount = submissions.filter(s => s.status === 'Mismatch').length;

  const getRoleClass = (role) => {
    switch (role) {
      case 'Admin': return 'role-admin';
      case 'Governor': return 'role-governor';
      case 'Senator': return 'role-senator';
      case 'MP': return 'role-mp';
      case 'MCA': return 'role-mca';
      case 'Aspirant': return 'role-aspirant';
      case 'Agent': return 'role-agent';
      default: return '';
    }
  };

  return (
    <nav className="navbar">
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="brand-logo">
          <Shield style={{ width: '28px', height: '28px', color: '#6366f1' }} />
          <span>IEBC EMS <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '4px' }}>v3.4 PRO</span></span>
        </div>
        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <MapPin style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
          <span>{currentUser.entityName}</span>
        </div>
      </div>

      {/* Center Actions / Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem' }}
          >
            <Users style={{ width: '16px', height: '16px', color: '#a5b4fc' }} />
            <span>Switch Role:</span>
            <span className={`role-badge ${getRoleClass(currentUser.role)}`}>
              {currentUser.role}
            </span>
            <ChevronDown style={{ width: '14px', height: '14px', opacity: 0.7 }} />
          </button>

          {/* Role Selection Dropdown */}
          {showRoleMenu && (
            <div 
              className="glass-card" 
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '320px',
                zIndex: 300,
                padding: '0.75rem',
                border: '1px solid var(--border-glow)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                Select Active Simulation Role
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: u.id === currentUser.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      background: u.id === currentUser.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.entityName}</div>
                      </div>
                    </div>
                    <span className={`role-badge ${getRoleClass(u.role)}`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2FA Status Pill */}
        <button
          onClick={toggle2FAStatus}
          className="btn btn-secondary btn-sm"
          title="Click to toggle 2FA verification state"
          style={{
            background: is2FAVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: is2FAVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: is2FAVerified ? '#34d399' : '#f87171'
          }}
        >
          {is2FAVerified ? (
            <>
              <ShieldCheck style={{ width: '14px', height: '14px' }} />
              <span>2FA Verified</span>
            </>
          ) : (
            <>
              <Lock style={{ width: '14px', height: '14px' }} />
              <span>2FA Required</span>
            </>
          )}
        </button>

        {/* Audit Logs Quick Button */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenAuditLogs}
          title="View System Audit Trail"
        >
          <Activity style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
          <span>Audit Logs</span>
        </button>

        {/* Notifications Drawer */}
        <button 
          className="btn btn-secondary btn-sm" 
          style={{ position: 'relative' }}
          onClick={onOpenNotifications}
        >
          <Bell style={{ width: '16px', height: '16px' }} />
          {(pendingCount > 0 || mismatchCount > 0) && (
            <span 
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: mismatchCount > 0 ? '#ef4444' : '#f59e0b',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {pendingCount + mismatchCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
