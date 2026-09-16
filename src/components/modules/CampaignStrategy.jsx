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
  ArrowRight,
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  MapPinned,
  MessageSquare,
  Wallet,
  UserRound
} from 'lucide-react';
import './CampaignStrategy.css';

const PHASE_ICONS = [Megaphone, Users, Network, Radio, Vote];

const INTEL_FACTORS = [
  {
    id: 'sentiment',
    label: 'Candidate favourability',
    help: 'Share of likely voters leaning toward your candidate',
    icon: TrendingUp,
    agentCanInput: false
  },
  {
    id: 'turnout',
    label: 'Turnout likelihood',
    help: 'Expected participation among your base and swing voters',
    icon: Vote,
    agentCanInput: true
  },
  {
    id: 'groundGame',
    label: 'Ground organisation',
    help: 'Ward structures, agents, and door-to-door capacity',
    icon: Users,
    agentCanInput: true
  },
  {
    id: 'messageReach',
    label: 'Message penetration',
    help: 'How widely campaign messaging is understood and recalled',
    icon: MessageSquare,
    agentCanInput: true
  },
  {
    id: 'opponentPressure',
    label: 'Opponent pressure',
    help: 'Strength of competing campaigns in contested stations',
    icon: ShieldAlert,
    agentCanInput: true
  },
  {
    id: 'agentCoverage',
    label: 'Polling agent coverage',
    help: 'Share of stations with deployed and trained agents',
    icon: MapPinned,
    agentCanInput: true
  },
  {
    id: 'resourceReadiness',
    label: 'Resource readiness',
    help: 'Logistics, materials, and funding for the next 14 days',
    icon: Wallet,
    agentCanInput: false
  },
  {
    id: 'youthEngagement',
    label: 'Youth engagement',
    help: 'Digital reach and mobilisation among first-time voters',
    icon: UserRound,
    agentCanInput: true
  }
];

const clampPercent = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
};

const defaultScores = () =>
  INTEL_FACTORS.reduce((acc, f) => {
    acc[f.id] = 50;
    return acc;
  }, {});

const scoreBand = (value) => {
  if (value >= 70) return 'strong';
  if (value >= 40) return 'moderate';
  return 'weak';
};

const scoreRingVariant = (value) => {
  if (value >= 70) return 'done';
  if (value >= 40) return 'active';
  return 'pending';
};

const isAgentRole = (role) => role === 'Field Agent' || role === 'Agent';


