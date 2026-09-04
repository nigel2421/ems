import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit3,
  Calendar,
  Users,
  BarChart3,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const CampaignStrategy = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { campaignPhases, updateCampaignTask } = useData();

  const [selectedPhase, setSelectedPhase] = useState(campaignPhases[2] || campaignPhases[0]);

  const handleTaskStatusToggle = (phaseId, taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    updateCampaignTask(phaseId, taskId, { status: nextStatus }, currentUser);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target style={{ width: '28px', height: '28px', color: '#8b5cf6' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Campaign Strategy & Phase Master Plan</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              5-phase roadmap: Announcement, Team Formation, Voter Mobilization, Mass Campaign, and GOTV.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Phase Interactive Timeline Stepper */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {campaignPhases.map(phase => {
            const isSelected = selectedPhase.id === phase.id;
            const isCompleted = phase.status === 'Completed';
            const isActive = phase.status === 'Active';

            return (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(phase)}
                style={{
                  background: isSelected ? 'rgba(139, 92, 246, 0.25)' : (isActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)'),
                  border: isSelected ? '2px solid #8b5cf6' : (isActive ? '1px solid #6366f1' : '1px solid var(--border-color)'),
                  borderRadius: '12px',
                  padding: '1rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: isSelected ? '#a78bfa' : 'var(--text-muted)' }}>
                    Phase {phase.phaseNumber}
                  </span>
                  <span className={`status-pill ${phase.status.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    {phase.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                  {phase.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginTop: '0.2rem' }}>
                  <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${phase.progressPct}%`, height: '100%', background: isCompleted ? '#10b981' : '#8b5cf6' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a78bfa' }}>{phase.progressPct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detail Breakdown */}
      {selectedPhase && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
          {/* Action Items & Tasks */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Phase {selectedPhase.phaseNumber}: {selectedPhase.name} Action Plan</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {selectedPhase.startDate} to {selectedPhase.endDate}
                </p>
              </div>
            </div>

            {/* Objectives */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '0.5rem' }}>
                Key Strategic Objectives
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {selectedPhase.objectives?.map((obj, idx) => (
                  <li key={idx} style={{ color: 'var(--text-main)' }}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Task Checklist */}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', marginBottom: '0.75rem' }}>
                Phase Action Tasks ({selectedPhase.tasks?.length || 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedPhase.tasks?.map(task => (
                  <div 
                    key={task.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
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
                      <button 
                        onClick={() => handleTaskStatusToggle(selectedPhase.id, task.id, task.status)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle2 style={{ width: '22px', height: '22px', color: '#10b981' }} />
                        ) : (
                          <Clock style={{ width: '22px', height: '22px', color: '#f59e0b' }} />
                        )}
                      </button>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? 'var(--text-muted)' : '#fff' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                          <span>Team: <strong>{task.assignedTeam}</strong></span>
                          <span>Due: <strong>{task.dueDate}</strong></span>
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
          </div>

          {/* KPI Target Cards */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>KPI Target Progress</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedPhase.tasks?.map(task => (
                <div key={task.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{task.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.35rem', color: '#a78bfa' }}>
                    <span>Target: {task.kpiTarget}</span>
                    <span>Current: <strong>{task.kpiCurrent}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
