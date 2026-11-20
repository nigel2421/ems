import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserPlus, X, CheckCircle2, LockKeyhole, Search, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { teamRequest } from '../../services/teamApi';
import { isSystemAdmin, teamRoleLabel } from '../../utils/teamHierarchy';
import { resolveCoordinatorAssignmentScope } from '../../utils/coordinatorAssignment';
import { checkPasswordComplexity, passwordsMatch } from '../../utils/passwordPolicy';
import { validateCoordinatorStep } from '../../utils/coordinatorOnboarding';
import { CoordinatorAssignment } from './CoordinatorAssignment';
import './AddCoordinatorModal.css';
import './CoordinatorAssignment.css';

const BoundaryPicker = ({ manager, role, geography, onChange }) => {
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState('');
  const [limit,setLimit]=useState(24);
  const callback=useRef(onChange);
  useEffect(()=>{callback.current=onChange;},[onChange]);
  const scope=useMemo(()=>resolveCoordinatorAssignmentScope(manager,geography),[manager,geography]);
  const fixed = role==='National Coordinator' ? {id:'GLOBAL',name:'National campaign'} : role==='County Coordinator' ? scope.county : role==='Constituency Coordinator' ? scope.constituency : role==='Ward Coordinator' ? scope.ward : null;
  useEffect(()=>{callback.current?.(scope.isConfigured ? fixed?.id || '' : '');},[scope,fixed?.id]);
  if (!scope.isConfigured || scope.failClosed) return <div className="ca-error" role="alert">{scope.error}</div>;
  if (role==='Agent') return <CoordinatorAssignment user={manager} geography={geography} onSelectionChange={location=>onChange(location.complete ? location.pollingStationId : '')} />;
  if (fixed) return <div className="tm-fixed"><LockKeyhole size={28}/><span>ASSIGNED FROM ASPIRANT PROFILE</span><h3>{fixed.name}</h3><p>This {teamRoleLabel(role).toLowerCase()} will lead the aspirant’s assigned area. This boundary cannot be changed.</p></div>;
  const choices = role==='County Coordinator' ? geography.counties : role==='Constituency Coordinator' ? geography.constituencies.filter(item=>item.countyId===scope.county?.id) : geography.wards.filter(item=>item.constituencyId===scope.constituency?.id);
  const filtered=choices.filter(item=>item.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="ca-workspace"><div className="tm-scope-note"><LockKeyhole size={16}/>{[scope.county?.name,scope.constituency?.name,scope.ward?.name].filter(Boolean).join(' / ') || 'National campaign'}</div><label className="ca-search"><Search size={18}/><input aria-label="Search assignment" placeholder="Search permitted locations" value={query} onChange={event=>{setQuery(event.target.value);setLimit(24);}}/></label><div className="ca-options">{filtered.slice(0,limit).map(item=><button type="button" key={item.id} className={`ca-option${selected===item.id ? ' is-selected' : ''}`} aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);onChange(item.id);}}><MapPin size={18}/><span className="ca-option-copy"><strong>{item.name}</strong><small>{teamRoleLabel(role)}</small></span><span className="ca-option-check">{selected===item.id && <CheckCircle2 size={14}/>}</span></button>)}</div>{!filtered.length && <p className="ca-empty">No permitted locations match this search.</p>}{filtered.length>limit && <button type="button" className="ca-show-more" onClick={()=>setLimit(value=>value+24)}>Show more</button>}</div>;
};

