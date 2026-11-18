import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Info, MessageSquareText, Send, Upload, Users, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { canPerformAction } from '../../utils/rbac';
import {
  createCommunicationDispatch,
  approveEmergencyDispatch,
  MESSAGE_CATEGORIES
} from '../../utils/communicationsEngine.js';
import { parseVoterContactSpreadsheet } from '../../utils/voterContactImport';
import './CommunicationsCommand.css';

export const CommunicationsCommand = ({ user }) => {
  const { agents, getScopedAgents, voterContactLists, addVoterContactList } = useData();
  const [category, setCategory] = useState(MESSAGE_CATEGORIES.STANDARD_MESSAGE);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientSource, setRecipientSource] = useState('agents');
  const [selectedVoterListId, setSelectedVoterListId] = useState('');
  const [showApproval, setShowApproval] = useState(false);
  const [pendingDispatch, setPendingDispatch] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const canSend = canPerformAction(user, 'SEND_BULK_SMS');
  const canUpload = canPerformAction(user, 'UPLOAD_VOTER_CONTACTS');
  const isAdmin = ['Admin', 'Super Admin'].includes(user?.role);
  const campaignOwnerId = user?.supervisorId || user?.candidateId || user?.creatorId || user?.id;
  const availableLists = useMemo(() => (voterContactLists || []).filter((list) =>
    isAdmin || list.ownerId === campaignOwnerId || list.uploadedBy === user?.id
  ), [voterContactLists, isAdmin, campaignOwnerId, user?.id]);

  const agentRecipients = useMemo(() => {
    const scopedAgents = getScopedAgents?.(user, agents) || [];
    return scopedAgents
      .filter((agent) => agent.phone)
      .map((agent) => ({
        id: agent.id,
        name: agent.fullName || agent.name || 'Field agent',
        phone: agent.phone,
        location: [agent.ward, agent.constituency, agent.county].filter(Boolean).join(', '),
        role: agent.role || 'Field Agent'
      }));
  }, [agents, getScopedAgents, user]);

  const selectedList = availableLists.find((list) => list.id === selectedVoterListId) || availableLists[0];
  const voterRecipients = selectedList?.contacts || [];
  const recipients = recipientSource === 'agents' ? agentRecipients : voterRecipients;

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setNotice(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Choose a spreadsheet smaller than 8 MB.');
      const { contacts, invalidRows } = await parseVoterContactSpreadsheet(file);
      const listId = `VCL-${Date.now()}`;
      const saved = await addVoterContactList({ id: listId, name: file.name.replace(/\.(xlsx|csv)$/i, ''), sourceFileName: file.name, contacts }, user);
      setSelectedVoterListId(saved.id);
      setRecipientSource('voters');
      setNotice(`Imported ${contacts.length.toLocaleString()} numbers${invalidRows ? `; skipped ${invalidRows} invalid rows` : ''}.`);
    } catch (error) {
      setNotice(error.message || 'Could not read this spreadsheet.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleSendDispatch = (event) => {
    event.preventDefault();
    if (!canSend || !body.trim() || recipients.length === 0) return;
    const dispatch = createCommunicationDispatch(user, {
      category,
      channel: 'SMS',
      subject,
      body,
      recipientCount: recipients.length,
      audienceFilter: recipientSource === 'agents'
        ? { source: 'uploaded_agents', recipientIds: recipients.map((recipient) => recipient.id) }
        : { source: 'uploaded_voter_contacts', listId: selectedList?.id }
    });
    if (dispatch.requiresMakerChecker) {
      setPendingDispatch(dispatch);
      setShowApproval(true);
      return;
    }
    setNotice(`Preview prepared for ${recipients.length.toLocaleString()} recipients. No SMS provider is connected, so no messages were sent.`);
  };

  const handleApproveEmergency = () => {
    try {
      approveEmergencyDispatch(pendingDispatch, { id: 'SUP-99', name: 'Security Director', role: 'Super Admin' });
      setShowApproval(false);
      setPendingDispatch(null);
      setNotice('Approval preview completed. No SMS provider is connected, so no messages were sent.');
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <main className="communications-page">
      <header className="communications-page-head">
        <div className="communications-page-icon"><MessageSquareText size={20} /></div>
        <div><p className="communications-eyebrow">FIELD OPERATIONS</p><h1>Bulk SMS</h1><p className="communications-page-subtitle">Choose a saved audience, compose your message, and review recipients.</p></div>
      </header>

      {notice && <div className="communications-notice" role="status"><Info size={17} />{notice}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button></div>}

      <div className="communications-layout">
        <section className="communications-card">
          <div className="communications-card-head"><div><h2>{canSend ? 'Compose message' : 'Upload voter contacts'}</h2><p>{canSend ? 'Select who should receive this operational update.' : 'Upload a contact spreadsheet for your campaign team.'}</p></div><span className="communications-preview-tag">PREVIEW MODE</span></div>

          {canSend && <form className="communications-form" onSubmit={handleSendDispatch}>
            <div className="communications-field">
              <label htmlFor="sms-recipient-source">Send to</label>
              <select id="sms-recipient-source" value={recipientSource} onChange={(event) => setRecipientSource(event.target.value)}>
                <option value="agents">Uploaded agents</option>
                <option value="voters">Uploaded voter numbers</option>
              </select>
            </div>

            {recipientSource === 'voters' && <div className="communications-list-picker">
              <div className="communications-field"><label htmlFor="sms-voter-list">Voter contact list</label><select id="sms-voter-list" value={selectedList?.id || ''} onChange={(event) => setSelectedVoterListId(event.target.value)}>
                {!availableLists.length && <option value="">No voter lists uploaded</option>}
                {availableLists.map((list) => <option key={list.id} value={list.id}>{list.name} · {list.contacts?.length || 0} numbers</option>)}
              </select></div>
              {canUpload && <label className={`communications-upload-button${isImporting ? ' is-loading' : ''}`}>
                <input type="file" accept=".xlsx,.csv" onChange={handleImport} disabled={isImporting} />
                {isImporting ? <FileSpreadsheet size={16} /> : <Upload size={16} />}{isImporting ? 'Reading file…' : 'Upload Excel / CSV'}
              </label>}
              {canUpload && <p className="communications-upload-help">Use a Phone or Mobile column, or place numbers in column A. Excel .xlsx and CSV files are supported.</p>}
            </div>}

            <div className="communications-fields">
              <div className="communications-field"><label htmlFor="sms-category">Message priority</label><select id="sms-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value={MESSAGE_CATEGORIES.STANDARD_MESSAGE}>Standard</option>
                <option value={MESSAGE_CATEGORIES.PRIORITY_ALERT}>Priority alert</option>
                <option value={MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT}>Emergency alert · approval required</option>
              </select></div>
              <div className="communications-field"><label htmlFor="sms-subject">Subject <span>Optional</span></label><input id="sms-subject" type="text" maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Polling station briefing" /></div>
            </div>

            <div className="communications-field"><label htmlFor="sms-body">Message</label><textarea id="sms-body" rows={6} maxLength={500} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a clear operational update for your selected recipients…" /><div className="communications-character-count">{body.length}/500 characters</div></div>
            <div className="communications-provider-note"><AlertTriangle size={17} /><span>Preview only. Connect an SMS provider to deliver messages to phones.</span></div>
            <button className="communications-send-button" type="submit" disabled={!body.trim() || recipients.length === 0}><Send size={16} />Review SMS for {recipients.length.toLocaleString()} recipients</button>
          </form>}

          {!canSend && canUpload && <div className="communications-upload-only"><div className="communications-provider-note"><Info size={17} /><span>Field agent access lets you upload a contact list for your campaign account. Sending is managed by an authorized campaign user.</span></div><label className={`communications-upload-button${isImporting ? ' is-loading' : ''}`}><input type="file" accept=".xlsx,.csv" onChange={handleImport} disabled={isImporting} />{isImporting ? <FileSpreadsheet size={16} /> : <Upload size={16} />}{isImporting ? 'Reading file…' : 'Upload Excel / CSV'}</label><p className="communications-upload-help">Use a Phone or Mobile column, or place numbers in column A. Excel .xlsx and CSV files are supported.</p></div>}
        </section>

        <aside className="communications-card communications-audience-card">
          <div className="communications-card-head"><div><h2>Recipient preview</h2><p>{recipientSource === 'agents' ? 'Agents in your assigned scope' : 'Numbers in the selected uploaded list'}</p></div></div>
          <div className="communications-audience-count"><Users size={19} /><strong>{recipients.length.toLocaleString()}</strong><span>recipients</span></div>
          {recipientSource === 'voters' && selectedList && <p className="communications-list-meta">Uploaded by {selectedList.uploadedByName} · {new Date(selectedList.createdAt).toLocaleDateString()}</p>}
          <div className="communications-audience-list">
            {recipients.slice(0, 7).map((recipient) => <div key={recipient.id}><span className="communications-avatar">{(recipient.name || recipient.phone || '?').slice(0, 1).toUpperCase()}</span><span><strong>{recipient.name || 'Voter contact'}</strong><small>{recipient.phone}{recipient.location ? ` · ${recipient.location}` : ''}</small></span></div>)}
            {recipients.length > 7 && <p>and { (recipients.length - 7).toLocaleString() } more recipients</p>}
            {recipients.length === 0 && <p>{recipientSource === 'agents' ? 'No uploaded agents with phone numbers are available in your scope.' : 'Select or upload a voter contact spreadsheet.'}</p>}
          </div>
        </aside>
      </div>

      {showApproval && <div className="communications-modal-backdrop" role="presentation"><section className="communications-approval-modal" role="dialog" aria-modal="true" aria-labelledby="communications-approval-title">
        <div className="communications-modal-icon"><AlertTriangle size={21} /></div><h2 id="communications-approval-title">Emergency message approval</h2><p>This emergency broadcast requires a separate checker approval for {pendingDispatch?.recipientCount || 0} recipients.</p>
        <div className="communications-message-preview"><strong>{pendingDispatch?.subject || 'Emergency alert'}</strong><span>{pendingDispatch?.body}</span></div>
        <div className="communications-modal-actions"><button type="button" className="communications-secondary-button" onClick={() => setShowApproval(false)}>Cancel</button><button type="button" className="communications-send-button" onClick={handleApproveEmergency}><CheckCircle2 size={16} />Approve preview</button></div>
      </section></div>}
    </main>
  );
};
