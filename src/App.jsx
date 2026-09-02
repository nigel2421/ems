import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { GovernorDashboard } from './components/dashboards/GovernorDashboard';
import { MPDashboard } from './components/dashboards/MPDashboard';
import { MCADashboard } from './components/dashboards/MCADashboard';
import { AspirantDashboard } from './components/dashboards/AspirantDashboard';
import { AgentPortal } from './components/dashboards/AgentPortal';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { GeographicMapper } from './components/modules/GeographicMapper';
import { MismatchDetector } from './components/modules/MismatchDetector';
import { AuditLogViewer } from './components/modules/AuditLogViewer';
import { LoginModal } from './components/auth/LoginModal';
import { Bell, X } from 'lucide-react';

const MainAppContent = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { submissions } = useData();

  const [showGeographic, setShowGeographic] = useState(false);
  const [showMismatch, setShowMismatch] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // If user is not authenticated, render Login Modal
  if (!isAuthenticated || !currentUser) {
    return <LoginModal />;
  }

  // Render Dashboard by Role
  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'Governor':
      case 'Senator':
        return <GovernorDashboard onOpenMismatch={() => setShowMismatch(true)} onOpenGeographic={() => setShowGeographic(true)} />;
      case 'MP':
        return <MPDashboard />;
      case 'MCA':
        return <MCADashboard />;
      case 'Aspirant':
        return <AspirantDashboard />;
      case 'Agent':
        return <AgentPortal />;
      case 'Admin':
        return <AdminDashboard onOpenAuditLogs={() => setShowAuditLogs(true)} onOpenGeographic={() => setShowGeographic(true)} />;
      default:
        return <GovernorDashboard onOpenMismatch={() => setShowMismatch(true)} onOpenGeographic={() => setShowGeographic(true)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar 
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
      />

      {/* Active Dashboard View */}
      <main className="main-content">
        {renderDashboard()}
      </main>

      {/* Global Modals */}
      {showGeographic && <GeographicMapper onClose={() => setShowGeographic(false)} />}
      {showMismatch && <MismatchDetector onClose={() => setShowMismatch(false)} />}
      {showAuditLogs && <AuditLogViewer onClose={() => setShowAuditLogs(false)} />}

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div 
            className="modal-content"
            style={{ maxWidth: '550px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>System Activity Notifications</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNotifications(false)}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {submissions.map(sub => (
                <div key={sub.id} className="glass-card" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`status-pill ${sub.status.toLowerCase()}`}>{sub.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                    {sub.pollingStationName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {sub.agentName} uploaded Form 34A evidence ({sub.evidence.compressedSizeKb}KB).
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
