import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ElectionCountdown } from './modules/ElectionCountdown';
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
  Compass,
  X,
  Zap,
  BarChart3,
  BrainCircuit
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications, onOpenAuditLogs, onOpenModule, currentModule }) => {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { tallyResults } = useData();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileNavDrawer, setShowMobileNavDrawer] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  const pendingTallyCount = tallyResults ? tallyResults.filter(s => s.status === 'Submitted').length : 0;
  const mismatchCount = tallyResults ? tallyResults.filter(s => s.status === 'Mismatch').length : 0;
  const totalAlerts = pendingTallyCount + mismatchCount;

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

  const navCategories = [
    {
      name: 'Strategy & Overview',
      icon: BrainCircuit,
      modules: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: Compass, desc: 'Real-time campaign status & KPIs' },
        { id: 'strategy', label: 'Campaign Strategy', icon: Target, desc: 'Electoral targets & sentiment matrix' },
        { id: 'ai_assistant', label: 'AI Intelligence Assistant', icon: Sparkles, desc: 'Predictive analytics & legal RAG' }
      ]
    },
    {
      name: 'Intelligence & Research',
      icon: BarChart3,
      modules: [
        { id: 'polling_stations', label: 'Polling Intelligence', icon: Building2, desc: 'Boundary mapping & voter statistics' },
        { id: 'field_reports', label: 'Field Incident Reports', icon: FileText, desc: 'Ground verification & dispatch logs' },
        { id: 'surveys', label: 'Survey & Sampling Engine', icon: ClipboardList, desc: 'Voter polling & demographic trends' }
      ]
    },
    {
      name: 'Operations & Monitoring',
      icon: Zap,
      modules: [
        { id: 'agents', label: 'Agent Management', icon: Users, desc: 'Agent deployment & accreditation' },
        { id: 'mobilization', label: 'Mobilization Network', icon: Layers, desc: 'Grassroots hierarchy & team sync' },
        { id: 'tally_center', label: 'Form 34A Tally Center', icon: Vote, desc: 'Form verification & mismatch engine' }
      ]
    }
  ];

  const allNavModules = navCategories.flatMap(c => c.modules);
  const activeNavModule = allNavModules.find(m => m.id === currentModule) || allNavModules[0];
  const ActiveNavIcon = activeNavModule.icon;

  return (
    <>
      {/* 56px Persistent Top App Bar */}
      <nav className="navbar" style={{ padding: 0, flexDirection: 'column', background: '#0B0F19', borderBottom: '1px solid #233252' }}>
        <div className="app-header-bar" style={{ width: '100%' }}>
          {/* Left: Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-logo" onClick={() => onOpenModule && onOpenModule('dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield style={{ width: '22px', height: '22px', color: '#3B82F6' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                CI-EMS
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.4rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px' }}>
                PRO
              </span>
            </div>

            <div className="nav-desktop-divider" style={{ height: '18px', width: '1px', background: '#233252', margin: '0 0.25rem' }}></div>
            
            {/* Countdown Badge - Desktop */}
            <div className="nav-desktop-row" style={{ border: 'none', padding: 0 }}>
              <ElectionCountdown variant="navbar" />
            </div>
          </div>

          {/* Center: Mobile Active Breadcrumb Selector Bar (Visible <= 768px) */}
          <div className="nav-mobile-breadcrumb-bar" style={{ flex: 1, maxWidth: '210px', margin: '0 0.5rem' }}>
            <div 
              className="nav-breadcrumb-selector"
              onClick={() => setShowMobileNavDrawer(true)}
              style={{ background: '#161F33', border: '1px solid #233252', padding: '0.35rem 0.6rem', borderRadius: '10px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                <ActiveNavIcon style={{ width: '15px', height: '15px', color: '#3B82F6', flexShrink: 0 }} />
                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeNavModule.label}
                </span>
              </div>
              <ChevronDown style={{ width: '14px', height: '14px', color: '#94A3B8', flexShrink: 0 }} />
            </div>
          </div>

          {/* Right: Consolidated Profile & Overflow Sheet Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Desktop Actions */}
            <div className="nav-desktop-row" style={{ border: 'none', padding: 0, gap: '0.4rem' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={onOpenAuditLogs}
                title="View System Audit Trail"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: '#233252' }}
              >
                <Activity style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
                <span>Audit</span>
              </button>

              <button 
                className="btn btn-secondary btn-sm" 
                style={{ position: 'relative', padding: '0.3rem 0.6rem', borderColor: '#233252' }}
                onClick={onOpenNotifications}
              >
                <Bell style={{ width: '14px', height: '14px' }} />
                {totalAlerts > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: mismatchCount > 0 ? '#EF4444' : '#F59E0B',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {totalAlerts}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Avatar Button (Opens Unified Account Sheet on Mobile & Desktop) */}
            <button 
              onClick={() => setShowAccountSheet(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#161F33',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #233252',
                color: '#F8FAFC',
                cursor: 'pointer',
                minHeight: '36px'
              }}
              aria-label="User Account Menu"
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                  alt={currentUser?.name} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span style={{ position: 'absolute', bottom: '0', right: '0', width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', border: '1px solid #0B0F19' }}></span>
              </div>
              <span className="nav-desktop-row" style={{ border: 'none', padding: 0, fontWeight: '600', fontSize: '0.78rem' }}>
                {currentUser?.name}
              </span>
              <span className={`role-badge ${getRoleClass(currentUser?.role)}`} style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}>
                {currentUser?.role}
              </span>
              {totalAlerts > 0 && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Module Navigation Row (Visible > 768px) */}
        <div className="nav-desktop-row" style={{ padding: '0.4rem 1.25rem', background: '#0F172A', borderTop: '1px solid #233252' }}>
          {allNavModules.map(mod => {
            const IconComp = mod.icon;
            const isActive = currentModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => onOpenModule && onOpenModule(mod.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? '700' : '500',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #3B82F6' : '1px solid transparent',
                  background: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#94A3B8',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp style={{ width: '14px', height: '14px', color: isActive ? '#3B82F6' : 'currentColor' }} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==========================================================================
         MODULE SELECTOR BOTTOM SHEET DRAWER (Mobile)
         ========================================================================== */}
      {showMobileNavDrawer && (
        <div className="mobile-drawer-overlay" onClick={() => setShowMobileNavDrawer(false)}>
          <div className="mobile-drawer-sheet" onClick={e => e.stopPropagation()}>
            <div className="drawer-drag-handle"></div>
            
            {/* Drawer Title Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #233252' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield style={{ width: '20px', height: '20px', color: '#3B82F6' }} />
                <span style={{ fontWeight: '800', fontSize: '1rem', color: '#F8FAFC' }}>CI-EMS System Modules</span>
              </div>
              <button 
                onClick={() => setShowMobileNavDrawer(false)} 
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '0.4rem', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Categorized Module List */}
            <div style={{ padding: '0.75rem 1rem 1.5rem 1rem', overflowY: 'auto', maxHeight: '70vh' }}>
              {navCategories.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.name} style={{ marginBottom: '1.25rem' }}>
                    <div className="drawer-category-header">
                      <CatIcon style={{ width: '14px', height: '14px', color: '#3B82F6' }} />
                      <span>{cat.name}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {cat.modules.map(mod => {
                        const IconComp = mod.icon;
                        const isActive = currentModule === mod.id;
                        return (
                          <button
                            key={mod.id}
                            className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              onOpenModule && onOpenModule(mod.id);
                              setShowMobileNavDrawer(false);
                            }}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconComp style={{ width: '18px', height: '18px', color: isActive ? '#3B82F6' : '#94A3B8' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: isActive ? '700' : '600', color: isActive ? '#60A5FA' : '#F8FAFC' }}>
                                {mod.label}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mod.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         UNIFIED ACCOUNT / OVERFLOW SHEET MODAL
         ========================================================================== */}
      {showAccountSheet && (
        <div className="modal-overlay" onClick={() => setShowAccountSheet(false)}>
          <div className="account-overflow-sheet" onClick={e => e.stopPropagation()}>
            {/* Account Sheet Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #233252' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                  alt={currentUser?.name} 
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3B82F6' }} 
                />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#F8FAFC' }}>{currentUser?.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
                      {currentUser?.role}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MapPin style={{ width: '11px', height: '11px', color: '#06B6D4' }} />
                      {currentUser?.entityName || 'National HQ'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAccountSheet(false)} style={{ padding: '0.3rem 0.5rem', minHeight: '36px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Quick Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Notifications */}
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowAccountSheet(false);
                  onOpenNotifications && onOpenNotifications();
                }}
                style={{ width: '100%', justifyContent: 'space-between', minHeight: '48px', background: '#0B0F19', borderColor: '#233252' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Bell style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                  <span style={{ fontSize: '0.88rem' }}>System Alerts & Notifications</span>
                </div>
                {totalAlerts > 0 ? (
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: mismatchCount > 0 ? '#EF4444' : '#F59E0B', color: '#fff', fontSize: '0.75rem', fontWeight: '800' }}>
                    {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Clear</span>
                )}
              </button>

              {/* Audit Logs */}
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowAccountSheet(false);
                  onOpenAuditLogs && onOpenAuditLogs();
                }}
                style={{ width: '100%', justifyContent: 'space-between', minHeight: '48px', background: '#0B0F19', borderColor: '#233252' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Activity style={{ width: '18px', height: '18px', color: '#06B6D4' }} />
                  <span style={{ fontSize: '0.88rem' }}>Audit Trail & Security Logs</span>
                </div>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#94A3B8', transform: 'rotate(-90deg)' }} />
              </button>

              {/* Role Persona Switcher Accordion */}
              <div style={{ background: '#0B0F19', border: '1px solid #233252', borderRadius: '12px', padding: '0.6rem 0.75rem' }}>
                <div 
                  onClick={() => setShowRoleMenu(!showRoleMenu)} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: '36px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <UserCheck style={{ width: '18px', height: '18px', color: '#3B82F6' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Switch Role Persona (Demo)</span>
                  </div>
                  <ChevronDown style={{ width: '16px', height: '16px', color: '#94A3B8', transform: showRoleMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {showRoleMenu && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.6rem', pt: '0.5rem', borderTop: '1px solid #233252' }}>
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowRoleMenu(false);
                          setShowAccountSheet(false);
                          onOpenModule && onOpenModule('dashboard');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: currentUser?.id === u.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: currentUser?.id === u.id ? '#60A5FA' : '#F8FAFC',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          minHeight: '40px'
                        }}
                      >
                        <UserCheck style={{ width: '14px', height: '14px', color: '#3B82F6' }} />
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '700' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{u.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowAccountSheet(false);
                  logout();
                }}
                style={{ width: '100%', marginTop: '0.5rem', minHeight: '48px' }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                <span>Sign Out of CI-EMS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
