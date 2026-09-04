import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { MapPin, Users, CheckCircle, Clock, AlertCircle, UserPlus, Award } from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-mca">MCA Ward Level Command</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ward: {ward.name} ({ward.id})</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            {ward.name} Ward Polling Matrix
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Hyper-local ward polling station monitoring, polling stream coverage, and agent deployment tracking.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddAgent(true)}
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <UserPlus style={{ width: '16px', height: '16px' }} />
          <span>Add MCA Ward Agent</span>
        </button>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid-stats">
        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Candidate Tally ({currentUser?.name})</div>
            <div className="stat-val" style={{ color: '#34d399' }}>{scopedSubmissions.length} Submissions</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>Verified Ward Evidence</div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Award style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Active Ward Agents</div>
            <div className="stat-val" style={{ color: '#818cf8' }}>{scopedAgents.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Bound to MCA Ticket</div>
          </div>
          <div className="stat-icon" style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Ward Polling Stations</div>
            <div className="stat-val" style={{ color: '#67e8f9' }}>{wardPollingStations.length} Streams</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{ward.name} Territory</div>
          </div>
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}>
            <MapPin style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* MCA Ticket Agents Roster */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            My Ward Candidate Agents ({scopedAgents.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned to {ward.name} Polling Streams</span>
        </div>

        {scopedAgents.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            No agents registered yet for your MCA ticket. Click <strong>"Add MCA Ward Agent"</strong> above to provision agents.
          </div>
        ) : (
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
        )}
      </div>

      {/* Ward Polling Stations Grid */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          Polling Stations & Assigned Agents ({wardPollingStations.length} Streams)
        </h3>

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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#6ee7b7' }}>{ps.code}</td>
                    <td style={{ fontWeight: '600' }}>{ps.name}</td>
                    <td>{ps.registeredVoters} voters</td>
                    <td>
                      {assignedAgent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                          <CheckCircle style={{ width: '14px', height: '14px' }} /> {assignedAgent.name}
                        </span>
                      ) : ps.agentAssigned ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                          <CheckCircle style={{ width: '14px', height: '14px' }} /> Assigned ({ps.agentAssigned})
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f87171' }}>
                          <AlertCircle style={{ width: '14px', height: '14px' }} /> Unassigned Agent
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
                          <Clock style={{ width: '12px', height: '12px' }} /> Awaiting Tally
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
