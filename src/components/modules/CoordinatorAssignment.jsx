import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, LockKeyhole, MapPin, Search, Building2, Map } from 'lucide-react';
import { getCoordinatorAssignmentOptions, resolveCoordinatorAssignmentScope } from '../../utils/coordinatorAssignment.js';
import './CoordinatorAssignment.css';

const AssignmentFields = ({ scope, geography, user, onSelectionChange }) => {
  const [selection, setSelection] = useState({});
  const [activeKey, setActiveKey] = useState(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(24);
  const prefix = useId();
  const pickerRef = useRef(null);
  const callback = useRef(onSelectionChange);
  useEffect(() => { callback.current = onSelectionChange; }, [onSelectionChange]);
  const options = useMemo(() => getCoordinatorAssignmentOptions(scope, geography, selection), [scope, geography, selection]);
  useEffect(() => { callback.current?.(options.location); }, [options.location]);
  const fields = [
    !scope.county && { key: 'countyId', label: 'County', title: 'Choose a county', choices: options.counties, icon: Map },
    !scope.constituency && { key: 'constituencyId', label: 'Constituency', title: 'Choose a constituency', choices: options.constituencies, icon: Map },
    !scope.ward && { key: 'wardId', label: 'Ward', title: 'Choose a ward', choices: options.wards, icon: MapPin },
    { key: 'pollingCentreName', label: 'Polling centre', title: 'Choose a polling centre', choices: options.centres.map(name => ({ id: name, name })), icon: Building2 },
    { key: 'pollingStationId', label: 'Stream', title: 'Choose a polling stream', choices: options.stations, icon: MapPin }
  ].filter(Boolean);
  const firstIncomplete = fields.findIndex(field => !options.location[field.key]);
  const openIndex = fields.findIndex(field => field.key === activeKey);
  const index = openIndex >= 0 && (firstIncomplete < 0 || openIndex <= firstIncomplete) ? openIndex : firstIncomplete < 0 ? fields.length - 1 : firstIncomplete;
  const active = fields[index];
  useEffect(() => { if (activeKey) pickerRef.current?.scrollIntoView({ block: 'nearest' }); }, [activeKey]);
  const filtered = active.choices.filter(item => `${item.name} ${item.code || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const change = value => {
    const hierarchy = ['countyId', 'constituencyId', 'wardId', 'pollingCentreName', 'pollingStationId'];
    setSelection(previous => Object.fromEntries(hierarchy.map((key, position) => [key,
      key === active.key ? value : position > hierarchy.indexOf(active.key) ? '' : previous[key] || ''
    ])));
    setActiveKey(fields[Math.min(index + 1, fields.length - 1)].key);
    setQuery(''); setLimit(24);
  };
  const edit = key => { setActiveKey(key); setQuery(''); setLimit(24); };
  const locked = [['County', scope.county], ['Constituency', scope.constituency], ['Ward', scope.ward]].filter(([, item]) => item);
  if (!scope.isConfigured || scope.failClosed) return <div className="ca-error" role="alert"><AlertTriangle size={24} /><div><h4>We could not confirm this campaign’s area</h4><p>{scope.error}</p><p>No locations can be selected until the profile assignment is resolved.</p></div></div>;

  return <div className="ca-workspace">
    <section className="ca-campaign" aria-label="Aspirant profile restrictions">
      <div className="ca-campaign-top"><span className="ca-lock"><LockKeyhole size={18} /></span><div><span className="ca-caption">CAMPAIGN AREA</span><h4>{user.name || 'Your campaign'}</h4></div><span className="ca-role">{user.role}</span></div>
      <div className="ca-boundaries">{locked.length ? locked.map(([label, item]) => <div key={label}><span>{label}</span><strong>{item.name}</strong><LockKeyhole size={12} aria-label="Locked from profile" /></div>) : <p>National campaign · All counties available</p>}</div>
      <p className="ca-scope-note">{locked.length ? 'Set by the aspirant profile. Your choices below stay inside this area.' : 'Start with the county where this coordinator will work.'}</p>
    </section>
    <nav className="ca-trail" aria-label="Location selection progress">{fields.map((field, position) => <button key={field.key} type="button" aria-current={position === index ? 'step' : undefined} disabled={firstIncomplete >= 0 && position > firstIncomplete} onClick={() => edit(field.key)}><span>{options.location[field.key] ? <Check size={14} /> : position + 1}</span><div><strong>{field.label}</strong><small>{options.location[field.key] ? ((field.key === 'pollingStationId' ? options.location.pollingStationCode : field.choices.find(item => String(item.id) === String(options.location[field.key]))?.name) || 'Selected') : 'Choose location'}</small></div></button>)}</nav>
    <section ref={pickerRef} className="ca-picker" aria-labelledby={`${prefix}-title`}>
      <div className="ca-picker-heading"><div><span className="ca-caption">LOCATION {index + 1} OF {fields.length}</span><h4 id={`${prefix}-title`}>{active.title}</h4></div><span className="ca-count">{active.choices.length} available</span></div>
      <label className="ca-search"><Search size={18} /><span className="ca-sr">Search {active.label.toLowerCase()}</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(24); }} placeholder={`Search ${active.label.toLowerCase()} by name or code`} /></label>
      <div className="ca-options" role="group" aria-label={active.title}>{filtered.slice(0, limit).map(item => {
        const selected = String(options.location[active.key]) === String(item.id);
        const Icon = active.icon;
        return <button type="button" key={item.id} className={`ca-option${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => change(item.id)}><span className="ca-option-icon"><Icon size={20} /></span><span className="ca-option-copy"><strong>{active.key === 'pollingStationId' && item.code ? `Stream ${String(item.code).slice(-2)}` : item.name}</strong><small>{item.code ? `Code ${item.code}` : active.label}{item.registeredVoters ? ` · ${Number(item.registeredVoters).toLocaleString()} voters` : ''}</small></span><span className="ca-option-check">{selected && <Check size={14} />}</span></button>;
      })}</div>
      {!filtered.length && <div className="ca-empty"><Search size={26} /><strong>{active.choices.length ? 'No matching locations' : 'No locations available'}</strong><p>{active.choices.length ? 'Try another name or clear the search.' : 'The selected area has no locations in the electoral register. Choose another permitted area or ask an administrator to check the profile.'}</p></div>}
      {filtered.length > limit && <button type="button" className="ca-show-more" onClick={() => setLimit(value => value + 24)}>Show more locations ({filtered.length - limit} remaining)</button>}
    </section>
    {options.location.complete && <div className="ca-ready" role="status"><CheckCircle2 size={24} /><div><strong>Location confirmed</strong><p>{[options.location.wardName, options.location.pollingCentreName, options.location.pollingStationCode].filter(Boolean).join(' · ')}</p><small>This stream is selected for the coordinator.</small></div></div>}
  </div>;
};

export const CoordinatorAssignment = ({ user, geography, onSelectionChange }) => {
  const scope = useMemo(() => resolveCoordinatorAssignmentScope(user, geography), [user, geography]);
  const identity = JSON.stringify([user?.id, scope.level, scope.county?.id, scope.constituency?.id, scope.ward?.id, scope.error]);
  return <AssignmentFields key={identity} scope={scope} geography={geography} user={user || {}} onSelectionChange={onSelectionChange} />;
};
