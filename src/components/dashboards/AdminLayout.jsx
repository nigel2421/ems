import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AddAgentModal } from '../modules/AddAgentModal';
import {
  Shield,
  LayoutDashboard,
  Target,
  Building2,
  Users,
  Vote,
  ChevronDown,
  Activity,
  Bell,
  LogOut,
  UserCheck,
  UserPlus,
  MapPin,
  Layers,
  FileText,
  ClipboardList,
  Sparkles,
  Map,
  X,
  Mail,
  IdCard
} from 'lucide-react';
import './AdminDashboard.css';
import {
  resolveJurisdiction,
  hasNationalGeographyAccess,
  filterTalliesByJurisdiction
} from '../../utils/jurisdictionAnalytics';
import { KenyaPoliticalNewsFab } from '../modules/KenyaPoliticalNewsPanel';

const PRIMARY_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'strategy_team', label: 'Strategy Team', icon: Users },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'polling_stations', label: 'Polling Intel', icon: Building2 },
  { id: 'agents', label: 'Agent Management', icon: Users },
  { id: 'tally_center', label: 'Tally Center', icon: Vote }
];

const MORE_MODULES = [
  { id: 'field_reports', label: 'Field Reports', icon: FileText },
  { id: 'surveys', label: 'Surveys & Sampling', icon: ClipboardList },
  { id: 'mobilization', label: 'Mobilization', icon: Layers },
  { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles }
];

const ADMIN_TOOLS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'user_directory', label: 'Accounts', icon: UserCheck }
];

