import React from 'react';
import { useData } from '../../context/DataContext';
import {
  Eye,
  Vote,
  BarChart3,
  ShieldCheck,
  Building2
} from 'lucide-react';
import './DashboardShared.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const ObserverDashboard = () => {
  const { geography, surveys, tallyResults } = useData();

  const totalPollingStations = geography.pollingStations?.length || 0;
  const verifiedTallies = tallyResults.filter((t) => t.status === 'Approved' || t.status === 'Verified');
  const totalVotesCast = tallyResults.reduce((acc, t) => acc + (t.totalVotesCast || 0), 0);
  const surveyResponses = surveys.reduce((acc, s) => acc + (s.responseCount || 0), 0);

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>Observer portal</h1>
          <p>Read-only transparency desk for election monitoring and public analytics.</p>
        </div>
        <div className="admin-head-actions">
          <span className="admin-chip" style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 0.9rem' }}>
            <Eye strokeWidth={1.75} style={{ width: 15, height: 15 }} />
            Read-only mode
          </span>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Polling stations</span>
            <div className="admin-metric-icon"><Building2 strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(totalPollingStations)}</strong>
          <small>Gazetted electoral streams</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Verified returns</span>
            <div className="admin-metric-icon"><ShieldCheck strokeWidth={1.75} /></div>
          </div>
          <strong>
            {verifiedTallies.length} / {tallyResults.length}
          </strong>
          <small>Form 34A evidence verified</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Votes processed</span>
            <div className="admin-metric-icon"><Vote strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(totalVotesCast)}</strong>
          <small>Ballots recorded across streams</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Survey inputs</span>
            <div className="admin-metric-icon"><BarChart3 strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(surveyResponses)}</strong>
          <small>Voter sentiment responses</small>
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Tally stream summary</h2>
            <p>Election day Form 34A returns</p>
          </div>
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Candidate A</th>
                <th>Candidate B</th>
                <th>Candidate C</th>
                <th>Total cast</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tallyResults.map((tally) => (
                <tr key={tally.id}>
                  <td style={{ fontWeight: 600 }}>{tally.pollingStationName}</td>
                  <td style={{ fontWeight: 700, color: '#006B3F' }}>{tally.candAVotes}</td>
                  <td>{tally.candBVotes}</td>
                  <td>{tally.candCVotes}</td>
                  <td style={{ fontWeight: 700 }}>{tally.totalVotesCast}</td>
                  <td><span className={`status-pill ${tally.status.toLowerCase()}`}>{tally.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};
