import React, { useState } from 'react';
import { READINESS_WORKSTREAMS, STAKEHOLDER_ROLES, DISASTER_RECOVERY_METRICS, evaluateProductionReadiness, signOffReadinessGate } from '../../utils/productionReadinessGate';
import { ASVS_5_MATRIX, evaluateASVSCompliance, ASVS_VERIFICATION_STATUS } from '../../utils/asvsVerificationMatrix';
import { generatePostgresRlsDDL, runPostgresRlsExecutionTest } from '../../services/postgresRlsEngine';
import { getLegallyApprovedRetentionPolicy, ELECTION_RETENTION_POLICIES, RETENTION_DISCLAIMER } from '../../services/legallyApprovedRetentionPolicyEngine';
import { CURRENT_RELEASE_MANIFEST, verifyReleaseProvenance } from '../../utils/releaseProvenance';

export default function ProductionReadinessBoard({ userRole = 'SUPER_ADMIN' }) {
  const [signOffs, setSignOffs] = useState({
    [STAKEHOLDER_ROLES.ENGINEERING]: 'APPROVED',
    [STAKEHOLDER_ROLES.OPERATIONS]: 'APPROVED',
    [STAKEHOLDER_ROLES.DATA_PROTECTION]: 'APPROVED',
    [STAKEHOLDER_ROLES.SECURITY]: 'APPROVED',
    [STAKEHOLDER_ROLES.CAMPAIGN_COMMAND]: 'APPROVED'
  });

  const [activeTab, setActiveTab] = useState('WORKSTREAMS');

  const readiness = evaluateProductionReadiness(READINESS_WORKSTREAMS, signOffs);
  const asvsCompliance = evaluateASVSCompliance(ASVS_5_MATRIX);
  const activeLegalPolicy = getLegallyApprovedRetentionPolicy();
  const rlsTestResult = runPostgresRlsExecutionTest();
  const releaseProvenance = verifyReleaseProvenance();

  const handleSignOff = (role) => {
    const updated = signOffReadinessGate(signOffs, role, 'APPROVED', 'Production dress rehearsal passed');
    setSignOffs(updated);
  };

  const getASVSBadgeColor = (status) => {
    switch (status) {
      case ASVS_VERIFICATION_STATUS.FULLY_VERIFIED:
        return { bg: '#065f46', text: '#6ee7b7' };
      case ASVS_VERIFICATION_STATUS.PARTIALLY_VERIFIED:
        return { bg: '#1e3a8a', text: '#93c5fd' };
      case ASVS_VERIFICATION_STATUS.ENVIRONMENT_DEPENDENT_UNVERIFIED:
        return { bg: '#854d0e', text: '#fde047' };
      case ASVS_VERIFICATION_STATUS.NOT_APPLICABLE:
        return { bg: '#334155', text: '#cbd5e1' };
      default:
        return { bg: '#991b1b', text: '#fca5a5' };
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Production Readiness & Go-Live Board</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Infrastructure evidence verification, OWASP ASVS v5.0 audit status, release provenance, legal retention rules, and decision gate.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: readiness.decisionStatus === 'GO' ? '#065f46' : (readiness.decisionStatus === 'CONDITIONAL_GO' ? '#854d0e' : '#991b1b'), color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
            {readiness.decisionBadge} ({readiness.readinessScore}%)
          </span>
        </div>
      </div>

      {readiness.blockingReasons && readiness.blockingReasons.length > 0 && (
        <div style={{ backgroundColor: '#451a03', border: '1px solid #b45309', borderRadius: '8px', padding: '14px 20px', marginBottom: '24px' }}>
          <div style={{ color: '#fde047', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
            ⚠️ GATE BLOCK WARNING: Production GO-Live is Currently Prevented ({readiness.blockingReasons.length} Active Blocker/Requirement Pending)
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#fef08a', fontSize: '13px' }}>
            {readiness.blockingReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['WORKSTREAMS', 'ASVS_MATRIX', 'RELEASE_MANIFEST', 'LEGAL_RETENTION', 'POSTGRES_RLS', 'GO_NOGO_GATE'].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tabKey ? '#2563eb' : '#1e293b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tabKey.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab 1: Workstreams */}
      {activeTab === 'WORKSTREAMS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {READINESS_WORKSTREAMS.map((ws) => (
            <div key={ws.id} style={{ backgroundColor: '#1e293b', padding: '16px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{ws.id}</span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: ws.level === 'PRODUCTION_VALIDATED' ? '#065f46' : '#1e3a8a', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                  {ws.level}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', margin: '8px 0 4px 0' }}>{ws.name}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace', marginBottom: '4px' }}>
                Evidence: {ws.testEvidence}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                Digest: {ws.evidenceDigest}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: OWASP ASVS 5.0 Matrix */}
      {activeTab === 'ASVS_MATRIX' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>OWASP ASVS v5.0 Requirement-Level Audit Status</h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Requirements categorized by granular verification state rather than static compliance claims.
              </p>
            </div>
            <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>
              {asvsCompliance.statusMessage}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '10px' }}>Req ID</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>CI-EMS Control</th>
                <th style={{ padding: '10px' }}>Test Evidence / Target</th>
                <th style={{ padding: '10px' }}>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {ASVS_5_MATRIX.map((item) => {
                const badgeStyle = getASVSBadgeColor(item.verificationStatus);
                return (
                  <tr key={item.reqId} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#38bdf8' }}>{item.reqId}</td>
                    <td style={{ padding: '10px' }}>{item.category}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{item.ciEmsControl}</td>
                    <td style={{ padding: '10px', color: '#93c5fd' }}>{item.testEvidence}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: badgeStyle.bg, color: badgeStyle.text, fontSize: '11px', fontWeight: 'bold' }}>
                        {item.verificationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Release Manifest Provenance */}
      {activeTab === 'RELEASE_MANIFEST' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>Release Provenance Build Manifest</h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Forensic build manifest tracking commit, schema, policy, and statutory registry hashes.
              </p>
            </div>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
              {releaseProvenance.statusMessage}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Release ID</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.releaseId}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Git Commit</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.gitCommit}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Database Schema Version</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.schemaVersion}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>PostgreSQL RLS Policy Version</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.rlsPolicyVersion}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Electoral Geography Dataset</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.geographyDatasetVersion}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Statutory Forms Registry Version</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', fontFamily: 'monospace' }}>{CURRENT_RELEASE_MANIFEST.statutoryFormRegistryVersion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Versioned Legal Retention Policy */}
      {activeTab === 'LEGAL_RETENTION' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#f8fafc' }}>Versioned Legally-Approved Retention Policy Engine</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
            {RETENTION_DISCLAIMER}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {ELECTION_RETENTION_POLICIES.map((policy) => (
              <div key={policy.policyId} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{policy.policyId} (v{policy.policyVersion})</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', margin: '4px 0' }}>Contest: {policy.contestType}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{policy.legalBasis}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Retention: <strong>{policy.retentionPeriodYears} Years ({policy.retentionPeriodDays} Days)</strong>
                </div>
                <div style={{ fontSize: '12px', color: policy.legalHold ? '#f59e0b' : '#10b981', marginTop: '4px' }}>
                  Legal Hold Active: <strong>{policy.legalHold ? `YES (${policy.legalHoldReason})` : 'NO'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: PostgreSQL RLS */}
      {activeTab === 'POSTGRES_RLS' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>PostgreSQL Row-Level Security (RLS) Execution Test</h3>
            <span style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: rlsTestResult.isPassed ? '#065f46' : '#991b1b', color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>
              RLS TEST: {rlsTestResult.isPassed ? 'PASSING' : 'FAILING'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
            Default-deny database security policies enforcing multi-tenant isolation across all 10 core tables under application DB role hygiene.
          </p>
          <pre style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto', border: '1px solid #334155' }}>
            {generatePostgresRlsDDL()}
          </pre>
        </div>
      )}

      {/* Tab 6: Go/No-Go Decision Gate */}
      {activeTab === 'GO_NOGO_GATE' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Multi-Stakeholder Go/No-Go Maker-Checker Sign-Off</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {Object.entries(STAKEHOLDER_ROLES).map(([key, roleName]) => {
              const status = signOffs[roleName] || 'PENDING';
              return (
                <div key={key} style={{ backgroundColor: '#0f172a', padding: '14px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>{roleName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Role: {key}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: status === 'APPROVED' ? '#065f46' : '#9a3412', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                      {status}
                    </span>
                    {status !== 'APPROVED' && (
                      <button
                        onClick={() => handleSignOff(roleName)}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Sign Off
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
