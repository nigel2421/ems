import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { MapPin, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const MCADashboard = () => {
  const { currentUser } = useAuth();
  const { geography, submissions } = useData();

  const ward = geography.wards[0]; // Parklands / Highridge Ward
  const wardPollingStations = geography.pollingStations.filter(ps => ps.wardId === ward.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="role-badge role-mca">MCA Ward Level View</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ward ID: WARD-01</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
          {ward.name} Polling Matrix
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Hyper-local ward polling station monitoring, polling stream coverage, and agent deployment tracking.
        </p>
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
                const sub = submissions.find(s => s.pollingStationId === ps.id);
                return (
                  <tr key={ps.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#6ee7b7' }}>{ps.code}</td>
                    <td style={{ fontWeight: '600' }}>{ps.name}</td>
                    <td>{ps.registeredVoters} voters</td>
                    <td>
                      {ps.agentAssigned ? (
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
    </div>
  );
};
