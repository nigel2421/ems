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
import './DashboardShared.css';

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
        backgroundColor: ['#006B3F', '#0E7A45', '#A7C4B5'],
        borderColor: ['#073322', '#006B3F', '#6B756F'],
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
        backgroundColor: ['#006B3F', '#C9A227', '#BB0A21'],
        borderColor: '#FFFFFF',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>{county.name} Executive Dashboard</h1>
          <p>
            County-wide live voting tally, turnouts, agent evidence status, and mismatch detection.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowAddAgent(true)}>
            <UserPlus strokeWidth={1.75} />
            Add Governor Agent
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={onOpenGeographic}>
            <Map strokeWidth={1.75} />
            Geo Inspector
          </button>
          {mismatchCount > 0 && (
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenMismatch} style={{ borderColor: '#BB0A21', color: '#BB0A21' }}>
              <AlertOctagon strokeWidth={1.75} />
              {mismatchCount} Mismatch Alerts
            </button>
          )}
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Registered Voters</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{county.registeredVoters.toLocaleString()}</strong>
          <small>17 Constituencies · 85 Wards</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Governor Leading Tally</span>
            <div className="admin-metric-icon"><Award strokeWidth={1.75} /></div>
          </div>
          <strong>{sakajaSum.toLocaleString()}</strong>
          <small>Margin: +{(sakajaSum - igatheSum).toLocaleString()} votes</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Polling Stations Reporting</span>
            <div className="admin-metric-icon"><CheckCircle strokeWidth={1.75} /></div>
          </div>
          <strong>{approvedCount} / {totalSubmissions}</strong>
          <small>Form 34A Signed & Approved</small>
        </article>

        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Mismatch Flags</span>
            <div className="admin-metric-icon"><AlertOctagon strokeWidth={1.75} /></div>
          </div>
          <strong>{mismatchCount}</strong>
          <small>{mismatchCount > 0 ? 'Requires Immediate Investigation' : 'Zero Discrepancies'}</small>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Governor Ticket Agents ({scopedAgents.length})</h2>
            <p>Assigned to Nairobi County Polling Streams</p>
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

      <section className="admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Nairobi County Gubernatorial Tally</h2>
              <p>Comparison of total valid votes counted from verified Form 34A evidence</p>
            </div>
            <span className="admin-chip">
              <TrendingUp strokeWidth={1.75} style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Live Stream
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
                  tooltip: { backgroundColor: '#073322', titleColor: '#fff', bodyColor: '#fff' }
                },
                scales: {
                  x: { grid: { color: '#E6EBE8' }, ticks: { color: '#6B756F' } },
                  y: { grid: { color: '#E6EBE8' }, ticks: { color: '#6B756F' } }
                }
              }}
            />
          </div>
        </article>

        <article className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-head">
            <div>
              <h2>County Turnout Ratio</h2>
              <p>Voter participation progress</p>
            </div>
          </div>
          <div style={{ height: '200px', position: 'relative', display: 'flex', justifyContent: 'center', flex: 1 }}>
            <Doughnut
              data={turnoutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#6B756F', font: { size: 11 } }
                  }
                }
              }}
            />
          </div>
          <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#6B756F', lineHeight: 1.45 }}>
            <strong>Note:</strong> County tallies aggregate submissions from Westlands, Dagoretti, Starehe, Langata, and Kasarani.
          </p>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Recent Form 34A Agent Uploads</h2>
            <p>Live evidence stream submitted by polling station agents</p>
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#006B3F' }}>{sub.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.pollingStationName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B756F' }}>Code: {sub.pollingStationId}</div>
                  </td>
                  <td>{sub.agentName}</td>
                  <td style={{ fontSize: '0.8rem', color: '#6B756F' }}>
                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <a
                      href={sub.evidence.form34AUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#006B3F', textDecoration: 'underline', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <FileSpreadsheet strokeWidth={1.75} style={{ width: 14, height: 14 }} />
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
