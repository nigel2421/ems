import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, MessageSquareText, Send, Users, X } from 'lucide-react';
import {
  filterAudienceByScope,
  createCommunicationDispatch,
  approveEmergencyDispatch,
  MESSAGE_CATEGORIES
} from '../../utils/communicationsEngine.js';
import './CommunicationsCommand.css';

const SAMPLE_RECIPIENTS = Array.from({ length: 17 }, (_, index) => ({
  id: `USR-AGENT-${index + 1}`,
  name: `Agent ${index + 1}`,
  county: 'Nairobi',
  constituency: 'Westlands',
  ward: 'Parklands/Highridge',
  role: 'Agent',
  missionStatus: 'ASSIGNED'
}));

export const CommunicationsCommand = ({ user }) => {
  const [category, setCategory] = useState(MESSAGE_CATEGORIES.STANDARD_MESSAGE);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetCounty, setTargetCounty] = useState(user?.county || 'Nairobi');
  const [targetRole, setTargetRole] = useState('Agent');
  const [showApproval, setShowApproval] = useState(false);
  const [pendingDispatch, setPendingDispatch] = useState(null);
  const [notice, setNotice] = useState(null);

  const audience = useMemo(() => filterAudienceByScope(user || { role: 'Super Admin' }, SAMPLE_RECIPIENTS, {
    county: targetCounty,
    role: targetRole
  }), [user, targetCounty, targetRole]);

  const handleSendDispatch = (event) => {
    event.preventDefault();
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
      setShowApproval(true);
      return;
    }
    setNotice('Preview dispatch recorded. No SMS provider is connected, so no messages were sent.');
    setBody('');
  };

  const handleApproveEmergency = () => {
    try {
      approveEmergencyDispatch(pendingDispatch, {
        id: 'SUP-99',
        name: 'Security Director',
        role: 'Super Admin'
      });
      setShowApproval(false);
      setPendingDispatch(null);
      setNotice('Approval flow completed in preview mode. No SMS provider is connected.');
      setBody('');
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <main className="communications-page">
      <header className="communications-page-head">
        <div className="communications-page-icon"><MessageSquareText size={20} /></div>
        <div>
          <p className="communications-eyebrow">FIELD OPERATIONS</p>
          <h1>Bulk SMS</h1>
          <p className="communications-page-subtitle">Compose and target operational messages by location and role.</p>
        </div>
      </header>

      {notice && <div className="communications-notice" role="status"><Info size={17} />{notice}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button></div>}

      <div className="communications-layout">
        <section className="communications-card">
          <div className="communications-card-head">
            <div><h2>Compose message</h2><p>Choose a recipient group and write your message.</p></div>
            <span className="communications-preview-tag">PREVIEW MODE</span>
          </div>

          <form className="communications-form" onSubmit={handleSendDispatch}>
            <div className="communications-fields">
              <div className="communications-field">
                <label htmlFor="sms-category">Message priority</label>
                <select id="sms-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value={MESSAGE_CATEGORIES.STANDARD_MESSAGE}>Standard</option>
                  <option value={MESSAGE_CATEGORIES.PRIORITY_ALERT}>Priority alert</option>
                  <option value={MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT}>Emergency alert · approval required</option>
                </select>
              </div>
              <div className="communications-field">
                <label htmlFor="sms-county">County</label>
                <select id="sms-county" value={targetCounty} onChange={(event) => setTargetCounty(event.target.value)}>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                </select>
              </div>
              <div className="communications-field">
                <label htmlFor="sms-role">Recipient role</label>
                <select id="sms-role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)}>
                  <option value="Agent">Agents</option>
                  <option value="All">All field staff</option>
                </select>
              </div>
              <div className="communications-field">
                <label htmlFor="sms-subject">Subject <span>Optional</span></label>
                <input id="sms-subject" type="text" maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Polling station briefing" />
              </div>
            </div>

            <div className="communications-field">
              <label htmlFor="sms-body">Message</label>
              <textarea id="sms-body" rows={6} maxLength={500} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a clear operational update for your selected recipients…" />
              <div className="communications-character-count">{body.length}/500 characters</div>
            </div>

            <div className="communications-provider-note"><AlertTriangle size={17} /><span>Preview only. Connect an SMS provider to deliver messages to phones.</span></div>
            <button className="communications-send-button" type="submit" disabled={!body.trim() || audience.length === 0}>
              <Send size={16} />{category === MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT ? 'Request approval' : 'Review message'}
            </button>
          </form>
        </section>

        <aside className="communications-card communications-audience-card">
          <div className="communications-card-head"><div><h2>Audience</h2><p>Estimated recipients for this scope</p></div></div>
          <div className="communications-audience-count"><Users size={19} /><strong>{audience.length}</strong><span>recipients</span></div>
          <div className="communications-audience-scope"><span>County</span><strong>{targetCounty}</strong><span>Role</span><strong>{targetRole === 'All Field Operational Staff' ? 'All field staff' : `${targetRole}s`}</strong></div>
          <div className="communications-audience-list">
            {audience.slice(0, 5).map((recipient) => <div key={recipient.id}><span className="communications-avatar">{recipient.name.slice(-1)}</span><span><strong>{recipient.name}</strong><small>{recipient.ward}</small></span></div>)}
            {audience.length > 5 && <p>and {audience.length - 5} more recipients</p>}
            {audience.length === 0 && <p>No recipients match this scope.</p>}
          </div>
        </aside>
      </div>

      {showApproval && <div className="communications-modal-backdrop" role="presentation"><section className="communications-approval-modal" role="dialog" aria-modal="true" aria-labelledby="communications-approval-title">
        <div className="communications-modal-icon"><AlertTriangle size={21} /></div>
        <h2 id="communications-approval-title">Emergency message approval</h2>
        <p>This emergency broadcast requires a separate checker approval for {pendingDispatch?.recipientCount || 0} recipients.</p>
        <div className="communications-message-preview"><strong>{pendingDispatch?.subject || 'Emergency alert'}</strong><span>{pendingDispatch?.body}</span></div>
        <div className="communications-modal-actions"><button type="button" className="communications-secondary-button" onClick={() => setShowApproval(false)}>Cancel</button><button type="button" className="communications-send-button" onClick={handleApproveEmergency}><CheckCircle2 size={16} />Approve preview</button></div>
      </section></div>}
    </main>
  );
};
