import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { MapPin, Users, CheckCircle, Clock, AlertCircle, UserPlus, Award } from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';
import './DashboardShared.css';

export const MCADashboard = () => {
  const { currentUser } = useAuth();
  const { geography, getScopedSubmissions, getScopedAgents } = useData();
  const [showAddAgent, setShowAddAgent] = useState(false);

  const scopedAgents = getScopedAgents(currentUser);
  const scopedSubmissions = getScopedSubmissions(currentUser);

  // Find ward assigned to MCA user or fallback to first ward
  const assignedWardId = currentUser?.assignedEntity || geography.wards[0]?.id;
  const ward = geography.wards.find(w => w.id === assignedWardId) || geography.wards[0];
  const wardPollingStations = geography.pollingStations.filter(ps => ps.wardId === ward.id);

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>{ward.name} Ward Polling Matrix</h1>
          <p>
            Hyper-local ward polling station monitoring, polling stream coverage, and agent deployment tracking.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowAddAgent(true)}>
            <UserPlus strokeWidth={1.75} />
            Add MCA Ward Agent
          </button>
        </div>
      </header>

      <section className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Candidate Tally ({currentUser?.name})</span>
            <div className="admin-metric-icon"><Award strokeWidth={1.75} /></div>
          </div>
          <strong>{scopedSubmissions.length}</strong>
          <small>Verified Ward Evidence Submissions</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Active Ward Agents</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{scopedAgents.length}</strong>
          <small>Bound to MCA Ticket</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Ward Polling Stations</span>
            <div className="admin-metric-icon"><MapPin strokeWidth={1.75} /></div>
          </div>
          <strong>{wardPollingStations.length}</strong>
          <small>{ward.name} Territory Streams</small>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>My Ward Candidate Agents ({scopedAgents.length})</h2>
            <p>Assigned to {ward.name} Polling Streams</p>
          </div>
        </div>
        {scopedAgents.length === 0 ? (
          <div className="admin-empty">
            No agents registered yet for your MCA ticket. Click <strong>Add MCA Ward Agent</strong> above to provision agents.
          </div>
        ) : (
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
        )}
      </article>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Polling Stations & Assigned Agents ({wardPollingStations.length} Streams)</h2>
            <p>Ward-level coverage and Form 34A status</p>
          </div>
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Station Code</th>
                <th>Polling Station Name</th>
                <th>Reg. Voters</th>
                <th>Assigned Agent</th>
                <th>Form 34A Status</th>
              </tr>
            </thead>
            <tbody>
              {wardPollingStations.map(ps => {
                const sub = scopedSubmissions.find(s => s.pollingStationId === ps.id);
                const assignedAgent = scopedAgents.find(a => a.assignedEntity === ps.id);
                return (
                  <tr key={ps.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#006B3F' }}>{ps.code}</td>
                    <td style={{ fontWeight: 600 }}>{ps.name}</td>
                    <td>{ps.registeredVoters} voters</td>
                    <td>
                      {assignedAgent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#006B3F' }}>
                          <CheckCircle strokeWidth={1.75} style={{ width: 14, height: 14 }} /> {assignedAgent.name}
                        </span>
                      ) : ps.agentAssigned ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#006B3F' }}>
                          <CheckCircle strokeWidth={1.75} style={{ width: 14, height: 14 }} /> Assigned ({ps.agentAssigned})
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#BB0A21' }}>
                          <AlertCircle strokeWidth={1.75} style={{ width: 14, height: 14 }} /> Unassigned Agent
                        </span>
                      )}
                    </td>
                    <td>
                      {sub ? (
                        <span className={`status-pill ${sub.status.toLowerCase()}`}>
                          {sub.status}
                        </span>
                      ) : (
                        <span className="status-pill pending">
                          <Clock strokeWidth={1.75} style={{ width: 12, height: 12 }} /> Awaiting Tally
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};
