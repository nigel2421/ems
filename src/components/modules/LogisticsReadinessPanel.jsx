// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Logistics Readiness & D-Day Operations Workspace Component
// ====================================================================

import React, { useState } from 'react';
import { calculateReadinessScore, evaluateReadinessDeadlines, getRegionalReadinessSummary, READINESS_DEADLINES } from '../../utils/logisticsReadiness.js';

export const LogisticsReadinessPanel = () => {
  const [selectedPhase, setSelectedPhase] = useState('D_7');

  const deadlineEval = evaluateReadinessDeadlines(selectedPhase, {
    agentsPct: 98,
    equipmentPct: 94,
    deploymentPct: 91,
    communicationPct: 100,
    trainingPct: 97,
    powerPct: 89
  });

  const regionalData = getRegionalReadinessSummary();

  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>📦 LOGISTICS & READINESS COMMAND</h2>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Election Equipment, Agent Kits & D-Day Deadline Operations</div>
        </div>
        <div style={{ background: deadlineEval.isTargetMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', border: `1px solid ${deadlineEval.isTargetMet ? '#10b981' : '#f59e0b'}`, color: deadlineEval.isTargetMet ? '#10b981' : '#f59e0b', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
          {deadlineEval.phase}: {deadlineEval.actualPct}% READINESS (TARGET: {deadlineEval.targetPct}%)
        </div>
      </header>

      {/* D-Day Deadline Phase Selector */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {Object.keys(READINESS_DEADLINES).map(key => {
          const item = READINESS_DEADLINES[key];
          const isSelected = selectedPhase === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedPhase(key)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: isSelected ? '#0284c7' : '#1e293b',
                border: '1px solid #334155',
                color: isSelected ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {item.phase} ({item.targetPct}%)
            </button>
          );
        })}
      </div>

      {/* Milestone Assessment Alert */}
      <div style={{ background: deadlineEval.isTargetMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${deadlineEval.isTargetMet ? '#10b981' : '#f59e0b'}`, padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600, color: deadlineEval.isTargetMet ? '#10b981' : '#f59e0b' }}>
        {deadlineEval.statusMessage}
      </div>

      {/* Equipment & Kit Readiness Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>AGENTS CONFIRMED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>98%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ 4,613 / 4,700 Assigned</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>AGENT KITS DISPATCHED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>94%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Badges & Tally Sheets Ready</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>POWER BANKS & PHONES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>89%</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⚠ 517 Backup Chargers Needed</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>TRANSPORT LOGISTICS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>91%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Vehicles Assigned</div>
        </div>
      </div>

      {/* Regional Readiness Summary Table */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#38bdf8' }}>REGIONAL READINESS BREAKDOWN</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px' }}>COUNTY</th>
              <th style={{ padding: '10px' }}>AGENTS %</th>
              <th style={{ padding: '10px' }}>EQUIPMENT %</th>
              <th style={{ padding: '10px' }}>OVERALL %</th>
              <th style={{ padding: '10px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {regionalData.map((reg, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', fontWeight: 700 }}>{reg.name}</td>
                <td style={{ padding: '10px' }}>{reg.agentsPct}%</td>
                <td style={{ padding: '10px' }}>{reg.equipmentPct}%</td>
                <td style={{ padding: '10px', fontWeight: 700, color: '#38bdf8' }}>{reg.overall}%</td>
                <td style={{ padding: '10px', color: reg.status === 'OPTIMAL' ? '#10b981' : reg.status === 'ON_TRACK' ? '#38bdf8' : '#f59e0b', fontWeight: 700 }}>
                  {reg.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
