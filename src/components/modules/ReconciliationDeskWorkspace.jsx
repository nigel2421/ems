// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Reconciliation Desk Workspace Component
// ====================================================================

import React, { useState } from 'react';
import { evaluateFieldLevelReconciliation, createReconciliationCase } from '../../utils/evidenceVault.js';

export const ReconciliationDeskWorkspace = () => {
  const [selectedCase, setSelectedCase] = useState({
    caseId: 'RC-2027-00184',
    stationName: 'Highridge Primary School - Stream 03',
    contestName: 'Presidential Election',
    agentReported: { candAVotes: 421, candBVotes: 318, candCVotes: 44, rejectedVotes: 7, totalVotesCast: 790 },
    campaignVerified: { candAVotes: 421, candBVotes: 318, candCVotes: 44, rejectedVotes: 7, totalVotesCast: 790 },
    officialReference: { candAVotes: 421, candBVotes: 318, candCVotes: 41, rejectedVotes: 7, totalVotesCast: 787 },
    status: 'UNDER_REVIEW',
    notes: 'Official reference shows candidate C as 41 vs agent/campaign verified 44'
  });

  const reconciliationEval = evaluateFieldLevelReconciliation(
    selectedCase.agentReported,
    selectedCase.campaignVerified,
    selectedCase.officialReference
  );

  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>⚖️ RECONCILIATION DESK</h2>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Field-Level 3-Way Source Comparison & Anomaly Investigation</div>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
          STATUS: {reconciliationEval.label}
        </div>
      </header>

      {/* Case Overview Panel */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#38bdf8' }}>CASE: {selectedCase.caseId} ({selectedCase.stationName})</h3>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>Contest: {selectedCase.contestName}</div>

        {/* 3-Way Field Comparison Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px' }}>FIELD / CANDIDATE</th>
              <th style={{ padding: '10px' }}>AGENT REPORTED</th>
              <th style={{ padding: '10px' }}>CAMPAIGN VERIFIED</th>
              <th style={{ padding: '10px' }}>OFFICIAL REFERENCE</th>
              <th style={{ padding: '10px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '10px', fontWeight: 600 }}>Candidate A</td>
              <td style={{ padding: '10px' }}>{selectedCase.agentReported.candAVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.campaignVerified.candAVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.officialReference.candAVotes}</td>
              <td style={{ padding: '10px', color: '#10b981', fontWeight: 700 }}>✓ MATCH</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '10px', fontWeight: 600 }}>Candidate B</td>
              <td style={{ padding: '10px' }}>{selectedCase.agentReported.candBVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.campaignVerified.candBVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.officialReference.candBVotes}</td>
              <td style={{ padding: '10px', color: '#10b981', fontWeight: 700 }}>✓ MATCH</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(245, 158, 11, 0.1)' }}>
              <td style={{ padding: '10px', fontWeight: 700, color: '#f59e0b' }}>Candidate C</td>
              <td style={{ padding: '10px' }}>{selectedCase.agentReported.candCVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.campaignVerified.candCVotes}</td>
              <td style={{ padding: '10px', fontWeight: 700, color: '#ef4444' }}>{selectedCase.officialReference.candCVotes}</td>
              <td style={{ padding: '10px', color: '#f59e0b', fontWeight: 700 }}>⚠ DIFFERENCE (+3)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '10px', fontWeight: 600 }}>Rejected Votes</td>
              <td style={{ padding: '10px' }}>{selectedCase.agentReported.rejectedVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.campaignVerified.rejectedVotes}</td>
              <td style={{ padding: '10px' }}>{selectedCase.officialReference.rejectedVotes}</td>
              <td style={{ padding: '10px', color: '#10b981', fontWeight: 700 }}>✓ MATCH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Investigation Notes & Case Resolution Controls */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>DISCREPANCY INVESTIGATION & RESOLUTION</h3>
        <textarea
          rows="3"
          value={selectedCase.notes}
          onChange={e => setSelectedCase({ ...selectedCase, notes: e.target.value })}
          style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button style={{ padding: '10px 18px', background: '#334155', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Escalate to Legal Desk
          </button>
          <button style={{ padding: '10px 18px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
            Record Resolution & Close Case
          </button>
        </div>
      </div>
    </div>
  );
};
