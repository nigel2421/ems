import React, { useState } from 'react';

export const TALLY_PIPELINE_STAGES = [
  { id: 'EXPECTED', label: '1. Expected', desc: 'Polling stations opened' },
  { id: 'AGENT_REPORTED', label: '2. Agent Reported', desc: 'Agent initial count submission' },
  { id: 'EVIDENCE_RECEIVED', label: '3. Evidence Received', desc: 'Form photo/scan uploaded to Vault' },
  { id: 'AUTOMATED_VALIDATED', label: '4. Auto Validated', desc: 'Checksum & math verification passed' },
  { id: 'HUMAN_VERIFIED', label: '5. Human Verified', desc: 'Tally clerk maker-checker approved' },
  { id: 'CAMPAIGN_VERIFIED', label: '6. Campaign Verified', desc: 'County coordinator signed off' },
  { id: 'REFERENCE_AVAILABLE', label: '7. Reference Available', desc: 'Public / IEBC reference cross-checked' },
  { id: 'RECONCILED', label: '8. Reconciled', desc: 'Final multi-source 0-mismatch lock' }
];

export default function TallyOperationsRoom({ userScope }) {
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Sample stage pipeline counts for demonstration
  const stageCounts = {
    EXPECTED: 46229,
    AGENT_REPORTED: 41200,
    EVIDENCE_RECEIVED: 38950,
    AUTOMATED_VALIDATED: 37800,
    HUMAN_VERIFIED: 35100,
    CAMPAIGN_VERIFIED: 34200,
    REFERENCE_AVAILABLE: 32000,
    RECONCILED: 31500
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Permanent Disclaimer Badge */}
      <div
        id="tally-disclaimer-badge"
        style={{
          backgroundColor: '#991b1b',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '14px',
          letterSpacing: '1px',
          textAlign: 'center',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '2px solid #ef4444',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}
      >
        ⚠️ CAMPAIGN PARALLEL TALLY — NOT AN OFFICIAL DECLARATION
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Tally Operations Room</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Real-time statutory form tally pipeline, reconciliation status, and verification progress.
          </p>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', color: '#38bdf8' }}>
          Scope: {userScope?.level || 'NATIONAL'} ({userScope?.county || 'ALL'})
        </div>
      </div>

      {/* Pipeline Stage Grid */}
      <h3 style={{ color: '#cbd5e1', marginBottom: '16px' }}>Tally Verification Pipeline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {TALLY_PIPELINE_STAGES.map((stage) => {
          const isSelected = selectedStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          const percentage = ((count / stageCounts.EXPECTED) * 100).toFixed(1);

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              style={{
                backgroundColor: isSelected ? '#1e3a8a' : '#1e293b',
                border: isSelected ? '2px solid #3b82f6' : '1fr solid #334155',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{stage.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: '8px 0 4px 0' }}>
                {count.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#38bdf8' }}>{percentage}% of total</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{stage.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Detailed Operations View */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>
          Pipeline Stage Details: {selectedStage === 'ALL' ? 'All Stations' : selectedStage}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          All votes captured in CI-EMS 2.6 are subject to strict 3-source reconciliation (Agent Field Entry, Statutory Form Image OCR/Vault, and Reference Verification). Results remain internal parallel tally estimates until official declaration by statutory election authority.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>3-Source Reconciled</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>31,500 Stations</div>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Reconciliation Gaps / Pending Review</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>2,700 Stations</div>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Disputed / Critical Exceptions</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>420 Stations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
