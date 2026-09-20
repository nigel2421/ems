import React, { useState } from 'react';

export default function ExecutiveBriefing({ userRole = 'SUPER_ADMIN' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefingText, setBriefingText] = useState(
    'EXECUTIVE SUMMARY (09:00 EAT):\n• Polling Station Agent Deployment: 98.4% (45,489 / 46,229 stations reported active).\n• Form 34A Receipt Rate: 84.1% uploaded to Evidence Vault.\n• Reconciliation Status: 31,500 stations locked with 0 multi-source variance.\n• Critical Exceptions: 3 open incident cases requiring National Command intervention.\n\nAI ADVISORY NOTICE: AI outputs are non-authoritative analytical summaries derived strictly from verified database records. AI cannot modify tally counts or approve evidence.'
  );

  const handleRefreshBriefing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBriefingText(
        `EXECUTIVE SUMMARY (${new Date().toLocaleTimeString()} EAT):\n• Agent Deployment: 99.1% across 47 Counties.\n• Statutory Form Receipt Rate: 89.6% across 290 Constituencies.\n• Reconciled Parallel Tally Count: 34,200 stations verified.\n• SOC Security Status: 0 critical breaches, 1 active break-glass session.\n\nAI ADVISORY NOTICE: AI outputs are non-authoritative analytical summaries derived strictly from verified database records. AI cannot modify tally counts or approve evidence.`
      );
      setIsGenerating(false);
    }, 600);
  };

  const [reviewStatus, setReviewStatus] = useState('HUMAN_REVIEWED');
  const [showSourceMetrics, setShowSourceMetrics] = useState(false);

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Executive Command Briefing</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            High-level operational intelligence synthesis for Campaign Leadership & Candidate Command.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowSourceMetrics(!showSourceMetrics)}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '10px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📊 {showSourceMetrics ? 'Hide Source Metrics' : 'View Source Metrics'}
          </button>
          <button
            onClick={handleRefreshBriefing}
            disabled={isGenerating}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? 'Synthesizing Verified Data...' : '🔄 Refresh AI Briefing'}
          </button>
        </div>
      </div>

      {/* AI Provenance Audit Panel */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, color: '#38bdf8' }}>AI ASSISTED BRIEFING PROVENANCE</h4>
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#065f46', color: '#6ee7b7', fontSize: '11px', fontWeight: 'bold' }}>
            REVIEW STATUS: {reviewStatus}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
          <div><strong>Snapshot ID:</strong> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>SP-829302</span></div>
          <div><strong>Model:</strong> Enterprise RAG Engine v3.0</div>
          <div><strong>Data Sources:</strong> ✓ Agent coverage ✓ Incidents ✓ Logistics ✓ Telemetry</div>
          <div><strong>Excluded Data:</strong> ✓ PII Voter Records ✓ Raw Credentials</div>
        </div>
      </div>

      {/* Optional Source Metrics Drawer */}
      {showSourceMetrics && (
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Verified Agent Count</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>45,489 Stations</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Form 34A Vault Images</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>38,890 Forms</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Reconciled Parallel Lock</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>31,500 Stations</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Open Incident Queue</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>3 Critical Cases</div>
          </div>
        </div>
      )}

      {/* Executive Briefing Container */}
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Latest Synthesized Briefing Narrative</h3>
        <pre
          style={{
            backgroundColor: '#0f172a',
            padding: '20px',
            borderRadius: '8px',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            border: '1px solid #334155'
          }}
        >
          {briefingText}
        </pre>
      </div>
    </div>
  );
}

