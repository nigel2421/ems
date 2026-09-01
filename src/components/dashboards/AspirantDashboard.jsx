import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  ShieldCheck, 
  UserCheck, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ApprovalWorkflowModal } from '../modules/ApprovalWorkflowModal';
import { PdfReportGenerator } from '../modules/PdfReportGenerator';

export const AspirantDashboard = () => {
  const { currentUser } = useAuth();
  const { submissions, updateSubmissionStatus } = useData();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showPdfExport, setShowPdfExport] = useState(false);

  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted');
  const approvedSubmissions = submissions.filter(s => s.status === 'Approved');
  const mismatchSubmissions = submissions.filter(s => s.status === 'Mismatch');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-aspirant">Aspirant Command Hub</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Candidate: {currentUser.name}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            Agent Evidence Approval & Verification
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Gatekeep agent submissions, verify Form 34A evidence photos, and generate verified PDF dossier logs.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowPdfExport(true)}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          <span>Export Verified PDF Dossier</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid-stats">
        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Pending Approval Queue</div>
            <div className="stat-val" style={{ color: '#fcd34d' }}>{pendingSubmissions.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Requires Aspirant Sign-off</div>
          </div>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}>
            <Clock style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Approved Agent Submissions</div>
            <div className="stat-val" style={{ color: '#34d399' }}>{approvedSubmissions.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>Form 34A Validated</div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Flagged Discrepancies</div>
            <div className="stat-val" style={{ color: mismatchSubmissions.length > 0 ? '#f87171' : '#34d399' }}>
              {mismatchSubmissions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>IEBC Broadcast Variance</div>
          </div>
          <div className="stat-icon" style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* Submissions Table with Approval Actions */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          Agent Submissions Ledger
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Submission ID</th>
                <th>Polling Station</th>
                <th>Agent</th>
                <th>Timestamp</th>
                <th>Tally Summary</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#fcd34d' }}>{sub.id}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{sub.pollingStationName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {sub.pollingStationId}</div>
                  </td>
                  <td>{sub.agentName}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    Presidential: <strong>{sub.tallies.presidential?.totalValid} valid</strong>
                  </td>
                  <td>
                    <span className={`status-pill ${sub.status.toLowerCase()}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      <span>Review Evidence</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Modal for Review */}
      {selectedSubmission && (
        <ApprovalWorkflowModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={(id, comment) => {
            updateSubmissionStatus(id, 'Approved', comment, currentUser);
            setSelectedSubmission(null);
          }}
          onReject={(id, comment) => {
            updateSubmissionStatus(id, 'Rejected', comment, currentUser);
            setSelectedSubmission(null);
          }}
        />
      )}

      {/* PDF Export Modal */}
      {showPdfExport && (
        <PdfReportGenerator
          submissions={submissions}
          onClose={() => setShowPdfExport(false)}
        />
      )}
    </div>
  );
};
