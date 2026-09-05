import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AddAgentModal } from './AddAgentModal';
import {
  Users,
  Search,
  UserPlus,
  MapPin,
  CheckCircle,
  Clock,
  Star,
  Activity,
  Phone,
  Shield,
  X,
  FileText,
  ClipboardList
} from 'lucide-react';

export const AgentManagement = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { agents, setAgents, geography, assignAgentToPollingStation, updateAgentStatus, getScopedAgents } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Assign Station Modal State
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState(null);
  const [bindCountyId, setBindCountyId] = useState(geography.counties[0]?.id || '');
  const [bindConstituencyId, setBindConstituencyId] = useState('');
  const [bindWardId, setBindWardId] = useState('');
  const [targetPsId, setTargetPsId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Handle Bind Modal Location Cascading
  const availableBindConstituencies = geography.constituencies.filter(c => c.countyId === bindCountyId);
  const availableBindWards = geography.wards.filter(w => w.constituencyId === bindConstituencyId);
  const availableBindPollingStations = bindWardId ? geography.pollingStations.filter(ps => ps.wardId === bindWardId) : [];

  const handleBindCountyChange = (cId) => {
    setBindCountyId(cId);
    const firstConst = geography.constituencies.find(c => c.countyId === cId)?.id || '';
    setBindConstituencyId(firstConst);
    const firstWard = geography.wards.find(w => w.constituencyId === firstConst)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleBindConstituencyChange = (csId) => {
    setBindConstituencyId(csId);
    const firstWard = geography.wards.find(w => w.constituencyId === csId)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleBindWardChange = (wId) => {
    setBindWardId(wId);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === wId)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleOpenAssignModal = (agent) => {
    setSelectedAgentForAssign(agent);
    const firstCounty = geography.counties[0]?.id || '';
    setBindCountyId(firstCounty);
    const firstConst = geography.constituencies.find(c => c.countyId === firstCounty)?.id || '';
    setBindConstituencyId(firstConst);
    const firstWard = geography.wards.find(w => w.constituencyId === firstConst)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  // Agent Activity Detail Drawer State
  const [viewingActivityAgent, setViewingActivityAgent] = useState(null);

  const scopedAgents = getScopedAgents ? getScopedAgents(currentUser, agents) : agents;

  const filteredAgents = scopedAgents.filter(a => {
    const nameStr = (a.fullName || a.name || '').toLowerCase();
    const phoneStr = a.phone || '';
    const regionStr = (a.region || '').toLowerCase();
    const matchesSearch = nameStr.includes(searchTerm.toLowerCase()) ||
                          phoneStr.includes(searchTerm) ||
                          regionStr.includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgentForAssign || !targetPsId) return;
    assignAgentToPollingStation(selectedAgentForAssign.id, targetPsId, currentUser);
    setAssignSuccess(`Successfully bound station to agent ${selectedAgentForAssign.fullName}!`);
    setTimeout(() => {
      setAssignSuccess('');
      setSelectedAgentForAssign(null);
    }, 2000);
  };

  const handleRatingChange = (agentId, newRating) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, performanceRating: newRating } : a));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users style={{ width: '28px', height: '28px', color: '#06b6d4' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Polling Station Agent Management</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Deploy, bind polling stations, monitor live activity timestamps, and track agent performance ratings.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus style={{ width: '16px', height: '16px' }} />
          <span>Register New Field Agent</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search agent by name, phone number, or region..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <select className="form-select" style={{ width: '160px', padding: '0.45rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Duty">On Duty</option>
          <option value="Inactive">Inactive</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Agents Roster Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
            Registered Field Agents ({filteredAgents.length})
          </h3>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent Name & Phone</th>
                <th>Assigned Region</th>
                <th>Assigned Polling Stations</th>
                <th>Supervisor</th>
                <th>Status</th>
                <th>Submissions & Surveys</th>
                <th>Performance Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map(ag => (
                  <tr key={ag.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{ag.fullName || ag.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone style={{ width: '12px', height: '12px' }} />
                        <span>{ag.phone}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{ag.region || ag.assignedEntity || 'Local Region'}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {Array.isArray(ag.assignedStations) && ag.assignedStations.length > 0 ? (
                        <span style={{ color: '#34d399', fontWeight: '700' }}>
                          {ag.assignedStations.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ag.supervisor || 'Regional Coordinator'}</td>
                    <td>
                      <select 
                        className={`form-select ${ag.status.toLowerCase().replace(' ', '-')}`}
                        value={ag.status}
                        onChange={e => updateAgentStatus(ag.id, e.target.value, currentUser)}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '12px', width: 'auto' }}
                      >
                        <option value="Active">Active</option>
                        <option value="On Duty">On Duty</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#818cf8' }}>
                          <FileText style={{ width: '12px', height: '12px' }} />
                          {ag.reportsSubmittedCount || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#22d3ee' }}>
                          <ClipboardList style={{ width: '12px', height: '12px' }} />
                          {ag.surveysCompletedCount || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontWeight: '800' }}>
                        <Star style={{ width: '14px', height: '14px', fill: '#fbbf24' }} />
                        <span>{ag.performanceRating || 4.5}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenAssignModal(ag)}>
                          <MapPin style={{ width: '13px', height: '13px' }} />
                          <span>Bind Station</span>
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewingActivityAgent(ag)}>
                          <Activity style={{ width: '13px', height: '13px' }} />
                          <span>Activity</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No field agents registered for your region. Click "Register New Field Agent" to deploy local agents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bind Polling Station Modal */}
      {selectedAgentForAssign && (
        <div className="modal-overlay" onClick={() => setSelectedAgentForAssign(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                  Bind Polling Station to {selectedAgentForAssign.fullName || selectedAgentForAssign.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sieve by County → Constituency → Ward to filter streams</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAgentForAssign(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            {assignSuccess && (
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {assignSuccess}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>1. County</label>
                    <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={bindCountyId} onChange={e => handleBindCountyChange(e.target.value)}>
                      {geography.counties.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>2. Constituency</label>
                    <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={bindConstituencyId} onChange={e => handleBindConstituencyChange(e.target.value)}>
                      {availableBindConstituencies.map(cs => (
                        <option key={cs.id} value={cs.id}>
                          {cs.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>3. Ward</label>
                    <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={bindWardId} onChange={e => handleBindWardChange(e.target.value)}>
                      {availableBindWards.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>4. Target Polling Station Stream</span>
                    <span style={{ fontSize: '0.72rem', color: '#34d399' }}>
                      {availableBindPollingStations.length} Stations Available
                    </span>
                  </label>
                  <select className="form-select" value={targetPsId} onChange={e => setTargetPsId(e.target.value)} required>
                    {availableBindPollingStations.length > 0 ? (
                      availableBindPollingStations.map(ps => (
                        <option key={ps.id} value={ps.id}>
                          {ps.code} - {ps.name} ({ps.registeredVoters} voters)
                        </option>
                      ))
                    ) : (
                      <option value="">No polling stations found for selected ward</option>
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Confirm Polling Station Binding
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Activity Timeline Drawer Modal */}
      {viewingActivityAgent && (
        <div className="modal-overlay" onClick={() => setViewingActivityAgent(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                  Activity Trail: {viewingActivityAgent.fullName}
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingActivityAgent(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem' }}>
                <div><strong>Status:</strong> {viewingActivityAgent.status}</div>
                <div><strong>Supervisor:</strong> {viewingActivityAgent.supervisor}</div>
                <div><strong>Last Active:</strong> {new Date(viewingActivityAgent.lastActivityTimestamp || Date.now()).toLocaleString()}</div>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: '800', marginTop: '0.5rem' }}>Submitted Reports Count: {viewingActivityAgent.reportsSubmittedCount || 0}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>Surveys Completed: {viewingActivityAgent.surveysCompletedCount || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddModal && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