export const TeamMemberModal = ({onClose,onCreated,workspace}) => {
  const {currentUser}=useAuth();
  const {geography}=useData();
  const [data,setData]=useState(workspace || null);
  const [aspirants,setAspirants]=useState([]);
  const [aspirantId,setAspirantId]=useState('');
  const [step,setStep]=useState(0);
  const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
  const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
  const [assignmentId,setAssignmentId]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(!workspace);
  const formRef=useRef(null),dialogRef=useRef(null),headingRef=useRef(null),lock=useRef(false);
  const admin=isSystemAdmin(currentUser);
  useEffect(()=>{
    if(workspace && !admin)return;
    const controller=new AbortController();setLoading(true);
    teamRequest('',{aspirantId:admin ? aspirantId : undefined,signal:controller.signal}).then(result=>{if(result.aspirants){setAspirants(result.aspirants);setData(null);}else setData(result);setError('');}).catch(reason=>{if(reason.name!=='AbortError')setError(reason.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[workspace,admin,aspirantId]);
  useEffect(()=>{const previous=document.activeElement;return()=>previous?.focus();},[]);
  useEffect(()=>{headingRef.current?.focus();},[step]);
  const manager=admin ? data?.aspirant : data?.self;
  const role=data?.nextRole;
  const steps=['Profile','Assignment','Security','Review'];
  const validate=index=>index===0 ? validateCoordinatorStep(0,{name,phone,email}) : index===1 ? (!assignmentId ? 'Select the assigned area before continuing.' : '') : index===2 ? (!checkPasswordComplexity(password).isValid ? checkPasswordComplexity(password).errors.join(' · ') : !passwordsMatch(password,confirmation) ? 'Passwords do not match.' : '') : '';
  const submit=async event=>{
    event.preventDefault();setError('');
    const problem=validate(step);if(problem){setError(problem);return;}
    if(step<3){setStep(step+1);return;}
    for(let index=0;index<3;index++){const problem=validate(index);if(problem){setStep(index);setError(problem);return;}}
    if(lock.current)return;lock.current=true;setBusy(true);
    try{await teamRequest('/members',{method:'POST',aspirantId:admin ? aspirantId : undefined,body:{name,phone,email,password,role,assignmentId}});onCreated?.();window.dispatchEvent(new Event('campaign-team-updated'));onClose();}catch(reason){setError(reason.message);}finally{lock.current=false;setBusy(false);}
  };
  const keyDown=event=>{
    if(event.key==='Escape' && !busy)onClose();
    if(event.key!=='Tab')return;
    const controls=[...dialogRef.current.querySelectorAll('button,input,select,[tabindex="0"]')].filter(item=>!item.disabled && item.getClientRects().length);
    if(event.shiftKey && [controls[0],headingRef.current].includes(document.activeElement)){event.preventDefault();controls.at(-1)?.focus();}
    else if(!event.shiftKey && document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}
  };
  return <div className="modal-overlay coordinator-overlay" style={{zIndex:10000}} onClick={()=>!busy && onClose()}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="team-create-title" className="coordinator-dialog" onClick={event=>event.stopPropagation()} onKeyDown={keyDown}>
    <aside className="coordinator-rail"><span className="coordinator-rail-brand"><UserPlus size={24}/> KURATECH / TEAM</span><div className="coordinator-rail-intro"><p>CAMPAIGN OPERATIONS</p><h2>Build your<br/>reporting line.</h2><span>Every role belongs to one aspirant and one assigned area.</span></div><ol className="coordinator-steps" aria-label="Registration progress">{steps.map((label,index)=><li key={label} aria-current={index===step ? 'step' : undefined} className={index<step ? 'is-complete' : ''}><span>{index<step ? <CheckCircle2 size={18}/> : index+1}</span><strong>{label}</strong></li>)}</ol><div className="coordinator-rail-owner"><span>ASPIRANT</span><strong>{data?.aspirant?.name || 'Choose a campaign'}</strong><small>{data?.aspirant?.role}</small></div></aside>
    <div className="coordinator-main"><header className="coordinator-header"><div><p className="coordinator-eyebrow">NEXT LEVEL IN YOUR TEAM</p><h2 id="team-create-title">{role ? `Add ${teamRoleLabel(role).toLowerCase()}` : 'Create campaign team'}</h2></div><button type="button" className="btn btn-secondary btn-sm" aria-label="Close registration" disabled={busy} onClick={onClose}><X size={18}/></button></header>
    <form ref={formRef} onSubmit={submit}><div className="coordinator-body">{admin && <div className="form-group"><label className="form-label" htmlFor="tm-aspirant">Aspirant campaign</label><select id="tm-aspirant" className="form-select" value={aspirantId} disabled={busy} onChange={event=>{setAspirantId(event.target.value);setStep(0);setAssignmentId('');}}><option value="">Choose aspirant</option>{aspirants.map(user=><option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></div>}
    {loading && <p role="status">Loading campaign permissions…</p>}{error && <div className="coordinator-error" role="alert">{error}</div>}
    {!loading && data && !role && <p>This account cannot create lower-level accounts.</p>}
    {role && !loading && <><div className="coordinator-step-heading"><p className="coordinator-eyebrow">STEP {step+1} OF 4</p><h3 ref={headingRef} tabIndex={-1}>{['Who will lead this area?','Set their responsibility','Secure the account','Review the reporting line'][step]}</h3><p>Reports to {manager?.name} · {data.aspirant.name} campaign</p></div>
    <section hidden={step!==0}><fieldset disabled={step!==0 || busy}><div className="form-group"><label htmlFor="tm-name" className="form-label">Full name</label><input id="tm-name" className="form-input" value={name} onChange={event=>setName(event.target.value)} required maxLength={120}/></div><div className="coordinator-grid"><div className="form-group"><label htmlFor="tm-phone" className="form-label">Phone number</label><input id="tm-phone" className="form-input" type="tel" placeholder="0712 345 678" value={phone} onChange={event=>setPhone(event.target.value)} required/></div><div className="form-group"><label htmlFor="tm-email" className="form-label">Email (optional)</label><input id="tm-email" className="form-input" type="email" autoComplete="off" value={email} onChange={event=>setEmail(event.target.value)}/></div></div></fieldset></section>
    <section hidden={step!==1}><BoundaryPicker key={`${manager?.id}-${role}-${aspirantId}`} manager={manager} role={role} geography={geography} onChange={setAssignmentId}/></section>
    <section hidden={step!==2}><fieldset disabled={step!==2 || busy}><div className="form-group"><label htmlFor="tm-password" className="form-label">Password</label><input id="tm-password" className="form-input" type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} required/><small>8+ characters, uppercase, lowercase, number, and symbol.</small></div><div className="form-group"><label htmlFor="tm-confirmation" className="form-label">Confirm password</label><input id="tm-confirmation" className="form-input" type="password" autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} required/></div></fieldset></section>
    {step===3 && <section className="coordinator-review"><h3>{name}</h3><dl>{[['Role',teamRoleLabel(role)],['Aspirant',data.aspirant.name],['Reports to',manager.name],['Phone',phone],['Area',geography.counties.concat(geography.constituencies,geography.wards,geography.pollingStations).find(item=>item.id===assignmentId)?.name || 'National campaign']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="coordinator-hint">This person signs in to their own dashboard. Their team, assignments and reports stay within this campaign.</p></section>}</>}
    </div><footer className="coordinator-footer"><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>step ? (setStep(step-1),setError('')) : onClose()}>{step ? 'Back' : 'Cancel'}</button><span>{step+1} / 4</span><button type="submit" className="btn btn-primary" disabled={busy || loading || !role}>{busy ? 'Creating…' : step===3 ? 'Create account' : 'Continue'}</button></footer></form></div></div></div>;
};
