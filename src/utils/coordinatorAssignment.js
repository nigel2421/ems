import { cleanScopeValue, CONTEST_JURISDICTION_POLICY } from './scopeResolver.js';

const token = value => String(value || '').toLowerCase().replace(/\b(county|constituency|ward|city)\b/g, '').replace(/[^a-z0-9]/g, '');
const matches = (item, value) => (String(item.id) === String(value) || (item.code != null && String(item.code) === String(value))) || token(item.name) === token(value);
const find = (items, value) => {
  if (!cleanScopeValue(String(value || ''))) return null;
  const exact = items.find(item => String(item.id) === String(value));
  if (exact) return exact;
  const named = items.filter(item => matches(item, value));
  return named.length === 1 ? named[0] : null;
};
const denied = error => ({ isConfigured: false, failClosed: true, error, locked: {}, selectableLevels: [] });

// Resolve legacy assignedEntity IDs as well as explicit profile geography. A profile
// must resolve to one real boundary before any subordinate locations are offered.
export const resolveCoordinatorAssignmentScope = (user, geography) => {
  if (!user) return denied('Sign in before assigning a coordinator.');
  const counties = geography.counties || [];
  const constituencies = geography.constituencies || [];
  const wards = geography.wards || [];
  const roleLevels = {
    MP: 'CONSTITUENCY', 'Constituency Coordinator': 'CONSTITUENCY',
    MCA: 'WARD', 'Ward Coordinator': 'WARD',
    Governor: 'COUNTY', Senator: 'COUNTY', 'Woman Rep': 'COUNTY', 'County Coordinator': 'COUNTY',
    Presidential: 'NATIONAL', President: 'NATIONAL', Admin: 'NATIONAL', 'Super Admin': 'NATIONAL'
  };
  let level = roleLevels[user.role];
  if (!level && (user.contestType || user.contest)) {
    const contest = String(user.contestType || user.contest).trim().toUpperCase().replace(/\s+/g, '_');
    const policy = CONTEST_JURISDICTION_POLICY[contest];
    if (!policy) return denied('Your aspirant profile has an unrecognized contest. Ask an administrator to update it.');
    level = policy.level;
  }
  if (!level) {
    if (find(wards, user.assignedEntity) || cleanScopeValue(user.ward)) level = 'WARD';
    else if (find(constituencies, user.assignedEntity) || cleanScopeValue(user.constituency)) level = 'CONSTITUENCY';
    else if (find(counties, user.assignedEntity) || cleanScopeValue(user.county)) level = 'COUNTY';
  }
  if (!level || !['NATIONAL', 'COUNTY', 'CONSTITUENCY', 'WARD'].includes(level)) return denied('Your aspirant profile needs a valid electoral assignment. Ask an administrator to update it.');

  let county = null;
  let constituency = null;
  let ward = null;
  const boundaryItems = level === 'WARD' ? wards : level === 'CONSTITUENCY' ? constituencies : counties;
  const boundaryField = level === 'WARD' ? 'ward' : level === 'CONSTITUENCY' ? 'constituency' : 'county';
  if (level !== 'NATIONAL') {
    const values = [user[`${boundaryField}Id`], user[boundaryField], user.assignedEntity].filter(value => cleanScopeValue(String(value || '')));
    const resolved = values.map(value => find(boundaryItems, value));
    // entityName is a fallback for older profiles with no separate location fields.
    const boundary = resolved[0] || (!values.length && find(boundaryItems, user.entityName));
    if (!boundary || resolved.some(item => !item || String(item.id) !== String(boundary.id))) return denied('Your profile’s electoral assignment is missing or inconsistent. Ask an administrator to correct it before continuing.');
    if (level === 'WARD') ward = boundary;
    if (level === 'CONSTITUENCY') constituency = boundary;
    if (level === 'COUNTY') county = boundary;
    if (ward) constituency = constituencies.find(item => String(item.id) === String(ward.constituencyId));
    if (constituency) county = counties.find(item => String(item.id) === String(constituency.countyId));
    if (!county || (level === 'WARD' && !constituency)) return denied('Your assigned location is not linked to a valid county and constituency. Ask an administrator to update your profile.');
    for (const [field, item] of [['county', county], ['constituency', constituency], ['ward', ward]]) {
      if (!item) continue;
      for (const value of [user[field], user[`${field}Id`]]) {
        if (cleanScopeValue(String(value || '')) && !matches(item, value)) return denied('Your profile’s county, constituency, and ward do not match. Ask an administrator to correct the assignment.');
      }
    }
  }
  const locked = { county: county?.name || null, constituency: constituency?.name || null, ward: ward?.name || null };
  return {
    isConfigured: true, failClosed: false, level, contestType: user.contestType || user.contest || user.role,
    county, constituency, ward, locked,
    selectableLevels: [!county && 'COUNTY', !constituency && 'CONSTITUENCY', !ward && 'WARD', 'POLLING_CENTRE', 'POLLING_STREAM'].filter(Boolean)
  };
};