const generateStrategies = (scores) => {
  const avg =
    INTEL_FACTORS.reduce((sum, f) => sum + Number(scores[f.id] || 0), 0) / INTEL_FACTORS.length;

  const recommendations = [];

  if (scores.sentiment < 45) {
    recommendations.push({
      id: 'sentiment-rebuild',
      priority: 'Critical',
      title: 'Rebuild favourability in swing wards',
      rationale: `Favourability is at ${scores.sentiment}% — below competitive threshold.`,
      actions: [
        'Deploy candidate walkabouts in top 10 swing wards',
        'Issue a 72-hour issue-based messaging burst',
        'Activate local influencers and faith networks'
      ]
    });
  } else if (scores.sentiment >= 70) {
    recommendations.push({
      id: 'sentiment-defend',
      priority: 'High',
      title: 'Defend strong favourability lead',
      rationale: `Favourability is strong at ${scores.sentiment}%.`,
      actions: [
        'Increase positive reinforcement media',
        'Protect soft supporters with reminder SMS',
        'Avoid high-risk controversy windows'
      ]
    });
  }

  if (scores.turnout < 50) {
    recommendations.push({
      id: 'turnout-lift',
      priority: 'Critical',
      title: 'Lift base turnout operations',
      rationale: `Turnout likelihood is only ${scores.turnout}%.`,
      actions: [
        'Build same-day transport and water points near stations',
        'Assign turnout captains per stream',
        'Run GOTV call banks 48 hours before Election Day'
      ]
    });
  }

  if (scores.groundGame < 55) {
    recommendations.push({
      id: 'ground-rebuild',
      priority: 'High',
      title: 'Strengthen ward command structure',
      rationale: `Ground organisation scores ${scores.groundGame}%.`,
      actions: [
        'Fill vacant ward coordinator roles within 5 days',
        'Run weekend agent drills with attendance logs',
        'Set daily field reporting cut-off at 18:00'
      ]
    });
  }

  if (scores.messageReach < 50) {
    recommendations.push({
      id: 'message-amplify',
      priority: 'High',
      title: 'Amplify core message penetration',
      rationale: `Message recall is weak at ${scores.messageReach}%.`,
      actions: [
        'Simplify manifesto to three recallable pledges',
        'Flood vernacular radio and WhatsApp clusters',
        'Use polling-station leafleting in morning peaks'
      ]
    });
  }

  if (scores.opponentPressure >= 60) {
    recommendations.push({
      id: 'opponent-counter',
      priority: 'Critical',
      title: 'Counter opponent pressure zones',
      rationale: `Opponent pressure is elevated at ${scores.opponentPressure}%.`,
      actions: [
        'Map contested stations and assign rapid-response teams',
        'Increase presence of party agents and legal desks',
        'Track narrative attacks every 4 hours'
      ]
    });
  }

  if (scores.agentCoverage < 65) {
    recommendations.push({
      id: 'agent-coverage',
      priority: 'Critical',
      title: 'Close polling agent coverage gaps',
      rationale: `Agent coverage stands at ${scores.agentCoverage}%.`,
      actions: [
        'Assign agents to uncovered stations immediately',
        'Prioritise high-registration streams first',
        'Verify accreditation packs before deployment'
      ]
    });
  }

  if (scores.resourceReadiness < 50) {
    recommendations.push({
      id: 'resource-surge',
      priority: 'High',
      title: 'Surge logistics and campaign materials',
      rationale: `Resource readiness is at ${scores.resourceReadiness}%.`,
      actions: [
        'Reallocate fuel and branded materials to hot wards',
        'Pre-position Election Day kits by Thursday',
        'Lock vendor SLAs for same-day replenishment'
      ]
    });
  }

  if (scores.youthEngagement < 55) {
    recommendations.push({
      id: 'youth-engage',
      priority: 'Medium',
      title: 'Boost youth and first-time voter engagement',
      rationale: `Youth engagement scores ${scores.youthEngagement}%.`,
      actions: [
        'Launch campus and estate digital town halls',
        'Partner with youth organisers for registration reminders',
        'Use short-form video with clear polling-day instructions'
      ]
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: 'balanced-hold',
      priority: 'Medium',
      title: 'Maintain balanced hold strategy',
      rationale: `Overall intelligence average is ${Math.round(avg)}% with no critical gaps.`,
      actions: [
        'Continue current phase roadmap with weekly reviews',
        'Protect leads while harvesting soft undecided voters',
        'Keep contingency teams ready for late swings'
      ]
    });
  }

  const priorityWeight = { Critical: 0, High: 1, Medium: 2 };
  recommendations.sort(
    (a, b) => (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9)
  );

  return {
    average: Math.round(avg),
    posture:
      avg >= 70 ? 'Advantage' : avg >= 50 ? 'Competitive' : 'Recovery',
    recommendations
  };
};

const CircularProgress = ({ value = 0, variant = 'neutral', diameter = 88 }) => {
  const stroke = 7;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`strategy-ring strategy-ring-${variant}`} style={{ width: diameter, height: diameter }}>
      <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} aria-hidden="true">
        <circle
          className="strategy-ring-track"
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="strategy-ring-value"
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
      </svg>
      <div className="strategy-ring-label">
        <strong>{value}%</strong>
      </div>
    </div>
  );
};

const getStatusVariant = (status) => {
  if (status === 'Completed') return 'done';
  if (status === 'Active') return 'active';
  return 'pending';
};

