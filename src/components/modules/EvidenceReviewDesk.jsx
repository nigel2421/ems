// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Dual-Pane Evidence Review Desk Component
// ====================================================================

import React, { useState } from 'react';
import { calculateEvidenceQualityScore } from '../../utils/evidenceVault.js';

export const EvidenceReviewDesk = () => {
  const [selectedSubmission, setSelectedSubmission] = useState({
    id: 'SUB-2027-8841',
    stationName: 'Highridge Primary School - Stream 03',
    pollingStationCode: '002938',
    formType: 'Form 34A',
    capturedAt: '2026-09-19 20:41:18',
    submittedBy: 'Jane Wambui (Agent-239)',
    candAVotes: 421,
    candBVotes: 318,
    candCVotes: 41,
    rejectedVotes: 7,
    totalVotesCast: 787,
    registeredVoters: 892,
    humanVerificationStatus: 'PENDING',
    reviewerNotes: ''
  });

  const qualityEval = calculateEvidenceQualityScore({
    imageReadable: true,
    stationId: selectedSubmission.pollingStationCode,
    formType: selectedSubmission.formType,
    fieldsDetected: true,
    mathValid: true,
    signaturesDetected: true,
    stampDetected: false, // Stamp warning test
    isDuplicate: false,
    humanVerificationStatus: selectedSubmission.humanVerificationStatus
  });

  const handleApprove = () => {
    setSelectedSubmission(prev => ({
      ...prev,
      humanVerificationStatus: 'APPROVED'
    }));
  };

  const handleReject = () => {
    setSelectedSubmission(prev => ({
      ...prev,
      humanVerificationStatus: 'REJECTED'
    }));
  };

  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>📷 EVIDENCE REVIEW WORKSPACE</h2>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Dual-Pane Image Inspection & Automated Check Breakdown</div>
        </div>
        <div style={{ background: '#1e293b', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          STATUS: <span style={{ color: selectedSubmission.humanVerificationStatus === 'APPROVED' ? '#10b981' : '#f59e0b' }}>{selectedSubmission.humanVerificationStatus}</span>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Pane: Original Image Preview & Chain of Custody */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#38bdf8' }}>ORIGINAL STATUTORY FORM EVIDENCE</h3>
          <div style={{ background: '#0f172a', border: '2px dashed #334155', borderRadius: '12px', height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📄</div>
            <div style={{ fontWeight: 700, color: '#94a3b8' }}>{selectedSubmission.formType} Original Snapshot</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>SHA-256: 0x8a92f...411e</div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8', background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>CHAIN OF CUSTODY AUDIT TRAIL</div>
            <div>20:41:14 CAPTURED by {selectedSubmission.submittedBy}</div>
            <div>20:41:15 HASH_CREATED (SHA-256 Verified)</div>
            <div>20:41:18 SERVER_RECEIVED & OCR_COMPLETED</div>
            <div>20:45:08 REVIEW_OPENED by Operations Reviewer</div>
          </div>
        </div>

        {/* Right Pane: OCR Data vs Automated Quality Checks & Human Decision */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#38bdf8' }}>OCR & ENTERED CANDIDATE DATA</h3>

          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <div>Candidate A: <strong style={{ color: '#fff' }}>{selectedSubmission.candAVotes}</strong></div>
              <div>Candidate B: <strong style={{ color: '#fff' }}>{selectedSubmission.candBVotes}</strong></div>
              <div>Candidate C: <strong style={{ color: '#fff' }}>{selectedSubmission.candCVotes}</strong></div>
              <div>Rejected Votes: <strong style={{ color: '#fff' }}>{selectedSubmission.rejectedVotes}</strong></div>
              <div>Total Votes Cast: <strong style={{ color: '#38bdf8' }}>{selectedSubmission.totalVotesCast}</strong></div>
              <div>Registered Voters: <strong style={{ color: '#94a3b8' }}>{selectedSubmission.registeredVoters}</strong></div>
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>AUTOMATED QUALITY CHECKS (SCORE: {qualityEval.score}/100)</h4>
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '12px', fontSize: '0.8rem', marginBottom: '16px' }}>
            {qualityEval.breakdown.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                <span>✓ {item.rule}</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>+{item.pts} pts</span>
              </div>
            ))}
            <div style={{ marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>TALLY ELIGIBILITY:</span>
              <span style={{ color: qualityEval.tallyEligibility === 'ELIGIBLE' ? '#10b981' : '#f59e0b' }}>{qualityEval.tallyEligibility}</span>
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>HUMAN VERIFICATION CONTROLS</h4>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleReject} style={{ flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              FLAG / REJECT
            </button>
            <button onClick={handleApprove} style={{ flex: 1, padding: '12px', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
              APPROVE & VERIFY FORM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
