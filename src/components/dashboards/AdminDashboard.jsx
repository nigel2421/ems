import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  Map,
  UserPlus,
  CheckCircle,
  Activity,
  UserCheck,
  MapPin,
  Building2,
  ArrowUpRight,
  Plus,
  Upload,
  ClipboardList,
  Eye,
  Pencil,
  Trash2,
  X,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { checkPasswordComplexity, passwordsMatch } from '../../utils/passwordPolicy';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { AddAgentModal } from '../modules/AddAgentModal';
import { ElectoralMapWidget } from '../common/ElectoralMapWidget';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { DIVERSE_CATEGORICAL_PALETTE } from '../../utils/chartPalette';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');
const ACCOUNT_ROLES = ['Admin', 'Strategy Team', 'Regional Coordinator', 'Governor', 'Senator', 'MP', 'MCA', 'Aspirant', 'Field Agent', 'Agent', 'Observer'];

const COUNTY_CHART_COLORS = DIVERSE_CATEGORICAL_PALETTE;

export const AdminDashboard = ({
  onOpenAuditLogs,
  onOpenGeographic,
  onOpenModule,
  activeTab: controlledTab = 'overview',
  onTabChange
}) => {
  const { users, addUser, currentUser, updateUserProfile, suspendUser, reinstateUser, getAccountLockState, unlockAccount } = useAuth();
  const {
    geography,
    assignAgentToPollingStation,
    logAuditAction,
    tallyResults,
    auditLogs,
    agents: agentDirectory
  } = useData();
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [activeTab, setActiveTab] = useState(controlledTab);
  const [accountModal, setAccountModal] = useState(null); // { mode: 'view' | 'edit', user }
  const [editDraft, setEditDraft] = useState(null);
  const [accountNotice, setAccountNotice] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('active'); // 'active' | 'suspended'
  const [suspendTarget, setSuspendTarget] = useState(null);

  useEffect(() => {
    setActiveTab(controlledTab);
  }, [controlledTab]);

  const setTab = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const [role, setRole] = useState('Governor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phone, setPhone] = useState('');
  const [countyId, setCountyId] = useState(geography.counties[0]?.id || '');
  const [constituencyId, setConstituencyId] = useState('');
  const [wardId, setWardId] = useState('');
  const [party, setParty] = useState('Independent / Coalition');
  const [createdNotice, setCreatedNotice] = useState('');

  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedPs, setSelectedPs] = useState(geography.pollingStations[0]?.id || '');
  const [assignmentNotice, setAssignmentNotice] = useState('');

  const agents = users.filter((u) => u.role === 'Agent' || u.role === 'Field Agent');

  const availableConstituencies = geography.constituencies.filter((c) => c.countyId === countyId);
  const availableWards = geography.wards.filter((w) => w.constituencyId === constituencyId);
  const selectedCounty = geography.counties.find((c) => c.id === countyId);
  const selectedConstituency = geography.constituencies.find((c) => c.id === constituencyId);
  const selectedWard = geography.wards.find((w) => w.id === wardId);

  const stats = useMemo(() => {
    const counties = geography?.counties || [];
    const stations = geography?.pollingStations || [];
    const totalVoters = counties.reduce((sum, county) => sum + (Number(county.registeredVoters) || 0), 0);
    const topCounties = [...counties]
      .sort((a, b) => (Number(b.registeredVoters) || 0) - (Number(a.registeredVoters) || 0))
      .slice(0, 10)
      .map((county) => ({
        id: county.id,
        name: county.name,
        registeredVoters: Number(county.registeredVoters) || 0,
        code: county.code
      }));

    return {
      totalVoters,
      stationCount: stations.length,
      countyCount: counties.length,
      accountCount: users.length,
      pendingTallies: (tallyResults || []).filter((t) => t.status === 'Submitted' || t.status === 'Mismatch').length,
      auditCount: (auditLogs || []).length,
      agentCount: (agentDirectory || []).length || agents.length,
      topCounties,
      recentUsers: users.slice(0, 6)
    };
  }, [geography, users, tallyResults, auditLogs, agentDirectory, agents.length]);

  const countyPieData = useMemo(() => ({
    labels: stats.topCounties.map((c) => c.name),
    datasets: [
      {
        label: 'Registered voters',
        data: stats.topCounties.map((c) => c.registeredVoters),
        backgroundColor: COUNTY_CHART_COLORS,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }), [stats.topCounties]);

  const countyLineData = useMemo(() => ({
    labels: stats.topCounties.map((c) => c.name.split(' ')[0]),
    datasets: [
      {
        label: 'Registered voters',
        data: stats.topCounties.map((c) => c.registeredVoters),
        borderColor: '#006B3F',
        backgroundColor: 'rgba(0, 107, 63, 0.12)',
        pointBackgroundColor: COUNTY_CHART_COLORS,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true
      }
    ]
  }), [stats.topCounties]);

  const countyChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#6B756F',
          font: { size: 11, family: 'Inter, Segoe UI, sans-serif' },
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#073322',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (ctx) => `${ctx.label || ctx.dataset.label}: ${formatCount(ctx.raw || ctx.parsed?.y || ctx.parsed)}`
        }
      }
    }
  }), []);

  const countyLineOptions = useMemo(() => ({
    ...countyChartOptions,
    plugins: {
      ...countyChartOptions.plugins,
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B756F', font: { size: 11 }, maxRotation: 45, minRotation: 0 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(7, 51, 34, 0.06)' },
        ticks: {
          color: '#6B756F',
          font: { size: 11 },
          callback: (value) => Number(value).toLocaleString('en-KE', { notation: 'compact', maximumFractionDigits: 1 })
        }
      }
    }
  }), [countyChartOptions]);

  const handleCreateAspirant = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password && !passwordsMatch(password, passwordConfirm)) {
      setPasswordError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    const complexity = checkPasswordComplexity(password);
    if (password && !complexity.isValid) {
      setPasswordError(complexity.errors.join(' · '));
      return;
    }

    let assignedEntity = countyId;
    let entityName = selectedCounty ? selectedCounty.name : 'National';

    if (role === 'MP' || role === 'Aspirant') {
      assignedEntity = constituencyId || countyId;
      entityName = selectedConstituency
        ? selectedConstituency.name
        : selectedCounty
          ? selectedCounty.name
          : 'Constituency';
    } else if (role === 'MCA') {
      assignedEntity = wardId || constituencyId || countyId;
      entityName = selectedWard
        ? selectedWard.name
        : selectedConstituency
          ? selectedConstituency.name
          : 'Ward';
    }

    addUser({
      id: `USR-${role.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      name,
      role,
      email,
      password,
      phone: phone || '+254 700 000 000',
      assignedEntity,
      entityName,
      party,
      twoFactorEnabled: true,
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    logAuditAction(
      users.find((u) => u.role === 'Admin' || u.role === 'Super Admin') || currentUser,
      'ASPIRANT_ACCOUNT_CREATED',
      `Created ${role} account for ${name} (${email}) assigned to ${entityName}`
    );

    setCreatedNotice(`Successfully created ${role} account for ${name}! Password set.`);
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setPasswordError('');
    setPhone('');
    setTimeout(() => setCreatedNotice(''), 4000);
  };

  const handleAssignAgent = (e) => {
    e.preventDefault();
    if (!selectedAgent) return;
    assignAgentToPollingStation(
      selectedAgent,
      selectedPs,
      users.find((u) => u.role === 'Admin' || u.role === 'Super Admin') || currentUser
    );
    setAssignmentNotice(`Agent bound to polling station ${selectedPs}`);
    setTimeout(() => setAssignmentNotice(''), 4000);
  };

  const openAccountView = (user) => {
    setAccountModal({ mode: 'view', user });
    setEditDraft(null);
  };

  const openAccountEdit = (user) => {
    setAccountModal({ mode: 'edit', user });
    setEditDraft({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'Aspirant',
      entityName: user.entityName || '',
      party: user.party || '',
      phone: user.phone || ''
    });
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!accountModal?.user || !editDraft) return;
    updateUserProfile(accountModal.user.id, {
      name: editDraft.name.trim(),
      email: editDraft.email.trim(),
      role: editDraft.role,
      entityName: editDraft.entityName.trim(),
      party: editDraft.party.trim(),
      phone: editDraft.phone.trim()
    });
    logAuditAction(
      currentUser,
      'ACCOUNT_UPDATED',
      `Updated account ${editDraft.name} (${editDraft.email})`
    );
    setAccountNotice(`Updated ${editDraft.name}`);
    setAccountModal(null);
    setEditDraft(null);
    setTimeout(() => setAccountNotice(''), 3500);
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    const name = suspendTarget.name;
    suspendUser(suspendTarget.id, 'Administrative suspension via User Directory');
    logAuditAction(currentUser, 'ACCOUNT_SUSPENDED', `Suspended user ${name} (${suspendTarget.email || suspendTarget.phone})`);
    setAccountNotice(`Account for ${name} quarantined and suspended.`);
    if (accountModal?.user?.id === suspendTarget.id) {
      setAccountModal(null);
      setEditDraft(null);
    }
    setSuspendTarget(null);
    setTimeout(() => setAccountNotice(''), 3500);
  };

  const pageCopy = {
    overview: {
      title: 'Dashboard',
      subtitle: 'National register overview, accounts, and election operations controls.'
    },
    add_aspirant: {
      title: 'Add Candidate',
      subtitle: 'Provision login credentials and bind the account to county, constituency, or ward.'
    },
    assign_agent: {
      title: 'Assign Agent',
      subtitle: 'Assign polling station agents to gazette streams by location sieve.'
    },
    user_directory: {
      title: 'Accounts Directory',
      subtitle: 'Provisioned candidates and field officers with role-based access.'
    }
  };

  const copy = pageCopy[activeTab] || pageCopy.overview;

  return (
    <div className="admin-main">
      <header className="admin-page-head">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setTab('add_aspirant')}>
            <Plus strokeWidth={1.75} />
            Add candidate
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule?.('polling_stations')}>
            <Upload strokeWidth={1.75} />
            Import stations
          </button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <section className="admin-metric-grid">
            <article className="admin-metric is-featured">
              <div className="admin-metric-top">
                <span>Registered voters</span>
                <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
              </div>
              <strong>{formatCount(stats.totalVoters)}</strong>
              <small>National register total</small>
            </article>
            <article className="admin-metric">
              <div className="admin-metric-top">
                <span>Polling stations</span>
                <div className="admin-metric-icon"><Building2 strokeWidth={1.75} /></div>
              </div>
              <strong>{formatCount(stats.stationCount)}</strong>
              <small>Gazette streams loaded</small>
            </article>
            <article className="admin-metric">
              <div className="admin-metric-top">
                <span>Active accounts</span>
                <div className="admin-metric-icon"><UserCheck strokeWidth={1.75} /></div>
              </div>
              <strong>{formatCount(stats.accountCount)}</strong>
              <small>Candidates & officers</small>
            </article>
            <article className="admin-metric">
              <div className="admin-metric-top">
                <span>Pending tallies</span>
                <div className="admin-metric-icon"><ClipboardList strokeWidth={1.75} /></div>
              </div>
              <strong>{formatCount(stats.pendingTallies)}</strong>
              <small>Awaiting verification</small>
            </article>
          </section>

          <div style={{ marginBottom: '1.25rem' }}>
            <ElectoralMapWidget onOpenMapRoom={() => (onOpenModule ? onOpenModule('interactive_map') : onOpenGeographic?.())} />
          </div>

          <section className="admin-analytics-full">
            <article className="admin-card admin-card-analytics">
              <div className="admin-card-head">
                <div>
                  <h2>Register by county</h2>
                  <p>Top counties by registered voters from national geography data</p>
                </div>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenGeographic}>
                  View map
                  <ArrowUpRight strokeWidth={1.75} />
                </button>
              </div>
              <div className="admin-chart-split">
                <div className="admin-chart-panel">
                  <h3>Share of register</h3>
                  <div className="admin-chart-canvas admin-chart-canvas-lg">
                    <Pie data={countyPieData} options={countyChartOptions} />
                  </div>
                </div>
                <div className="admin-chart-panel">
                  <h3>Voters by county</h3>
                  <div className="admin-chart-canvas admin-chart-canvas-lg">
                    <Line data={countyLineData} options={countyLineOptions} />
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="admin-grid-2">
            <article className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Recent accounts</h2>
                  <p>Latest provisioned system users</p>
                </div>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setTab('user_directory')}>
                  <Plus strokeWidth={1.75} />
                  Directory
                </button>
              </div>
              <div className="admin-list">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="admin-list-item">
                    <img src={user.avatar} alt="" />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.entityName || 'Unassigned'}</span>
                    </div>
                    <span className="admin-chip">{user.role}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Operations snapshot</h2>
                  <p>Agents, counties, and audit activity</p>
                </div>
              </div>
              <div className="admin-list">
                <div className="admin-list-item">
                  <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
                  <div>
                    <strong>{formatCount(stats.agentCount)} agents</strong>
                    <span>Field force directory</span>
                  </div>
                </div>
                <div className="admin-list-item">
                  <div className="admin-metric-icon"><Map strokeWidth={1.75} /></div>
                  <div>
                    <strong>{formatCount(stats.countyCount)} counties</strong>
                    <span>National coverage units</span>
                  </div>
                </div>
                <div className="admin-list-item">
                  <div className="admin-metric-icon"><Activity strokeWidth={1.75} /></div>
                  <div>
                    <strong>{formatCount(stats.auditCount)} audit events</strong>
                    <span>System activity trail</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="admin-grid-2">
            <article className="admin-card" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-card-head">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump to common admin tasks</p>
                </div>
              </div>
              <div className="admin-head-actions" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => setTab('add_aspirant')}>
                  <UserPlus strokeWidth={1.75} />
                  Create candidate account
                </button>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowAddAgent(true)}>
                  <UserPlus strokeWidth={1.75} />
                  Add polling station agent
                </button>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setTab('assign_agent')}>
                  <MapPin strokeWidth={1.75} />
                  Assign agent to station
                </button>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenAuditLogs}>
                  <Activity strokeWidth={1.75} />
                  Open audit trail
                </button>
              </div>
            </article>
          </section>
        </>
      )}

      {activeTab === 'add_aspirant' && (
        <div className="admin-panel">
          <h2>Add new aspirant / candidate</h2>
          <p>Issue credentials and scope access to the correct electoral boundary.</p>

          {createdNotice && (
            <div className="admin-notice">
              <CheckCircle strokeWidth={1.75} />
              <span>{createdNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateAspirant} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label">Candidate role</label>
              <div className="admin-role-row">
                {['Governor', 'Senator', 'MP', 'MCA', 'Aspirant'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`admin-role-btn${role === r ? ' is-active' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="responsive-form-grid">
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input type="text" className="form-input" placeholder="e.g. Hon. Johnson Sakaja" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Party / alliance</label>
                <input type="text" className="form-input" placeholder="e.g. UDA / Azimio / Independent" value={party} onChange={(e) => setParty(e.target.value)} required />
              </div>
            </div>

            {passwordError && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="responsive-form-grid">
              <div className="form-group">
                <label className="form-label">Login email</label>
                <input type="email" className="form-input" placeholder="candidate@ems.go.ke" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input type="tel" className="form-input" placeholder="+254 7..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="responsive-form-grid">
              <div className="form-group">
                <label className="form-label">Login password</label>
                <input type="password" className="form-input" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input type="password" className="form-input" placeholder="Re-enter password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
              </div>
            </div>

            <div className="admin-geo-box">
              <div>Geographic boundary ({role})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">County</label>
                  <select className="form-select" value={countyId} onChange={(e) => { setCountyId(e.target.value); setConstituencyId(''); setWardId(''); }}>
                    <option value="">-- Select County --</option>
                    {geography.counties.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                {(role === 'MP' || role === 'MCA' || role === 'Aspirant') && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Constituency</label>
                    <select className="form-select" value={constituencyId} onChange={(e) => { setConstituencyId(e.target.value); setWardId(''); }}>
                      <option value="">-- Select Constituency --</option>
                      {availableConstituencies.map((cs) => (
                        <option key={cs.id} value={cs.id}>{cs.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {role === 'MCA' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ward</label>
                    <select className="form-select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
                      <option value="">-- Select Ward --</option>
                      {availableWards.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ height: 48, width: '100%' }}>
              <UserPlus strokeWidth={1.75} />
              Create account & issue credentials
            </button>
          </form>
        </div>
      )}

      {activeTab === 'assign_agent' && (
        <div className="admin-panel">
          <h2>Agent boundary binding</h2>
          <p>Filter County → Constituency → Ward, then bind an agent to a station stream.</p>

          {agents.length === 0 ? (
            <div className="admin-empty">
              No polling station agents registered yet. Add an agent from quick actions, then bind them here.
            </div>
          ) : (
            <form onSubmit={handleAssignAgent} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label className="form-label">Select agent</label>
                <select className="form-select" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} required>
                  <option value="">-- Select Agent --</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>

              <div className="admin-geo-box">
                <div>Location sieve</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">County</label>
                    <select className="form-select" value={countyId} onChange={(e) => { setCountyId(e.target.value); setConstituencyId(''); setWardId(''); setSelectedPs(''); }}>
                      <option value="">-- Select County --</option>
                      {geography.counties.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Constituency</label>
                    <select className="form-select" value={constituencyId} onChange={(e) => { setConstituencyId(e.target.value); setWardId(''); setSelectedPs(''); }}>
                      <option value="">-- Select Constituency --</option>
                      {availableConstituencies.map((cs) => (
                        <option key={cs.id} value={cs.id}>{cs.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ward</label>
                    <select
                      className="form-select"
                      value={wardId}
                      onChange={(e) => {
                        setWardId(e.target.value);
                        const firstPs = geography.pollingStations.find((ps) => ps.wardId === e.target.value)?.id || '';
                        setSelectedPs(firstPs);
                      }}
                    >
                      <option value="">-- Select Ward --</option>
                      {availableWards.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                  <label className="form-label">
                    Polling station stream
                    <span style={{ marginLeft: '0.5rem', color: '#0E7A45' }}>
                      {wardId ? geography.pollingStations.filter((ps) => ps.wardId === wardId).length : 0} in ward
                    </span>
                  </label>
                  <select className="form-select" value={selectedPs} onChange={(e) => setSelectedPs(e.target.value)} required>
                    {wardId ? (
                      geography.pollingStations.filter((ps) => ps.wardId === wardId).map((ps) => (
                        <option key={ps.id} value={ps.id}>
                          {ps.code} - {ps.name} ({ps.registeredVoters} voters)
                        </option>
                      ))
                    ) : (
                      <option value="">Select county, constituency, and ward first</option>
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" className="admin-btn admin-btn-primary" style={{ height: 48, width: '100%' }}>
                <MapPin strokeWidth={1.75} />
                Assign agent to selected stream
              </button>

              {assignmentNotice && (
                <div className="admin-notice">
                  <CheckCircle strokeWidth={1.75} />
                  {assignmentNotice}
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {activeTab === 'user_directory' && (() => {
        const activeAccounts = users.filter((u) => !u.isSuspended && u.status !== 'Suspended');
        const suspendedAccounts = users.filter((u) => u.isSuspended || u.status === 'Suspended');
        const displayedAccounts = directoryFilter === 'active' ? activeAccounts : suspendedAccounts;

        return (
          <div className="admin-panel">
            <div className="admin-panel-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2>User Directory ({displayedAccounts.length})</h2>
                <p>Provisioned candidates, campaign coordinators, and field agents.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', gap: '3px' }}>
                  <button
                    type="button"
                    className={`admin-btn admin-btn-sm ${directoryFilter === 'active' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                    onClick={() => setDirectoryFilter('active')}
                  >
                    Active ({activeAccounts.length})
                  </button>
                  <button
                    type="button"
                    className={`admin-btn admin-btn-sm ${directoryFilter === 'suspended' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                    onClick={() => setDirectoryFilter('suspended')}
                    style={directoryFilter === 'suspended' ? { background: '#dc2626' } : { color: '#f87171' }}
                  >
                    <ShieldAlert size={14} style={{ marginRight: 4 }} />
                    Quarantined ({suspendedAccounts.length})
                  </button>
                </div>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => setTab('add_aspirant')}>
                  <Plus strokeWidth={1.75} />
                  Add account
                </button>
              </div>
            </div>

            {accountNotice && (
              <div className="admin-notice">
                <CheckCircle strokeWidth={1.75} />
                <span>{accountNotice}</span>
              </div>
            )}

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Email / Phone</th>
                    <th>Jurisdiction</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAccounts.length > 0 ? (
                    displayedAccounts.map((u) => {
                      const isUserSuspended = u.isSuspended || u.status === 'Suspended';
                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            <span>{u.name}</span>
                          </td>
                          <td><span className={`role-badge role-${String(u.role).toLowerCase().replace(/\s+/g, '-')}`}>{u.role}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                            <div>{u.email || '—'}</div>
                            {u.phone && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.phone}</div>}
                          </td>
                          <td>{u.entityName}</td>
                          <td>
                            {isUserSuspended ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                                SUSPENDED
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="admin-icon-btn"
                                title="View account"
                                aria-label={`View ${u.name}`}
                                onClick={() => openAccountView(u)}
                              >
                                <Eye strokeWidth={1.75} />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn"
                                title="Edit account"
                                aria-label={`Edit ${u.name}`}
                                onClick={() => openAccountEdit(u)}
                              >
                                <Pencil strokeWidth={1.75} />
                              </button>
                              {isUserSuspended ? (
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-ghost admin-btn-sm"
                                  style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.35)', padding: '0.2rem 0.6rem' }}
                                  title="Reinstate account"
                                  aria-label={`Reinstate ${u.name}`}
                                  onClick={() => {
                                    reinstateUser(u.id);
                                    logAuditAction(currentUser, 'ACCOUNT_REINSTATED', `Reinstated user ${u.name} (${u.email || u.phone})`);
                                    setAccountNotice(`Account for ${u.name} has been reinstated to Active status.`);
                                    setTimeout(() => setAccountNotice(''), 4000);
                                  }}
                                >
                                  <RotateCcw size={13} style={{ marginRight: 4 }} />
                                  Reinstate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-icon-btn is-warning"
                                  style={{ color: '#f59e0b' }}
                                  title="Suspend account"
                                  aria-label={`Suspend ${u.name}`}
                                  disabled={u.id === currentUser?.id}
                                  onClick={() => setSuspendTarget(u)}
                                >
                                  <ShieldAlert strokeWidth={1.75} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {directoryFilter === 'active' ? 'No active accounts found.' : 'No quarantined or suspended accounts.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {accountModal && (
        <div className="admin-modal-overlay" onClick={() => { setAccountModal(null); setEditDraft(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>{accountModal.mode === 'edit' ? 'Edit account' : 'Account details'}</h3>
                <p>{accountModal.user.email}</p>
              </div>
              <button
                type="button"
                className="admin-icon-btn"
                aria-label="Close"
                onClick={() => { setAccountModal(null); setEditDraft(null); }}
              >
                <X strokeWidth={1.75} />
              </button>
            </div>

            {accountModal.mode === 'view' ? (
              <div className="admin-account-detail">
                <img src={accountModal.user.avatar} alt="" />
                <div className="admin-account-detail-grid">
                  <div><span>Name</span><strong>{accountModal.user.name}</strong></div>
                  <div><span>Role</span><strong>{accountModal.user.role}</strong></div>
                  <div><span>Email</span><strong>{accountModal.user.email}</strong></div>
                  <div><span>Phone</span><strong>{accountModal.user.phone || '—'}</strong></div>
                  <div><span>Jurisdiction</span><strong>{accountModal.user.entityName || '—'}</strong></div>
                  <div><span>Party</span><strong>{accountModal.user.party || '—'}</strong></div>
                  <div>
                    <span>Security status</span>
                    {getAccountLockState(accountModal.user.email).locked ? (
                      <strong style={{ color: '#BB0A21' }}>
                        {getAccountLockState(accountModal.user.email).permanent ? 'Permanently Locked' : 'Temporarily Locked'}
                      </strong>
                    ) : (
                      <strong style={{ color: '#006B3F' }}>Active / Normal</strong>
                    )}
                  </div>
                </div>
                <div className="admin-modal-actions">
                  {getAccountLockState(accountModal.user.email).locked && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => {
                        unlockAccount(accountModal.user.email);
                        logAuditAction(currentUser, 'ACCOUNT_UNLOCKED', `Admin unlocked account access for ${accountModal.user.email}`);
                        setAccountNotice(`Unlocked access for ${accountModal.user.name}`);
                        setTimeout(() => setAccountNotice(''), 3500);
                      }}
                    >
                      Restore Access (Unlock)
                    </button>
                  )}
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openAccountEdit(accountModal.user)}>
                    <Pencil strokeWidth={1.75} />
                    Edit
                  </button>
                  {accountModal.user.isSuspended || accountModal.user.status === 'Suspended' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                      onClick={() => {
                        reinstateUser(accountModal.user.id);
                        logAuditAction(currentUser, 'ACCOUNT_REINSTATED', `Reinstated user ${accountModal.user.name}`);
                        setAccountNotice(`Account for ${accountModal.user.name} has been reinstated.`);
                        setTimeout(() => setAccountNotice(''), 3500);
                        setAccountModal(null);
                      }}
                    >
                      <RotateCcw strokeWidth={1.75} />
                      Reinstate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={accountModal.user.id === currentUser?.id}
                      onClick={() => setSuspendTarget(accountModal.user)}
                    >
                      <ShieldAlert strokeWidth={1.75} />
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAccount} className="admin-account-form">
                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input
                      className="form-input"
                      value={editDraft?.name || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editDraft?.email || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={editDraft?.role || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value }))}
                    >
                      {ACCOUNT_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={editDraft?.phone || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label className="form-label">Jurisdiction</label>
                    <input
                      className="form-input"
                      value={editDraft?.entityName || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, entityName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Party</label>
                    <input
                      className="form-input"
                      value={editDraft?.party || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, party: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => { setAccountModal(null); setEditDraft(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    <CheckCircle strokeWidth={1.75} />
                    Save changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {suspendTarget && (
        <div className="admin-modal-overlay" onClick={() => setSuspendTarget(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                  <ShieldAlert size={20} />
                  Quarantine / Suspend Account
                </h3>
                <p>Restrict access for {suspendTarget.name} while preserving tally and audit logs.</p>
              </div>
              <button type="button" className="admin-icon-btn" aria-label="Close" onClick={() => setSuspendTarget(null)}>
                <X strokeWidth={1.75} />
              </button>
            </div>
            <p className="admin-modal-copy">
              Suspending <strong>{suspendTarget.email || suspendTarget.phone}</strong> immediately revokes active sessions and prevents further portal sign-ins. All historical tally returns and audit logs remain preserved.
            </p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSuspendTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                style={{ background: '#d97706', borderColor: '#b45309' }}
                onClick={handleConfirmSuspend}
              >
                <ShieldAlert strokeWidth={1.75} />
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};
