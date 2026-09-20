import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  MessageSquare,
  Mail,
  Bell,
  Users,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import './CommunicationHub.css';

export const CommunicationHub = () => {
  const { userScope } = useAuth();

  const [channel, setChannel] = useState('SMS');
  const [targetScope, setTargetScope] = useState('Nairobi -> Westlands -> Parklands');
  const [targetRole, setTargetRole] = useState('Polling Agents');
  const [targetStatus, setTargetStatus] = useState('Confirmed');
  const [messageText, setMessageText] = useState('CRITICAL: Polls open at 6:00 AM. Please verify your agent badge, power bank, and form 34A kit. Contact coordinator immediately if unequipped.');
  const [dispatched, setDispatched] = useState(false);

  const recipientCount = 186;

  const handleSendDispatch = (e) => {
    e.preventDefault();
    setDispatched(true);
    setTimeout(() => setDispatched(false), 4000);
  };

  return (
    <div className="comm-shell">
      <header className="comm-header">
        <div>
          <h1>Communication Hub</h1>
          <p>Targeted operational SMS, Email, and Push dispatch aligned with ODPC Kenya Data Protection guidelines.</p>
        </div>
      </header>

      <div className="comm-grid">
        {/* Compose Dispatch Form */}
        <article className="comm-panel">
          <div className="comm-panel-head">
            <h3>Compose Operational Dispatch</h3>
            <span className="comm-sub">Target agents and coordinators by operational scope</span>
          </div>

          {dispatched && (
            <div className="comm-alert-success">
              <CheckCircle2 size={18} />
              <span>Dispatch transmitted successfully to {recipientCount} agents!</span>
            </div>
          )}

          <form onSubmit={handleSendDispatch} className="comm-form">
            <div className="form-group">
              <label className="form-label">Broadcast Channel</label>
              <div className="comm-channel-pills">
                {['SMS', 'Email', 'In-App Push', 'WhatsApp'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className={`comm-pill ${channel === ch ? 'is-active' : ''}`}
                    onClick={() => setChannel(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="comm-form-row">
              <div className="form-group">
                <label className="form-label">Recipient Geographic Scope</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Category</label>
                <select className="form-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  <option value="Polling Agents">Polling Agents</option>
                  <option value="Ward Coordinators">Ward Coordinators</option>
                  <option value="Constituency Coordinators">Constituency Coordinators</option>
                  <option value="All Field Operational Staff">All Field Operational Staff</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deployment Status</label>
                <select className="form-select" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
                  <option value="Confirmed">Confirmed On Duty</option>
                  <option value="Assigned">Assigned (Unconfirmed)</option>
                  <option value="All Statuses">All Statuses</option>
                </select>
              </div>
            </div>

            {/* Recipient Counter Box */}
            <div className="comm-recipient-box">
              <Users size={18} className="comm-icon" />
              <div>
                <strong>{recipientCount} Recipients Selected</strong>
                <p>Scope: {targetScope} · {targetRole} ({targetStatus})</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Operational Message Content</label>
              <textarea
                rows={4}
                className="form-input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
            </div>

            <div className="comm-odpc-note">
              <ShieldAlert size={16} />
              <span>ODPC Kenya Compliance Notice: Operational communications must pertain strictly to campaign deployment and agent coordination.</span>
            </div>

            <button type="submit" className="comm-send-btn">
              <Send size={16} />
              Transmit Operational Dispatch ({recipientCount} Recipients)
            </button>
          </form>
        </article>

        {/* Dispatch History Side Panel */}
        <article className="comm-panel">
          <div className="comm-panel-head">
            <h3>Recent Broadcast History</h3>
          </div>

          <div className="comm-history-list">
            <div className="comm-hist-item">
              <div className="comm-hist-head">
                <span className="comm-hist-ch">SMS</span>
                <span className="comm-hist-time">Today, 06:15 AM</span>
              </div>
              <h4>Election Day Readiness Call</h4>
              <p>186 Polling Agents in Westlands Ward notified to check in.</p>
              <span className="comm-hist-status">✅ Delivered 186/186</span>
            </div>

            <div className="comm-hist-item">
              <div className="comm-hist-head">
                <span className="comm-hist-ch">Push</span>
                <span className="comm-hist-time">Yesterday, 08:30 PM</span>
              </div>
              <h4>Briefing Location Update</h4>
              <p>Parklands Ward coordinators night briefing moved to Highridge Centre.</p>
              <span className="comm-hist-status">✅ Delivered 42/42</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
