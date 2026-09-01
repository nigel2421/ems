import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldCheck, FileSpreadsheet, MapPin, Smartphone, Hash } from 'lucide-react';

export const ApprovalWorkflowModal = ({ submission, onClose, onApprove, onReject }) => {
  const [comment, setComment] = useState('Form 34A evidence reviewed against physical carbon copy.');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '850px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck style={{ width: '22px', height: '22px', color: '#f59e0b' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Form 34A Evidence Verification Workflow</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Submission ID: {submission.id} • {submission.pollingStationName}</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
          {/* Left Column: Image Preview & Security Metadata */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Form 34A Photo Evidence</h4>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
              <img 
                src={submission.evidence.form34AUrl} 
                alt="Form 34A Evidence" 
                style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin style={{ width: '12px', height: '12px', color: '#06b6d4' }} />
                <span>GPS: {submission.evidence.gpsCoordinates}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smartphone style={{ width: '12px', height: '12px', color: '#818cf8' }} />
                <span>Device: {submission.evidence.deviceInfo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Hash style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
                <span style={{ fontFamily: 'var(--font-mono)' }}>Hash: {submission.evidence.hashSignature}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tally Review & Decision Form */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem' }}>Agent Submitted Figures</h4>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Presidential</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Candidate A: <strong>{submission.tallies.presidential?.candidateA}</strong> • Candidate B: <strong>{submission.tallies.presidential?.candidateB}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase' }}>Gubernatorial</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Johnson Sakaja: <strong>{submission.tallies.governor?.Sakaja}</strong> • Igathe: <strong>{submission.tallies.governor?.Igathe}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Aspirant Verification Comment / Rationale</label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={() => onReject(submission.id, comment)}
              >
                <XCircle style={{ width: '16px', height: '16px' }} />
                <span>Reject Submission</span>
              </button>
              <button 
                className="btn btn-success" 
                style={{ flex: 2 }}
                onClick={() => onApprove(submission.id, comment)}
              >
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                <span>Approve Form 34A</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
