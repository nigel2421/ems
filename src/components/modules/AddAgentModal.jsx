import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserPlus, X, Camera, MapPin, Filter } from 'lucide-react';

export const AddAgentModal = ({ onClose, defaultAspirantId = null }) => {
  const { addUser, currentUser } = useAuth();
  const { geography, logAuditAction } = useData();

  // Cascading Selection State: County -> Constituency -> Ward -> Polling Station
  const [countyId, setCountyId] = useState(() => geography.counties[0]?.id || '');
  const [constituencyId, setConstituencyId] = useState('');
  const [wardId, setWardId] = useState('');
  const [pollingStationId, setPollingStationId] = useState('');

  // Initial auto-scoping based on logged in user's jurisdiction
  useEffect(() => {
    if (!currentUser || currentUser.role === 'Admin' || currentUser.assignedEntity === 'GLOBAL') {
      const defaultCounty = geography.counties[0]?.id || '';
      setCountyId(defaultCounty);
      const firstConst = geography.constituencies.find(c => c.countyId === defaultCounty)?.id || '';
      setConstituencyId(firstConst);
      const firstWard = geography.wards.find(w => w.constituencyId === firstConst)?.id || '';
      setWardId(firstWard);
      const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
      setPollingStationId(firstPs);
      return;
    }

    // Try matching user assigned entity to Ward, Constituency or County
    const matchedWard = geography.wards.find(w => w.id === currentUser.assignedEntity || w.name.toLowerCase() === currentUser.entityName?.toLowerCase());
    if (matchedWard) {
      setCountyId(matchedWard.countyId);
      setConstituencyId(matchedWard.constituencyId);
      setWardId(matchedWard.id);
      const ps = geography.pollingStations.find(p => p.wardId === matchedWard.id);
      setPollingStationId(ps?.id || '');
      return;
    }

    const matchedConst = geography.constituencies.find(c => c.id === currentUser.assignedEntity || c.name.toLowerCase() === currentUser.entityName?.toLowerCase());
    if (matchedConst) {
      setCountyId(matchedConst.countyId);
      setConstituencyId(matchedConst.id);
      const w = geography.wards.find(ward => ward.constituencyId === matchedConst.id);
      setWardId(w?.id || '');
      const ps = geography.pollingStations.find(p => p.wardId === w?.id);
      setPollingStationId(ps?.id || '');
      return;
    }

    const matchedCounty = geography.counties.find(c => c.id === currentUser.assignedEntity || c.name.toLowerCase() === currentUser.entityName?.toLowerCase());
    if (matchedCounty) {
      setCountyId(matchedCounty.id);
      const c = geography.constituencies.find(cs => cs.countyId === matchedCounty.id);
      setConstituencyId(c?.id || '');
      const w = geography.wards.find(ward => ward.constituencyId === c?.id);
      setWardId(w?.id || '');
      const ps = geography.pollingStations.find(p => p.wardId === w?.id);
      setPollingStationId(ps?.id || '');
    }
  }, [currentUser, geography]);

  // Derived filtered lists
  const availableConstituencies = useMemo(() => {
    return geography.constituencies.filter(c => c.countyId === countyId);
  }, [geography, countyId]);

  const availableWards = useMemo(() => {
    return geography.wards.filter(w => w.constituencyId === constituencyId);
  }, [geography, constituencyId]);

  const availablePollingStations = useMemo(() => {
    if (!wardId) return [];
    return geography.pollingStations.filter(ps => ps.wardId === wardId);
  }, [geography, wardId]);

  // Handle cascading dropdown resets
  const handleCountyChange = (newCountyId) => {
    setCountyId(newCountyId);
    const firstConst = geography.constituencies.find(c => c.countyId === newCountyId)?.id || '';
    setConstituencyId(firstConst);
    const firstWard = geography.wards.find(w => w.constituencyId === firstConst)?.id || '';
    setWardId(firstWard);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
    setPollingStationId(firstPs);
  };

  const handleConstituencyChange = (newConstId) => {
    setConstituencyId(newConstId);
    const firstWard = geography.wards.find(w => w.constituencyId === newConstId)?.id || '';
    setWardId(firstWard);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === firstWard)?.id || '';
    setPollingStationId(firstPs);
  };

  const handleWardChange = (newWardId) => {
    setWardId(newWardId);
    const firstPs = geography.pollingStations.find(ps => ps.wardId === newWardId)?.id || '';
    setPollingStationId(firstPs);
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Agent2026!');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const selectedPs = geography.pollingStations.find(ps => ps.id === pollingStationId);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const targetAspirantId = defaultAspirantId || currentUser.id;

    const newAgent = {
      id: `USR-AGENT-${Date.now().toString().slice(-4)}`,
      name,
      role: 'Agent',
      email,
      password,
      phone,
      assignedEntity: pollingStationId || 'PS-1',
      entityName: selectedPs ? `${selectedPs.code} - ${selectedPs.name}` : 'Assigned Polling Station',
      aspirantId: targetAspirantId,
      creatorId: currentUser.id,
      twoFactorEnabled: false,
      avatar
    };

    addUser(newAgent);
    logAuditAction(currentUser, 'AGENT_REGISTERED', `Added new agent ${name} bound to polling station ${selectedPs?.name || pollingStationId}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '560px', padding: '1.75rem', borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#818cf8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Register Polling Station Agent</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sieve location by County → Constituency → Ward to pick exact stream</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Photo Preview & Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
            <img src={avatar} alt="Agent Preview" style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Agent Profile Photo</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload portrait photo</div>
              <label className="btn btn-secondary btn-sm" style={{ marginTop: '0.35rem', cursor: 'pointer', display: 'inline-flex' }}>
                <Camera style={{ width: '12px', height: '12px' }} />
                <span>Choose Image</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="e.g. Samuel Mutua" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="samuel@agent.ke" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" placeholder="+254 7..." value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          {/* Cascading Location Filter (Sieve) */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter style={{ width: '14px', height: '14px' }} />
              <span>Location Sieve: Select County → Constituency → Ward</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>1. County</label>
                <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={countyId} onChange={e => handleCountyChange(e.target.value)}>
                  {geography.counties.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>2. Constituency</label>
                <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={constituencyId} onChange={e => handleConstituencyChange(e.target.value)}>
                  {availableConstituencies.map(cs => (
                    <option key={cs.id} value={cs.id}>
                      {cs.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>3. Ward</label>
                <select className="form-select" style={{ fontSize: '0.8rem', padding: '0.4rem' }} value={wardId} onChange={e => handleWardChange(e.target.value)}>
                  {availableWards.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>4. Polling Station Stream</span>
                <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <MapPin style={{ width: '12px', height: '12px' }} />
                  {availablePollingStations.length} Streams in Ward
                </span>
              </label>
              <select className="form-select" value={pollingStationId} onChange={e => setPollingStationId(e.target.value)} required>
                {availablePollingStations.length > 0 ? (
                  availablePollingStations.map(ps => (
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

          <div className="form-group">
            <label className="form-label">Default Account Password</label>
            <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.25rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
            <UserPlus style={{ width: '16px', height: '16px' }} />
            <span>Confirm Agent Registration</span>
          </button>
        </form>
      </div>
    </div>
  );
};