export const CampaignStrategy = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { campaignPhases, updateCampaignTask } = useData();
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [showIntelModal, setShowIntelModal] = useState(true);
  const [scores, setScores] = useState(defaultScores);
  const [strategyPlan, setStrategyPlan] = useState(null);
  const [intelStep, setIntelStep] = useState(0);

  const agentMode = isAgentRole(currentUser?.role);

  const editableFactors = useMemo(
    () => (agentMode ? INTEL_FACTORS.filter((f) => f.agentCanInput) : INTEL_FACTORS),
    [agentMode]
  );

  const currentFactor = editableFactors[intelStep] || editableFactors[0];
  const StepIcon = currentFactor?.icon;
  const stepValue = currentFactor ? scores[currentFactor.id] : 0;
  const isLastIntelStep = intelStep >= editableFactors.length - 1;
  const stepProgress = editableFactors.length
    ? Math.round(((intelStep + 1) / editableFactors.length) * 100)
    : 0;

  const openIntelModal = () => {
    setIntelStep(0);
    setShowIntelModal(true);
  };

  useEffect(() => {
    if (intelStep > editableFactors.length - 1) {
      setIntelStep(Math.max(0, editableFactors.length - 1));
    }
  }, [editableFactors.length, intelStep]);

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

  const handleScoreChange = (id, value) => {
    setScores((prev) => ({ ...prev, [id]: clampPercent(value) }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const plan = generateStrategies(scores);
    setStrategyPlan(plan);
    setShowIntelModal(false);
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
            Score poll intelligence factors to unlock recommended strategies, then track phase objectives and KPIs.
          </p>
        </div>
        <div className="strategy-hero-actions">
          <button
            type="button"
            className="strategy-intel-launch"
            onClick={openIntelModal}
          >
            <BrainCircuit strokeWidth={1.75} />
            Poll intelligence
          </button>
          <div className="strategy-hero-stat">
            <CircularProgress value={overallProgress} variant="active" diameter={96} />
            <div>
              <strong>Overall progress</strong>
              <span>{campaignPhases.length} phases in the master plan</span>
            </div>
          </div>
        </div>
      </header>

      {strategyPlan && (
        <section className="strategy-intel-results">
          <div className="strategy-intel-results-head">
            <div>
              <div className="strategy-kicker strategy-kicker-dark">
                <Sparkles strokeWidth={1.75} />
                <span>Generated from poll intelligence</span>
              </div>
              <h2>Recommended strategies</h2>
              <p>
                Posture: <strong>{strategyPlan.posture}</strong> · Average score{' '}
                <strong>{strategyPlan.average}%</strong>
              </p>
            </div>
            <CircularProgress
              value={strategyPlan.average}
              variant={strategyPlan.average >= 70 ? 'done' : strategyPlan.average >= 50 ? 'active' : 'pending'}
              diameter={84}
            />
          </div>

          <div className="strategy-intel-score-strip">
            {(agentMode ? editableFactors : INTEL_FACTORS).map((factor) => {
              const value = scores[factor.id];
              return (
                <div key={factor.id} className={`strategy-intel-chip strategy-intel-chip-${scoreBand(value)}`}>
                  <span>{factor.label}</span>
                  <strong>{value}%</strong>
                </div>
              );
            })}
          </div>

          <div className="strategy-reco-grid">
            {strategyPlan.recommendations.map((reco) => (
              <article key={reco.id} className={`strategy-reco-card strategy-reco-${reco.priority.toLowerCase()}`}>
                <div className="strategy-reco-top">
                  <span>{reco.priority}</span>
                  <h3>{reco.title}</h3>
                  <p>{reco.rationale}</p>
                </div>
                <ul>
                  {reco.actions.map((action) => (
                    <li key={action}>
                      <CheckCircle2 strokeWidth={1.75} />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="strategy-phase-grid">
        {campaignPhases.map((phase, index) => {
          const Icon = PHASE_ICONS[index % PHASE_ICONS.length] || Flag;
          const variant = getStatusVariant(phase.status);
          return (
            <button
              key={phase.id}
              type="button"
              className={`strategy-phase-card strategy-phase-card-${variant}`}
              onClick={() => setSelectedPhaseId(phase.id)}
            >
              <div className="strategy-phase-top">
                <div className="strategy-phase-icon">
                  <Icon strokeWidth={1.75} />
                </div>
                <span className={`strategy-status strategy-status-${variant}`}>{phase.status}</span>
              </div>

              <div className="strategy-phase-mid">
                <span className="strategy-phase-num">Phase {phase.phaseNumber}</span>
                <h2>{phase.name}</h2>
                <p>{phase.description}</p>
              </div>

              <div className="strategy-phase-foot">
                <CircularProgress value={phase.progressPct} variant={variant} diameter={84} />
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

      {showIntelModal && currentFactor && (
        <div className="strategy-modal-overlay" onClick={() => setShowIntelModal(false)}>
          <form
            className="strategy-modal strategy-intel-modal strategy-intel-modal-step"
            role="dialog"
            aria-modal="true"
            aria-labelledby="strategy-intel-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (isLastIntelStep) {
                handleGenerate(e);
              } else {
                setIntelStep((step) => Math.min(step + 1, editableFactors.length - 1));
              }
            }}
          >
            <div className="strategy-modal-head">
              <div className="strategy-modal-title-row">
                <div className="strategy-intel-mark">
                  <BrainCircuit strokeWidth={1.75} />
                </div>
                <div>
                  <span className="strategy-status strategy-status-active">
                    {agentMode ? 'Agent field intake' : 'Intelligence intake'}
                  </span>
                  <h2 id="strategy-intel-title">Poll intelligence</h2>
                  <p>
                    Step {intelStep + 1} of {editableFactors.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="strategy-icon-btn"
                aria-label="Close intelligence form"
                onClick={() => setShowIntelModal(false)}
              >
                <X strokeWidth={1.75} />
              </button>
            </div>

            <div className="strategy-intel-step-track" aria-hidden="true">
              <div className="strategy-intel-step-fill" style={{ width: `${stepProgress}%` }} />
            </div>

            <div className="strategy-intel-step-card">
              <div className="strategy-intel-field-head">
                <span>
                  {StepIcon ? <StepIcon strokeWidth={1.75} /> : null}
                  {currentFactor.label}
                </span>
                {currentFactor.agentCanInput && (
                  <em className="strategy-intel-agent-tag">Agent input</em>
                )}
              </div>
              <p>{currentFactor.help}</p>
              <div className="strategy-intel-control strategy-intel-control-step">
                <CircularProgress
                  value={stepValue}
                  variant={scoreRingVariant(stepValue)}
                  diameter={96}
                />
                <label className="strategy-intel-percent-input">
                  <span>Enter percentage</span>
                  <div>
                    <input
                      key={currentFactor.id}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      inputMode="numeric"
                      autoFocus
                      value={stepValue}
                      onChange={(e) => handleScoreChange(currentFactor.id, e.target.value)}
                      aria-label={`${currentFactor.label} percentage`}
                    />
                    <span>%</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="strategy-intel-actions strategy-intel-actions-step">
              <button
                type="button"
                className="strategy-btn-ghost"
                disabled={intelStep === 0}
                onClick={() => setIntelStep((step) => Math.max(0, step - 1))}
              >
                Back
              </button>
              <button type="button" className="strategy-btn-ghost" onClick={() => setShowIntelModal(false)}>
                Skip
              </button>
              <button type="submit" className="strategy-btn-primary">
                {isLastIntelStep ? (
                  <>
                    <Sparkles strokeWidth={1.75} />
                    {agentMode ? 'Submit scores' : 'Generate strategies'}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight strokeWidth={1.75} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

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
                <CircularProgress
                  value={selectedPhase.progressPct}
                  variant={getStatusVariant(selectedPhase.status)}
                  diameter={72}
                />
                <div>
                  <span className={`strategy-status strategy-status-${getStatusVariant(selectedPhase.status)}`}>
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
