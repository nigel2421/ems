// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Strategy Team & Campaign Organization Main Module
// ====================================================================

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ScopedLocationSieve } from './ScopedLocationSieve';
import {
  STRATEGY_DEPARTMENTS,
  DEPARTMENT_ROLES_MAP,
  resolveOrgHierarchyGraph,
  calculateStrategyReadinessMetrics
} from '../../utils/strategyEngine';
import { ROLES } from '../../utils/rbac';
import {
  Users,
  Target,
  CheckSquare,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
  UserPlus,
  Plus,
  X,
  Search,
  ChevronRight,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Cpu,
  Lock,
  UserCheck,
  Edit2
} from 'lucide-react';
import { sanitizeMediaUrl } from '../../utils/urlSanitizer';
import './StrategyTeamModule.css';

export const StrategyTeamModule = () => {
  const { currentUser } = useAuth();
  const {
    strategyMembers,
    addStrategyMember,
    updateStrategyMember,
    strategyTasks,
    addStrategyTask,
    updateStrategyTask,
    campaignRoadmap,
    strategyMeetings,
    addStrategyMeeting,
    geography
  } = useData();

  // Active Sub-Tab: 'dashboard' | 'directory' | 'orgchart' | 'tasks' | 'roadmap' | 'meetings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers & Modals
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('DEP-FOPS');
  const [newMemberPosition, setNewMemberPosition] = useState('Field Operations Director');
  const [newMemberJurisdiction, setNewMemberJurisdiction] = useState('Nairobi City County');
  const [newMemberReportingTo, setNewMemberReportingTo] = useState('');
  const [newMemberSystemAccess, setNewMemberSystemAccess] = useState(false);
  const [newMemberSecurityRole, setNewMemberSecurityRole] = useState(ROLES.AGENT);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDept, setNewTaskDept] = useState('DEP-FOPS');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('HIGH');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Zero Dead-KPI Metrics
  const metrics = useMemo(() => {
    return calculateStrategyReadinessMetrics(strategyMembers, strategyTasks, campaignRoadmap, strategyMeetings);
  }, [strategyMembers, strategyTasks, campaignRoadmap, strategyMeetings]);

  // Org Hierarchy Graph
  const orgHierarchy = useMemo(() => {
    return resolveOrgHierarchyGraph(strategyMembers);
  }, [strategyMembers]);

  // Filtered Roster Members
  const filteredMembers = useMemo(() => {
    return strategyMembers.filter(m => {
      const matchDept = selectedDeptFilter === 'ALL' || m.departmentId === selectedDeptFilter;
      const matchSearch = !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.jurisdiction || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [strategyMembers, selectedDeptFilter, searchQuery]);

  const openTasks = useMemo(() => strategyTasks
    .filter((task) => !['COMPLETED', 'DONE'].includes(String(task.status).toUpperCase()))
    .filter((task) => !searchQuery || `${task.title} ${task.assignedToName} ${task.status}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 8), [strategyTasks, searchQuery]);

  const departmentSummary = useMemo(() => STRATEGY_DEPARTMENTS.map((department) => ({
    ...department,
    members: strategyMembers.filter((member) => member.departmentId === department.id).length,
    tasks: strategyTasks.filter((task) => task.departmentId === department.id && String(task.status).toUpperCase() !== 'COMPLETED').length
  })).sort((a, b) => (b.members + b.tasks) - (a.members + a.tasks)).slice(0, 5), [strategyMembers, strategyTasks]);

  // Add Member Handler
  const handleCreateMember = (e) => {
    e.preventDefault();
    const assigneeObj = strategyMembers.find(m => m.id === newMemberReportingTo);

    addStrategyMember({
      name: newMemberName,
      phone: newMemberPhone,
      email: newMemberEmail,
      candidateId: currentUser?.id || 'CAND-GOV-01',
      campaignId: 'CMP-NAIROBI-2027',
      departmentId: newMemberDept,
      position: newMemberPosition,
      jurisdiction: newMemberJurisdiction,
      reportingToId: newMemberReportingTo || null,
      status: 'Active',
      systemAccess: newMemberSystemAccess,
      securityRole: newMemberSystemAccess ? newMemberSecurityRole : ROLES.AGENT,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      notes: `Joined as ${newMemberPosition}`
    }, currentUser);

    setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberEmail('');
  };

  // Add Task Handler
  const handleCreateTask = (e) => {
    e.preventDefault();
    const assignee = strategyMembers.find(m => m.id === newTaskAssigneeId);

    addStrategyTask({
      title: newTaskTitle,
      departmentId: newTaskDept,
      assignedToId: newTaskAssigneeId,
      assignedToName: assignee?.name || 'Unassigned',
      jurisdiction: assignee?.jurisdiction || 'Nairobi City County',
      priority: newTaskPriority,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      status: 'TO DO',
      description: newTaskDesc
    }, currentUser);

    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  // Render Org Node Helper Component
  const renderOrgNode = (node) => {
    const dept = STRATEGY_DEPARTMENTS.find(d => d.id === node.departmentId);
    return (
      <div key={node.id} className="org-node-item d-flex flex-column align-items-center">
        <button
          type="button"
          className="org-tree-node"
          onClick={() => setSelectedMember(node)}
          style={{ borderTop: `4px solid ${dept?.color || '#3b82f6'}` }}
        >
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span className="strategy-dept-marker" style={{ backgroundColor: dept?.color || '#006B3F' }} />
            <span className="node-title">{node.position}</span>
          </div>
          <strong className="node-name">{node.name}</strong>
          <span className="node-jurisdiction">{node.jurisdiction}</span>
          {node.systemAccess && (
            <span className="node-badge">
              <Lock size={12} />
              {node.securityRole}
            </span>
          )}
        </button>

        {node.children && node.children.length > 0 && (
          <div className="org-tree-children">
            {node.children.map(child => renderOrgNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="strategy-module-shell">
      {/* Header & Contest Scope Bar */}
      <header className="admin-page-head strategy-module-head">
        <div>
          <h1>Strategy team</h1>
          <p>People, priorities and campaign progress in one place.</p>
        </div>
        <div className="admin-head-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setShowAddMemberModal(true)}
          >
            <UserPlus size={16} />
            Add member
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={() => setShowAddTaskModal(true)}
          >
            <Plus size={16} />
            New task
          </button>
        </div>
      </header>

      {/* Embedded Scoped Location Sieve Header */}
      <ScopedLocationSieve
        user={currentUser}
        geography={geography}
        purpose="Strategy Team Jurisdiction Scope"
        className="strategy-scope-sieve"
      />

      {/* Primary strategy navigation */}
      <nav className="strategy-tab-nav" aria-label="Strategy team sections">
        <button
          className={`strategy-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Layers size={16} />
          <span>Overview</span>
        </button>
        <button
          className={`strategy-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Users size={16} />
          <span>People <small>{strategyMembers.length}</small></span>
        </button>
        <button
          className={`strategy-tab-btn ${activeTab === 'orgchart' ? 'active' : ''}`}
          onClick={() => setActiveTab('orgchart')}
        >
          <Target size={16} />
          <span>Org chart</span>
        </button>
        <button
          className={`strategy-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={16} />
          <span>Tasks <small>{strategyTasks.length}</small></span>
        </button>
        <button
          className={`strategy-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <TrendingUp size={16} />
          <span>Roadmap</span>
        </button>
        <button
          className={`strategy-tab-btn ${activeTab === 'meetings' ? 'active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          <Calendar size={16} />
          <span>Meetings</span>
        </button>
      </nav>

      {/* TAB 1: COMMAND DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="strategy-dashboard-view">
          <div className="strategy-summary-grid mb-3">
            <div className="col-12 col-sm-6 col-md-3">
              <button type="button" className="admin-metric strategy-metric-button strategy-kpi strategy-kpi-green" onClick={() => setActiveTab('directory')}>
                <div className="admin-metric-top">
                  <span>Active Strategy Team</span>
                  <Users size={18} />
                </div>
                <strong>{metrics.activeMembers} Members</strong>
                <small>{metrics.activeDepartments} departments · {metrics.systemUsersCount} system roles</small>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <button type="button" className="admin-metric strategy-metric-button strategy-kpi strategy-kpi-blue" onClick={() => setActiveTab('tasks')}>
                <div className="admin-metric-top">
                  <span>Strategy Execution</span>
                  <CheckSquare size={18} />
                </div>
                <strong>{metrics.completedTasks} / {metrics.totalTasks} Done</strong>
                <small className={metrics.overdueTasks > 0 ? 'text-amber-400 font-bold' : ''}>
                  {metrics.overdueTasks} overdue
                </small>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <button type="button" className="admin-metric strategy-metric-button strategy-kpi strategy-kpi-orange" onClick={() => setActiveTab('roadmap')}>
                <div className="admin-metric-top">
                  <span>Roadmap Progress</span>
                  <TrendingUp size={18} />
                </div>
                <strong>Phase 2 / 5</strong>
                <small>83.5% Ward Teams Appointed</small>
              </button>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <button type="button" className="admin-metric strategy-metric-button strategy-kpi strategy-kpi-red" onClick={() => setActiveTab('meetings')}>
                <div className="admin-metric-top">
                  <span>Strategy Meetings</span>
                  <Calendar size={18} />
                </div>
                <strong>{metrics.activeMeetings} Meetings</strong>
                <small>Action items bound to leads</small>
              </button>
            </div>
          </div>

          <div className="strategy-overview-grid">
            <section className="admin-card strategy-overview-panel">
              <div className="admin-card-head mb-2">
              <div>
                <h2>Priority work</h2>
                <p>Open tasks across the campaign</p>
              </div>
              </div>
              <label className="strategy-overview-search">
                <Search size={15} />
                <input aria-label="Search open tasks" placeholder="Search tasks" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              </label>
              <div className="strategy-compact-table-wrap">
                <table className="strategy-compact-table">
                  <thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
                  <tbody>{openTasks.map((task) => <tr key={task.id}>
                    <td><strong>{task.title}</strong><small>{STRATEGY_DEPARTMENTS.find((department) => department.id === task.departmentId)?.name || 'Campaign'}</small></td>
                    <td>{task.assignedToName || 'Unassigned'}</td>
                    <td>{task.dueDate || '—'}</td>
                    <td><span className={`strategy-task-status strategy-task-status-${String(task.status).toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span></td>
                  </tr>)}</tbody>
                </table>
                {!openTasks.length && <p className="strategy-empty-state">No open tasks match this search.</p>}
              </div>
              <button type="button" className="strategy-text-action" onClick={() => setActiveTab('tasks')}>View all tasks <ChevronRight size={14} /></button>
            </section>

            <div className="strategy-overview-side">
              <section className="admin-card strategy-overview-panel">
                <div className="admin-card-head mb-2"><div><h2>Team coverage</h2><p>People and active tasks</p></div></div>
                <div className="strategy-coverage-list">{departmentSummary.map((department) => <button type="button" key={department.id} onClick={() => { setSelectedDeptFilter(department.id); setActiveTab('directory'); }}>
                  <span className="strategy-dept-marker" style={{ backgroundColor: department.color }} />
                  <span>{department.name}</span><strong>{department.members}</strong><small>{department.tasks} tasks</small>
                </button>)}</div>
                <button type="button" className="strategy-text-action" onClick={() => setActiveTab('directory')}>Open team directory <ChevronRight size={14} /></button>
              </section>
              <section className="admin-card strategy-overview-panel strategy-next-panel">
                <div className="admin-card-head mb-2"><div><h2>Next milestone</h2><p>Campaign roadmap</p></div></div>
                {campaignRoadmap[0] ? <><strong>{campaignRoadmap[0].phaseName}</strong><p>Target {campaignRoadmap[0].targetDate || 'date not set'}</p><button type="button" className="strategy-text-action" onClick={() => setActiveTab('roadmap')}>View roadmap <ChevronRight size={14} /></button></> : <p className="strategy-empty-state">No roadmap milestones yet.</p>}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="strategy-directory-view">
          {/* Department Filters & Search Bar */}
          <div className="admin-card agm-filters mb-3">
            <div className="agm-search">
              <Search strokeWidth={1.75} />
              <input
                type="search"
                placeholder="Search team member by name, position, or jurisdiction..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select text-xs bg-slate-900 text-slate-200 border-slate-700"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments (9)</option>
              {STRATEGY_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Members Table */}
          <div className="admin-card">
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Department & Position</th>
                    <th>Jurisdiction</th>
                    <th>Reporting To</th>
                    <th>System Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => {
                    const dept = STRATEGY_DEPARTMENTS.find(d => d.id === m.departmentId);
                    const manager = strategyMembers.find(mgr => mgr.id === m.reportingToId);
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img src={sanitizeMediaUrl(m.avatar)} alt={m.name} className="w-8 h-8 rounded-full border border-slate-700" />
                            <div>
                              <strong className="block text-slate-100">{m.name}</strong>
                              <span className="text-xs text-slate-400">{m.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-slate-800 text-slate-300 text-xs mb-1 block w-max">
                            {dept?.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 block">{m.position}</span>
                        </td>
                        <td>
                          <span className="text-xs text-cyan-300 d-flex align-items-center gap-1">
                            <MapPin size={12} /> {m.jurisdiction}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-300">
                            {manager ? manager.name : '— Candidate Direct'}
                          </span>
                        </td>
                        <td>
                          {m.systemAccess ? (
                            <span className="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs d-inline-flex align-items-center gap-1">
                              <Lock size={12} /> {m.securityRole}
                            </span>
                          ) : (
                            <span className="badge bg-slate-800 text-slate-400 text-xs">
                              No System Access
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-emerald-900/40 text-emerald-300 text-xs">
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm text-xs text-cyan-400"
                            onClick={() => setSelectedMember(m)}
                          >
                            View Profile →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL ORGANIZATION CHART */}
      {activeTab === 'orgchart' && (
        <div className="strategy-orgchart-view admin-card">
          <div className="admin-card-head mb-3">
            <div>
              <h2>Org chart</h2>
              <p>Select a person to view their profile.</p>
            </div>
          </div>

          {orgHierarchy.length > 0 ? (
            <div className="org-chart-container">
              {orgHierarchy.map(rootNode => renderOrgNode(rootNode))}
            </div>
          ) : (
            <div className="text-center p-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 my-3">
              <Target size={44} className="mx-auto text-slate-500 mb-2" />
              <h3 className="h6 font-bold text-slate-200">No Organization Tree Available</h3>
              <p className="text-xs text-slate-400 mb-3">
                Your campaign organization directory is currently unpopulated. Click below to add your campaign manager, strategists, and field coordinators.
              </p>
              <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 mx-auto" onClick={() => setShowAddMemberModal(true)}>
                <UserPlus size={15} /> Add Campaign Team Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS */}
      {activeTab === 'tasks' && (
        <div className="strategy-tasks-view">
          <div className="kanban-board">
            {['TO DO', 'IN PROGRESS', 'BLOCKED', 'COMPLETED'].map(status => {
              const colTasks = strategyTasks.filter(t => t.status === status);
              return (
                <div key={status} className="kanban-col">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="font-bold text-xs text-slate-300 tracking-wider uppercase">{status}</span>
                    <span className="badge bg-slate-800 text-slate-300 text-xs">{colTasks.length}</span>
                  </div>

                  {colTasks.map(t => (
                    <div key={t.id} className="kanban-card">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className={`badge ${t.priority === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'} text-[10px]`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 d-flex align-items-center gap-1">
                          <Clock size={10} /> {t.dueDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 mb-1">{t.title}</h4>
                      <p className="text-[11px] text-slate-400 mb-2">{t.description}</p>
                      <div className="d-flex align-items-center justify-content-between pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        <span>{t.assignedToName}</span>
                        <select
                          className="form-select text-[10px] py-0 px-1 bg-slate-900 text-slate-200 border-slate-700"
                          value={t.status}
                          onChange={e => updateStrategyTask(t.id, { status: e.target.value }, currentUser)}
                        >
                          <option value="TO DO">TO DO</option>
                          <option value="IN PROGRESS">IN PROGRESS</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="strategy-roadmap-view admin-card">
          <div className="admin-card-head mb-4">
            <div>
              <h2>Campaign roadmap</h2>
              <p>Objectives, owners and delivery progress.</p>
            </div>
          </div>

          <div className="d-flex flex-column gap-4">
            {campaignRoadmap.map(phase => (
              <div key={phase.phaseId} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h3 className="h6 font-bold text-slate-100 mb-0">{phase.phaseName}</h3>
                  <span className={`badge ${phase.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'} text-xs`}>
                    Target: {phase.targetDate}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 mt-3">
                  {phase.objectives.map(obj => (
                    <div key={obj.id} className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{obj.title}</span>
                        <span className="text-cyan-400 font-bold">{obj.actualPct}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, obj.actualPct)}%` }}
                        />
                      </div>
                      <div className="d-flex justify-content-between text-[11px] text-slate-400">
                        <span>Owner: {obj.owner}</span>
                        {obj.targetCount && <span>Target: {obj.actualCount} / {obj.targetCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="strategy-meetings-view admin-card">
          <div className="admin-card-head mb-4">
            <div>
              <h2>Meetings</h2>
              <p>Decisions and assigned actions.</p>
            </div>
          </div>

          {strategyMeetings.length === 0 && <p className="strategy-empty-state">No meetings yet.</p>}
          {strategyMeetings.map(mtg => (
            <div key={mtg.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="h6 font-bold text-slate-100 mb-0">{mtg.title}</h3>
                <span className="text-xs text-slate-400 d-flex align-items-center gap-1">
                  <Calendar size={12} /> {new Date(mtg.date).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">Chair: <strong>{mtg.chair}</strong> · Location: {mtg.location}</p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-3">
                <strong>Discussion Summary:</strong> {mtg.discussionNotes}
              </div>

              <h4 className="text-xs font-bold text-cyan-400 mb-2">Decisions & Binding Action Items:</h4>
              {mtg.decisions.map(dec => (
                <div key={dec.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs mb-2">
                  <div className="font-semibold text-slate-100 mb-1">{dec.summary}</div>
                  {dec.actionItems.map(act => (
                    <div key={act.id} className="d-flex align-items-center justify-content-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Action: {act.title} (Assigned: <strong>{act.assignedToName}</strong>)</span>
                      <span className="badge bg-amber-950 text-amber-300 border border-amber-800">{act.status}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* MEMBER PROFILE SLIDE-OUT DRAWER */}
      {selectedMember && (
        <div className="member-drawer-overlay" onClick={() => setSelectedMember(null)}>
          <div className="member-drawer" onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="h5 font-extrabold text-white mb-0">Strategy Member Profile</h3>
              <button className="btn btn-ghost btn-sm text-slate-400" onClick={() => setSelectedMember(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-4">
              <img src={sanitizeMediaUrl(selectedMember.avatar)} alt={selectedMember.name} className="w-20 h-20 rounded-full mx-auto mb-2 border-2 border-indigo-500" />
              <h4 className="font-bold text-slate-100 mb-0">{selectedMember.name}</h4>
              <span className="text-xs text-cyan-400 font-semibold">{selectedMember.position}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 mb-4 text-xs space-y-2">
              <div className="d-flex justify-content-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-200 font-semibold">{selectedMember.departmentId}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="text-slate-200 font-semibold">{selectedMember.jurisdiction}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-slate-400">Phone / Email:</span>
                <span className="text-slate-200">{selectedMember.phone}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-slate-400">Date Joined:</span>
                <span className="text-slate-200">{selectedMember.dateJoined}</span>
              </div>
            </div>

            {/* Privilege Separation Toggle */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <h5 className="text-xs font-bold text-slate-200 mb-2 d-flex align-items-center gap-1.5">
                <Lock size={14} className="text-amber-400" />
                <span>CI-EMS System Access & Security Role</span>
              </h5>
              <div className="d-flex align-items-center justify-content-between text-xs mb-2">
                <span className="text-slate-400">System Access Granted:</span>
                <button
                  className={`btn btn-sm ${selectedMember.systemAccess ? 'btn-success' : 'btn-secondary'} py-0 px-2 text-xs`}
                  onClick={() => {
                    const updated = !selectedMember.systemAccess;
                    updateStrategyMember(selectedMember.id, { systemAccess: updated }, currentUser);
                    setSelectedMember({ ...selectedMember, systemAccess: updated });
                  }}
                >
                  {selectedMember.systemAccess ? 'YES' : 'NO'}
                </button>
              </div>

              {selectedMember.systemAccess && (
                <div className="mt-2">
                  <label className="form-label text-xs text-slate-400">Assigned CI-EMS Security Role</label>
                  <select
                    className="form-select text-xs bg-slate-950 text-slate-200 border-slate-700"
                    value={selectedMember.securityRole}
                    onChange={e => {
                      updateStrategyMember(selectedMember.id, { securityRole: e.target.value }, currentUser);
                      setSelectedMember({ ...selectedMember, securityRole: e.target.value });
                    }}
                  >
                    {Object.values(ROLES).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h6 font-bold text-white mb-0">Register Strategy Team Member</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMemberModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="form-label text-slate-300">Full Name</label>
                <input type="text" className="form-input text-xs" required value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label text-slate-300">Phone</label>
                  <input type="tel" className="form-input text-xs" required value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label text-slate-300">Email</label>
                  <input type="email" className="form-input text-xs" required value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label text-slate-300">Department</label>
                  <select className="form-select text-xs" value={newMemberDept} onChange={e => setNewMemberDept(e.target.value)}>
                    {STRATEGY_DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-slate-300">Position Title</label>
                  <select className="form-select text-xs" value={newMemberPosition} onChange={e => setNewMemberPosition(e.target.value)}>
                    {(DEPARTMENT_ROLES_MAP[newMemberDept] || []).map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label text-slate-300">Reporting To Manager</label>
                <select className="form-select text-xs" value={newMemberReportingTo} onChange={e => setNewMemberReportingTo(e.target.value)}>
                  <option value="">-- Candidate Direct --</option>
                  {strategyMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="font-semibold text-slate-200">Provision CI-EMS System Account?</span>
                  <input type="checkbox" checked={newMemberSystemAccess} onChange={e => setNewMemberSystemAccess(e.target.checked)} />
                </div>
                {newMemberSystemAccess && (
                  <div>
                    <label className="form-label text-slate-400">CI-EMS Security Role</label>
                    <select className="form-select text-xs" value={newMemberSecurityRole} onChange={e => setNewMemberSecurityRole(e.target.value)}>
                      {Object.values(ROLES).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full py-2 mt-2">
                Confirm Registration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h6 font-bold text-white mb-0">Create Strategy Task</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTaskModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="form-label text-slate-300">Task Title</label>
                <input type="text" className="form-input text-xs" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label text-slate-300">Department</label>
                  <select className="form-select text-xs" value={newTaskDept} onChange={e => setNewTaskDept(e.target.value)}>
                    {STRATEGY_DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-slate-300">Priority</label>
                  <select className="form-select text-xs" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label text-slate-300">Assigned To</label>
                <select className="form-select text-xs" required value={newTaskAssigneeId} onChange={e => setNewTaskAssigneeId(e.target.value)}>
                  <option value="">-- Select Team Member --</option>
                  {strategyMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label text-slate-300">Due Date</label>
                <input type="date" className="form-input text-xs" required value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label text-slate-300">Description</label>
                <textarea className="form-input text-xs" rows="2" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary w-full py-2 mt-2">
                Create Strategy Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyTeamModule;
