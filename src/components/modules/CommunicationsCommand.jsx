// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Communications Command & Emergency Broadcast Workspace Component
// ====================================================================

import React, { useState } from 'react';
import { filterAudienceByScope, createCommunicationDispatch, approveEmergencyDispatch, MESSAGE_CATEGORIES } from '../../utils/communicationsEngine.js';

export const CommunicationsCommand = ({ user }) => {
  const [category, setCategory] = useState(MESSAGE_CATEGORIES.STANDARD_MESSAGE);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetCounty, setTargetCounty] = useState('Nairobi');
  const [targetRole, setTargetRole] = useState('Agent');
  const [showMakerCheckerModal, setShowMakerCheckerModal] = useState(false);
  const [pendingDispatch, setPendingDispatch] = useState(null);
  const [notification, setNotification] = useState(null);

  const mockAgents = Array.from({ length: 17 }, (_, i) => ({
    id: `USR-AGENT-${i + 1}`,
    name: `Agent ${i + 1}`,
    county: 'Nairobi',
    constituency: 'Westlands',
    ward: 'Parklands/Highridge',
    role: 'Agent',
    missionStatus: 'ASSIGNED'
  }));

  const audience = filterAudienceByScope(user || { role: 'Super Admin' }, mockAgents, {
    county: targetCounty,
    role: targetRole
  });

  const handleSendDispatch = () => {
    if (!body.trim()) return;

    const dispatch = createCommunicationDispatch(user || { id: 'ADM-01', name: 'Campaign Ops Admin', role: 'Admin' }, {
      category,
      subject,
      body,
      recipientCount: audience.length,
      audienceFilter: { county: targetCounty, role: targetRole }
    });

    if (dispatch.requiresMakerChecker) {
      setPendingDispatch(dispatch);
      setShowMakerCheckerModal(true);
    } else {
      setNotification(`Dispatch sent to ${audience.length} recipients`);
      setBody('');
    }
  };

  const handleApproveEmergency = () => {
    try {
      const approver = { id: 'SUP-99', name: 'Security Director', role: 'Super Admin' };
      const approved = approveEmergencyDispatch(pendingDispatch, approver);
      setShowMakerCheckerModal(false);
      setPendingDispatch(null);
      setNotification(`EMERGENCY BROADCAST APPROVED by ${approver.name}. Sent to ${approved.recipientCount} agents.`);
      setBody('');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>📡 COMMUNICATIONS COMMAND CENTRE</h2>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scope-Targeted Dispatch & Emergency Operational Alerting</div>
      </header>

      {notification && (
        <div style={{ background: '#10b981', color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: 700 }}>
          ✓ {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Dispatch Composer */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8' }}>COMPOSE OPERATIONAL DISPATCH</h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>CATEGORY</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }}
            >
              <option value={MESSAGE_CATEGORIES.STANDARD_MESSAGE}>STANDARD MESSAGE</option>
              <option value={MESSAGE_CATEGORIES.PRIORITY_ALERT}>PRIORITY ALERT</option>
              <option value={MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT}>EMERGENCY OPERATIONAL ALERT (Maker-Checker Required)</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>TARGET COUNTY</label>
            <select
              value={targetCounty}
              onChange={e => setTargetCounty(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }}
            >
              <option value="Nairobi">Nairobi County</option>
              <option value="Mombasa">Mombasa County</option>
              <option value="Kisumu">Kisumu County</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>SUBJECT / TITLE</label>
            <input
              type="text"
              placeholder="Dispatch Subject..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>MESSAGE CONTENT</label>
            <textarea
              rows="4"
              placeholder="Enter dispatch text for targeted field personnel..."
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>

          <button
            onClick={handleSendDispatch}
            style={{
              width: '100%',
              padding: '12px',
              background: category === MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT ? '#ef4444' : '#0284c7',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {category === MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT ? 'REQUEST EMERGENCY BROADCAST APPROVAL' : 'DISPATCH MESSAGE'}
          </button>
        </div>

        {/* Audience Preview & Delivery Stats */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8' }}>TARGET AUDIENCE PREVIEW ({audience.length} RECIPIENTS)</h3>
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', fontSize: '0.8rem' }}>
            {audience.map(agt => (
              <div key={agt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span>{agt.name} ({agt.role})</span>
                <span style={{ color: '#94a3b8' }}>{agt.ward}</span>
              </div>
            ))}
          </div>

          <h4 style={{ margin: '12px 0 6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>DELIVERY TRACKING OVERVIEW</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>1,402</div>
              <div style={{ color: '#64748b' }}>SENT</div>
            </div>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#10b981' }}>1,389</div>
              <div style={{ color: '#64748b' }}>DELIVERED</div>
            </div>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#eab308' }}>1,210</div>
              <div style={{ color: '#64748b' }}>ACKNOWLEDGED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Maker-Checker Approval Modal for Emergency Broadcast */}
      {showMakerCheckerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '2px solid #ef4444', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>🚨 EMERGENCY BROADCAST MAKER-CHECKER APPROVAL</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              Requester <strong>{pendingDispatch?.senderName}</strong> has requested a high-priority Emergency Broadcast to <strong>{pendingDispatch?.recipientCount} recipients</strong>.
              Under CI-EMS 2.3 security policy, emergency broadcasts require independent Checker authorization.
            </p>

            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', margin: '14px 0', borderLeft: '4px solid #ef4444' }}>
              <div><strong>Subject:</strong> {pendingDispatch?.subject || 'EMERGENCY BROADCAST'}</div>
              <div><strong>Body:</strong> {pendingDispatch?.body}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => setShowMakerCheckerModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Reject Request</button>
              <button onClick={handleApproveEmergency} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>APPROVE BROADCAST</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
