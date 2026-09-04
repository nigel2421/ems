import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  BrainCircuit,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const StrategyDashboard = ({ onOpenModule, onOpenAIAssistant }) => {
  const { currentUser } = useAuth();
  const { campaignPhases, stationIntelligence, fieldReports, stakeholders, surveys, tallyResults } = useData();

  const activePhase = campaignPhases.find(p => p.status === 'Active') || campaignPhases[2];
  const highRiskStations = Object.entries(stationIntelligence).filter(([_, data]) => data.riskLevel === 'Severe' || data.riskLevel === 'High');
  const criticalReports = fieldReports.filter(r => r.severityLevel === 'High' || r.severityLevel === 'Critical');
  const totalReachEstimate = stakeholders.reduce((acc, curr) => acc + (curr.reachEstimate || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.5rem 1.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <BrainCircuit style={{ width: '16px', height: '16px' }} />
            <span>Strategic War Room & Campaign Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem', color: '#fff' }}>
            Executive Strategy Command
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Real-time analytics, voter sentiment tracking, phase KPIs, and AI intelligence analysis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={onOpenAIAssistant}
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '0.75rem 1.25rem' }}
          >
            <Sparkles style={{ width: '18px', height: '18px' }} />
            <span>Launch AI Strategy Assistant</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onOpenModule('strategy')}
          >
            <Target style={{ width: '16px', height: '16px' }} />
            <span>View Full Campaign Plan</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Active Campaign Phase</span>
            <Target style={{ width: '18px', height: '18px', color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', marginTop: '0.5rem' }}>
            Phase {activePhase.phaseNumber}: {activePhase.name.split(' ')[0]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${activePhase.progressPct}%`, height: '100%', background: '#6366f1', borderRadius: '4px' }}></div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#818cf8' }}>{activePhase.progressPct}%</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>High Risk Hotspots</span>
            <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#f87171' }}>
            {highRiskStations.length} Wards
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Severe opponent strength flagged
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Stakeholder Network Reach</span>
            <Users style={{ width: '18px', height: '18px', color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#34d399' }}>
            {totalReachEstimate.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Voters influenced via elders & clergy
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Survey Responses</span>
            <BarChart3 style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#22d3ee' }}>
            {surveys.reduce((acc, s) => acc + (s.responseCount || 0), 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Voter sentiment inputs collected
          </div>
        </div>
      </div>

      {/* Main Grid: AI Intelligence Recommendations + High Risk Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Strategic Action Plans & Phase Progress */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Phase {activePhase.phaseNumber} Action Plan & KPIs</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {activePhase.description}
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenModule('strategy')}>
              Manage Tasks
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activePhase.tasks.map(task => (
              <div 
                key={task.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {task.status === 'Completed' ? (
                    <CheckCircle2 style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
                  ) : (
                    <Clock style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{task.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                      <span>Team: <strong>{task.assignedTeam}</strong></span>
                      <span>KPI: <strong>{task.kpiCurrent} / {task.kpiTarget}</strong></span>
                    </div>
                  </div>
                </div>

                <span className={`status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Assistant Insights & High Risk Incident Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI Quick Insight Box */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem',
              background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.12) 0%, rgba(13, 17, 31, 0.9) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: '800' }}>
                <Sparkles style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                <span>AI Automated Strategy Briefing</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={onOpenAIAssistant} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                Ask AI <ArrowUpRight style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
            <div style={{ fontSize: '0.84rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
              "Youth employment remains the #1 issue across Westlands and Dagoretti. Opposition activity has spiked by +18% in Dagoretti Corner. Recommended action: Schedule townhall with Bodaboda association leaders before Friday."
            </div>
          </div>

          {/* Critical Incident Alert Feed */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Field Intelligence & Incidents</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => onOpenModule('field_reports')}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {fieldReports.slice(0, 3).map(rep => (
                <div key={rep.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`status-pill ${rep.severityLevel.toLowerCase()}`}>{rep.severityLevel}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '0.35rem' }}>
                    {rep.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {rep.locationName} - Reported by {rep.agentName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
