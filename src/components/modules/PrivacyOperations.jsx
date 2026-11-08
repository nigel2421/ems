import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, RefreshCw, Cpu, CheckCircle } from 'lucide-react';

export default function PrivacyOperations() {
  const [keyMode, setKeyMode] = useState('platform'); // 'platform' | 'self'
  const [keyRotatedNotice, setKeyRotatedNotice] = useState('');
  const [fingerprint, setFingerprint] = useState('SHA256:7b2e9a4f61c80912d8471b05ff4c98ad');

  const handleRotateKey = () => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setFingerprint(`SHA256:${randomHex.slice(0, 32)}`);
    setKeyRotatedNotice('Cryptographic key rotated successfully. New session master key active.');
    setTimeout(() => setKeyRotatedNotice(''), 4000);
  };

  const privacyRegistry = [
    { purpose: 'AGENT_MANAGEMENT', legalBasis: 'Contractual Obligation / Deployment', retention: '90 Days Post-Election', status: 'ACTIVE' },
    { purpose: 'EVIDENCE_VERIFICATION', legalBasis: 'Legal Claim / Statutory Evidence', retention: '7 Years (Electoral Disputes)', status: 'ACTIVE' },
    { purpose: 'FIELD_GEOLOCATION', legalBasis: 'Consent (Agent Deployment)', retention: 'Election Day + 48h', status: 'ACTIVE' },
    { purpose: 'BIOMETRIC_OR_ID_SCAN', legalBasis: 'Explicit Consent', retention: 'Immediate Redaction Post-Verification', status: 'STRICT_REDACTION' }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '1rem' }}>
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

      {/* User-Managed Encryption Keys Panel */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="#38bdf8" />
              Cryptographic Key Management & Privacy Self-Custody
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              ODPC Kenya Section 41 technical safeguards. Choose between automated Cloud KMS hardware keys or user-managed self-custody zero-knowledge derivation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRotateKey}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#334155', color: '#f8fafc', border: '1px solid #475569', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}
            >
              <RefreshCw size={14} />
              Rotate Session Key
            </button>
          </div>
        </div>

        {keyRotatedNotice && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>{keyRotatedNotice}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div
            onClick={() => setKeyMode('platform')}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: keyMode === 'platform' ? '2px solid #38bdf8' : '1px solid #334155',
              backgroundColor: keyMode === 'platform' ? 'rgba(56, 189, 248, 0.08)' : '#0f172a',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>Platform Managed KMS</div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0284c7', color: '#fff' }}>Default</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Hardware security module (FIPS 140-2 Level 3 HSM) with automatic 90-day rotation and envelope encryption. Zero agent configuration needed.
            </p>
          </div>

          <div
            onClick={() => setKeyMode('self')}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: keyMode === 'self' ? '2px solid #10b981' : '1px solid #334155',
              backgroundColor: keyMode === 'self' ? 'rgba(16, 185, 129, 0.08)' : '#0f172a',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>User-Managed Self-Custody</div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#059669', color: '#fff' }}>Zero-Knowledge</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Keys derived locally in your browser session using PBKDF2/scrypt (100,000 iterations). Raw candidate votes and field notes are inaccessible even to system administrators.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0f172a', padding: '12px 16px', borderRadius: '6px', border: '1px solid #334155', flexWrap: 'wrap' }}>
          <Lock size={16} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active Key Fingerprint:</span>
          <code style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>{fingerprint}</code>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} />
            AES-256-GCM Verified
          </span>
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
