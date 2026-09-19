// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.5)
// Scope-Inherited "Action Required" Operations Queue Workspace Component
// ====================================================================

import React, { useState } from 'react';
import { getUserScope } from '../../utils/rbac.js';

export const OperationsQueue = ({ user }) => {
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const scope = getUserScope(user);

  const queueItems = [
    { id: 'TSK-001', category: 'INCIDENT', title: 'BVR kit battery failure at Stream 03', severity: 'CRITICAL', location: 'Parklands/Highridge', assignedTo: 'Ward Coordinator', slaMin: 4 },
    { id: 'TSK-002', category: 'MISSING_AGENT', title: 'Agent missing check-in at T-15 mins', severity: 'CRITICAL', location: 'Kitisuru Primary', assignedTo: 'Polling Coordinator', slaMin: 18 },
    { id: 'TSK-003', category: 'EVIDENCE_REVIEW', title: 'Form 34A stamp area unverified', severity: 'HIGH', location: 'Westlands Primary', assignedTo: 'Reviewer Desk', slaMin: 12 },
    { id: 'TSK-004', category: 'RECONCILIATION', title: 'Candidate B total difference (+3 votes)', severity: 'REVIEW', location: 'Highridge Primary', assignedTo: 'Tally Supervisor', slaMin: 35 }
  ];

  const filteredItems = queueItems.filter(item => {
    if (selectedSeverity === 'ALL') return true;
    return item.severity === selectedSeverity;
  });

  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>📋 MY OPERATIONS QUEUE (ACTION REQUIRED)</h2>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scope-Inherited Task Consolidation ({scope.level}: {scope.name})</div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSelectedSeverity('ALL')}
            style={{ padding: '6px 12px', borderRadius: '6px', background: selectedSeverity === 'ALL' ? '#0284c7' : '#1e293b', border: '1px solid #334155', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            All ({queueItems.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('CRITICAL')}
            style={{ padding: '6px 12px', borderRadius: '6px', background: selectedSeverity === 'CRITICAL' ? '#ef4444' : '#1e293b', border: '1px solid #334155', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🔴 Critical (2)
          </button>
          <button
            onClick={() => setSelectedSeverity('HIGH')}
            style={{ padding: '6px 12px', borderRadius: '6px', background: selectedSeverity === 'HIGH' ? '#f59e0b' : '#1e293b', border: '1px solid #334155', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🟠 High (1)
          </button>
        </div>
      </header>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: item.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : item.severity === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: item.severity === 'CRITICAL' ? '#ef4444' : item.severity === 'HIGH' ? '#f59e0b' : '#38bdf8'
                }}>
                  {item.severity}
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.title}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {item.location} • Assigned to: {item.assignedTo} • Age: {item.slaMin} mins
              </div>
            </div>

            <button style={{ padding: '8px 14px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              Action Task →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
