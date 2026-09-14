import React, { useState } from 'react';
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
  Map
} from 'lucide-react';
import './AdminDashboard.css';

const PRIMARY_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      return 'role-governor';
    case 'Regional Coordinator':
      return 'role-mp';
    case 'Field Agent':
    case 'Agent':
      return 'role-agent';
    case 'Observer':
      return 'role-aspirant';
    default:
      return '';
  }
};

export const AdminLayout = ({
  children,
  currentModule = 'dashboard',
  adminPanel = 'overview',
  onAdminPanelChange,
  onOpenModule,
  onOpenNotifications,
  onOpenAuditLogs,
  onOpenGeographic
}) => {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { tallyResults } = useData();
  const [showMore, setShowMore] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);

  const pendingTallyCount = tallyResults?.filter((s) => s.status === 'Submitted').length || 0;
  const mismatchCount = tallyResults?.filter((s) => s.status === 'Mismatch').length || 0;
  const totalAlerts = pendingTallyCount + mismatchCount;
  const isDashboard = currentModule === 'dashboard';
  const isBindAgent = isDashboard && adminPanel === 'assign_agent';
  const isAgentActive = currentModule === 'agents' || isBindAgent || showAddAgent;
  const isMoreActive = MORE_MODULES.some((m) => m.id === currentModule);

  const openModule = (id) => {
    setShowMore(false);
    onOpenModule?.(id);
  };

  const openAdminTool = (panelId) => {
    onAdminPanelChange?.(panelId);
    onOpenModule?.('dashboard');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-aside">
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

        <div className="admin-nav-group">
          <div className="admin-nav-label">Modules</div>
          {PRIMARY_MODULES.map((item) => {
            const Icon = item.icon;
            const isAgents = item.id === 'agents';
            const isActive = isAgents
              ? currentModule === 'agents'
              : currentModule === item.id;

            if (isAgents) {
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
                        <span>Bind agent</span>
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
                  if (item.id === 'dashboard') onAdminPanelChange?.('overview');
                  openModule(item.id);
                }}
              >
                <Icon strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}

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
              {MORE_MODULES.map((item) => {
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
        </div>

        <div className="admin-nav-group">
          <div className="admin-nav-label">Admin tools</div>
          {ADMIN_TOOLS.map((item) => {
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
          <button type="button" className="admin-nav-btn" onClick={onOpenGeographic}>
            <Map strokeWidth={1.75} />
            <span>Geo Inspector</span>
          </button>
          <button type="button" className="admin-nav-btn" onClick={onOpenAuditLogs}>
            <Activity strokeWidth={1.75} />
            <span>Audit</span>
          </button>
          <button type="button" className="admin-nav-btn" onClick={onOpenNotifications}>
            <Bell strokeWidth={1.75} />
            <span>Alerts</span>
            {totalAlerts > 0 && <span className="admin-nav-badge">{totalAlerts}</span>}
          </button>
        </div>

        <div className="admin-profile-block">
          <button
            type="button"
            className="admin-profile-btn"
            onClick={() => setShowRoleMenu((v) => !v)}
            aria-expanded={showRoleMenu}
          >
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt=""
            />
            <div>
              <strong>{currentUser?.name}</strong>
              <span className={`role-badge ${getRoleClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>
            <ChevronDown strokeWidth={1.75} className={`admin-nav-chevron${showRoleMenu ? ' is-open' : ''}`} />
          </button>

          {showRoleMenu && (
            <div className="admin-profile-menu">
              <div className="admin-nav-label">Switch persona</div>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`admin-nav-btn admin-nav-btn-sub${currentUser?.id === u.id ? ' is-active' : ''}`}
                  onClick={() => {
                    switchUser(u.id);
                    setShowRoleMenu(false);
                    onOpenModule?.('dashboard');
                    onAdminPanelChange?.('overview');
                  }}
                >
                  <UserCheck strokeWidth={1.75} />
                  <span>
                    {u.name}
                    <small>{u.role}</small>
                  </span>
                </button>
              ))}
              <button type="button" className="admin-logout-btn" onClick={logout}>
                <LogOut strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="admin-layout-main">{children}</div>

      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser?.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};
