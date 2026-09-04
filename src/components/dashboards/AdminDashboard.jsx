import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Users, 
  Map, 
  UserPlus, 
  CheckCircle, 
  Activity,
  UserCheck,
  Shield,
  Layers,
  Building,
  MapPin
} from 'lucide-react';
import { AddAgentModal } from '../modules/AddAgentModal';

export const AdminDashboard = ({ onOpenAuditLogs, onOpenGeographic }) => {
  const { users, addUser, currentUser } = useAuth();
  const { geography, assignAgentToPollingStation, logAuditAction } = useData();
  const [showAddAgent, setShowAddAgent] = useState(false);

  // Active Menu Tab State
  const [activeTab, setActiveTab] = useState('add_aspirant'); // 'add_aspirant' | 'assign_agent' | 'user_directory'

  // Add Aspirant Form State
  const [role, setRole] = useState('Governor'); // Governor | Senator | MP | MCA | Aspirant
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countyId, setCountyId] = useState(geography.counties[0]?.id || '');
  const [constituencyId, setConstituencyId] = useState('');
  const [wardId, setWardId] = useState('');
  const [party, setParty] = useState('Independent / Coalition');
  const [createdNotice, setCreatedNotice] = useState('');

  // Agent Assignment State
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedPs, setSelectedPs] = useState(geography.pollingStations[0]?.id || '');
  const [assignmentNotice, setAssignmentNotice] = useState('');

  const agents = users.filter(u => u.role === 'Agent');

  // Filtered geography options based on selection hierarchy
  const availableConstituencies = geography.constituencies.filter(c => c.countyId === countyId);
  const availableWards = geography.wards.filter(w => w.constituencyId === constituencyId);

  const selectedCounty = geography.counties.find(c => c.id === countyId);
  const selectedConstituency = geography.constituencies.find(c => c.id === constituencyId);
  const selectedWard = geography.wards.find(w => w.id === wardId);

  const handleCreateAspirant = (e) => {
    e.preventDefault();

    let assignedEntity = countyId;
    let entityName = selectedCounty ? selectedCounty.name : 'National';

    if (role === 'MP' || role === 'Aspirant') {
      assignedEntity = constituencyId || countyId;
      entityName = selectedConstituency ? selectedConstituency.name : (selectedCounty ? selectedCounty.name : 'Constituency');
    } else if (role === 'MCA') {
      assignedEntity = wardId || constituencyId || countyId;
      entityName = selectedWard ? selectedWard.name : (selectedConstituency ? selectedConstituency.name : 'Ward');
    }

    const newAspirantUser = {
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
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    };

    addUser(newAspirantUser);
    logAuditAction(users.find(u => u.role === 'Admin'), 'ASPIRANT_ACCOUNT_CREATED', `Created ${role} account for ${name} (${email}) assigned to ${entityName}`);
    
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
    assignAgentToPollingStation(selectedAgent, selectedPs, users.find(u => u.role === 'Admin'));
    setAssignmentNotice(`Agent bound to Polling Station ${selectedPs}`);
    setTimeout(() => setAssignmentNotice(''), 4000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', minHeight: '80vh' }}>
      {/* Left Navigation Sidebar */}
      <aside 
        className="glass-card" 
        style={{
          padding: '1.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          height: 'fit-content'
        }}
      >
        <div style={{ padding: '0 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#818cf8', letterSpacing: '0.05em' }}>
            Admin Management
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '0.2rem' }}>
            System Control Panel
          </div>
        </div>

        <button
          onClick={() => setActiveTab('add_aspirant')}
          className={`btn ${activeTab === 'add_aspirant' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '10px' }}
        >
          <UserPlus style={{ width: '16px', height: '16px' }} />
          <span>Add Aspirant & Candidate</span>
        </button>

        <button
          onClick={() => setShowAddAgent(true)}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '10px', borderColor: 'rgba(99, 102, 241, 0.3)' }}
        >
          <UserPlus style={{ width: '16px', height: '16px', color: '#818cf8' }} />
          <span>Add Polling Station Agent</span>
        </button>

        <button
          onClick={() => setActiveTab('assign_agent')}
          className={`btn ${activeTab === 'assign_agent' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '10px' }}
        >
          <MapPin style={{ width: '16px', height: '16px' }} />
          <span>Bind Agent Polling Station</span>
        </button>

        <button
          onClick={() => setActiveTab('user_directory')}
          className={`btn ${activeTab === 'user_directory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '10px' }}
        >
          <UserCheck style={{ width: '16px', height: '16px' }} />
          <span>Accounts Directory ({users.length})</span>
        </button>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpenAuditLogs} style={{ justifyContent: 'flex-start' }}>
            <Activity style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
            <span>Audit Trail Ledger</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenGeographic} style={{ justifyContent: 'flex-start' }}>
            <Map style={{ width: '14px', height: '14px', color: '#10b981' }} />
            <span>IEBC Geo Inspector</span>
          </button>
        </div>
      </aside>

      {/* Main Content View based on Left Menu Selection */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeTab === 'add_aspirant' && (
          <div className="glass-card">
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>Add New Aspirant / Candidate Account</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Provision login credentials (email & password) and bind candidate to specific County, Constituency, or Ward boundaries.
              </p>
            </div>

            {createdNotice && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.85rem 1rem', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                <span>{createdNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateAspirant} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label">Select Candidate Executive Level / Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {['Governor', 'Senator', 'MP', 'MCA', 'Aspirant'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`btn ${role === r ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Candidate Full Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Hon. Johnson Sakaja" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Party / Alliance</label>
                  <input type="text" className="form-input" placeholder="e.g. UDA / Azimio / Independent" value={party} onChange={e => setParty(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Login Email Address</label>
                  <input type="email" className="form-input" placeholder="candidate@ems.go.ke" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password</label>
                  <input type="password" className="form-input" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>

              {/* Hierarchical Boundaries Breakdown */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#a5b4fc' }}>
                  IEBC Geographic Boundary Assignment ({role} Scoping)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* County Selector (Governor, Senator, MP, MCA, Aspirant) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">1. Select County</label>
                    <select className="form-select" value={countyId} onChange={e => { setCountyId(e.target.value); setConstituencyId(''); setWardId(''); }}>
                      <option value="">-- Select County --</option>
                      {geography.counties.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Constituency Selector (MP, MCA, Aspirant) */}
                  {(role === 'MP' || role === 'MCA' || role === 'Aspirant') && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">2. Select Constituency</label>
                      <select className="form-select" value={constituencyId} onChange={e => { setConstituencyId(e.target.value); setWardId(''); }}>
                        <option value="">-- Select Constituency --</option>
                        {availableConstituencies.map(cs => (
                          <option key={cs.id} value={cs.id}>
                            {cs.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ward Selector (MCA) */}
                  {role === 'MCA' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">3. Select Ward Boundary</label>
                      <select className="form-select" value={wardId} onChange={e => setWardId(e.target.value)}>
                        <option value="">-- Select Ward --</option>
                        {availableWards.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', marginTop: '0.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                <UserPlus style={{ width: '18px', height: '18px' }} />
                <span>Create Candidate Account & Issue Credentials</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'assign_agent' && (
          <div className="glass-card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.25rem' }}>Agent Boundary Binding</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Assign created polling station agents to IEBC gazette streams.
            </p>

            {agents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active polling station agents registered yet. Candidates add their agents directly from their command portal.
              </div>
            ) : (
              <form onSubmit={handleAssignAgent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Agent</label>
                  <select className="form-select" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                    <option value="">-- Select Agent --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Polling Station Stream</label>
                  <select className="form-select" value={selectedPs} onChange={e => setSelectedPs(e.target.value)}>
                    {geography.pollingStations.slice(0, 100).map(ps => (
                      <option key={ps.id} value={ps.id}>
                        {ps.code} - {ps.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary">
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  <span>Bind Agent to Station</span>
                </button>

                {assignmentNotice && (
                  <div style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                    {assignmentNotice}
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {activeTab === 'user_directory' && (
          <div className="glass-card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.25rem' }}>Active Accounts Directory ({users.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Provisioned candidates and polling station agents with strict multi-tenant role access.
            </p>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Candidate / User</th>
                    <th>Role</th>
                    <th>Email Address</th>
                    <th>Assigned Jurisdiction</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>{u.name}</span>
                      </td>
                      <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#a5b4fc' }}>{u.email}</td>
                      <td>{u.entityName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <AddAgentModal
          defaultAspirantId={currentUser.id}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};
