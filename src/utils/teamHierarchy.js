import { resolveCoordinatorAssignmentScope, resolveCoordinatorStationAssignment } from './coordinatorAssignment.js';

export const ASPIRANT_ROLES = ['Presidential', 'President', 'Governor', 'Senator', 'Woman Rep', 'MP', 'MCA', 'Aspirant', 'Candidate Admin', 'Candidate/Campaign Admin'];
export const TEAM_ROLES = ['National Coordinator', 'County Coordinator', 'Constituency Coordinator', 'Ward Coordinator', 'Agent', 'Field Agent'];
export const isCampaignWorkspaceUser = user => ASPIRANT_ROLES.includes(user?.role) || TEAM_ROLES.includes(user?.role);
export const isStationAgent = user => ['Agent', 'Field Agent'].includes(user?.role);
export const isAspirant = user => ASPIRANT_ROLES.includes(user?.role);
export const isSystemAdmin = user => ['Admin', 'Super Admin'].includes(user?.role);
export const teamRoleLabel = role => ['Agent', 'Field Agent'].includes(role) ? 'Polling station agent' : role;
export const parentIdOf = user => user?.parentId || user?.supervisorId || user?.creatorId || user?.candidateId || user?.aspirantId;

export const campaignRoot = (user, users) => {
  const seen = new Set();
  let current = user;
  while (current && !seen.has(current.id)) {
    if (isAspirant(current)) return current;
    seen.add(current.id);
    const parentId = parentIdOf(current);
    current = users.find(item => item.id === parentId);
  }
  return null;
};
export const isDescendant = (actor, target, users) => {
  if (!actor || !target || actor.id === target.id) return false;
  const root=campaignRoot(actor,users);
  if (!root || root.id !== campaignRoot(target,users)?.id) return false;
  let current = target;
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const parentId = parentIdOf(current);
    if (parentId === actor.id) return true;
    current = users.find(item => item.id === parentId);
  }
  return false;
};
export const isTeamAccountActive = (user, users) => {
  const seen = new Set();
  let current = user;
  while (current && !seen.has(current.id)) {
    if (current.isSuspended || ['Suspended', 'Inactive'].includes(current.status)) return false;
    if (isAspirant(current) || isSystemAdmin(current)) return true;
    seen.add(current.id);
    current = users.find(item => item.id === parentIdOf(current));
  }
  return false;
};
export const nextTeamRole = (user, geography) => {
  if (isStationAgent(user)) return null;
  const next = { 'National Coordinator': 'County Coordinator', 'County Coordinator': 'Constituency Coordinator', 'Constituency Coordinator': 'Ward Coordinator', 'Ward Coordinator': 'Agent' };
  if (next[user?.role]) return next[user.role];
  if (!isAspirant(user)) return null;
  const scope = resolveCoordinatorAssignmentScope(user, geography);
  return scope.isConfigured ? ({ NATIONAL: 'National Coordinator', COUNTY: 'County Coordinator', CONSTITUENCY: 'Constituency Coordinator', WARD: 'Ward Coordinator' })[scope.level] : null;
};
export const teamScope = (user, geography) => {
  if (!isStationAgent(user)) return resolveCoordinatorAssignmentScope(user, geography);
  const station = geography.pollingStations.find(item => item.id === (user.pollingStationId || user.assignedEntity));
  const ward = geography.wards.find(item => item.id === station?.wardId);
  const constituency = geography.constituencies.find(item => item.id === ward?.constituencyId);
  const county = geography.counties.find(item => item.id === constituency?.countyId);
  return { isConfigured: Boolean(station && ward && constituency && county), failClosed: !(station && ward && constituency && county), level: 'STATION', station, ward, constituency, county, locked: {county:county?.name,constituency:constituency?.name,ward:ward?.name} };
};
export const isLocationInScope = (scope, location) => scope.isConfigured && !scope.failClosed && ['county', 'constituency', 'ward', 'station'].every(key => !scope[key] || scope[key].id === location[key]?.id);
export const resolveTeamAssignment = (actor, targetRole, assignmentId, geography) => {
  if (nextTeamRole(actor, geography) !== targetRole) throw new Error('You can create only the next team level in this campaign.');
  const scope = teamScope(actor, geography);
  if (!scope.isConfigured || scope.failClosed) throw new Error('Your electoral profile must be configured before creating a team.');
  let county, constituency, ward, station;
  if (targetRole === 'County Coordinator') county = geography.counties.find(item => item.id === assignmentId);
  if (targetRole === 'Constituency Coordinator') constituency = geography.constituencies.find(item => item.id === assignmentId);
  if (targetRole === 'Ward Coordinator') ward = geography.wards.find(item => item.id === assignmentId);
  if (targetRole === 'Agent') {
    const location = resolveCoordinatorStationAssignment(actor, geography, assignmentId);
    if (!location.complete) throw new Error('Choose a polling station inside your assigned ward.');
    station = geography.pollingStations.find(item => item.id === assignmentId);
    ward = geography.wards.find(item => item.id === station?.wardId);
  }
  if (ward) constituency = geography.constituencies.find(item => item.id === ward.constituencyId);
  if (constituency) county = geography.counties.find(item => item.id === constituency.countyId);
  const entity = targetRole === 'National Coordinator' ? {id:'GLOBAL',name:'National campaign'} : station || ward || constituency || county;
  if (!entity || (targetRole !== 'National Coordinator' && !county) || !isLocationInScope(scope, {county,constituency,ward,station})) throw new Error('The assignment is outside your campaign area.');
  return { assignedEntity: entity.id, entityName: entity.name, county:county?.name || null, countyId:county?.id || null, constituency:constituency?.name || null, constituencyId:constituency?.id || null, ward:ward?.name || null, wardId:ward?.id || null, pollingStationId:station?.id || null, pollingStationName:station?.name || null, pollingStationCode:station?.code || null, assignedStations:station ? [station.id] : [] };
};
