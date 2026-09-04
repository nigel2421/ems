import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Shield, 
  Users, 
  Bell, 
  MapPin, 
  Lock,
  ChevronDown,
  Activity,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications, onOpenAuditLogs }) => {
  const { currentUser, users, switchUser, logout, is2FAVerified, toggle2FAStatus } = useAuth();
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
          <span>{currentUser?.entityName}</span>
        </div>
      </div>

      {/* Center Actions / User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
          <img src={currentUser?.avatar} alt={currentUser?.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{currentUser?.name}</span>
          <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
            {currentUser?.role}
          </span>
        </div>

        {/* Audit Logs Quick Button */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenAuditLogs}
          title="View System Audit Trail"
        >
          <Activity style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
          <span>Audit</span>
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

        {/* Logout Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Sign out of system"
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
        >
          <LogOut style={{ width: '14px', height: '14px' }} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};
