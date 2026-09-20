import React from 'react';

export default function PrivacyOperations() {
  const privacyRegistry = [
    { purpose: 'AGENT_MANAGEMENT', legalBasis: 'Contractual Obligation / Deployment', retention: '90 Days Post-Election', status: 'ACTIVE' },
    { purpose: 'EVIDENCE_VERIFICATION', legalBasis: 'Legal Claim / Statutory Evidence', retention: '7 Years (Electoral Disputes)', status: 'ACTIVE' },
    { purpose: 'FIELD_GEOLOCATION', legalBasis: 'Consent (Agent Deployment)', retention: 'Election Day + 48h', status: 'ACTIVE' },
    { purpose: 'BIOMETRIC_OR_ID_SCAN', legalBasis: 'Explicit Consent', retention: 'Immediate Redaction Post-Verification', status: 'STRICT_REDACTION' }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Privacy Operations (ODPC Kenya Compliance)</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Data protection governance under the Data Protection Act (Kenya). Consent records, retention schedules, and dataset exclusions.
          </p>
        </div>
        <div style={{ backgroundColor: '#065f46', color: '#6ee7b7', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
          DPIA STATUS: CERTIFIED COMPLIANT
        </div>
      </div>

      {/* Compliance Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Consent Records</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>46,229 Agents</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>AI Excluded Datasets</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>100% PII Protected</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Open Data Subject Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>0 Pending</div>
        </div>
      </div>

      {/* Purpose Registry Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>ODPC Data Purpose & Retention Registry</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Processing Purpose</th>
              <th style={{ padding: '12px' }}>Legal Basis (DPA Kenya)</th>
              <th style={{ padding: '12px' }}>Retention Schedule</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {privacyRegistry.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: '#38bdf8' }}>{item.purpose}</td>
                <td style={{ padding: '12px' }}>{item.legalBasis}</td>
                <td style={{ padding: '12px', color: '#cbd5e1' }}>{item.retention}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#065f46', color: '#6ee7b7', fontSize: '11px', fontWeight: 'bold' }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
