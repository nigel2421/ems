import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Users, 
  CheckCircle, 
  AlertOctagon, 
  Map, 
  TrendingUp, 
  FileSpreadsheet,
  Award,
  UserPlus
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AddAgentModal } from '../modules/AddAgentModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const GovernorDashboard = ({ onOpenMismatch, onOpenGeographic }) => {
  const { currentUser } = useAuth();
  const { geography, getScopedSubmissions, getScopedAgents } = useData();
  const [showAddAgent, setShowAddAgent] = useState(false);

  const scopedAgents = getScopedAgents(currentUser);
  const scopedSubmissions = getScopedSubmissions(currentUser);

  // Metrics
  const county = geography.counties[0]; // Nairobi City County
  const totalSubmissions = scopedSubmissions.length;
  const approvedCount = scopedSubmissions.filter(s => s.status === 'Approved').length;
  const mismatchCount = scopedSubmissions.filter(s => s.status === 'Mismatch').length;

  // Tally Calculations based on tenant's agents submissions
  let candidateASum = 0;
  let candidateBSum = 0;
  let sakajaSum = 0;
  let igatheSum = 0;

  scopedSubmissions.forEach(sub => {
    if (sub.tallies.presidential) {
      candidateASum += sub.tallies.presidential.candidateA || 0;
      candidateBSum += sub.tallies.presidential.candidateB || 0;
    }
    if (sub.tallies.governor) {
      sakajaSum += sub.tallies.governor.Sakaja || 0;
      igatheSum += sub.tallies.governor.Igathe || 0;
    }
  });

  // Chart Data
  const governorChartData = {
    labels: ['Johnson Sakaja (UDA)', 'Polycarp Igathe (Azimio)', 'Others'],
    datasets: [
      {
        label: 'County Governor Votes',
        data: [sakajaSum, igatheSum, 25],
        backgroundColor: ['rgba(99, 102, 241, 0.85)', 'rgba(6, 182, 212, 0.85)', 'rgba(156, 163, 175, 0.6)'],
        borderColor: ['#6366f1', '#06b6d4', '#9ca3af'],
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  };

  const turnoutData = {
    labels: ['Votes Cast & Verified', 'Pending Verification', 'Unreported'],
    datasets: [
      {
        data: [candidateASum + candidateBSum, 1120, 2480000],
        backgroundColor: ['#10b981', '#f59e0b', '#1f2937'],
        borderColor: '#111827',
        borderWidth: 2
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-governor">{currentUser.role} Control Command</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IEBC Gazette C047</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            {county.name} Executive Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            County-wide live voting tally, turnouts, agent evidence status, and mismatch detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddAgent(true)}>
            <UserPlus style={{ width: '16px', height: '16px' }} />
            <span>Add Governor Agent</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenGeographic}>
            <Map style={{ width: '16px', height: '16px' }} />
            <span>IEBC Geo Inspector</span>
          </button>
          {mismatchCount > 0 && (
            <button className="btn btn-danger" onClick={onOpenMismatch}>
              <AlertOctagon style={{ width: '16px', height: '16px' }} />
              <span>{mismatchCount} Mismatch Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Governor Ticket Agents Roster */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            Governor Ticket Agents ({scopedAgents.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned to Nairobi County Polling Streams</span>
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

      {/* Top Stat Cards Grid */}
      <div className="grid-stats">
        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Registered Voters</div>
            <div className="stat-val">{county.registeredVoters.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
              17 Constituencies • 85 Wards
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Governor Leading Tally</div>
            <div className="stat-val" style={{ color: '#a5b4fc' }}>{sakajaSum.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Margin: +{(sakajaSum - igatheSum).toLocaleString()} votes
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Award style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">Polling Stations Reporting</div>
            <div className="stat-val">{approvedCount} / {totalSubmissions}</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
              Form 34A Signed & Approved
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)' }}>
            <CheckCircle style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        <div className="glass-card stat-box">
          <div>
            <div className="stat-label">IEBC Mismatch Flags</div>
            <div className="stat-val" style={{ color: mismatchCount > 0 ? '#f87171' : '#34d399' }}>
              {mismatchCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: mismatchCount > 0 ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.2rem' }}>
              {mismatchCount > 0 ? 'Requires Immediate Investigation' : 'Zero Discrepancies'}
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertOctagon style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid-dashboard">
        {/* Main Bar Chart */}
        <div className="glass-card col-span-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Nairobi County Gubernatorial Tally</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comparison of total valid votes counted from verified Form 34A evidence</p>
            </div>
            <span className="status-pill approved">
              <TrendingUp style={{ width: '12px', height: '12px' }} /> Live Stream
            </span>
          </div>

          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            <Bar 
              data={governorChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#1f2937', titleColor: '#fff', bodyColor: '#fff' }
                },
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
                }
              }}
            />
          </div>
        </div>

        {/* Turnout Doughnut Chart */}
        <div className="glass-card col-span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>County Turnout Ratio</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Voter participation progress</p>
          </div>

          <div style={{ height: '200px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Doughnut 
              data={turnoutData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 11 } } } }
              }}
            />
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> County tallies aggregate submissions from Westlands, Dagoretti, Starehe, Langata, and Kasarani.
          </div>
        </div>
      </div>

      {/* Submissions Table Summary */}
      <div className="glass-card col-span-12">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Form 34A Agent Uploads</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live evidence stream submitted by polling station agents</p>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Polling Station</th>
                <th>Agent Name</th>
                <th>Timestamp</th>
                <th>Form 34A Evidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scopedSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#a5b4fc' }}>{sub.id}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{sub.pollingStationName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {sub.pollingStationId}</div>
                  </td>
                  <td>{sub.agentName}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <a 
                      href={sub.evidence.form34AUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#06b6d4', textDecoration: 'underline', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
                      View Image ({sub.evidence.compressedSizeKb}KB)
                    </a>
                  </td>
                  <td>
                    <span className={`status-pill ${sub.status.toLowerCase()}`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
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
