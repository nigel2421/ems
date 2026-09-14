import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import './DashboardShared.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const StrategyDashboard = ({ onOpenModule, onOpenAIAssistant }) => {
  const { currentUser } = useAuth();
  const { campaignPhases, stationIntelligence, fieldReports, stakeholders, surveys } = useData();

  const activePhase = campaignPhases.find((p) => p.status === 'Active') || campaignPhases[2];
  const highRiskStations = Object.entries(stationIntelligence || {}).filter(
    ([, data]) => data.riskLevel === 'Severe' || data.riskLevel === 'High'
  );
  const totalReachEstimate = stakeholders.reduce((acc, curr) => acc + (curr.reachEstimate || 0), 0);
  const surveyResponses = surveys.reduce((acc, s) => acc + (s.responseCount || 0), 0);

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>Strategy command</h1>
          <p>
            Campaign intelligence for {currentUser?.name || 'strategy team'} — phase KPIs, field risks, and AI briefings.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={onOpenAIAssistant}>
            <Sparkles strokeWidth={1.75} />
            AI assistant
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('strategy')}>
            <Target strokeWidth={1.75} />
            Campaign plan
          </button>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Active phase</span>
            <div className="admin-metric-icon"><Target strokeWidth={1.75} /></div>
          </div>
          <strong>Phase {activePhase?.phaseNumber}</strong>
          <small>{activePhase?.name}</small>
          <div className="admin-progress">
            <div className="admin-progress-track">
              <div className="admin-progress-fill" style={{ width: `${activePhase?.progressPct || 0}%`, background: '#C9A227' }} />
            </div>
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{activePhase?.progressPct || 0}%</strong>
          </div>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>High risk hotspots</span>
            <div className="admin-metric-icon"><AlertTriangle strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(highRiskStations.length)}</strong>
          <small>Severe / high risk wards</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Network reach</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(totalReachEstimate)}</strong>
          <small>Stakeholder influence estimate</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Survey responses</span>
            <div className="admin-metric-icon"><BarChart3 strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(surveyResponses)}</strong>
          <small>Voter sentiment inputs</small>
        </article>
      </section>

      <section className="admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Phase {activePhase?.phaseNumber} action plan</h2>
              <p>{activePhase?.description}</p>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('strategy')}>
              Manage tasks
              <ArrowUpRight strokeWidth={1.75} />
            </button>
          </div>
          <div className="admin-list">
            {(activePhase?.tasks || []).map((task) => (
              <div key={task.id} className="admin-list-item">
                <div className="admin-metric-icon">
                  {task.status === 'Completed' ? <CheckCircle2 strokeWidth={1.75} /> : <Clock strokeWidth={1.75} />}
                </div>
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    {task.assignedTeam} · {task.kpiCurrent} / {task.kpiTarget}
                  </span>
                </div>
                <span className="admin-chip">{task.status}</span>
              </div>
            ))}
          </div>
        </article>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <article className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>AI briefing</h2>
                <p>Automated strategy note</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenAIAssistant}>
                <Sparkles strokeWidth={1.75} />
                Ask AI
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: '#6B756F' }}>
              Youth employment remains the top issue across Westlands and Dagoretti. Opposition activity has spiked in
              Dagoretti Corner. Recommended action: schedule a townhall with bodaboda association leaders before Friday.
            </p>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Field intelligence</h2>
                <p>Latest incident reports</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('field_reports')}>
                <FileText strokeWidth={1.75} />
                View all
              </button>
            </div>
            <div className="admin-list">
              {fieldReports.slice(0, 3).map((rep) => (
                <div key={rep.id} className="admin-list-item">
                  <div className="admin-metric-icon"><AlertTriangle strokeWidth={1.75} /></div>
                  <div>
                    <strong>{rep.title}</strong>
                    <span>
                      {rep.locationName} · {rep.agentName}
                    </span>
                  </div>
                  <span className="admin-chip">{rep.severityLevel}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
