import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserPlus, X, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CoordinatorAssignment } from './CoordinatorAssignment';
import { checkPasswordComplexity, passwordsMatch } from '../../utils/passwordPolicy';
import { sanitizeMediaUrl } from '../../utils/urlSanitizer';
import { validateCoordinatorStep } from '../../utils/coordinatorOnboarding';
import { resolveCoordinatorStationAssignment } from '../../utils/coordinatorAssignment';
import './AddCoordinatorModal.css';

export const AddAgentModal = ({ onClose, defaultAspirantId = null }) => {
  const { addUser, currentUser } = useAuth();
  const { geography, logAuditAction, createAgent } = useData();

  const [locationMeta, setLocationMeta] = useState({
    countyId: '',
    countyName: '',
    constituencyId: '',
    constituencyName: '',
    wardId: '',
    wardName: '',
    pollingCentreName: '',
    pollingStationId: '',
    pollingStationCode: '',
    pollingStationName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const [step, setStep] = useState(0);
  const formRef = useRef(null);
  const headingRef = useRef(null);
  const dialogRef = useRef(null);
  const submitLock = useRef(false);
  const steps = ['Profile', 'Assignment', 'Security', 'Review'];
  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => previousFocus?.focus();
  }, []);
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape' && !isSubmitting) onClose();
    if (event.key !== 'Tab') return;
    const controls = [...dialogRef.current.querySelectorAll('button, input, select, [tabindex="0"]')]
      .filter(element => !element.disabled && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const validateStep = (index) => validateCoordinatorStep(index, {
    name, phone, email: emailTouched ? email : '', password, passwordConfirm, locationMeta
  });
  const handleContinue = () => {
    if (!formRef.current?.reportValidity()) return;
    const error = validateStep(step);
    setSubmitError(error);
    if (!error) setStep(value => value + 1);
  };
  const handleBack = () => { setSubmitError(''); setStep(value => value - 1); };

  const cleanPhone = phone.trim().replace(/\s+/g, '');

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
    if (step < 3) { handleContinue(); return; }
    if (submitLock.current) return;
    for (let index = 0; index < 3; index++) {
      const error = validateStep(index);
      if (error) { setStep(index); setSubmitError(error); return; }
    }
    setSubmitError('');

    if (password && !passwordComplexity.isValid) {
      setSubmitError(passwordComplexity.errors.join(' · '));
      return;
    }

    if (password && !isMatch) {
      setSubmitError('Passwords do not match. Please verify password confirmation.');
      return;
    }

    const targetAspirantId = defaultAspirantId || currentUser?.id;
    const rawTypedEmail = emailTouched ? email.trim() : '';
    const isCreatorEmailAutofill = Boolean(
      rawTypedEmail &&
      currentUser?.email &&
      rawTypedEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
    const phoneDigits = cleanPhone.replace(/[^0-9]/g, '') || String(Date.now());
    const resolvedEmail = (rawTypedEmail && !isCreatorEmailAutofill)
      ? rawTypedEmail
      : `${phoneDigits}@agent.ems.ke`;

    const finalStationId = locationMeta.pollingStationId;
    const resolvedPs = geography.pollingStations.find(ps => ps.id === finalStationId);
    if (!resolvedPs) { setStep(1); setSubmitError('Select an available polling station.'); return; }
    const verifiedLocation = resolveCoordinatorStationAssignment(currentUser, geography, finalStationId);
    if (!verifiedLocation.complete) {
      setStep(1);
      setSubmitError('This station is outside the aspirant’s current profile assignment. Select a permitted location.');
      return;
    }
    const finalCounty = verifiedLocation.countyName;
    const finalConst = verifiedLocation.constituencyName;
    const finalWard = verifiedLocation.wardName;
    const finalEntityName = resolvedPs
      ? `${resolvedPs.code || resolvedPs.id} - ${resolvedPs.name}`
      : (locationMeta.pollingStationName || locationMeta.pollingCentreName || finalWard || 'Assigned Polling Station');

    const newAgent = {
      id: `USR-COORD-${crypto.randomUUID()}`,
      name: name.trim(),
      role: 'Agent', // Keep the existing station-scoped permission contract for coordinator accounts.
      email: resolvedEmail,
      phone: phone.trim(),
      county: finalCounty,
      constituency: finalConst,
      ward: finalWard,
      assignedEntity: finalStationId,
      entityName: finalEntityName,
      pollingStationId: finalStationId,
      pollingStationCode: resolvedPs?.code || finalStationId,
      pollingStationName: resolvedPs?.name || finalEntityName,
      assignedStations: finalStationId ? [finalStationId] : [],
      supervisorId: targetAspirantId,
      supervisor: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Campaign HQ',
      aspirantId: targetAspirantId,
      creatorId: currentUser?.id,
      twoFactorEnabled: false,
      status: 'Active',
      avatar
    };

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const res = await addUser(newAgent, password);
      if (res && res.success === false) {
        setSubmitError(res.error || 'Failed to register coordinator on server.');
        setIsSubmitting(false);
        return;
      }

      const persistedUser = res?.user || newAgent;
      if (typeof createAgent === 'function') {
        createAgent(
          {
            ...newAgent,
            ...persistedUser,
            id: persistedUser.id || newAgent.id,
            userId: persistedUser.id || newAgent.id,
            role: 'Field Agent',
            county: persistedUser.county || finalCounty,
            constituency: persistedUser.constituency || finalConst,
            ward: persistedUser.ward || finalWard,
            assignedEntity: finalStationId,
            entityName: finalEntityName,
            pollingStationId: finalStationId,
            pollingStationCode: resolvedPs?.code || finalStationId,
            pollingStationName: resolvedPs?.name || finalEntityName,
            assignedStations: finalStationId ? [finalStationId] : []
          },
          currentUser
        );
      }

      logAuditAction(currentUser, 'AGENT_REGISTERED', `Added new coordinator ${name} bound to polling station ${resolvedPs?.name || finalStationId} (Phone: ${phone})`);
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Unable to register coordinator. Please try again.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay coordinator-overlay" style={{ zIndex: 10000 }} onClick={() => !isSubmitting && onClose()}>
      <div ref={dialogRef} className="coordinator-dialog" role="dialog" aria-modal="true" aria-labelledby="coordinator-title" onClick={e => e.stopPropagation()} onKeyDown={handleDialogKeyDown}>
        <header className="coordinator-header">
          <div className="coordinator-heading"><span className="coordinator-icon"><UserPlus size={22} /></span><div><p className="coordinator-eyebrow">YOUR FIELD TEAM</p><h2 id="coordinator-title">Add coordinator</h2></div></div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSubmitting} aria-label="Close registration"><X size={18} /></button>
        </header>
        <ol className="coordinator-steps" aria-label="Registration progress">
          {steps.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <CheckCircle2 size={18} /> : index + 1}</span><strong>{label}</strong></li>)}
        </ol>
        <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
          <div className="coordinator-body">
            <div className="coordinator-step-heading"><p className="coordinator-eyebrow">STEP {step + 1} OF 4</p><h3 ref={headingRef} tabIndex={-1}>{['Who are you adding?', 'Choose their assignment', 'Secure their account', 'Review coordinator details'][step]}</h3><p>{['Start with their name and contact details.', 'Select a polling station within your electoral jurisdiction.', 'Create a password for this coordinator to sign in.', 'Check the details before creating the account.'][step]}</p></div>
            {submitError && <div className="coordinator-error" role="alert"><AlertTriangle size={18} /><span>{submitError}</span></div>}
            <section hidden={step !== 0} aria-label="Profile details">
              <div className="coordinator-photo"><img src={sanitizeMediaUrl(avatar)} alt="Coordinator profile" /><div><strong>Profile photo</strong><p>Optional portrait for your team directory</p><label className="btn btn-secondary btn-sm"><Camera size={14} /> Choose image<input type="file" accept="image/*" onChange={handlePhotoUpload} hidden disabled={step !== 0} /></label></div></div>
              <fieldset disabled={step !== 0}>
                <div className="form-group"><label className="form-label" htmlFor="coordinator-name">Full name</label><input id="coordinator-name" name="coordinator_name" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samuel Mutua" required /></div>
                <div className="coordinator-grid"><div className="form-group"><label className="form-label" htmlFor="coordinator-phone">Phone number <span>Required</span></label><input id="coordinator-phone" name="coordinator_phone" type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 345 678" required /><small>Used as their primary sign-in ID.</small></div>
                <div className="form-group"><label className="form-label" htmlFor="coordinator-email">Email address <span>Optional</span></label><input id="coordinator-email" name="coordinator_email" type="email" className="form-input" readOnly={!emailTouched} onFocus={() => setEmailTouched(true)} value={emailTouched ? email : ''} onChange={e => { setEmailTouched(true); setEmail(e.target.value); }} placeholder="name@example.com" /></div></div>
              </fieldset>
            </section>
            <section hidden={step !== 1} aria-label="Electoral assignment">
              <CoordinatorAssignment user={currentUser} geography={geography} onSelectionChange={sel => setLocationMeta(sel)} />
            </section>
            <section hidden={step !== 2} aria-label="Account security"><fieldset disabled={step !== 2}>
              <div className="form-group"><label className="form-label" htmlFor="coordinator-password">Account password</label><input id="coordinator-password" type="password" autoComplete="new-password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required /><small>At least 8 characters, with uppercase, lowercase, a number, and a special character.</small></div>
              {password && <p className={passwordComplexity.isValid ? 'coordinator-valid' : 'coordinator-hint'}>Password strength: {passwordComplexity.strengthLabel}</p>}
              <div className="form-group"><label className="form-label" htmlFor="coordinator-confirm">Confirm password</label><input id="coordinator-confirm" type="password" autoComplete="new-password" className="form-input" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required /></div>
              {passwordConfirm && <p className={isMatch ? 'coordinator-valid' : 'coordinator-hint'}>{isMatch ? 'Passwords match' : 'Passwords do not match'}</p>}
            </fieldset></section>
            {step === 3 && <section className="coordinator-review" aria-label="Registration review"><div className="coordinator-review-profile"><img src={sanitizeMediaUrl(avatar)} alt="" /><div><h4>{name}</h4><span>Polling station coordinator</span></div></div><dl>{[['Phone', phone], ['Email', emailTouched && email.trim() && email.trim().toLowerCase() !== currentUser?.email?.toLowerCase() ? email : 'Phone sign-in'], ['County', locationMeta.countyName], ['Constituency', locationMeta.constituencyName], ['Ward', locationMeta.wardName], ['Polling station', locationMeta.pollingStationName], ['Account security', 'Password configured']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl><p className="coordinator-hint">The coordinator will appear in your team directory after registration.</p></section>}
          </div>
          <footer className="coordinator-footer"><button type="button" className="btn btn-secondary" onClick={step === 0 ? onClose : handleBack} disabled={isSubmitting}>{step === 0 ? 'Cancel' : 'Back'}</button><span>{step + 1} / 4</span>{step < 3 ? <button key="continue" type="submit" className="btn btn-primary">Continue</button> : <button key="register" type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Registering coordinator…' : 'Register coordinator'}</button>}</footer>
        </form>
      </div>
    </div>
  );
};
