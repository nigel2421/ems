import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { AdminLayout } from './components/dashboards/AdminLayout';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { StrategyDashboard } from './components/dashboards/StrategyDashboard';
import { RegionalDashboard } from './components/dashboards/RegionalDashboard';
import { AgentDashboard } from './components/dashboards/AgentDashboard';
import { ObserverDashboard } from './components/dashboards/ObserverDashboard';
import { PollingStationIntelligence } from './components/modules/PollingStationIntelligence';
import { AgentManagement } from './components/modules/AgentManagement';
import { SurveyEngine } from './components/modules/SurveyEngine';
import { FieldReporting } from './components/modules/FieldReporting';
import { TeamMobilization } from './components/modules/TeamMobilization';
import { CampaignStrategy } from './components/modules/CampaignStrategy';
import { TallyCenter } from './components/modules/TallyCenter';
import { AIAssistantModal } from './components/modules/AIAssistantModal';
import { AuditLogViewer } from './components/modules/AuditLogViewer';
import { ElectionCountdown } from './components/modules/ElectionCountdown';
import { LoginModal } from './components/auth/LoginModal';
import { Bell, X } from 'lucide-react';

const MainAppContent = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { tallyResults } = useData();

  const [currentModule, setCurrentModule] = useState('dashboard');
  const [adminPanel, setAdminPanel] = useState('overview');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  if (!isAuthenticated || !currentUser) {
    return <LoginModal />;
  }

  const openModule = (mod) => {
    if (mod === 'ai_assistant') {
      setShowAIAssistant(true);
      return;
    }
    setShowProfilePanel(false);
    setCurrentModule(mod);
    if (mod === 'dashboard') {
      setAdminPanel((prev) => prev || 'overview');
    }
  };

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'Super Admin':
      case 'Admin':
        return (
          <AdminDashboard
            activeTab={adminPanel}
            onTabChange={setAdminPanel}
            onOpenAuditLogs={() => setShowAuditLogs(true)}
            onOpenGeographic={() => setCurrentModule('polling_stations')}
            onOpenModule={openModule}
          />
        );
      case 'Strategy Team':
      case 'Governor':
      case 'Senator':
        return (
          <StrategyDashboard
            onOpenModule={openModule}
            onOpenAIAssistant={() => setShowAIAssistant(true)}
          />
        );
      case 'Regional Coordinator':
      case 'MP':
      case 'MCA':
      case 'Aspirant':
        return <RegionalDashboard onOpenModule={openModule} />;
      case 'Field Agent':
      case 'Agent':
        return <AgentDashboard onOpenModule={openModule} />;
      case 'Observer':
        return <ObserverDashboard />;
      default:
        return (
          <StrategyDashboard
            onOpenModule={openModule}
            onOpenAIAssistant={() => setShowAIAssistant(true)}
          />
        );
    }
  };

  const renderActiveModuleContent = () => {
    switch (currentModule) {
      case 'polling_stations':
        return <PollingStationIntelligence onClose={() => setCurrentModule('dashboard')} />;
      case 'agents':
        return <AgentManagement onClose={() => setCurrentModule('dashboard')} />;
      case 'surveys':
        return <SurveyEngine onClose={() => setCurrentModule('dashboard')} />;
      case 'field_reports':
        return <FieldReporting onClose={() => setCurrentModule('dashboard')} />;
      case 'mobilization':
        return <TeamMobilization onClose={() => setCurrentModule('dashboard')} />;
      case 'strategy':
        return <CampaignStrategy onClose={() => setCurrentModule('dashboard')} />;
      case 'tally_center':
        return <TallyCenter onClose={() => setCurrentModule('dashboard')} />;
      case 'ai_assistant':
        return (
          <StrategyDashboard
            onOpenModule={openModule}
            onOpenAIAssistant={() => setShowAIAssistant(true)}
          />
        );
      case 'dashboard':
      default:
        return renderDashboardByRole();
    }
  };

  const content = renderActiveModuleContent();

  return (
    <div className="app-container is-admin-shell">
      <AdminLayout
        currentModule={currentModule}
        adminPanel={adminPanel}
        onAdminPanelChange={setAdminPanel}
        onOpenModule={openModule}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
        onOpenGeographic={() => setCurrentModule('polling_stations')}
        showProfilePanel={showProfilePanel}
        onToggleProfilePanel={() => setShowProfilePanel((v) => !v)}
        onCloseProfilePanel={() => setShowProfilePanel(false)}
      >
        {content}
      </AdminLayout>

      {showAuditLogs && <AuditLogViewer onClose={() => setShowAuditLogs(false)} />}
      {showAIAssistant && <AIAssistantModal onClose={() => setShowAIAssistant(false)} />}

      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '550px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Election Day Tally & System Activity Stream</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNotifications(false)}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tallyResults.map((tally) => (
                <div key={tally.id} className="glass-card" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`status-pill ${tally.status.toLowerCase()}`}>{tally.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tally.submittedAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                    {tally.pollingStationName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Form 34A transmitted: Candidate A ({tally.candAVotes}), Candidate B ({tally.candBVotes}). Total: {tally.totalVotesCast}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ElectionCountdown variant="floating" />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
