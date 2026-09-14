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
  ClipboardList
} from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';
import './AdminDashboard.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const AdminDashboard = ({
  onOpenAuditLogs,
  onOpenGeographic,
  onOpenModule,
  activeTab: controlledTab = 'overview',
  onTabChange
}) => {
  const { users, addUser, currentUser } = useAuth();
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
      .slice(0, 7);
    const maxVoters = Math.max(...topCounties.map((c) => Number(c.registeredVoters) || 0), 1);

    return {
      totalVoters,
      stationCount: stations.length,
      countyCount: counties.length,
      accountCount: users.length,
      pendingTallies: (tallyResults || []).filter((t) => t.status === 'Submitted' || t.status === 'Mismatch').length,
      auditCount: (auditLogs || []).length,
      agentCount: (agentDirectory || []).length || agents.length,
      topCounties: topCounties.map((county) => ({
        id: county.id,
        name: county.name,
        pct: Math.max(10, Math.round(((Number(county.registeredVoters) || 0) / maxVoters) * 100))
      })),
      recentUsers: users.slice(0, 6)
    };
  }, [geography, users, tallyResults, auditLogs, agentDirectory, agents.length]);

  const handleCreateAspirant = (e) => {
    e.preventDefault();

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
      title: 'Bind Agent',
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

          <section className="admin-grid-2">
            <article className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Register by county</h2>
                  <p>Largest counties by registered voters</p>
                </div>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenGeographic}>
                  View map
                  <ArrowUpRight strokeWidth={1.75} />
                </button>
              </div>
              <div className="admin-bars">
                {stats.topCounties.map((county, index) => (
                  <div key={county.id}>
                    <i className={index === 0 ? 'is-accent' : undefined} style={{ height: `${county.pct}%` }} />
                    <span>{county.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </article>

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
          </section>

          <section className="admin-grid-2">
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

            <article className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump to common admin tasks</p>
                </div>
              </div>
              <div className="admin-head-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
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
                  Bind agent to station
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

            <div className="responsive-form-grid">
              <div className="form-group">
                <label className="form-label">Login email</label>
                <input type="email" className="form-input" placeholder="candidate@ems.go.ke" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Login password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                Bind agent to selected stream
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

      {activeTab === 'user_directory' && (
        <div className="admin-panel">
          <h2>Active accounts ({users.length})</h2>
          <p>Provisioned candidates and polling station agents.</p>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Jurisdiction</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      <span>{u.name}</span>
                    </td>
                    <td><span className={`role-badge role-${String(u.role).toLowerCase().replace(/\s+/g, '-')}`}>{u.role}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</td>
                    <td>{u.entityName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
