import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  FileText,
  ClipboardList,
  Vote,
  Users,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import './DashboardShared.css';

export const AgentDashboard = ({ onOpenModule }) => {
  const { currentUser } = useAuth();
  const { fieldReports, surveys } = useData();

  const myReports = fieldReports.filter(
    (r) => r.agentId === currentUser?.id || r.agentName === currentUser?.name
  );
  const activeSurveys = surveys.filter((s) => s.status === 'Active');

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <img
            src={
              currentUser?.avatar ||
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            }
            alt=""
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #006B3F' }}
          />
          <div>
            <h1>{currentUser?.name}</h1>
            <p>
              <MapPin style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Assigned: {currentUser?.entityName || 'Polling station stream'}
            </p>
          </div>
        </div>
        <div className="admin-head-actions">
          <span className="admin-chip" style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 0.9rem' }}>
            <ShieldCheck strokeWidth={1.75} style={{ width: 15, height: 15 }} />
            Terminal active
          </span>
        </div>
      </header>

      <section className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>My reports</span>
            <div className="admin-metric-icon"><FileText strokeWidth={1.75} /></div>
          </div>
          <strong>{myReports.length}</strong>
          <small>Field submissions logged</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Active surveys</span>
            <div className="admin-metric-icon"><ClipboardList strokeWidth={1.75} /></div>
          </div>
          <strong>{activeSurveys.length}</strong>
          <small>Pulse polls available</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Station</span>
            <div className="admin-metric-icon"><MapPin strokeWidth={1.75} /></div>
          </div>
          <strong style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>{currentUser?.entityName || 'Unassigned'}</strong>
          <small>Duty location</small>
        </article>
      </section>

      <section>
        <div className="admin-card-head" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Operations</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#6B756F' }}>Open a field workflow</p>
          </div>
        </div>
        <div className="admin-op-grid">
          <button type="button" className="admin-op-card" onClick={() => onOpenModule('field_reports')}>
            <div className="admin-metric-icon"><FileText strokeWidth={1.75} /></div>
            <strong>Field reports</strong>
            <span>Submit mobilization, incident, or opponent activity with GPS.</span>
          </button>
          <button type="button" className="admin-op-card" onClick={() => onOpenModule('surveys')}>
            <div className="admin-metric-icon"><ClipboardList strokeWidth={1.75} /></div>
            <strong>Voter surveys</strong>
            <span>Complete pulse polls and preference surveys ({activeSurveys.length} active).</span>
          </button>
          <button type="button" className="admin-op-card" onClick={() => onOpenModule('mobilization')}>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
            <strong>Team mobilization</strong>
            <span>Log meetings with elders, clergy, and community leaders.</span>
          </button>
          <button type="button" className="admin-op-card" onClick={() => onOpenModule('tally_center')}>
            <div className="admin-metric-icon"><Vote strokeWidth={1.75} /></div>
            <strong>Tally Form 34A</strong>
            <span>Upload Form 34A evidence and vote tallies on election day.</span>
          </button>
        </div>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>My submitted reports</h2>
            <p>{myReports.length} submissions</p>
          </div>
        </div>
        {myReports.length === 0 ? (
          <div className="admin-empty">No field reports submitted yet. Open Field reports to log activity.</div>
        ) : (
          <div className="admin-list">
            {myReports.map((rep) => (
              <div key={rep.id} className="admin-list-item">
                <div className="admin-metric-icon"><FileText strokeWidth={1.75} /></div>
                <div>
                  <strong>{rep.title}</strong>
                  <span>
                    {rep.category} · {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="admin-chip">{rep.severityLevel}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};
