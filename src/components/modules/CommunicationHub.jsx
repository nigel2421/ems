import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  MessageSquare,
  Mail,
  Bell,
  Users,
  CheckCircle2,
  ShieldAlert,
  CreditCard,
  Plus,
  AlertCircle,
  Smartphone,
  X,
  Zap
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
  const [smsBalance, setSmsBalance] = useState(14250);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(20000);
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [topUpSuccessNotice, setTopUpSuccessNotice] = useState('');

  const recipientCount = 186;
  const smsSegments = Math.max(1, Math.ceil((messageText.length || 1) / 160));
  const unitsRequired = channel === 'SMS' ? recipientCount * smsSegments : 0;
  const isBalanceSufficient = channel !== 'SMS' || smsBalance >= unitsRequired;

  const handleSendDispatch = (e) => {
    e.preventDefault();
    if (channel === 'SMS' && !isBalanceSufficient) {
      setShowTopUpModal(true);
      return;
    }
    if (channel === 'SMS') {
      setSmsBalance((prev) => Math.max(0, prev - unitsRequired));
    }
    setDispatched(true);
    setTimeout(() => setDispatched(false), 4000);
  };

  const handleConfirmTopUp = (e) => {
    e.preventDefault();
    setSmsBalance((prev) => prev + selectedPack);
    setShowTopUpModal(false);
    setTopUpSuccessNotice(`Successfully credited ${selectedPack.toLocaleString()} SMS units via M-Pesa STK Push!`);
    setTimeout(() => setTopUpSuccessNotice(''), 4500);
  };

  return (
    <div className="comm-shell">
      <header className="comm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Communication Hub</h1>
          <p>Targeted operational SMS, Email, and Push dispatch aligned with ODPC Kenya Data Protection guidelines.</p>
        </div>

        {/* SMS Units Balance Widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SMS Gateway Balance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: smsBalance < 1000 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
              {smsBalance.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>Units</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowTopUpModal(true)}
          >
            <Plus size={14} />
            Top Up
          </button>
        </div>
      </header>

      {topUpSuccessNotice && (
        <div className="comm-alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{topUpSuccessNotice}</span>
        </div>
      )}

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
              <span>
                Dispatch transmitted successfully to {recipientCount} agents!
                {channel === 'SMS' && ` (${unitsRequired.toLocaleString()} units deducted)`}
              </span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Operational Message Content</label>
                {channel === 'SMS' && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {messageText.length} chars · {smsSegments} segment{smsSegments > 1 ? 's' : ''} (160 chars/part)
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                className="form-input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
            </div>

            {channel === 'SMS' && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: isBalanceSufficient ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.12)', border: isBalanceSufficient ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Estimated consumption: </span>
                  <strong>{recipientCount} recipients × {smsSegments} segment = {unitsRequired.toLocaleString()} SMS Units</strong>
                </div>
                {!isBalanceSufficient && (
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    Short by {(unitsRequired - smsBalance).toLocaleString()} units
                  </span>
                )}
              </div>
            )}

            <div className="comm-odpc-note">
              <ShieldAlert size={16} />
              <span>ODPC Kenya Compliance Notice: Operational communications must pertain strictly to campaign deployment and agent coordination.</span>
            </div>

            <button
              type="submit"
              className="comm-send-btn"
              disabled={channel === 'SMS' && !isBalanceSufficient}
              style={channel === 'SMS' && !isBalanceSufficient ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
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

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="admin-modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
                  <Zap size={20} />
                  Top Up SMS Gateway Units
                </h3>
                <p>Instant provisioning via M-Pesa Express (Safaricom)</p>
              </div>
              <button type="button" className="admin-icon-btn" aria-label="Close" onClick={() => setShowTopUpModal(false)}>
                <X strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleConfirmTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="form-label">Select SMS Unit Bundle</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { units: 5000, price: 'KES 4,000' },
                    { units: 20000, price: 'KES 15,000' },
                    { units: 50000, price: 'KES 35,000' }
                  ].map((pack) => (
                    <div
                      key={pack.units}
                      onClick={() => setSelectedPack(pack.units)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: selectedPack === pack.units ? '2px solid #38bdf8' : '1px solid #334155',
                        background: selectedPack === pack.units ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#f8fafc' }}>
                        {pack.units.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {pack.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">M-Pesa Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Smartphone size={16} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    required
                  />
                </div>
                <small style={{ color: '#94a3b8', fontSize: '0.74rem' }}>An STK push PIN prompt will be sent to this line.</small>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowTopUpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <CreditCard size={15} />
                  Authorize M-Pesa Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
