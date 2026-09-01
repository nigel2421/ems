import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Users, 
  ShieldAlert, 
  Map, 
  UserPlus, 
  CheckCircle, 
  Activity,
  Layers,
  Settings,
  Database
} from 'lucide-react';

export const AdminDashboard = ({ onOpenAuditLogs, onOpenGeographic }) => {
  const { users } = useAuth();
  const { geography, assignAgentToPollingStation } = useData();

  const [selectedAgent, setSelectedAgent] = useState('USR-AGENT-01');
  const [selectedPs, setSelectedPs] = useState('PS-104');
  const [assignmentNotice, setAssignmentNotice] = useState('');

  const agents = users.filter(u => u.role === 'Agent');

  const handleAssignAgent = (e) => {
    e.preventDefault();
    assignAgentToPollingStation(selectedAgent, selectedPs, users.find(u => u.role === 'Admin'));
    setAssignmentNotice(`Agent successfully bound to Polling Station ${selectedPs}`);
    setTimeout(() => setAssignmentNotice(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-admin">System Admin Command</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Super Admin Directory</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            IEBC Master System Administration
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage user roles, agent boundaries, geographic hierarchy, and inspect system audit ledgers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onOpenAuditLogs}>
            <Activity style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
            <span>Full System Audit Trail</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenGeographic}>
            <Map style={{ width: '16px', height: '16px' }} />
            <span>Geographic Manager</span>
          </button>
        </div>
      </div>

      <div className="grid-dashboard">
        {/* Agent Assignment Tool */}
        <div className="glass-card col-span-6">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Agent Polling Station Boundary Binding
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Assign agents strictly to designated polling stations per IEBC gazette
          </p>

          <form onSubmit={handleAssignAgent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Agent</label>
              <select className="form-select" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Polling Station</label>
              <select className="form-select" value={selectedPs} onChange={e => setSelectedPs(e.target.value)}>
                {geography.pollingStations.map(ps => (
                  <option key={ps.id} value={ps.id}>
                    {ps.code} - {ps.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              <UserPlus style={{ width: '16px', height: '16px' }} />
              <span>Bind Agent to Polling Station</span>
            </button>

            {assignmentNotice && (
              <div style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle style={{ width: '14px', height: '14px' }} />
                {assignmentNotice}
              </div>
            )}
          </form>
        </div>

        {/* User Directory Overview */}
        <div className="glass-card col-span-6">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Role Access & 2FA Status Directory
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Active system users and two-factor authentication security state
          </p>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Role</th>
                  <th>2FA Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                    <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td>
                      {u.twoFactorEnabled ? (
                        <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: '600' }}>Active (App OTP)</span>
                      ) : (
                        <span style={{ color: '#f87171', fontSize: '0.8rem' }}>Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
