import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  AlertTriangle,
  UserCheck,
  Building2,
  Activity,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { JurisdictionVoterAnalytics } from './JurisdictionVoterAnalytics';
import {
  resolveJurisdiction,
  hasNationalGeographyAccess,
  filterTalliesByJurisdiction
} from '../../utils/jurisdictionAnalytics';
import './DashboardShared.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const RegionalDashboard = ({ onOpenModule }) => {
  const { currentUser } = useAuth();
  const { agents, fieldReports, tallyResults, getScopedAgents, geography } = useData();

  const scopedAgents = getScopedAgents ? getScopedAgents(currentUser, agents) : agents;
  const scope = resolveJurisdiction(currentUser, geography);
  const regionName =
    scope.title || currentUser?.entityName || currentUser?.assignedEntity || 'Regional Operations';

  const scopedTallies = filterTalliesByJurisdiction(
    tallyResults,
    geography?.pollingStations || [],
    scope,
    { national: hasNationalGeographyAccess(currentUser) }
  );

  const regionalIncidents = fieldReports.filter(
    (r) =>
      (r.locationName && regionName && r.locationName.toLowerCase().includes(regionName.toLowerCase())) ||
      r.severityLevel === 'High' ||
      r.severityLevel === 'Critical'
  );
  const pendingTallyVerifications = scopedTallies.filter((t) => t.status === 'Submitted' || t.status === 'Mismatch');
  const activeAgents = scopedAgents.filter((a) => a.status === 'Active' || a.status === 'On Duty').length;

  const personaKey = `${currentUser?.role || ''} ${currentUser?.name || ''} ${currentUser?.email || ''}`.toLowerCase();
  const roleTitle =
    currentUser?.role === 'MCA' || personaKey.includes('mca')
      ? 'MCA ward command'
      : currentUser?.role === 'MP' ||
          currentUser?.role === 'Regional Coordinator' ||
          personaKey.includes('mp ')
        ? 'MP constituency command'
        : 'Regional operations';

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>{roleTitle}</h1>
          <p>
            Real voter analytics for {regionName}
            {scope.level === 'ward'
              ? ' — polling stream concentrations and GOTV priorities.'
              : ' — ward voter blocks, station coverage, and tally verification.'}
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => onOpenModule('strategy_team')}>
            <Users strokeWidth={1.75} />
            Strategy Team
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('agents')}>
            <UserCheck strokeWidth={1.75} />
            Assign agents
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('tally_center')}>
            <ShieldCheck strokeWidth={1.75} />
            Tally queue ({pendingTallyVerifications.length})
          </button>
        </div>
      </header>

      <JurisdictionVoterAnalytics user={currentUser} geography={geography} onOpenModule={onOpenModule} />

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Field agents</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(scopedAgents.length)}</strong>
          <small>{activeAgents} active / on duty</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Jurisdiction</span>
            <div className="admin-metric-icon"><Building2 strokeWidth={1.75} /></div>
          </div>
          <strong style={{ fontSize: '1.15rem' }}>{regionName}</strong>
          <small>{scope.label} operations desk</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Pending tallies</span>
            <div className="admin-metric-icon"><AlertTriangle strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(pendingTallyVerifications.length)}</strong>
          <small>{scopedTallies.filter((t) => t.status === 'Mismatch').length} mismatch flags</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Incidents</span>
            <div className="admin-metric-icon"><Activity strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(regionalIncidents.length)}</strong>
          <small>Field reports in scope</small>
        </article>
      </section>

      <section className="admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Field agents roster</h2>
              <p>Assigned stations, status, and performance</p>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('agents')}>
              Directory
              <ArrowUpRight strokeWidth={1.75} />
            </button>
          </div>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Region / ward</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {scopedAgents.length > 0 ? (
                  scopedAgents.map((ag) => (
                    <tr key={ag.id}>
                      <td style={{ fontWeight: 600 }}>{ag.fullName || ag.name}</td>
                      <td>{ag.region}</td>
                      <td><span className={`status-pill ${String(ag.status).toLowerCase().replace(' ', '-')}`}>{ag.status}</span></td>
                      <td>
                        {ag.reportsSubmittedCount || 0} reps / {ag.surveysCompletedCount || 0} surv
                      </td>
                      <td style={{ fontWeight: 700, color: '#006B3F' }}>★ {ag.performanceRating || '4.5'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="admin-empty">No field agents assigned to {regionName} yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Tally sign-off queue</h2>
              <p>Incoming Form 34A returns</p>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('tally_center')}>
              Open tally
            </button>
          </div>
          <div className="admin-list">
            {scopedTallies.map((tally) => (
              <div key={tally.id} className="admin-list-item">
                <div className="admin-metric-icon"><ShieldCheck strokeWidth={1.75} /></div>
                <div>
                  <strong>{tally.pollingStationName}</strong>
                  <span>
                    Votes cast {tally.totalVotesCast} · Reg {tally.registeredVoters}
                  </span>
                </div>
                <span className="admin-chip">{tally.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};
