import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AddAgentModal } from './AddAgentModal';
import { ScopedLocationSieve } from './ScopedLocationSieve';

import {
  Users,
  Search,
  UserPlus,
  MapPin,
  Star,
  Activity,
  Phone,
  X,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import '../dashboards/DashboardShared.css';
import './AgentManagement.css';

const PAGE_SIZE = 20;
const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const AgentManagement = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { agents, geography, assignAgentToPollingStation, updateAgentStatus, getScopedAgents } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState(null);
  const [bindCountyId, setBindCountyId] = useState(geography.counties[0]?.id || '');
  const [bindConstituencyId, setBindConstituencyId] = useState('');
  const [bindWardId, setBindWardId] = useState('');
  const [targetPsId, setTargetPsId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [viewingActivityAgent, setViewingActivityAgent] = useState(null);

  const availableBindConstituencies = geography.constituencies.filter((c) => c.countyId === bindCountyId);
  const availableBindWards = geography.wards.filter((w) => w.constituencyId === bindConstituencyId);
  const availableBindPollingStations = bindWardId
    ? geography.pollingStations.filter((ps) => ps.wardId === bindWardId)
    : [];

  const handleBindCountyChange = (cId) => {
    setBindCountyId(cId);
    const firstConst = geography.constituencies.find((c) => c.countyId === cId)?.id || '';
    setBindConstituencyId(firstConst);
    const firstWard = geography.wards.find((w) => w.constituencyId === firstConst)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find((ps) => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleBindConstituencyChange = (csId) => {
    setBindConstituencyId(csId);
    const firstWard = geography.wards.find((w) => w.constituencyId === csId)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find((ps) => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleBindWardChange = (wId) => {
    setBindWardId(wId);
    const firstPs = geography.pollingStations.find((ps) => ps.wardId === wId)?.id || '';
    setTargetPsId(firstPs);
  };

  const handleOpenAssignModal = (agent) => {
    setSelectedAgentForAssign(agent);
    const firstCounty = geography.counties[0]?.id || '';
    setBindCountyId(firstCounty);
    const firstConst = geography.constituencies.find((c) => c.countyId === firstCounty)?.id || '';
    setBindConstituencyId(firstConst);
    const firstWard = geography.wards.find((w) => w.constituencyId === firstConst)?.id || '';
    setBindWardId(firstWard);
    const firstPs = geography.pollingStations.find((ps) => ps.wardId === firstWard)?.id || '';
    setTargetPsId(firstPs);
  };

  const scopedAgents = getScopedAgents ? getScopedAgents(currentUser, agents) : agents;

  const filteredAgents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return scopedAgents.filter((a) => {
      const nameStr = (a.fullName || a.name || '').toLowerCase();
      const phoneStr = a.phone || '';
      const regionStr = (a.region || '').toLowerCase();
      const matchesSearch =
        !term || nameStr.includes(term) || phoneStr.includes(term) || regionStr.includes(term);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [scopedAgents, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageAgents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAgents.slice(start, start + PAGE_SIZE);
  }, [filteredAgents, page]);

  const rangeStart = filteredAgents.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredAgents.length);

  const activeCount = scopedAgents.filter((a) => a.status === 'Active' || a.status === 'On Duty').length;
  const boundCount = scopedAgents.filter((a) => Array.isArray(a.assignedStations) && a.assignedStations.length > 0).length;
  const avgRating =
    scopedAgents.length === 0
      ? 0
      : (
          scopedAgents.reduce((sum, a) => sum + (Number(a.performanceRating) || 4.5), 0) / scopedAgents.length
        ).toFixed(1);

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgentForAssign || !targetPsId) return;
    assignAgentToPollingStation(selectedAgentForAssign.id, targetPsId, currentUser);
    setAssignSuccess(`Bound station to ${selectedAgentForAssign.fullName || selectedAgentForAssign.name}.`);
    setTimeout(() => {
      setAssignSuccess('');
      setSelectedAgentForAssign(null);
    }, 2000);
  };

  const statusClass = (status) => {
    const key = String(status || '').toLowerCase().replace(/\s+/g, '-');
    if (key === 'active' || key === 'on-duty') return 'agm-status agm-status-active';
    if (key === 'inactive') return 'agm-status agm-status-inactive';
    return 'agm-status agm-status-offline';
  };

  return (
    <div className="role-dash agm-shell">
      <header className="admin-page-head">
        <div>
          <h1>Agent management</h1>
          <p>Deploy field agents, assign polling stations, and monitor duty status and performance.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus strokeWidth={1.75} />
            Register agent
          </button>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Registered agents</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(filteredAgents.length)}</strong>
          <small>Matching current filters</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>On duty / active</span>
            <div className="admin-metric-icon"><ShieldCheck strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(activeCount)}</strong>
          <small>Ready for field operations</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Station-bound</span>
            <div className="admin-metric-icon"><MapPin strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(boundCount)}</strong>
          <small>Agents with assigned streams</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Avg. rating</span>
            <div className="admin-metric-icon"><Star strokeWidth={1.75} /></div>
          </div>
          <strong>{avgRating}</strong>
          <small>Performance average</small>
        </article>
      </section>

      <article className="admin-card agm-filters">
        <div className="agm-search">
          <Search strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search by name, phone, or region…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="On Duty">On Duty</option>
          <option value="Inactive">Inactive</option>
          <option value="Offline">Offline</option>
        </select>
      </article>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Field agent roster</h2>
            <p>
              Showing {formatCount(rangeStart)}–{formatCount(rangeEnd)} of {formatCount(filteredAgents.length)}
            </p>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Region</th>
                <th>Stations</th>
                <th>Supervisor</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageAgents.length > 0 ? (
                pageAgents.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <strong style={{ display: 'block' }}>{ag.fullName || ag.name}</strong>
                      <span className="agm-phone">
                        <Phone strokeWidth={1.75} />
                        {ag.phone || '—'}
                      </span>
                    </td>
                    <td>{ag.region || ag.assignedEntity || 'Local region'}</td>
                    <td>
                      {Array.isArray(ag.assignedStations) && ag.assignedStations.length > 0 ? (
                        <span className="agm-bound">{ag.assignedStations.join(', ')}</span>
                      ) : (
                        <span className="agm-unassigned">Unassigned</span>
                      )}
                    </td>
                    <td>{ag.supervisor || 'Regional Coordinator'}</td>
                    <td>
                      <select
                        className="form-select agm-status-select"
                        value={ag.status}
                        onChange={(e) => updateAgentStatus(ag.id, e.target.value, currentUser)}
                      >
                        <option value="Active">Active</option>
                        <option value="On Duty">On Duty</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </td>
                    <td>
                      <div className="agm-activity-pills">
                        <span title="Reports">
                          <FileText strokeWidth={1.75} />
                          {ag.reportsSubmittedCount || 0}
                        </span>
                        <span title="Surveys">
                          <ClipboardList strokeWidth={1.75} />
                          {ag.surveysCompletedCount || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="agm-rating">
                        <Star strokeWidth={1.75} />
                        {ag.performanceRating || 4.5}
                      </span>
                    </td>
                    <td>
                      <div className="agm-row-actions">
                        <button type="button" className="admin-btn admin-btn-ghost agm-action-btn" onClick={() => handleOpenAssignModal(ag)}>
                          <MapPin strokeWidth={1.75} />
                          Assign
                        </button>
                        <button type="button" className="admin-btn admin-btn-ghost agm-action-btn" onClick={() => setViewingActivityAgent(ag)}>
                          <Activity strokeWidth={1.75} />
                          Activity
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="admin-empty">No field agents match these filters. Register a new agent to get started.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="agm-pagination">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="agm-pagination-controls">
            <button type="button" className="agm-page-btn" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
              <ChevronsLeft strokeWidth={1.75} />
            </button>
            <button type="button" className="agm-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
              <ChevronLeft strokeWidth={1.75} />
            </button>
            <button type="button" className="agm-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">
              <ChevronRight strokeWidth={1.75} />
            </button>
            <button type="button" className="agm-page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">
              <ChevronsRight strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </article>

      {selectedAgentForAssign && (
        <div className="agm-modal-overlay" onClick={() => setSelectedAgentForAssign(null)}>
          <div className="agm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agm-modal-head">
              <div>
                <h3>Assign polling station</h3>
                <p>{selectedAgentForAssign.fullName || selectedAgentForAssign.name}</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost agm-icon-btn" onClick={() => setSelectedAgentForAssign(null)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>

            {assignSuccess && <div className="agm-notice">{assignSuccess}</div>}

            <form onSubmit={handleAssignSubmit} className="agm-form">
              <ScopedLocationSieve
                user={currentUser}
                geography={geography}
                purpose="Agent Polling Station Assignment"
                onSelectionChange={(sel) => {
                  if (sel.pollingStationId) {
                    setTargetPsId(sel.pollingStationId);
                  }
                }}
              />

              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 46 }}>
                <UserCheck strokeWidth={1.75} />
                Confirm assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingActivityAgent && (
        <div className="agm-modal-overlay" onClick={() => setViewingActivityAgent(null)}>
          <div className="agm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agm-modal-head">
              <div>
                <h3>Activity trail</h3>
                <p>{viewingActivityAgent.fullName || viewingActivityAgent.name}</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost agm-icon-btn" onClick={() => setViewingActivityAgent(null)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>

            <div className="admin-list">
              <div className="admin-list-item">
                <div className="admin-metric-icon"><ShieldCheck strokeWidth={1.75} /></div>
                <div>
                  <strong>Status</strong>
                  <span className={statusClass(viewingActivityAgent.status)}>{viewingActivityAgent.status}</span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><UserCheck strokeWidth={1.75} /></div>
                <div>
                  <strong>Supervisor</strong>
                  <span>{viewingActivityAgent.supervisor || 'Regional Coordinator'}</span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><Activity strokeWidth={1.75} /></div>
                <div>
                  <strong>Last active</strong>
                  <span>{new Date(viewingActivityAgent.lastActivityTimestamp || Date.now()).toLocaleString()}</span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><FileText strokeWidth={1.75} /></div>
                <div>
                  <strong>Reports submitted</strong>
                  <span>{viewingActivityAgent.reportsSubmittedCount || 0}</span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><ClipboardList strokeWidth={1.75} /></div>
                <div>
                  <strong>Surveys completed</strong>
                  <span>{viewingActivityAgent.surveysCompletedCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
