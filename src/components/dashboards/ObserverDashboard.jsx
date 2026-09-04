import React from 'react';
import { useData } from '../../context/DataContext';
import {
  Eye,
  Vote,
  BarChart3,
  Users,
  AlertTriangle,
  ShieldCheck,
  Building
} from 'lucide-react';

export const ObserverDashboard = () => {
  const { geography, stationIntelligence, surveys, tallyResults, fieldReports } = useData();

  const totalPollingStations = geography.pollingStations?.length || 12872;
  const verifiedTallies = tallyResults.filter(t => t.status === 'Approved' || t.status === 'Verified');
  const totalVotesCast = tallyResults.reduce((acc, t) => acc + (t.totalVotesCast || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Read-Only Observer Banner */}
      <div 
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(30, 41, 59, 0.3) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Eye style={{ width: '28px', height: '28px', color: '#94a3b8' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.05em' }}>
              Observer / Read-Only Transparency Desk
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
              Election Monitoring & Public Analytics Portal
            </h1>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          Read-Only Mode Enabled
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Polling Stations</span>
            <Building style={{ width: '18px', height: '18px', color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem' }}>
            {totalPollingStations.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Gazetted electoral streams
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Verified Tally Returns</span>
            <ShieldCheck style={{ width: '18px', height: '18px', color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#34d399' }}>
            {verifiedTallies.length} / {tallyResults.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Form 34A evidence verified
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Votes Processed</span>
            <Vote style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#fbbf24' }}>
            {totalVotesCast.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Ballots recorded across streams
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Survey Inputs Collected</span>
            <BarChart3 style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#22d3ee' }}>
            {surveys.reduce((acc, s) => acc + (s.responseCount || 0), 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Voter sentiment responses
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.75rem' }}>Election Day Tally Stream Summary</h2>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Station Code & Name</th>
                <th>Candidate A</th>
                <th>Candidate B</th>
                <th>Candidate C</th>
                <th>Total Cast</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tallyResults.map(tally => (
                <tr key={tally.id}>
                  <td style={{ fontWeight: '600' }}>{tally.pollingStationName}</td>
                  <td style={{ fontWeight: '700', color: '#818cf8' }}>{tally.candAVotes}</td>
                  <td>{tally.candBVotes}</td>
                  <td>{tally.candCVotes}</td>
                  <td style={{ fontWeight: '700' }}>{tally.totalVotesCast}</td>
                  <td>
                    <span className={`status-pill ${tally.status.toLowerCase()}`}>{tally.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
