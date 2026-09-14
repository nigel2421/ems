import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  CheckCircle,
  Eye,
  Download,
  Clock,
  AlertTriangle,
  UserPlus,
  Users
} from 'lucide-react';
import { ApprovalWorkflowModal } from '../modules/ApprovalWorkflowModal';
import { PdfReportGenerator } from '../modules/PdfReportGenerator';
import { AddAgentModal } from '../modules/AddAgentModal';
import './DashboardShared.css';

export const AspirantDashboard = () => {
  const { currentUser } = useAuth();
  const { getScopedSubmissions, getScopedAgents, updateSubmissionStatus } = useData();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);

  const scopedSubmissions = getScopedSubmissions(currentUser);
  const scopedAgents = getScopedAgents(currentUser);

  const pendingSubmissions = scopedSubmissions.filter(s => s.status === 'Submitted');
  const approvedSubmissions = scopedSubmissions.filter(s => s.status === 'Approved');
  const mismatchSubmissions = scopedSubmissions.filter(s => s.status === 'Mismatch');

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>Agent Evidence Approval</h1>
          <p>
            Manage assigned agents, verify Form 34A evidence, and generate verified PDF dossier logs for {currentUser?.name}.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowAddAgent(true)}>
            <UserPlus strokeWidth={1.75} />
            Add Candidate Agent
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowPdfExport(true)}>
            <Download strokeWidth={1.75} />
            Export Verified Dossier
          </button>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Assigned Agents</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{scopedAgents.length}</strong>
          <small>Bound to Candidate</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Pending Approval Queue</span>
            <div className="admin-metric-icon"><Clock strokeWidth={1.75} /></div>
          </div>
          <strong>{pendingSubmissions.length}</strong>
          <small>Requires Sign-off</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Approved Submissions</span>
            <div className="admin-metric-icon"><CheckCircle strokeWidth={1.75} /></div>
          </div>
          <strong>{approvedSubmissions.length}</strong>
          <small>Form 34A Validated</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Flagged Discrepancies</span>
            <div className="admin-metric-icon"><AlertTriangle strokeWidth={1.75} /></div>
          </div>
          <strong>{mismatchSubmissions.length}</strong>
          <small>Broadcast Variance</small>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>My Candidate Agents ({scopedAgents.length})</h2>
            <p>Isolated Tenant Access</p>
          </div>
        </div>
        <div className="admin-agent-grid">
          {scopedAgents.map(ag => (
            <div key={ag.id} className="admin-agent-tile">
              <img src={ag.avatar} alt={ag.name} />
              <strong>{ag.name}</strong>
              <span>{ag.entityName}</span>
              <span>{ag.email}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Candidate Evidence Submissions Ledger</h2>
            <p>Review and approve Form 34A evidence from assigned agents</p>
          </div>
        </div>
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
              {scopedSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#006B3F' }}>{sub.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.pollingStationName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B756F' }}>ID: {sub.pollingStationId}</div>
                  </td>
                  <td>{sub.agentName}</td>
                  <td style={{ fontSize: '0.8rem', color: '#6B756F' }}>
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
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ height: 36, padding: '0 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <Eye strokeWidth={1.75} />
                      Review Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

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

      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}

      {showPdfExport && (
        <PdfReportGenerator
          submissions={scopedSubmissions}
          onClose={() => setShowPdfExport(false)}
        />
      )}
    </div>
  );
};
