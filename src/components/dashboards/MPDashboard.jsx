import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Building2, Vote, Award, AlertTriangle, CheckCircle2, UserPlus, Users } from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-mp">MP Constituency View</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IEBC Code: CONST-01</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            {constituency.name} Command Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Constituency-level Parliamentary vote tally, candidate margins, and ward stream monitoring.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddAgent(true)}>
          <UserPlus style={{ width: '16px', height: '16px' }} />
          <span>Add MP Constituency Agent</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid-stats">
        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Candidate Tally ({currentUser?.name || 'Hon. Tim Wanyonyi'})</div>
            <div className="stat-val" style={{ color: '#67e8f9' }}>{wanyonyiVotes.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
              Verified Form 34A Agent Votes
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}>
            <Award style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Active Candidate Agents</div>
            <div className="stat-val" style={{ color: '#fcd34d' }}>{scopedAgents.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Assigned Polling Stations
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Agent Submissions</div>
            <div className="stat-val" style={{ color: '#34d399' }}>{constituencySubmissions.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.2rem' }}>
              Verified Physical Evidence
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle2 style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* MP Constituency Agents Roster */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            My Candidate Agents ({scopedAgents.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bound to {currentUser?.name || 'Candidate'} Ticket</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {scopedAgents.map(ag => (
            <div key={ag.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={ag.avatar} alt={ag.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ag.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ag.entityName}</div>
                <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: '0.1rem' }}>{ag.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wards Breakdown Cards */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          Ward Tally Matrix ({geography.wards.length} Wards)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {geography.wards.map(ward => {
            const wardSubs = constituencySubmissions.filter(s => s.wardId === ward.id);
            const wardTally = wardSubs.reduce((acc, curr) => acc + (curr.tallies.mp?.Wanyonyi || curr.tallies.mp?.candidateCount || 0), 0);
            return (
              <div 
                key={ward.id} 
                className="glass-card" 
                style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{ward.name}</div>
                  <span className="status-pill approved" style={{ fontSize: '0.7rem' }}>
                    {wardSubs.length} / {ward.pollingStationsCount} PS
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Reg. Voters: {ward.registeredVoters.toLocaleString()}
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{currentUser?.name || 'Candidate'} Tally:</span>
                    <strong style={{ color: '#67e8f9', fontWeight: '800' }}>
                      {wardTally} votes
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};
