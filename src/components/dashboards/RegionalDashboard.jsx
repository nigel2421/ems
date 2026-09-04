import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building,
  Activity,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const RegionalDashboard = ({ onOpenModule }) => {
  const { currentUser } = useAuth();
  const { agents, geography, fieldReports, tallyResults, updateAgentStatus } = useData();

  const regionName = currentUser?.assignedEntity || 'Nairobi Metro';
  const regionalAgents = agents.filter(a => a.region.includes(regionName) || a.supervisor.includes(currentUser?.name || ''));
  const regionalIncidents = fieldReports.filter(r => r.locationName?.includes(regionName) || r.severityLevel === 'High' || r.severityLevel === 'Critical');
  const pendingTallyVerifications = tallyResults.filter(t => t.status === 'Submitted' || t.status === 'Mismatch');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.5rem 1.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22d3ee', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <MapPin style={{ width: '16px', height: '16px' }} />
            <span>Regional Operations Hub</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem', color: '#fff' }}>
            {regionName} Regional Coordinator Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Manage regional field agents, monitor assigned polling station activities, and verify incoming election tallies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => onOpenModule('agent_management')}>
            <UserCheck style={{ width: '16px', height: '16px' }} />
            <span>Assign Field Agents</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenModule('tally_center')}>
            <ShieldCheck style={{ width: '16px', height: '16px' }} />
            <span>Tally Verification Queue ({pendingTallyVerifications.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Assigned Field Agents</span>
            <Users style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#22d3ee' }}>
            {regionalAgents.length || agents.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {agents.filter(a => a.status === 'Active' || a.status === 'On Duty').length} Active / On Duty
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Polling Station Coverage</span>
            <Building style={{ width: '18px', height: '18px', color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#34d399' }}>
            94.2%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Agents deployed across gazetted streams
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Tally Verifications</span>
            <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#fbbf24' }}>
            {pendingTallyVerifications.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {tallyResults.filter(t => t.status === 'Mismatch').length} Math Mismatch flagged
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Regional Incident Feed</span>
            <Activity style={{ width: '18px', height: '18px', color: '#ec4899' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#f472b6' }}>
            {regionalIncidents.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Reports submitted by field agents
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Regional Agents Directory & Activity */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Regional Field Agents Roster</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Monitor assigned polling stations, live activity status, and performance ratings.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenModule('agent_management')}>
              Manage Directory
            </button>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Assigned Region / Ward</th>
                  <th>Status</th>
                  <th>Reports / Surveys</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(ag => (
                  <tr key={ag.id}>
                    <td style={{ fontWeight: '600' }}>{ag.fullName}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ag.region}</td>
                    <td>
                      <span className={`status-pill ${ag.status.toLowerCase().replace(' ', '-')}`}>
                        {ag.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <strong>{ag.reportsSubmittedCount || 0}</strong> reps / <strong>{ag.surveysCompletedCount || 0}</strong> surv
                    </td>
                    <td style={{ color: '#fbbf24', fontWeight: '700' }}>
                      ★ {ag.performanceRating || '4.5'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Tally Verification Cards */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Tally Sign-Off Queue</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenModule('tally_center')}>
              Open Tally Center
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tallyResults.map(tally => (
              <div 
                key={tally.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{tally.pollingStationName}</span>
                  <span className={`status-pill ${tally.status.toLowerCase()}`}>{tally.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total Votes Cast: <strong>{tally.totalVotesCast}</strong> (Reg: {tally.registeredVoters})
                </div>
                {tally.approvalComment && (
                  <div style={{ fontSize: '0.75rem', color: tally.status === 'Mismatch' ? '#f87171' : '#34d399', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
                    {tally.approvalComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
