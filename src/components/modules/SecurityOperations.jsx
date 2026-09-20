import React, { useState } from 'react';

export default function SecurityOperations({ userRole = 'SUPER_ADMIN' }) {
  const [activeTab, setActiveTab] = useState('TELEMETRY');
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchCorrelationId, setSearchCorrelationId] = useState('');

  const socMetrics = {
    authAnomaliesCount: 3,
    crossScopeViolationsCount: 1,
    revokedDeviceAttempts: 12,
    activeBreakGlassSessions: 1,
    auditLedgerIntegrity: 'VERIFIED_TAMPER_FREE',
    environmentIsolation: 'LIVE'
  };

  const activeSecurityCases = [
    {
      id: 'SEC-CASE-201',
      type: 'CROSS_TENANT_DENIED',
      actor: 'USR-8291',
      authenticatedTenant: 'TENANT-ALPHA',
      requestedTenant: 'TENANT-BRAVO',
      resource: 'EV-278293',
      result: 'DENIED',
      correlation_id: 'COR-01K59F7Z-829310',
      time: '5 mins ago',
      details: 'Client-side tenant header override attempt detected and blocked by server validation.'
    },
    {
      id: 'SEC-CASE-202',
      type: 'REVOKED_DEVICE_ATTEMPT',
      actor: 'DEV-8849',
      authenticatedTenant: 'TENANT-KENYA-2027',
      requestedTenant: 'TENANT-KENYA-2027',
      resource: 'POST /api/v1/sync',
      result: 'BLOCKED',
      correlation_id: 'COR-01K59F7Z-330192',
      time: '12 mins ago',
      details: 'Device ID bound to lost handset revoked at 14:00 EAT attempted synchronization.'
    }
  ];

  // Rule-Driven Security Case Correlation (Groups multiple alerts for same actor/correlation)
  const correlatedSecurityCases = [
    {
      caseId: 'CORR-SEC-00421',
      actor: 'USR-8921',
      relatedEventsCount: 4,
      correlationId: 'COR-01K59F7Z-889912',
      summary: 'Multiple high-risk security events: Auth Failure -> Cross-Tenant Denial -> Break-Glass Request',
      riskScore: 'CRITICAL_HIGH',
      status: 'REVIEW_REQUIRED'
    }
  ];


  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Security Operations Center (SOC Console)</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Actionable security console, cross-tenant isolation enforcement, break-glass monitoring, and transaction correlation search.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#065f46', color: '#6ee7b7', fontSize: '12px', fontWeight: 'bold' }}>
            LEDGER: {socMetrics.auditLedgerIntegrity}
          </span>
          <span style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#1e3a8a', color: '#93c5fd', fontSize: '12px', fontWeight: 'bold' }}>
            ENV: {socMetrics.environmentIsolation}
          </span>
        </div>
      </div>

      {/* Correlation ID Search Bar */}
      <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #334155', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search Transaction Correlation ID (e.g. COR-01K59F7Z-829310)..."
          value={searchCorrelationId}
          onChange={(e) => setSearchCorrelationId(e.target.value)}
          style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px 14px', color: '#38bdf8', fontFamily: 'monospace' }}
        />
        <button style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔍 Trace Correlation Lifecycle
        </button>
      </div>

      {/* SOC Summary Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Auth Anomalies</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{socMetrics.authAnomaliesCount}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Cross-Tenant Denials</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>{socMetrics.crossScopeViolationsCount}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Revoked Device Access Blocked</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{socMetrics.revokedDeviceAttempts}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Break-Glass Sessions</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>{socMetrics.activeBreakGlassSessions}</div>
        </div>
      </div>

      {/* Actionable Security Cases Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Active Security Incident Cases (Click to Drill Through)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Case ID</th>
              <th style={{ padding: '12px' }}>Security Violation Type</th>
              <th style={{ padding: '12px' }}>Actor</th>
              <th style={{ padding: '12px' }}>Correlation ID</th>
              <th style={{ padding: '12px' }}>Enforcement</th>
            </tr>
          </thead>
          <tbody>
            {activeSecurityCases.map((evt) => (
              <tr key={evt.id} onClick={() => setSelectedCase(evt)} style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{evt.id}</td>
                <td style={{ padding: '12px', fontWeight: 600 }}>{evt.type}</td>
                <td style={{ padding: '12px' }}>{evt.actor}</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#93c5fd' }}>{evt.correlation_id}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#7f1d1d', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                    {evt.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drill-through Modal */}
      {selectedCase && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e293b', width: '500px', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Security Incident Case: {selectedCase.id}</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1' }}>{selectedCase.details}</p>
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', marginBottom: '20px' }}>
              Actor: {selectedCase.actor}<br />
              Tenant Context: {selectedCase.authenticatedTenant}<br />
              Requested Target: {selectedCase.requestedTenant}<br />
              Resource: {selectedCase.resource}<br />
              Correlation ID: {selectedCase.correlation_id}
            </div>
            <button onClick={() => setSelectedCase(null)} style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Close Drill-Through
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