export const getPollingCentreName = station => station.centreName || station.pollingCentre || station.name?.replace(/\s*(Stream|Strm|Rm)\s*\d+$/i, '') || station.name;

export const getCoordinatorAssignmentOptions = (scope, geography, selection = {}) => {
  if (!scope.isConfigured || scope.failClosed) return { counties: [], constituencies: [], wards: [], centres: [], stations: [], location: { complete: false, effectiveScope: scope } };
  const counties = scope.county ? [scope.county] : geography.counties || [];
  const county = scope.county || counties.find(item => String(item.id) === String(selection.countyId));
  const constituencies = (geography.constituencies || []).filter(item => county && String(item.countyId) === String(county.id) && (!scope.constituency || String(item.id) === String(scope.constituency.id)));
  const constituency = constituencies.find(item => String(item.id) === String(scope.constituency?.id || selection.constituencyId));
  const wards = (geography.wards || []).filter(item => constituency && String(item.constituencyId) === String(constituency.id) && (!scope.ward || String(item.id) === String(scope.ward.id)));
  const ward = wards.find(item => String(item.id) === String(scope.ward?.id || selection.wardId));
  const wardStations = (geography.pollingStations || []).filter(item => ward && String(item.wardId) === String(ward.id));
  const centres = [...new Set(wardStations.map(getPollingCentreName))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const centre = centres.includes(selection.pollingCentreName) ? selection.pollingCentreName : '';
  const stations = centre ? wardStations.filter(item => getPollingCentreName(item) === centre) : [];
  const station = stations.find(item => String(item.id) === String(selection.pollingStationId));
  return { counties, constituencies, wards, centres, stations, location: {
    countyId: county?.id || '', countyName: county?.name || '',
    constituencyId: constituency?.id || '', constituencyName: constituency?.name || '',
    wardId: ward?.id || '', wardName: ward?.name || '', pollingCentreName: centre,
    pollingStationId: station?.id || '', pollingStationCode: station?.code || station?.id || '', pollingStationName: station?.name || '',
    complete: Boolean(county && constituency && ward && station), effectiveScope: scope
  } };
};

export const resolveCoordinatorStationAssignment = (user, geography, stationId) => {
  const scope = resolveCoordinatorAssignmentScope(user, geography);
  const station = (geography.pollingStations || []).find(item => String(item.id) === String(stationId));
  const ward = (geography.wards || []).find(item => String(item.id) === String(station?.wardId));
  const constituency = (geography.constituencies || []).find(item => String(item.id) === String(ward?.constituencyId));
  return getCoordinatorAssignmentOptions(scope, geography, {
    countyId: constituency?.countyId, constituencyId: constituency?.id, wardId: ward?.id,
    pollingCentreName: station && getPollingCentreName(station), pollingStationId: stationId
  }).location;
};
