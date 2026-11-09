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
import { StrategyTeamModule } from './components/modules/StrategyTeamModule';
import { TallyCenter } from './components/modules/TallyCenter';
import { AIAssistantModal } from './components/modules/AIAssistantModal';
import { AuditLogViewer } from './components/modules/AuditLogViewer';
import { ElectionCountdown } from './components/modules/ElectionCountdown';
import { FieldAgentPWA } from './components/field/FieldAgentPWA';
import { ExceptionCommandCenter } from './components/dashboards/ExceptionCommandCenter';
import { ElectionWarRoom } from './components/dashboards/ElectionWarRoom';
import { HierarchicalWarRoom } from './components/dashboards/HierarchicalWarRoom';
import { OperationsQueue } from './components/modules/OperationsQueue';
import { EvidenceReviewDesk } from './components/modules/EvidenceReviewDesk';
import { ReconciliationDeskWorkspace } from './components/modules/ReconciliationDeskWorkspace';
import { CommunicationsCommand } from './components/modules/CommunicationsCommand';
import { LogisticsReadinessPanel } from './components/modules/LogisticsReadinessPanel';
import { SystemHealthPanel } from './components/modules/SystemHealthPanel';
import TallyOperationsRoom from './components/modules/TallyOperationsRoom';
import SecurityOperations from './components/modules/SecurityOperations';
import PrivacyOperations from './components/modules/PrivacyOperations';
import ExecutiveBriefing from './components/modules/ExecutiveBriefing';
import UnifiedOperationsQueue from './components/modules/UnifiedOperationsQueue';
import ElectionSimulationControl from './components/modules/ElectionSimulationControl';
import ProductionReadinessBoard from './components/modules/ProductionReadinessBoard';
import { ElectoralMapRoom } from './components/modules/ElectoralMapRoom';
import { LoginModal } from './components/auth/LoginModal';
import { IdleTimeoutModal } from './components/auth/IdleTimeoutModal';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useModuleRouter, resolveModuleFromHash } from './hooks/useModuleRouter';
import { updatePageMetadata } from './utils/seoManager';
import { OfflineSyncBanner } from './components/common/OfflineSyncBanner';
import { Bell, X } from 'lucide-react';

const MainAppContent = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { tallyResults } = useData();

  // Initialize module from initial URL hash so direct links and crawlers open immediately to target page
  const [currentModule, setCurrentModule] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return resolveModuleFromHash(window.location.hash);
    }
    return 'dashboard';
  });
  const [adminPanel, setAdminPanel] = useState('overview');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Sync route and browser history back/forward buttons
  const { navigateToModule } = useModuleRouter(currentModule, (newMod) => {
    setShowProfilePanel(false);
    setCurrentModule(newMod);
  });

  // Dynamically update document title, description, canonical and OpenGraph meta tags on navigation
  React.useEffect(() => {
    updatePageMetadata(currentModule);
  }, [currentModule]);

  // Inactivity timeout: 15 min limit with 13 min warning
  const { phase, secondsLeft, stayActive } = useIdleTimeout({
    isAuthenticated,
    onTimeout: () => logout('inactivity')
  });

  const [mapFilters, setMapFilters] = useState(null);

  if (!isAuthenticated || !currentUser) {
    return <LoginModal />;
  }

  const openModule = (mod, state) => {
    if (mod === 'ai_assistant') {
      setShowAIAssistant(true);
      return;
    }
    if (mod === 'interactive_map' && state) {
      setMapFilters(state);
    }
    setShowProfilePanel(false);
    setCurrentModule(mod);
    navigateToModule(mod);
    if (mod === 'dashboard') {
      setAdminPanel((prev) => prev || 'overview');
    }
  };

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'Super Admin':
      case 'Admin':
        return (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '580px', margin: '4rem auto', background: 'var(--bg-surface, #1e293b)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.75rem' }}>
              Operations Console Relocated
            </h2>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Administrative tools and system governance functions are exclusively available on the dedicated Kuratech Operations Console subdomain.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/admin.html"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Launch Admin Console (/admin.html)
              </a>
              <a
                href="https://ops-konsole.kuratech.site"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  background: '#0284c7',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                Open ops-konsole.kuratech.site
              </a>
            </div>
          </div>
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
        return <FieldAgentPWA user={currentUser} onBackToDashboard={() => openModule('dashboard')} />;
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
      case 'production_readiness':
        return <ProductionReadinessBoard userRole={currentUser?.role} />;
      case 'ops_queue':
        return <UnifiedOperationsQueue user={currentUser} />;
      case 'simulation_ctrl':
        return <ElectionSimulationControl userRole={currentUser?.role} />;

      case 'tally_ops_room':
        return <TallyOperationsRoom userScope={currentUser?.jurisdictionScope} />;
      case 'security_ops':
        return <SecurityOperations userRole={currentUser?.role} />;
      case 'privacy_ops':
        return <PrivacyOperations />;
      case 'executive_briefing':
        return <ExecutiveBriefing userRole={currentUser?.role} />;
      case 'hierarchical_warroom':
        return <HierarchicalWarRoom user={currentUser} onSelectModule={(mod) => setCurrentModule(mod)} />;


      case 'war_room':
        return <ElectionWarRoom user={currentUser} onSelectModule={(mod) => setCurrentModule(mod)} />;
      case 'field_pwa':
        return <FieldAgentPWA user={currentUser} onBackToDashboard={() => setCurrentModule('dashboard')} />;
      case 'exception_cmd':
        return <ExceptionCommandCenter user={currentUser} onSelectModule={(mod) => setCurrentModule(mod)} />;
      case 'evidence_review':
        return <EvidenceReviewDesk />;
      case 'reconciliation_desk':
        return <ReconciliationDeskWorkspace />;
      case 'communications_cmd':
      case 'communication':
        return <CommunicationsCommand user={currentUser} />;
      case 'logistics_panel':
      case 'logistics':
        return <LogisticsReadinessPanel />;
      case 'system_health':
      case 'health':
        return <SystemHealthPanel />;
      case 'polling_stations':
        return <PollingStationIntelligence onOpenModule={openModule} onClose={() => setCurrentModule('dashboard')} />;
      case 'interactive_map':
        return <ElectoralMapRoom initialCountyId={mapFilters?.countyId} initialConstituencyId={mapFilters?.constituencyId} />;
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
      case 'strategy_team':
        return <StrategyTeamModule onClose={() => setCurrentModule('dashboard')} />;
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
      <OfflineSyncBanner />
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

      {phase === 'warning' && (
        <IdleTimeoutModal
          secondsLeft={secondsLeft}
          onStayActive={stayActive}
          onLogout={() => logout('manual')}
        />
      )}

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
