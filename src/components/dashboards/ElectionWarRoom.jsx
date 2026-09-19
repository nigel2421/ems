// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Flagship Election Command War Room Component
// ====================================================================

import React, { useState } from 'react';
import './ElectionWarRoom.css';
import { getSystemMode, setSystemMode, SYSTEM_MODES, injectChaosScenario, CHAOS_SCENARIOS } from '../../utils/simulationEngine.js';
import { createBreakGlassRequest, approveBreakGlassRequest, isBreakGlassActive } from '../../utils/breakGlass.js';

export const ElectionWarRoom = ({ user, onSelectModule }) => {
  const [systemMode, setModeState] = useState(() => getSystemMode());
  const [breakGlassState, setBreakGlassState] = useState(null);
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [showChaosModal, setShowChaosModal] = useState(false);
  const [bgReason, setBgReason] = useState('');
  const [notification, setNotification] = useState(null);

  const isElevated = breakGlassState && isBreakGlassActive(breakGlassState);

  const handleToggleMode = () => {
    const nextMode = systemMode === SYSTEM_MODES.LIVE ? SYSTEM_MODES.SIMULATION : SYSTEM_MODES.LIVE;
    const res = setSystemMode(nextMode, user);
    setModeState(res.mode);
    setNotification(`System Mode switched to ${res.mode}`);
  };

  const handleRequestBreakGlass = () => {
    try {
      const req = createBreakGlassRequest(user || { id: 'USR-OPS', name: 'Ops Admin', role: 'Admin' }, bgReason);
      const approver = { id: 'USR-SEC', name: 'Security Chief', role: 'Super Admin' };
      const approved = approveBreakGlassRequest(req, approver);
      setBreakGlassState(approved);
      setShowBreakGlassModal(false);
      setBgReason('');
      setNotification(`🔴 BREAK-GLASS ELEVATION APPROVED for 15 mins by ${approver.name}`);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleInjectChaos = (scenarioType) => {
    try {
      const res = injectChaosScenario(scenarioType, 'PU-002938');
      setShowChaosModal(false);
      setNotification(`⚡ CHAOS SCENARIO INJECTED: ${res.payload.title}`);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="warroom-container">
      {/* Header Bar */}
      <header className="warroom-header">
        <div>
          <div className="warroom-title">
            <span>🏛️ CI-EMS ELECTION COMMAND WAR ROOM</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Operational Control & Real-time Exception Monitoring Engine</div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`mode-badge ${systemMode === SYSTEM_MODES.LIVE ? 'live' : 'simulation'}`}
            onClick={handleToggleMode}
          >
            MODE: {systemMode} (TAP TO SWITCH)
          </button>

          {!isElevated && (
            <button
              onClick={() => setShowBreakGlassModal(true)}
              style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🚨 Break-Glass Elevation
            </button>
          )}
        </div>
      </header>

      {/* Notification Bar */}
      {notification && (
        <div style={{ background: '#0284c7', color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: 700, fontSize: '0.85rem' }}>
          ✓ {notification}
        </div>
      )}

      {/* Break-Glass Active Elevation Alert Banner */}
      {isElevated && (
        <div className="breakglass-alert-banner">
          <div className="breakglass-alert-title">
            <span>🔴 ELEVATED ACCESS ACTIVE (Scope: Nairobi Campaign)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
            Reason: {breakGlassState.reason} • Approved by: {breakGlassState.approvedBy}
          </div>
        </div>
      )}

      {/* Zero Dead-KPI Operational Metrics */}
      <div className="warroom-metrics-grid">
        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('exception_cmd')}>
          <div className="metric-value" style={{ color: '#ef4444' }}>49</div>
          <div className="metric-label">AGENTS MISSING CHECK-IN</div>
          <div className="metric-hint">Open Missing Agent Queue →</div>
        </div>

        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('logistics_panel')}>
          <div className="metric-value" style={{ color: '#ef4444' }}>302</div>
          <div className="metric-label">UNCOVERED STATIONS</div>
          <div className="metric-hint">Resolve Uncovered Stations →</div>
        </div>

        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('exception_cmd')}>
          <div className="metric-value" style={{ color: '#ef4444' }}>8</div>
          <div className="metric-label">CRITICAL INCIDENTS</div>
          <div className="metric-hint">View Escalation Desk →</div>
        </div>

        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('evidence_review')}>
          <div className="metric-value" style={{ color: '#f59e0b' }}>433</div>
          <div className="metric-label">OUTSTANDING EVIDENCE UPLOADS</div>
          <div className="metric-hint">Inspect Evidence Vault →</div>
        </div>

        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('reconciliation_desk')}>
          <div className="metric-value" style={{ color: '#ef4444' }}>24</div>
          <div className="metric-label">RECONCILIATION DIFFERENCES</div>
          <div className="metric-hint">Open Reconciliation Desk →</div>
        </div>

        <div className="warroom-metric-card" onClick={() => onSelectModule && onSelectModule('system_health')}>
          <div className="metric-value" style={{ color: '#10b981' }}>3,116</div>
          <div className="metric-label">RECONCILED STATIONS</div>
          <div className="metric-hint">Inspect Reconciled Data →</div>
        </div>
      </div>

      {/* Selected Station Inspector & Bounded Command Actions */}
      <div className="command-inspector-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#38bdf8' }}>STATION COMMAND INSPECTOR</h3>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Highridge Primary School • Stream 03 (Code: 002938)</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
            AGENT CHECKED IN
          </div>
        </div>

        <div className="command-actions-grid">
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('communications_cmd')}>
            📞 Contact Agent
          </button>
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('communications_cmd')}>
            📞 Contact Supervisor
          </button>
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('exception_cmd')}>
            🚨 Open Incident
          </button>
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('field_pwa')}>
            ⏱ View Station Timeline
          </button>
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('evidence_review')}>
            📄 View Form Evidence
          </button>
          <button className="cmd-btn" onClick={() => onSelectModule && onSelectModule('logistics_panel')}>
            📋 View Assignment
          </button>
        </div>
      </div>

      {systemMode === SYSTEM_MODES.SIMULATION && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '14px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b' }}>⚡ ELECTION-DAY SIMULATION ENGINE</h4>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 12px 0' }}>
            Inject operational chaos scenarios to test system resilience and rehearsal procedures. Simulation data is isolated from LIVE production stores.
          </p>
          <button
            onClick={() => setShowChaosModal(true)}
            style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            Inject Operational Chaos Scenario
          </button>
        </div>
      )}

      {/* Break-Glass Modal */}
      {showBreakGlassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '2px solid #ef4444', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>🚨 REQUEST BREAK-GLASS ELEVATED ACCESS</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Break-Glass access grants temporary 15-minute administrative elevation for high-priority operational emergencies. All actions are cryptographically hash-chained in the audit ledger.
            </p>
            <textarea
              rows="3"
              placeholder="Enter detailed reason (min 10 chars)..."
              value={bgReason}
              onChange={e => setBgReason(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowBreakGlassModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRequestBreakGlass} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Request Access</button>
            </div>
          </div>
        </div>
      )}

      {/* Chaos Scenario Injection Modal */}
      {showChaosModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '2px solid #f59e0b', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b' }}>⚡ INJECT SIMULATION SCENARIO</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="cmd-btn" onClick={() => handleInjectChaos(CHAOS_SCENARIOS.NETWORK_OUTAGE)}>
                📡 Simulate 3G/LTE Base Station Network Outage
              </button>
              <button className="cmd-btn" onClick={() => handleInjectChaos(CHAOS_SCENARIOS.DUPLICATE_SUBMISSION)}>
                🔄 Simulate Duplicate Offline Retried Transmission
              </button>
              <button className="cmd-btn" onClick={() => handleInjectChaos(CHAOS_SCENARIOS.RECONCILIATION_DIFFERENCE)}>
                ⚖️ Simulate Candidate Total Variance (+3 votes)
              </button>
              <button className="cmd-btn" onClick={() => handleInjectChaos(CHAOS_SCENARIOS.CRITICAL_INCIDENT)}>
                🚨 Simulate PO Verification SLA Breach
              </button>
            </div>
            <button onClick={() => setShowChaosModal(false)} style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#334155', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
