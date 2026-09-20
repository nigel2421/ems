// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Exception-Driven Command Center Workspace Component
// ====================================================================

import React, { useState } from 'react';
import './ExceptionCommandCenter.css';
import { getUserScope } from '../../utils/rbac.js';

export const ExceptionCommandCenter = ({ user, onSelectModule }) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('All');
  const [activeFilter, setActiveFilter] = useState(null);

  const scope = getUserScope(user);

  const exceptions = {
    criticalIncidents: [
      { id: 'INC-001', location: 'Parklands/Highridge • Stream 03', title: 'Presiding officer requested verification delay', severity: 'CRITICAL', time: '11:18' },
      { id: 'INC-002', location: 'Kitisuru Primary • Stream 01', title: 'Ballot paper shortfall reported by agent', severity: 'CRITICAL', time: '10:45' }
    ],
    missingAgents: [
      { id: 'AGT-104', location: 'Mountain View Centre • Stream 02', name: 'Field Agent 01', status: 'UNREGISTERED_CHECKIN', slaMin: 42 },
      { id: 'AGT-109', location: 'Kangemi High • Stream 04', name: 'Field Agent 02', status: 'UNREGISTERED_CHECKIN', slaMin: 28 }
    ],
    pendingUploads: [
      { id: 'UPL-881', location: 'Westlands Primary • Stream 01', form: 'Form 34A', delayedMin: 38 },
      { id: 'UPL-884', location: 'Kilimani School • Stream 02', form: 'Form 34A', delayedMin: 34 }
    ],
    conflicts: [
      { id: 'CONF-01', location: 'Highridge Primary • Stream 03', contest: 'Presidential Election', diff: 'Candidate B +3' },
      { id: 'CONF-02', location: 'Lavington Primary • Stream 01', contest: 'Gubernatorial Race', diff: 'Candidate A +12' }
    ]
  };

  return (
    <div className="exception-cmd-container">
      <header className="exception-cmd-header">
        <div>
          <div className="exception-cmd-title">ELECTION COMMAND OPERATIONS</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Exception-Driven Operational Intervention Dashboard</div>
        </div>
        <div className="scope-badge">
          <span>SCOPE: {scope.level} ({scope.name})</span>
        </div>
      </header>

      {/* KPI Exception Cards (Zero Dead-KPI Principle) */}
      <div className="exception-kpi-grid">
        <div className="exception-kpi-card critical" onClick={() => setActiveFilter('incidents')}>
          <div className="kpi-count" style={{ color: '#ef4444' }}>
            <span>🚨 8</span>
          </div>
          <div className="kpi-label">CRITICAL INCIDENTS</div>
          <div className="kpi-drilldown-hint">Click to inspect list →</div>
        </div>

        <div className="exception-kpi-card warning" onClick={() => setActiveFilter('missingAgents')}>
          <div className="kpi-count" style={{ color: '#f59e0b' }}>
            <span>👤 17</span>
          </div>
          <div className="kpi-label">MISSING AGENT CHECK-INS</div>
          <div className="kpi-drilldown-hint">Click to inspect list →</div>
        </div>

        <div className="exception-kpi-card warning" onClick={() => setActiveFilter('pendingUploads')}>
          <div className="kpi-count" style={{ color: '#f59e0b' }}>
            <span>📷 43</span>
          </div>
          <div className="kpi-label">UPLOADS PENDING &gt;30 MIN</div>
          <div className="kpi-drilldown-hint">Click to inspect list →</div>
        </div>

        <div className="exception-kpi-card review" onClick={() => setActiveFilter('conflicts')}>
          <div className="kpi-count" style={{ color: '#eab308' }}>
            <span>⚖️ 24</span>
          </div>
          <div className="kpi-label">RECONCILIATION CASES</div>
          <div className="kpi-drilldown-hint">Click to inspect desk →</div>
        </div>

        <div className="exception-kpi-card good">
          <div className="kpi-count" style={{ color: '#10b981' }}>
            <span>🟢 93.7%</span>
          </div>
          <div className="kpi-label">STATION COVERAGE RATE</div>
          <div className="kpi-drilldown-hint">All 47 Counties Active</div>
        </div>
      </div>

      {/* Actionable Exception Workspaces */}
      <div className="exception-workspace-grid">
        {/* Critical Operational Incidents */}
        <div className="exception-panel">
          <div className="panel-title">
            <span>🚨 CRITICAL INCIDENTS REQUIRING ACTION</span>
            <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>SLA BREACH ALERT</span>
          </div>
          <div className="exception-list">
            {exceptions.criticalIncidents.map(inc => (
              <div key={inc.id} className="exception-item">
                <div>
                  <div className="exception-info-title">{inc.title}</div>
                  <div className="exception-info-meta">{inc.location} • Reported at {inc.time}</div>
                </div>
                <button
                  className="btn-action-sm"
                  style={{ background: '#ef4444' }}
                  onClick={() => onSelectModule && onSelectModule('communication')}
                >
                  Escalate
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Agent Check-ins & SLA Handover */}
        <div className="exception-panel">
          <div className="panel-title">
            <span>👤 AGENT CHECK-IN SLA BREACHES</span>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>HANDOVER REQUIRED</span>
          </div>
          <div className="exception-list">
            {exceptions.missingAgents.map(agt => (
              <div key={agt.id} className="exception-item">
                <div>
                  <div className="exception-info-title">{agt.name} ({agt.id})</div>
                  <div className="exception-info-meta">{agt.location} • Overdue by {agt.slaMin} mins</div>
                </div>
                <button
                  className="btn-action-sm"
                  style={{ background: '#f59e0b' }}
                  onClick={() => onSelectModule && onSelectModule('logistics')}
                >
                  Dispatch
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliations & Discrepancies Desk Link */}
        <div className="exception-panel">
          <div className="panel-title">
            <span>⚖️ ACTIVE RECONCILIATION DISCREPANCIES</span>
            <span style={{ fontSize: '0.75rem', color: '#eab308' }}>3-WAY DIFFERENCE</span>
          </div>
          <div className="exception-list">
            {exceptions.conflicts.map(cnf => (
              <div key={cnf.id} className="exception-item">
                <div>
                  <div className="exception-info-title">{cnf.contest}: {cnf.diff}</div>
                  <div className="exception-info-meta">{cnf.location}</div>
                </div>
                <button
                  className="btn-action-sm"
                  onClick={() => onSelectModule && onSelectModule('reconciliation')}
                >
                  Open Desk
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Telemetry Shortcut */}
        <div className="exception-panel">
          <div className="panel-title">
            <span>⚙️ SYSTEM & TELEMETRY HEALTH</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>OPERATIONAL</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <div>• API Latency (p95): <strong style={{ color: '#fff' }}>182 ms</strong></div>
            <div>• Evidence Queue Depth: <strong style={{ color: '#fff' }}>43 items</strong></div>
            <div>• OCR Backlog: <strong style={{ color: '#fff' }}>31 forms</strong></div>
            <div>• System Error Rate: <strong style={{ color: '#10b981' }}>0.12%</strong></div>
          </div>
          <button
            className="btn-action-sm"
            style={{ marginTop: '16px', width: '100%', background: '#334155' }}
            onClick={() => onSelectModule && onSelectModule('health')}
          >
            Inspect System Health Telemetry →
          </button>
        </div>
      </div>
    </div>
  );
};
