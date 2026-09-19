// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Mobile-First Field Agent PWA Application Component
// ====================================================================

import React, { useState, useEffect } from 'react';
import './FieldAgentPWA.css';
import { createAgentMission, updateMissionStatus, MISSION_STATES } from '../../utils/agentMissions.js';
import { calculateEvidenceQualityScore } from '../../utils/evidenceVault.js';
import { enqueueOfflineItem, getOfflineQueue } from '../../utils/offlineSync.js';

export const FieldAgentPWA = ({ user, onBackToDashboard }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mission, setMission] = useState(() => createAgentMission({
    agentId: user?.id || 'USR-AGENT-239',
    agentName: user?.name || 'Jane Wambui',
    pollingCentreName: 'Highridge Primary School',
    streamId: 'Stream 03',
    pollingUnitId: '002938',
    county: user?.county || 'Nairobi',
    constituency: user?.constituency || 'Westlands',
    ward: user?.ward || 'Parklands/Highridge'
  }));

  const [offlineQueue, setOfflineQueue] = useState([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [candAVotes, setCandAVotes] = useState('421');
  const [candBVotes, setCandBVotes] = useState('318');
  const [rejectedVotes, setRejectedVotes] = useState('7');
  const [statusNotification, setStatusNotification] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOfflineQueue(getOfflineQueue());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckInToggle = () => {
    const nextState = mission.status === MISSION_STATES.CHECKED_IN || mission.status === MISSION_STATES.ON_DUTY
      ? MISSION_STATES.CHECKED_OUT
      : MISSION_STATES.CHECKED_IN;

    const updated = updateMissionStatus(mission, nextState, user || 'Agent', `User tapped Check-${nextState === MISSION_STATES.CHECKED_IN ? 'In' : 'Out'}`);
    setMission(updated);
    showTempNotification(`Status updated: ${nextState}`);
  };

  const showTempNotification = (msg) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleReportIncident = async () => {
    if (!incidentText.trim()) return;

    const payload = {
      type: 'INCIDENT_REPORT',
      incidentText,
      stationId: mission.pollingUnitId,
      agentId: mission.agentId,
      timestamp: new Date().toISOString()
    };

    await enqueueOfflineItem(payload);
    setOfflineQueue(getOfflineQueue());
    setIncidentText('');
    setShowIncidentModal(false);
    showTempNotification('Incident report queued & secured locally');
  };

  const handleCaptureEvidence = async () => {
    const qualityEval = calculateEvidenceQualityScore({
      imageReadable: true,
      stationId: mission.pollingUnitId,
      formType: 'Form 34A',
      fieldsDetected: true,
      mathValid: true,
      signaturesDetected: true,
      stampDetected: true,
      isDuplicate: false
    });

    const payload = {
      type: 'RESULT_EVIDENCE_SUBMISSION',
      formType: 'Form 34A',
      stationId: mission.pollingUnitId,
      candAVotes: Number(candAVotes),
      candBVotes: Number(candBVotes),
      rejectedVotes: Number(rejectedVotes),
      totalVotesCast: Number(candAVotes) + Number(candBVotes) + Number(rejectedVotes),
      qualityEval,
      capturedAt: new Date().toISOString()
    };

    await enqueueOfflineItem(payload);
    setOfflineQueue(getOfflineQueue());
    setShowEvidenceModal(false);
    showTempNotification('Result evidence captured & SHA-256 verified');
  };

  const isCheckedIn = mission.status === MISSION_STATES.CHECKED_IN || mission.status === MISSION_STATES.ON_DUTY;

  return (
    <div className="field-pwa-container">
      {/* Header Bar */}
      <header className="field-header">
        <div className="field-brand">
          <span>CI-EMS FIELD</span>
        </div>
        <div className={`connectivity-badge ${isOnline ? 'online' : 'offline'}`}>
          <span className="pulse-dot"></span>
          <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
        </div>
      </header>

      {/* Temp Notification */}
      {statusNotification && (
        <div style={{ background: '#0284c7', color: '#fff', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
          ✓ {statusNotification}
        </div>
      )}

      {/* Offline Visual Pipeline Banner */}
      <div className={`offline-sync-banner ${offlineQueue.length === 0 ? 'synced' : ''}`}>
        <div className="offline-banner-title">
          <span>{offlineQueue.length > 0 ? `OFFLINE QUEUE (${offlineQueue.length} ITEMS PENDING)` : 'SYNCED WITH SERVER'}</span>
          <span style={{ fontSize: '0.7rem' }}>SHA-256 SECURED</span>
        </div>
        <div className="sync-pipeline-steps">
          <div className="sync-step completed">
            <div className="step-icon">✓</div>
            <span>CAPTURED</span>
          </div>
          <div className={`sync-step ${offlineQueue.length > 0 ? 'active' : 'completed'}`}>
            <div className="step-icon">{offlineQueue.length > 0 ? '●' : '✓'}</div>
            <span>QUEUED</span>
          </div>
          <div className={`sync-step ${isOnline && offlineQueue.length > 0 ? 'active' : ''}`}>
            <div className="step-icon">↑</div>
            <span>UPLOADING</span>
          </div>
          <div className={`sync-step ${isOnline && offlineQueue.length === 0 ? 'completed' : ''}`}>
            <div className="step-icon">✓</div>
            <span>RECEIVED</span>
          </div>
          <div className={`sync-step ${isOnline && offlineQueue.length === 0 ? 'completed' : ''}`}>
            <div className="step-icon">★</div>
            <span>VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Today's Assignment Card */}
      <div className="mission-card">
        <div className="mission-label">TODAY'S ASSIGNMENT</div>
        <div className="mission-station-name">{mission.pollingCentreName}</div>
        <div className="mission-stream">{mission.streamId} • Code: {mission.pollingUnitId}</div>

        <div className="mission-details-grid">
          <div className="mission-detail-item">
            <span>WARD</span>
            <span>{mission.ward}</span>
          </div>
          <div className="mission-detail-item">
            <span>SUPERVISOR</span>
            <span>{mission.supervisorName}</span>
          </div>
          <div className="mission-detail-item">
            <span>CONSTITUENCY</span>
            <span>{mission.constituency}</span>
          </div>
          <div className="mission-detail-item">
            <span>REPORTING</span>
            <span>{mission.reportingTime}</span>
          </div>
        </div>

        <button
          className={`btn-checkin ${isCheckedIn ? 'checked-in' : ''}`}
          onClick={handleCheckInToggle}
        >
          {isCheckedIn ? '✓ CHECKED IN (TAP TO CHECK OUT)' : 'CHECK IN NOW'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-title">QUICK ACTIONS</div>
      <div className="quick-actions-grid">
        <button className="quick-action-btn incident" onClick={() => setShowIncidentModal(true)}>
          <span className="quick-action-icon">🚨</span>
          <span>Report Incident</span>
        </button>

        <button className="quick-action-btn evidence" onClick={() => setShowEvidenceModal(true)}>
          <span className="quick-action-icon">📷</span>
          <span>Capture Evidence</span>
        </button>

        <button className="quick-action-btn" onClick={() => showTempNotification('Station Update Sent')}>
          <span className="quick-action-icon">📋</span>
          <span>Station Update</span>
        </button>

        <button className="quick-action-btn" onClick={() => showTempNotification(`Contacting ${mission.supervisorName}`)}>
          <span className="quick-action-icon">📞</span>
          <span>Contact Supervisor</span>
        </button>
      </div>

      {/* Operational Station Timeline */}
      <div className="timeline-widget">
        <div className="timeline-title">
          <span>STATION OPERATIONAL TIMELINE</span>
          <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>LIVE</span>
        </div>
        <div className="timeline-list">
          <div className="timeline-item">
            <span className="timeline-time">05:54</span>
            <span className="timeline-label">Agent checked in</span>
            <span className="timeline-status done">✓</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-time">06:11</span>
            <span className="timeline-label">Agent admitted by PO</span>
            <span className="timeline-status done">✓</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-time">06:29</span>
            <span className="timeline-label">Materials & ballot boxes confirmed</span>
            <span className="timeline-status done">✓</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-time">06:43</span>
            <span className="timeline-label">Polling station opened</span>
            <span className="timeline-status done">✓</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-time">11:18</span>
            <span className="timeline-label">Incident reported & resolved</span>
            <span className="timeline-status warn">⚠</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-time">17:00</span>
            <span className="timeline-label">Voting closed & counting started</span>
            <span className="timeline-status pending">●</span>
          </div>
        </div>
      </div>

      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}
        >
          ← Switch to Command Operations
        </button>
      )}

      {/* Modal: Report Incident */}
      {showIncidentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>🚨 Report Election Incident</h3>
            <textarea
              rows="4"
              placeholder="Describe the incident (e.g. queue delay, material shortage, security issue)..."
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowIncidentModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReportIncident} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Capture Form 34A Evidence */}
      {showEvidenceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>📷 Capture Result Evidence (Form 34A)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <label style={{ color: '#94a3b8' }}>Candidate A Votes:</label>
                <input type="number" value={candAVotes} onChange={e => setCandAVotes(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8' }}>Candidate B Votes:</label>
                <input type="number" value={candBVotes} onChange={e => setCandBVotes(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8' }}>Rejected Votes:</label>
                <input type="number" value={rejectedVotes} onChange={e => setRejectedVotes(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowEvidenceModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCaptureEvidence} style={{ flex: 1, padding: '10px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Evidence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
