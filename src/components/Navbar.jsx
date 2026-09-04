import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Shield, 
  MapPin, 
  Bell, 
  ChevronDown, 
  Activity, 
  LogOut, 
  UserCheck,
  Building2,
  Users,
  ClipboardList,
  FileText,
  Target,
  Vote,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications, onOpenAuditLogs, onOpenModule, currentModule }) => {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { submissions, tallyResults, fieldReports } = useData();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingTallyCount = tallyResults.filter(s => s.status === 'Submitted').length;
  const mismatchCount = tallyResults.filter(s => s.status === 'Mismatch').length;

  const getRoleClass = (role) => {
    switch (role) {
      case 'Super Admin':
      case 'Admin': return 'role-admin';
      case 'Strategy Team': return 'role-governor';
      case 'Regional Coordinator': return 'role-mp';
      case 'Field Agent':
      case 'Agent': return 'role-agent';
      case 'Observer': return 'role-aspirant';
      default: return '';
    }
  };

  const navModules = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'polling_stations', label: 'Polling Intelligence', icon: Building2 },
    { id: 'agents', label: 'Agent Management', icon: Users },
    { id: 'surveys', label: 'Survey Engine', icon: ClipboardList },
    { id: 'field_reports', label: 'Field Reports', icon: FileText },
    { id: 'mobilization', label: 'Mobilization Network', icon: Layers },
    { id: 'strategy', label: 'Campaign Strategy', icon: Target },
    { id: 'tally_center', label: 'Tally Center', icon: Vote },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles }
  ];

  return (
    <nav className="navbar" style={{ flexDirection: 'column', gap: '0.75rem', padding: '0.75rem 1.5rem' }}>
      {/* Top Row: Brand, User Identity & Persona Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="brand-logo" onClick={() => onOpenModule('dashboard')} style={{ cursor: 'pointer' }}>
            <Shield style={{ width: '26px', height: '26px', color: '#6366f1' }} />
            <span>CI-EMS <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '4px' }}>v4.0 PRO</span></span>
          </div>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <MapPin style={{ width: '13px', height: '13px', color: '#06b6d4' }} />
            <span>{currentUser?.entityName || 'National Campaign HQ'}</span>
          </div>
        </div>

        {/* Center/Right User Identity & Persona Quick Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Persona Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <img src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} alt={currentUser?.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontWeight: '600', fontSize: '0.82rem' }}>{currentUser?.name}</span>
              <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            </button>

            {showRoleMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '260px',
                  background: '#0f172a',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '14px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                  padding: '0.5rem',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.05em' }}>
                  Switch Role Persona (Dev / Demo)
                </div>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleMenu(false);
                      onOpenModule('dashboard');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentUser?.id === u.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: currentUser?.id === u.id ? '#818cf8' : 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <UserCheck style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '700' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs */}
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
            {(pendingTallyCount > 0 || mismatchCount > 0) && (
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
                {pendingTallyCount + mismatchCount}
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
      </div>

      {/* Bottom Row: Module Navigation Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.15rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '0.5rem'
        }}
      >
        {navModules.map(mod => {
          const IconComp = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onOpenModule(mod.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: isActive ? '700' : '500',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isActive ? '#a5b4fc' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComp style={{ width: '14px', height: '14px', color: isActive ? '#818cf8' : 'currentColor' }} />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
