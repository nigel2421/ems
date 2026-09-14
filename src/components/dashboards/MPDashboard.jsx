import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Award, CheckCircle2, UserPlus, Users } from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';
import './DashboardShared.css';

export const MPDashboard = () => {
  const { currentUser } = useAuth();
  const { geography, getScopedSubmissions, getScopedAgents } = useData();
  const [showAddAgent, setShowAddAgent] = useState(false);

  const scopedAgents = getScopedAgents(currentUser);
  const scopedSubmissions = getScopedSubmissions(currentUser);
  const constituency = geography.constituencies[0]; // Westlands Constituency
  const constituencySubmissions = scopedSubmissions;

  // MP Tally Calculation
  let wanyonyiVotes = 0;
  let haviVotes = 0;

  constituencySubmissions.forEach(sub => {
    if (sub.tallies && sub.tallies.mp) {
      wanyonyiVotes += sub.tallies.mp.Wanyonyi || 0;
      haviVotes += sub.tallies.mp.NelsonHavi || 0;
    }
  });

  const leadingMargin = wanyonyiVotes - haviVotes;

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>{constituency.name} Command Center</h1>
          <p>
            Constituency-level Parliamentary vote tally, candidate margins, and ward stream monitoring.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowAddAgent(true)}>
            <UserPlus strokeWidth={1.75} />
            Add MP Constituency Agent
          </button>
        </div>
      </header>

      <section className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Candidate Tally ({currentUser?.name || 'Hon. Tim Wanyonyi'})</span>
            <div className="admin-metric-icon"><Award strokeWidth={1.75} /></div>
          </div>
          <strong>{wanyonyiVotes.toLocaleString()}</strong>
          <small>Verified Form 34A Agent Votes · Margin +{leadingMargin.toLocaleString()}</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Active Candidate Agents</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{scopedAgents.length}</strong>
          <small>Assigned Polling Stations</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Agent Submissions</span>
            <div className="admin-metric-icon"><CheckCircle2 strokeWidth={1.75} /></div>
          </div>
          <strong>{constituencySubmissions.length}</strong>
          <small>Verified Physical Evidence</small>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>My Candidate Agents ({scopedAgents.length})</h2>
            <p>Bound to {currentUser?.name || 'Candidate'} Ticket</p>
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
            <h2>Ward Tally Matrix ({geography.wards.length} Wards)</h2>
            <p>Constituency ward-level vote aggregation</p>
          </div>
        </div>
        <div className="admin-list">
          {geography.wards.map(ward => {
            const wardSubs = constituencySubmissions.filter(s => s.wardId === ward.id);
            const wardTally = wardSubs.reduce((acc, curr) => acc + (curr.tallies.mp?.Wanyonyi || curr.tallies.mp?.candidateCount || 0), 0);
            return (
              <div key={ward.id} className="admin-list-item">
                <div>
                  <strong>{ward.name}</strong>
                  <span>Reg. Voters: {ward.registeredVoters.toLocaleString()}</span>
                </div>
                <span className="admin-chip">{wardSubs.length} / {ward.pollingStationsCount} PS</span>
                <strong style={{ marginLeft: '0.5rem', color: '#006B3F', fontSize: '0.9rem' }}>
                  {wardTally} votes
                </strong>
              </div>
            );
          })}
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
