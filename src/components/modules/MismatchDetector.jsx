import React from 'react';
import { useData } from '../../context/DataContext';
import { AlertOctagon, X, FileWarning, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export const MismatchDetector = ({ onClose }) => {
  const { submissions, broadcasts, analyzeMismatch } = useData();

  // Filter submissions with detected mismatches
  const mismatchItems = submissions.map(sub => ({
    submission: sub,
    analysis: analyzeMismatch(sub)
  })).filter(item => item.analysis.hasMismatch);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '850px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertOctagon style={{ width: '24px', height: '24px', color: '#ef4444' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>IEBC Mismatch & Discrepancy Detector</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cross-referencing agent physical Form 34A vs IEBC public broadcast stream</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {mismatchItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <ShieldAlert style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Zero Discrepancies Detected</h3>
            <p style={{ fontSize: '0.85rem' }}>All submitted Form 34A agent tallies match official IEBC broadcast records perfectly.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {mismatchItems.map(({ submission, analysis }) => (
              <div 
                key={submission.id}
                className="glass-card"
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="status-pill mismatch">MISMATCH FLAGGED</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{submission.pollingStationName}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Station ID: {submission.pollingStationId} • Agent: {submission.agentName}
                    </div>
                  </div>
                </div>

                {/* Discrepancies Table */}
                <div className="custom-table-container" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Category / Position</th>
                        <th>Agent Form 34A Count</th>
                        <th>IEBC Public Broadcast</th>
                        <th>Variance (Difference)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.discrepancies.map((disc, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{disc.category}</td>
                          <td style={{ color: '#34d399', fontWeight: '700' }}>{disc.agentCount} votes</td>
                          <td style={{ color: '#f87171', fontWeight: '700' }}>{disc.iebcCount} votes</td>
                          <td style={{ color: disc.diff > 0 ? '#f87171' : '#f59e0b', fontWeight: '800' }}>
                            {disc.diff > 0 ? `+${disc.diff}` : disc.diff} votes discrepancy
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>Recommendation:</strong> Present physical signed Form 34A copy (EXIF Hash: {submission.evidence.hashSignature}) to IEBC Returning Officer for official recount audit.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
