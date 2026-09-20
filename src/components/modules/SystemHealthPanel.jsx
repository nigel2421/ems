// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Platform System Health & Telemetry Component
// ====================================================================

import React from 'react';

export const SystemHealthPanel = () => {
  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>⚙️ PLATFORM SYSTEM HEALTH & TELEMETRY</h2>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Infrastructure Status, Queue Depths & Observability Telemetry</div>
      </header>

      {/* Services Health Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>API GATEWAY</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>● Healthy</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>p95 Latency: 182ms</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>EVIDENCE OBJECT STORAGE</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>● Healthy</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Queue Depth: 43 items</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>OCR QUEUE WORKER</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>● Healthy</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Backlog: 31 forms</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>AI PROVIDER (GEMINI)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>◐ Degraded Rate</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Advisory Mode Only</div>
        </div>
      </div>

      {/* Telemetry Metrics Panel */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#38bdf8' }}>TELEMETRY METRICS SUMMARY</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
            <div>SMS Gateway Queue: <strong style={{ color: '#fff' }}>118 queued</strong></div>
            <div>Offline Client Synced: <strong style={{ color: '#10b981' }}>241 connected</strong></div>
          </div>
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
            <div>Failed Sync Retries: <strong style={{ color: '#f59e0b' }}>7 retries</strong></div>
            <div>Global System Error Rate: <strong style={{ color: '#10b981' }}>0.12%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
