import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  FileText,
  ClipboardList,
  Vote,
  Users,
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const AgentDashboard = ({ onOpenModule }) => {
  const { currentUser } = useAuth();
  const { fieldReports, tallyResults, surveys } = useData();

  const myReports = fieldReports.filter(r => r.agentId === currentUser?.id || r.agentName === currentUser?.name);
  const activeSurveys = surveys.filter(s => s.status === 'Active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Agent Identity & Polling Station Card */}
      <div 
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'} 
              alt={currentUser?.name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }}
            />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.05em' }}>
                Field Agent Operational Terminal
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', marginTop: '0.15rem' }}>
                {currentUser?.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
                <span>Assigned: <strong>{currentUser?.entityName || 'Westlands Primary Stream 01'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#34d399' }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>Terminal Active & Syncing</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid (Mobile-friendly big touch targets) */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Agent Operations Menu
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          {/* Card 1: Field Reporting */}
          <button
            onClick={() => onOpenModule('field_reports')}
            className="glass-card clickable-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              textAlign: 'left',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <FileText style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Field Reports</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Submit mobilization, incident, or opponent activity photos & GPS.
              </div>
            </div>
          </button>

          {/* Card 2: Surveys */}
          <button
            onClick={() => onOpenModule('surveys')}
            className="glass-card clickable-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              textAlign: 'left',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
              <ClipboardList style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Voter Surveys</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Complete targeted pulse polls & voter preference surveys. ({activeSurveys.length} active)
              </div>
            </div>
          </button>

          {/* Card 3: Mobilization */}
          <button
            onClick={() => onOpenModule('mobilization')}
            className="glass-card clickable-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              textAlign: 'left',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <Users style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Team Mobilization</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Log community meetings with elders, clergy, & bodaboda leaders.
              </div>
            </div>
          </button>

          {/* Card 4: Election Day Tally */}
          <button
            onClick={() => onOpenModule('tally_center')}
            className="glass-card clickable-card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.75rem',
              textAlign: 'left',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <Vote style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Tally Form 34A</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Upload Form 34A photo evidence & vote tallies on election day.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Submitted Field Activity List */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          My Submitted Field Reports ({myReports.length})
        </h3>

        {myReports.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No field reports submitted yet today. Tap "Field Reports" above to log your first activity.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {myReports.map(rep => (
              <div key={rep.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{rep.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {rep.category} • {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={`status-pill ${rep.severityLevel.toLowerCase()}`}>{rep.severityLevel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
