import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserPlus, X, Upload, Camera, Shield } from 'lucide-react';

export const AddAgentModal = ({ onClose, defaultAspirantId = null }) => {
  const { addUser, currentUser } = useAuth();
  const { geography, logAuditAction } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Agent2026!');
  const [pollingStationId, setPollingStationId] = useState(geography.pollingStations[0]?.id || 'PS-101');
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
      assignedEntity: pollingStationId,
      entityName: selectedPs ? selectedPs.name : 'Assigned Polling Station',
      aspirantId: targetAspirantId,
      creatorId: currentUser.id,
      twoFactorEnabled: false,
      avatar
    };

    addUser(newAgent);
    logAuditAction(currentUser, 'AGENT_REGISTERED', `Added new agent ${name} strictly bound to candidate ${currentUser.name}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '520px', padding: '1.75rem', borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#818cf8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Add Agent & Station Details</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bound strictly under candidate: {currentUser.name}</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Photo Preview & Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
            <img src={avatar} alt="Agent Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Agent Profile Photo</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload official portrait picture</div>
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

          <div className="form-group">
            <label className="form-label">Assigned Polling Station Boundary</label>
            <select className="form-select" value={pollingStationId} onChange={e => setPollingStationId(e.target.value)}>
              {geography.pollingStations.map(ps => (
                <option key={ps.id} value={ps.id}>
                  {ps.code} - {ps.name} ({ps.registeredVoters} voters)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Account Password</label>
            <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
            <UserPlus style={{ width: '16px', height: '16px' }} />
            <span>Create Agent & Lock to Candidate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