const getRoleClass = (role) => {
  switch (role) {
    case 'Super Admin':
    case 'Admin':
      return 'role-admin';
    case 'Strategy Team':
    case 'Governor':
    case 'Senator':
      return 'role-governor';
    case 'Regional Coordinator':
    case 'MP':
    case 'MCA':
      return 'role-mp';
    case 'Field Agent':
    case 'Agent':
      return 'role-agent';
    case 'Observer':
    case 'Aspirant':
      return 'role-aspirant';
    default:
      return '';
  }
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export const AdminLayout = ({
  children,
  currentModule = 'dashboard',
  adminPanel = 'overview',
  onAdminPanelChange,
  onOpenModule,
  onOpenNotifications,
  onOpenAuditLogs,
  onOpenGeographic,
  showProfilePanel = false,
  onToggleProfilePanel,
  onCloseProfilePanel
}) => {
  const { currentUser, users, switchUser, logout, canAccessModule, userScope } = useAuth();
  const { tallyResults, geography } = useData();
  const [showMore, setShowMore] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);

  const isAdmin =
    currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setAsideOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!asideOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setAsideOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [asideOpen]);

  const closeAside = () => setAsideOpen(false);

  const scopedNavTallies = useMemo(() => {
    const national = hasNationalGeographyAccess(currentUser);
    const scope = resolveJurisdiction(currentUser, geography);
    return filterTalliesByJurisdiction(tallyResults, geography?.pollingStations || [], scope, {
      national
    });
  }, [tallyResults, geography, currentUser]);

  const pendingTallyCount = scopedNavTallies.filter((s) => s.status === 'Submitted').length || 0;
  const mismatchCount = scopedNavTallies.filter((s) => s.status === 'Mismatch').length || 0;
  const totalAlerts = pendingTallyCount + mismatchCount;
  const isDashboard = currentModule === 'dashboard';
  const isBindAgent = isAdmin && isDashboard && adminPanel === 'assign_agent';
  const isAgentActive = currentModule === 'agents' || isBindAgent || showAddAgent;
  const isMoreActive = MORE_MODULES.some((m) => m.id === currentModule);

  const primaryModules = useMemo(
    () => PRIMARY_MODULES.filter((m) => m.id === 'dashboard' || canAccessModule?.(m.id)),
    [canAccessModule]
  );

  const moreModules = useMemo(
    () => MORE_MODULES.filter((m) => canAccessModule?.(m.id)),
    [canAccessModule]
  );

  const openModule = (id) => {
    setShowMore(false);
    onCloseProfilePanel?.();
    closeAside();
    onOpenModule?.(id);
  };

  const openAdminTool = (panelId) => {
    onCloseProfilePanel?.();
    closeAside();
    onAdminPanelChange?.(panelId);
    onOpenModule?.('dashboard');
  };

  const handleSwitchPersona = (userId) => {
    switchUser(userId);
    onCloseProfilePanel?.();
    onOpenModule?.('dashboard');
    onAdminPanelChange?.('overview');
  };

  const toolsLabel = isAdmin ? 'Admin tools' : 'Workspace';

  const isDevMode = import.meta.env?.DEV || import.meta.env?.VITE_DEV_MODE === 'true' || true;
  const isImpersonating = currentUser && currentUser.id !== 'USR-SUPERADMIN-01' && currentUser.id !== 'USR-ADMIN-01';

  return (
    <div className={`admin-layout${asideOpen ? ' is-aside-open' : ''}`}>
      <header className="admin-mobile-bar">
        <button
          type="button"
          className={`admin-menu-toggle${asideOpen ? ' is-open' : ''}`}
          aria-label={asideOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={asideOpen}
          aria-controls="admin-aside-nav"
          onClick={() => setAsideOpen((v) => !v)}
        >
          <span className="admin-hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <button type="button" className="admin-mobile-brand" onClick={() => openModule('dashboard')}>
          <Shield strokeWidth={2} />
          <strong>
            CI-EMS <span className="admin-pro-badge">PRO</span>
          </strong>
        </button>
      </header>

      <button
        type="button"
        className="admin-aside-scrim"
        aria-label="Close navigation menu"
        tabIndex={asideOpen ? 0 : -1}
        onClick={closeAside}
      />

      <aside id="admin-aside-nav" className="admin-aside">
        <button type="button" className="admin-brand" onClick={() => openModule('dashboard')}>
          <div className="admin-aside-mark">
            <Shield strokeWidth={2} />
          </div>
          <div>
            <strong>
              CI-EMS <span className="admin-pro-badge">PRO</span>
            </strong>
            <span>Election Management</span>
          </div>
        </button>

        {userScope && (
          <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#38bdf8' }}>
              <MapPin size={13} /> {userScope.name}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
              Role: <strong>{currentUser?.role || 'Guest'}</strong>
            </div>
          </div>
        )}


        <div className="admin-nav-group">
          <div className="admin-nav-label">Modules</div>
          {primaryModules.map((item) => {
            const Icon = item.icon;
            const isAgents = item.id === 'agents';
            const isActive = isAgents
              ? currentModule === 'agents'
              : currentModule === item.id;

            if (isAgents && isAdmin) {
              return (
                <div key={item.id} className="admin-nav-parent">
                  <button
                    type="button"
                    className={`admin-nav-btn${isAgentActive ? ' is-active' : ''}`}
                    aria-expanded={showAgentMenu}
                    onClick={() => {
                      const next = !showAgentMenu;
                      setShowAgentMenu(next);
                      if (next) openModule('agents');
                    }}
                  >
                    <Icon strokeWidth={1.75} />
                    <span>{item.label}</span>
                    <ChevronDown
                      strokeWidth={1.75}
                      className={`admin-nav-chevron${showAgentMenu ? ' is-open' : ''}`}
                    />
                  </button>
                  {showAgentMenu && (
                    <div className="admin-more-list">
                      <button
                        type="button"
                        className={`admin-nav-btn admin-nav-btn-sub${showAddAgent ? ' is-active' : ''}`}
                        onClick={() => {
                          setShowAgentMenu(true);
                          onCloseProfilePanel?.();
                          closeAside();
                          setShowAddAgent(true);
                        }}
                      >
                        <UserPlus strokeWidth={1.75} />
                        <span>Add new agent</span>
                      </button>
                      <button
                        type="button"
                        className={`admin-nav-btn admin-nav-btn-sub${isBindAgent ? ' is-active' : ''}`}
                        onClick={() => {
                          setShowAgentMenu(true);
                          openAdminTool('assign_agent');
                        }}
                      >
                        <MapPin strokeWidth={1.75} />
                        <span>Assign agent</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-btn${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  if (item.id === 'dashboard' && isAdmin) onAdminPanelChange?.('overview');
                  openModule(item.id);
                }}
              >
                <Icon strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {moreModules.length > 0 && (
            <>
              <button
                type="button"
                className={`admin-nav-btn${isMoreActive || showMore ? ' is-active' : ''}`}
                onClick={() => setShowMore((v) => !v)}
                aria-expanded={showMore}
              >
                <Layers strokeWidth={1.75} />
                <span>More</span>
                <ChevronDown
                  strokeWidth={1.75}
                  className={`admin-nav-chevron${showMore ? ' is-open' : ''}`}
                />
              </button>

              {showMore && (
                <div className="admin-more-list">
                  {moreModules.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`admin-nav-btn admin-nav-btn-sub${isActive ? ' is-active' : ''}`}
                        onClick={() => openModule(item.id)}
                      >
                        <Icon strokeWidth={1.75} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="admin-nav-group">
          <div className="admin-nav-label">{toolsLabel}</div>
          {isAdmin &&
            ADMIN_TOOLS.map((item) => {
              const Icon = item.icon;
              const isActive = isDashboard && adminPanel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-btn${isActive ? ' is-active' : ''}`}
                  onClick={() => openAdminTool(item.id)}
                >
                  <Icon strokeWidth={1.75} />
                  <span>{item.label}</span>
                  {item.id === 'user_directory' && (
                    <span className="admin-nav-badge">{users.length}</span>
                  )}
                </button>
              );
            })}
          {isAdmin && (
            <button type="button" className="admin-nav-btn" onClick={() => { onCloseProfilePanel?.(); closeAside(); onOpenGeographic?.(); }}>
              <Map strokeWidth={1.75} />
              <span>Geo Inspector</span>
            </button>
          )}
          {(isAdmin ||
            ['Strategy Team', 'Governor', 'Senator', 'Regional Coordinator'].includes(
              currentUser?.role
            )) && (
            <button type="button" className="admin-nav-btn" onClick={() => { onCloseProfilePanel?.(); closeAside(); onOpenAuditLogs?.(); }}>
              <Activity strokeWidth={1.75} />
              <span>Audit</span>
            </button>
          )}
          <button type="button" className="admin-nav-btn" onClick={() => { onCloseProfilePanel?.(); closeAside(); onOpenNotifications?.(); }}>
            <Bell strokeWidth={1.75} />
            <span>Alerts</span>
            {totalAlerts > 0 && <span className="admin-nav-badge">{totalAlerts}</span>}
          </button>
        </div>

        <div className="admin-profile-block">
          <button
            type="button"
            className={`admin-profile-btn${showProfilePanel ? ' is-active' : ''}`}
            onClick={() => {
              closeAside();
              onToggleProfilePanel?.();
            }}
            aria-expanded={showProfilePanel}
            aria-controls="admin-profile-panel"
          >
            <img src={currentUser?.avatar || DEFAULT_AVATAR} alt="" />
            <div>
              <strong>{currentUser?.name}</strong>
              <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>
            <ChevronDown
              strokeWidth={1.75}
              className={`admin-nav-chevron${showProfilePanel ? ' is-open' : ''}`}
            />
          </button>
        </div>
      </aside>

      <div className="admin-layout-main">
        {isImpersonating && (
          <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid #991b1b', marginBottom: '1rem' }}>
            <span>⚠️ ADMINISTRATIVE IMPERSONATION ACTIVE:</span>
            <span>Logged in as <strong>{currentUser?.name}</strong> [{currentUser?.role}] — Audit logging active</span>
          </div>
        )}
        {showProfilePanel && (
          <div
            id="admin-profile-panel"
            className="admin-profile-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Account profile"
          >
            <button
              type="button"
              className="admin-profile-backdrop"
              aria-label="Close profile"
              onClick={() => onCloseProfilePanel?.()}
            />
            <div className="admin-profile-panel-card">
              <div className="admin-profile-panel-head">
                <div className="admin-profile-panel-identity">
                  <img src={currentUser?.avatar || DEFAULT_AVATAR} alt="" />
                  <div>
                    <h2>{currentUser?.name}</h2>
                    <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-profile-panel-close"
                  onClick={() => onCloseProfilePanel?.()}
                  aria-label="Close profile"
                >
                  <X strokeWidth={1.75} />
                </button>
              </div>

              <div className="admin-profile-panel-meta">
                <div>
                  <Mail strokeWidth={1.75} />
                  <div>
                    <small>Official email</small>
                    <strong>{currentUser?.email || 'Not provided'}</strong>
                  </div>
                </div>
                <div>
                  <IdCard strokeWidth={1.75} />
                  <div>
                    <small>Assigned scope</small>
                    <strong>{currentUser?.entityName || currentUser?.assignedEntity || 'National'}</strong>
                  </div>
                </div>
                <div>
                  <MapPin strokeWidth={1.75} />
                  <div>
                    <small>Jurisdiction</small>
                    <strong>
                      {[currentUser?.county, currentUser?.constituency, currentUser?.ward]
                        .filter(Boolean)
                        .join(' · ') || 'Nationwide'}
                    </strong>
                  </div>
                </div>
              </div>

              <button type="button" className="admin-logout-btn" onClick={logout}>
                <LogOut strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </div>
        )}

        {children}
      </div>

      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser?.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}

      <KenyaPoliticalNewsFab />
    </div>
  );
};
