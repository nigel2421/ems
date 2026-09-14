import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Flag,
  Megaphone,
  Network,
  Radio,
  Vote,
  X,
  ListChecks,
  Gauge,
  CircleDot,
  ArrowRight
} from 'lucide-react';
import './CampaignStrategy.css';

const PHASE_ICONS = [Megaphone, Users, Network, Radio, Vote];

const CircularProgress = ({ value = 0, size = 'neutral', size = 88 }) => {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`strategy-ring strategy-ring-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="strategy-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="strategy-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="strategy-ring-label">
        <strong>{value}%</strong>
      </div>
    </div>
  );
};

const statusTone = (status) => {
  if (status === 'Completed') return 'done';
  if (status === 'Active') return 'active';
  return 'pending';
};

export const CampaignStrategy = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { campaignPhases, updateCampaignTask } = useData();
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);

  const selectedPhase = useMemo(
    () => campaignPhases.find((p) => p.id === selectedPhaseId) || null,
    [campaignPhases, selectedPhaseId]
  );

  useEffect(() => {
    if (selectedPhaseId && !campaignPhases.some((p) => p.id === selectedPhaseId)) {
      setSelectedPhaseId(null);
    }
  }, [campaignPhases, selectedPhaseId]);

  const overallProgress = useMemo(() => {
    if (!campaignPhases.length) return 0;
    const total = campaignPhases.reduce((sum, p) => sum + (Number(p.progressPct) || 0), 0);
    return Math.round(total / campaignPhases.length);
  }, [campaignPhases]);

  const handleTaskStatusToggle = (phaseId, taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    updateCampaignTask(phaseId, taskId, { status: nextStatus }, currentUser);
  };

  return (
    <div className="strategy-shell">
      <header className="strategy-hero">
        <div className="strategy-hero-copy">
          <div className="strategy-kicker">
            <Target strokeWidth={1.75} />
            <span>Campaign operations</span>
          </div>
          <h1>Strategy phase roadmap</h1>
          <p>
            Select a phase to review objectives, action tasks, and KPI progress. Each phase is tracked independently.
          </p>
        </div>
        <div className="strategy-hero-stat">
          <CircularProgress value={overallProgress} tone="active" size={96} />
          <div>
            <strong>Overall progress</strong>
            <span>{campaignPhases.length} phases in the master plan</span>
          </div>
        </div>
      </header>

      <section className="strategy-phase-grid">
        {campaignPhases.map((phase, index) => {
          const Icon = PHASE_ICONS[index % PHASE_ICONS.length] || Flag;
          const tone = statusTone(phase.status);
          return (
            <button
              key={phase.id}
              type="button"
              className={`strategy-phase-card strategy-phase-card-${tone}`}
              onClick={() => setSelectedPhaseId(phase.id)}
            >
              <div className="strategy-phase-top">
                <div className="strategy-phase-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <span className={`strategy-status strategy-status-${tone}`}>{phase.status}</span>
              </div>

              <div className="strategy-phase-mid">
                <span className="strategy-phase-num">Phase {phase.phaseNumber}</span>
                <h2>{phase.name}</h2>
                <p>{phase.description}</p>
              </div>

              <div className="strategy-phase-foot">
                <CircularProgress value={phase.progressPct} tone={tone} size={84} />
                <div className="strategy-phase-meta">
                  <div>
                    <Calendar strokeWidth={1.75} />
                    <span>
                      {phase.startDate} → {phase.endDate}
                    </span>
                  </div>
                  <div>
                    <ListChecks strokeWidth={1.75} />
                    <span>{phase.tasks?.length || 0} action tasks</span>
                  </div>
                  <span className="strategy-open-hint">
                    Open details <ArrowRight strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {selectedPhase && (
        <div className="strategy-modal-overlay" onClick={() => setSelectedPhaseId(null)}>
          <div
            className="strategy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="strategy-phase-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-head">
              <div className="strategy-modal-title-row">
                <CircularProgress value={selectedPhase.progressPct} tone={statusTone(selectedPhase.status)} size={72} />
                <div>
                  <span className={`strategy-status strategy-status-${statusTone(selectedPhase.status)}`}>
                    {selectedPhase.status}
                  </span>
                  <h2 id="strategy-phase-title">
                    Phase {selectedPhase.phaseNumber}: {selectedPhase.name}
                  </h2>
                  <p>
                    {selectedPhase.startDate} to {selectedPhase.endDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="strategy-icon-btn"
                aria-label="Close phase details"
                onClick={() => setSelectedPhaseId(null)}
              >
                <X strokeWidth={1.75} />
              </button>
            </div>

            <p className="strategy-modal-desc">{selectedPhase.description}</p>

            <div className="strategy-modal-grid">
              <section className="strategy-panel">
                <div className="strategy-panel-head">
                  <CircleDot strokeWidth={1.75} />
                  <h3>Key objectives</h3>
                </div>
                <ul className="strategy-objective-list">
                  {(selectedPhase.objectives || []).map((obj) => (
                    <li key={obj}>
                      <CheckCircle2 strokeWidth={1.75} />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="strategy-panel">
                <div className="strategy-panel-head">
                  <Gauge strokeWidth={1.75} />
                  <h3>KPI progress</h3>
                </div>
                <div className="strategy-kpi-list">
                  {(selectedPhase.tasks || []).map((task) => (
                    <div key={task.id} className="strategy-kpi-item">
                      <strong>{task.title}</strong>
                      <div>
                        <span>Target: {task.kpiTarget}</span>
                        <span>Current: {task.kpiCurrent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="strategy-panel strategy-panel-tasks">
              <div className="strategy-panel-head">
                <ListChecks strokeWidth={1.75} />
                <h3>Action tasks ({selectedPhase.tasks?.length || 0})</h3>
              </div>
              <div className="strategy-task-list">
                {(selectedPhase.tasks || []).map((task) => {
                  const done = task.status === 'Completed';
                  return (
                    <div key={task.id} className={`strategy-task-row${done ? ' is-done' : ''}`}>
                      <button
                        type="button"
                        className="strategy-task-toggle"
                        title={done ? 'Mark in progress' : 'Mark completed'}
                        onClick={() => handleTaskStatusToggle(selectedPhase.id, task.id, task.status)}
                      >
                        {done ? <CheckCircle2 strokeWidth={1.75} /> : <Clock strokeWidth={1.75} />}
                      </button>
                      <div className="strategy-task-copy">
                        <strong>{task.title}</strong>
                        <div>
                          <span>
                            <Users strokeWidth={1.75} /> {task.assignedTeam}
                          </span>
                          <span>
                            <Calendar strokeWidth={1.75} /> {task.dueDate}
                          </span>
                        </div>
                      </div>
                      <span className={`strategy-status strategy-status-${done ? 'done' : 'active'}`}>
                        {task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
