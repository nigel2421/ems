import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserPlus, X, Camera, MapPin, Filter, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ScopedLocationSieve } from './ScopedLocationSieve';
import { checkPasswordComplexity, passwordsMatch } from '../../utils/passwordPolicy';
import { sanitizeMediaUrl } from '../../utils/urlSanitizer';

export const AddAgentModal = ({ onClose, defaultAspirantId = null }) => {
  const { addUser, currentUser, users } = useAuth();
  const { geography, logAuditAction, agents } = useData();

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
    }
  }, [currentUser, geography]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const selectedPs = geography.pollingStations.find(ps => ps.id === pollingStationId);

  // Strict Duplicate Phone Validation
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const duplicateUser = useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 7) return null;
    const allAccounts = [...(users || []), ...(agents || [])];
    return allAccounts.find(u => {
      const p = (u.phone || '').trim().replace(/\s+/g, '');
      return p && p.length >= 7 && (p === cleanPhone || p.endsWith(cleanPhone.slice(-9)) || cleanPhone.endsWith(p.slice(-9)));
    });
  }, [cleanPhone, users, agents]);

  const passwordComplexity = useMemo(() => checkPasswordComplexity(password), [password]);
  const isMatch = useMemo(() => passwordsMatch(password, passwordConfirm), [password, passwordConfirm]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (duplicateUser) {
      setSubmitError(`Duplicate Phone: ${phone} is already registered to ${duplicateUser.name || duplicateUser.fullName || 'another agent'}. Duplicate registrations are strictly prohibited.`);
      return;
    }

    if (password && !passwordComplexity.isValid) {
      setSubmitError(passwordComplexity.errors.join(' · '));
      return;
    }

    if (password && !isMatch) {
      setSubmitError('Passwords do not match. Please verify password confirmation.');
      return;
    }

    const targetAspirantId = defaultAspirantId || currentUser.id;
    const resolvedEmail = email.trim() || `${cleanPhone.replace(/[^0-9]/g, '') || Date.now()}@agent.ems.ke`;

    const newAgent = {
      id: `USR-AGENT-${Date.now().toString().slice(-4)}`,
      name,
      role: 'Agent',
      email: resolvedEmail,
      phone,
      assignedEntity: pollingStationId || 'PS-1',
      entityName: selectedPs ? `${selectedPs.code} - ${selectedPs.name}` : 'Assigned Polling Station',
      aspirantId: targetAspirantId,
      creatorId: currentUser.id,
      twoFactorEnabled: false,
      status: 'Active',
      avatar
    };

    const res = await addUser(newAgent, password || 'dev-local-only-password');
    if (res && res.success === false) {
      setSubmitError(res.error || 'Failed to register agent on server.');
      return;
    }

    logAuditAction(currentUser, 'AGENT_REGISTERED', `Added new agent ${name} bound to polling station ${selectedPs?.name || pollingStationId} (Phone: ${phone})`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '580px', padding: '1.75rem', borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#818cf8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Register Polling Station Agent</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phone-first agent onboarding with anti-duplicate validation</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close">
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {submitError && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Photo Preview & Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
            <img src={sanitizeMediaUrl(avatar)} alt="Agent Preview" style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
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

          <div className="responsive-form-grid">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Phone Number</span>
                <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Required / Primary ID</span>
              </label>
              <input
                type="tel"
                className={`form-input${duplicateUser ? ' is-invalid' : ''}`}
                style={duplicateUser ? { borderColor: '#ef4444', background: 'rgba(239,68,68,0.08)' } : {}}
                placeholder="+254 7..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
              {duplicateUser && (
                <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldAlert size={13} />
                  <span>Duplicate: Registered to {duplicateUser.name || duplicateUser.fullName} ({duplicateUser.role || 'Agent'})</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Email Address</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Optional</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="samuel@agent.ke (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Contest-Aware Scoped Location Sieve */}
          <ScopedLocationSieve
            user={currentUser}
            geography={geography}
            purpose="Agent Registration"
            onSelectionChange={(sel) => {
              if (sel.pollingStationId) {
                setPollingStationId(sel.pollingStationId);
              }
            }}
          />

          <div className="responsive-form-grid">
            <div className="form-group">
              <label className="form-label">Account Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {password && (
                <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', color: passwordComplexity.isValid ? '#10b981' : '#f59e0b' }}>
                  Strength: {passwordComplexity.strengthLabel} {passwordComplexity.isValid && '✓'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                required
              />
              {passwordConfirm && (
                <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', color: isMatch ? '#10b981' : '#ef4444' }}>
                  {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={Boolean(duplicateUser || (password && (!passwordComplexity.isValid || !isMatch)))}
            style={{ padding: '0.75rem', marginTop: '0.25rem', background: duplicateUser ? '#64748b' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', cursor: duplicateUser ? 'not-allowed' : 'pointer' }}
          >
            <UserPlus style={{ width: '16px', height: '16px' }} />
            <span>Confirm Agent Registration</span>
          </button>
        </form>
      </div>
    </div>
  );
};
