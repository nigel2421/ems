import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, LockKeyhole, MapPin } from 'lucide-react';
import { getCoordinatorAssignmentOptions, resolveCoordinatorAssignmentScope } from '../../utils/coordinatorAssignment.js';
import './CoordinatorAssignment.css';

const AssignmentFields = ({ scope, geography, user, onSelectionChange }) => {
  const [selection, setSelection] = useState({});
  const prefix = useId();
  const callback = useRef(onSelectionChange);
  useEffect(() => { callback.current = onSelectionChange; }, [onSelectionChange]);
  const options = useMemo(() => getCoordinatorAssignmentOptions(scope, geography, selection), [scope, geography, selection]);
  useEffect(() => { callback.current?.(options.location); }, [options.location]);

  const change = (field, value) => {
    const hierarchy = ['countyId', 'constituencyId', 'wardId', 'pollingCentreName', 'pollingStationId'];
    setSelection(previous => Object.fromEntries(hierarchy.map((key, index) => [key,
      key === field ? value : index > hierarchy.indexOf(field) ? '' : previous[key] || ''
    ])));
  };
  if (!scope.isConfigured || scope.failClosed) return (
    <div className="assignment-error" role="alert"><AlertTriangle size={22} /><div><strong>Update aspirant profile to continue</strong><p>{scope.error}</p></div></div>
  );

  const fields = [
    !scope.county && { key: 'countyId', label: 'County', placeholder: 'Select county', choices: options.counties, hint: 'Choose the county for this assignment.' },
    !scope.constituency && { key: 'constituencyId', label: 'Constituency', placeholder: 'Select constituency', choices: options.constituencies, hint: options.location.countyId ? `${options.constituencies.length} constituencies in ${options.location.countyName}` : 'Select a county first.' },
    !scope.ward && { key: 'wardId', label: 'Ward', placeholder: 'Select ward', choices: options.wards, hint: options.location.constituencyId ? `${options.wards.length} wards in ${options.location.constituencyName}` : 'Select a constituency first.' },
    { key: 'pollingCentreName', label: 'Polling centre', placeholder: 'Select polling centre', choices: options.centres.map(name => ({ id: name, name })), hint: options.location.wardId ? `${options.centres.length} centres in ${options.location.wardName}` : 'Select a ward first.' },
    { key: 'pollingStationId', label: 'Polling station / stream', placeholder: 'Select polling stream', choices: options.stations, hint: options.location.pollingCentreName ? `${options.stations.length} streams at this centre` : 'Select a polling centre first.' }
  ].filter(Boolean);
  const locked = [['County', scope.county], ['Constituency', scope.constituency], ['Ward', scope.ward]].filter(([, item]) => item);

  return (
    <div className="coordinator-assignment">
      <section className="assignment-profile" aria-label="Aspirant profile restrictions">
        <div className="assignment-profile-heading"><span className="assignment-profile-icon"><LockKeyhole size={20} /></span><div><p className="assignment-overline">FROM ASPIRANT PROFILE</p><h4>{user.name || 'Your campaign'}</h4><span>{scope.contestType}</span></div></div>
        {locked.length ? <dl className="assignment-locked">{locked.map(([label, item]) => <div key={label}><dt>{label} <LockKeyhole size={12} aria-hidden="true" /></dt><dd>{item.name}</dd></div>)}</dl> : <p className="assignment-profile-note">National access · Choose the coordinator’s county below.</p>}
        {locked.length > 0 && <p className="assignment-profile-note">These locations are fixed by the aspirant’s profile. Only locations within this area are available.</p>}
      </section>

      <div className="assignment-fields">
        {fields.map(field => <div className={`assignment-field${field.key === 'pollingStationId' ? ' assignment-field-wide' : ''}`} key={field.key}>
          <label htmlFor={`${prefix}-${field.key}`}>{field.label}</label>
          <select id={`${prefix}-${field.key}`} className="form-select" aria-describedby={`${prefix}-${field.key}-hint`} value={options.location[field.key] || ''} disabled={!field.choices.length} onChange={event => change(field.key, event.target.value)}>
            <option value="">{field.placeholder}</option>
            {field.choices.map(item => <option key={item.id} value={item.id}>{item.code ? `[${item.code}] ` : ''}{item.name}</option>)}
          </select>
          <p id={`${prefix}-${field.key}-hint`}>{field.hint}</p>
        </div>)}
      </div>

      <div className={`assignment-summary${options.location.complete ? ' is-ready' : ''}`} aria-live="polite">
        {options.location.complete ? <CheckCircle2 size={22} /> : <MapPin size={22} />}
        <div><strong>{options.location.complete ? 'Assignment ready' : 'Complete the location selection'}</strong><p>{options.location.complete ? [options.location.wardName, options.location.pollingCentreName, options.location.pollingStationCode].filter(Boolean).join(' · ') : 'Choose each location in order to assign this coordinator to a polling stream.'}</p></div>
      </div>
    </div>
  );
};

export const CoordinatorAssignment = ({ user, geography, onSelectionChange }) => {
  const scope = useMemo(() => resolveCoordinatorAssignmentScope(user, geography), [user, geography]);
  // Changing the aspirant or their locked boundary discards the previous selection.
  const identity = JSON.stringify([user?.id, scope.level, scope.county?.id, scope.constituency?.id, scope.ward?.id, scope.error]);
  return <AssignmentFields key={identity} scope={scope} geography={geography} user={user || {}} onSelectionChange={onSelectionChange} />;
};
