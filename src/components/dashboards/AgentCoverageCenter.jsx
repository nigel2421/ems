import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Radio,
  UserX,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import './AgentCoverageCenter.css';

export const AgentCoverageCenter = () => {
  const { currentUser, userScope } = useAuth();
  const { agents, geography, getScopedAgents } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');

  const scopedAgentList = useMemo(() => {
    return getScopedAgents(currentUser);
  }, [currentUser, agents, getScopedAgents]);

  // Operational Deployment Metrics Calculation
  const deploymentMetrics = useMemo(() => {
    const required = 4820;
    const assigned = scopedAgentList.length ? Math.min(required, scopedAgentList.length * 900) : 4611;
    const confirmed = Math.round(assigned * 0.962);
    const unassigned = required - assigned;
    const unavailable = 64;
    const replacementRequired = 31;
    const coveragePct = ((confirmed / required) * 100).toFixed(1);

    return {
      required,
      assigned,
      confirmed,
      unassigned,
      unavailable,
      replacementRequired,
      coveragePct
    };
  }, [scopedAgentList]);

  // County Coverage Map Data
  const regionalCoverage = [
    { county: 'Nairobi County', required: 1250, confirmed: 1225, pct: 98.0 },
    { county: 'Kiambu County', required: 980, confirmed: 921, pct: 94.0 },
    { county: 'Mombasa County', required: 650, confirmed: 598, pct: 92.0 },
    { county: 'Nakuru County', required: 1100, confirmed: 968, pct: 88.0 },
    { county: 'Machakos County', required: 840, confirmed: 689, pct: 82.0 }
  ];

  // Actionable Exceptions Queue
  const exceptionItems = [
    { id: 'EXC-101', type: 'CRITICAL', title: '12 Stations without agents bound', region: 'Machakos — Yatta Constituency', time: '10 mins ago' },
    { id: 'EXC-102', type: 'WARNING', title: '23 Unconfirmed agent deployments', region: 'Nakuru — Naivasha Ward', time: '25 mins ago' },
    { id: 'EXC-103', type: 'WARNING', title: '18 Duplicate station stream assignments', region: 'Nairobi — Embakasi East', time: '40 mins ago' },
    { id: 'EXC-104', type: 'URGENT', title: '7 Agents inactive > 12 hours', region: 'Mombasa — Nyali Ward', time: '1 hour ago' },
    { id: 'EXC-105', type: 'CRITICAL', title: '4 Critical station incidents flagged', region: 'Kiambu — Ruiru Ward', time: '2 hours ago' }
  ];

  return (
    <div className="agent-coverage-shell">
      <header className="acc-header">
        <div>
          <div className="acc-badge">
            <Radio size={14} className="acc-pulse" /> LIVE ACCREDITATION & DEPLOYMENT TRACKER
          </div>
          <h1>Agent Coverage Command Center</h1>
          <p>
            Scope: <strong>{userScope?.name || 'National Scope'}</strong> · Real-time deployment, confirmation, and exception dispatch.
          </p>
        </div>
      </header>

      {/* Metric Cards Grid */}
      <section className="acc-metrics-grid">
        <article className="acc-card is-highlight">
          <div className="acc-card-head">
            <span>Overall Coverage</span>
            <ShieldCheck size={20} className="acc-icon-ok" />
          </div>
          <strong className="acc-big-val">{deploymentMetrics.coveragePct}%</strong>
          <div className="acc-bar-wrap">
            <div className="acc-bar-fill" style={{ width: `${deploymentMetrics.coveragePct}%` }} />
          </div>
          <small>{deploymentMetrics.confirmed.toLocaleString()} of {deploymentMetrics.required.toLocaleString()} positions confirmed</small>
        </article>

        <article className="acc-card">
          <div className="acc-card-head">
            <span>Required Positions</span>
            <Users size={20} />
          </div>
          <strong className="acc-val">{deploymentMetrics.required.toLocaleString()}</strong>
          <small>Total polling stream targets</small>
        </article>

        <article className="acc-card">
          <div className="acc-card-head">
            <span>Assigned Agents</span>
            <CheckCircle2 size={20} className="acc-icon-ok" />
          </div>
          <strong className="acc-val">{deploymentMetrics.assigned.toLocaleString()}</strong>
          <small>{deploymentMetrics.unassigned} streams unassigned</small>
        </article>

        <article className="acc-card">
          <div className="acc-card-head">
            <span>Confirmed On Duty</span>
            <ShieldCheck size={20} className="acc-icon-ok" />
          </div>
          <strong className="acc-val">{deploymentMetrics.confirmed.toLocaleString()}</strong>
          <small>Accredited & ready</small>
        </article>

        <article className="acc-card is-warn">
          <div className="acc-card-head">
            <span>Action Required</span>
            <AlertTriangle size={20} className="acc-icon-warn" />
          </div>
          <strong className="acc-val">{deploymentMetrics.replacementRequired + deploymentMetrics.unavailable}</strong>
          <small>{deploymentMetrics.replacementRequired} replacements · {deploymentMetrics.unavailable} unavailable</small>
        </article>
      </section>

      {/* Main Grid: Regional Coverage & Exception Action Panel */}
      <div className="acc-main-grid">
        {/* Regional Coverage Progress Bars */}
        <article className="acc-panel">
          <div className="acc-panel-head">
            <h3>Regional Deployment Breakdown</h3>
            <span className="acc-subtitle">County-by-county deployment percentage</span>
          </div>

          <div className="acc-regional-list">
            {regionalCoverage.map((reg, idx) => (
              <div key={idx} className="acc-reg-row">
                <div className="acc-reg-info">
                  <strong>{reg.county}</strong>
                  <span>{reg.confirmed.toLocaleString()} / {reg.required.toLocaleString()} confirmed</span>
                </div>
                <div className="acc-reg-bar-outer">
                  <div
                    className={`acc-reg-bar-inner ${reg.pct >= 90 ? 'is-good' : reg.pct >= 85 ? 'is-mid' : 'is-low'}`}
                    style={{ width: `${reg.pct}%` }}
                  />
                </div>
                <span className="acc-reg-pct">{reg.pct}%</span>
              </div>
            ))}
          </div>
        </article>

        {/* Actionable Exception Panel */}
        <article className="acc-panel acc-exceptions-panel">
          <div className="acc-panel-head">
            <h3>🚨 Deployment Exception Panel</h3>
            <span className="acc-subtitle">Actionable readiness bottlenecks</span>
          </div>

          <div className="acc-exception-list">
            {exceptionItems.map((exc) => (
              <div key={exc.id} className={`acc-exc-item is-${exc.type.toLowerCase()}`}>
                <div className="acc-exc-head">
                  <span className={`acc-exc-badge is-${exc.type.toLowerCase()}`}>{exc.type}</span>
                  <span className="acc-exc-time">{exc.time}</span>
                </div>
                <h4>{exc.title}</h4>
                <p><MapPin size={13} /> {exc.region}</p>
                <div className="acc-exc-actions">
                  <button type="button" className="acc-btn-action">Resolve</button>
                  <button type="button" className="acc-btn-sub">Reassign</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Agent Roster Directory Table */}
      <article className="acc-panel acc-roster-panel">
        <div className="acc-panel-head acc-roster-head">
          <div>
            <h3>Active Field Agent Roster</h3>
            <span className="acc-subtitle">{scopedAgentList.length} agents registered in scope</span>
          </div>
          <div className="acc-search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search agent name, phone, or station"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="acc-search-input"
            />
          </div>
        </div>

        <div className="acc-table-wrap">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Assigned Station</th>
                <th>Supervisor</th>
                <th>Status</th>
                <th>Reports</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {scopedAgentList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="acc-empty">No agents found in this scope.</td>
                </tr>
              ) : (
                scopedAgentList.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <strong>{ag.name || ag.fullName}</strong>
                      <span className="acc-subtext">{ag.phone || '+254 700 000 000'}</span>
                    </td>
                    <td>
                      <strong>{ag.assignedEntity || ag.region}</strong>
                    </td>
                    <td>{ag.supervisor || 'District Coordinator'}</td>
                    <td>
                      <span className={`acc-status-tag is-${(ag.status || 'Active').toLowerCase().replace(' ', '-')}`}>
                        {ag.status || 'Active'}
                      </span>
                    </td>
                    <td><strong>{ag.reportsSubmittedCount || 0}</strong></td>
                    <td className="acc-subtext">{ag.lastActivityTimestamp ? new Date(ag.lastActivityTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active now'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};
