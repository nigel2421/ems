// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
// Role-Based Access Control (RBAC) & Geographic Data Scoping Engine
// ====================================================================

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  CANDIDATE_ADMIN: 'Candidate/Campaign Admin',
  STRATEGY_TEAM: 'Strategy Team',
  COUNTY_COORDINATOR: 'County Coordinator',
  GOVERNOR: 'Governor',
  SENATOR: 'Senator',
  CONSTITUENCY_COORDINATOR: 'Constituency Coordinator',
  MP: 'MP',
  WARD_COORDINATOR: 'Ward Coordinator',
  MCA: 'MCA',
  POLLING_COORDINATOR: 'Polling Coordinator',
  ASPIRANT: 'Aspirant',
  AGENT: 'Agent',
  FIELD_AGENT: 'Field Agent',
  OBSERVER: 'Observer'
};

export const SCOPE_LEVELS = {
  NATIONAL: 'NATIONAL',       // Super Admin, Admin, Campaign HQ
  COUNTY: 'COUNTY',           // County Coordinator, Governor, Senator
  CONSTITUENCY: 'CONSTITUENCY', // Constituency Coordinator, MP
  WARD: 'WARD',               // Ward Coordinator, MCA
  POLLING_CENTRE: 'POLLING_CENTRE', // Polling Coordinator
  STATION: 'STATION'          // Agent / Field Agent
};

export {
  CONTEST_JURISDICTION_POLICY,
  getContestPolicy,
  resolveEffectiveGeographicScope,
  validateGeographicSubmission
} from './scopeResolver.js';


export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 10,
  [ROLES.ADMIN]: 10,
  [ROLES.CANDIDATE_ADMIN]: 9,
  [ROLES.GOVERNOR]: 8,
  [ROLES.SENATOR]: 8,
  [ROLES.COUNTY_COORDINATOR]: 7,
  [ROLES.STRATEGY_TEAM]: 7,
  [ROLES.MP]: 6,
  [ROLES.CONSTITUENCY_COORDINATOR]: 6,
  [ROLES.MCA]: 5,
  [ROLES.WARD_COORDINATOR]: 5,
  [ROLES.POLLING_COORDINATOR]: 4,
  [ROLES.ASPIRANT]: 4,
  [ROLES.FIELD_AGENT]: 3,
  [ROLES.AGENT]: 3,
  [ROLES.OBSERVER]: 2
};

/**
 * Resolves a user's exact scope level and geographic identifiers
 */
export const getUserScope = (user) => {
  if (!user) {
    return { level: SCOPE_LEVELS.STATION, name: 'Unauthenticated', entityName: 'Guest' };
  }

  const role = user.role;

  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.STRATEGY_TEAM) {
    return {
      level: SCOPE_LEVELS.NATIONAL,
      name: 'National Scope (All 47 Counties)',
      county: user.county || 'All',
      entityName: user.entityName || 'National HQ'
    };
  }

  if (role === ROLES.COUNTY_COORDINATOR || role === ROLES.GOVERNOR || role === ROLES.SENATOR) {
    return {
      level: SCOPE_LEVELS.COUNTY,
      name: `${user.county || 'Assigned'} County`,
      county: user.county || 'Nairobi',
      entityName: user.entityName || `${user.county || 'Nairobi'} County HQ`
    };
  }

  if (role === ROLES.CONSTITUENCY_COORDINATOR || role === ROLES.MP) {
    return {
      level: SCOPE_LEVELS.CONSTITUENCY,
      name: `${user.constituency || 'Assigned'} Constituency`,
      county: user.county || 'Nairobi',
      constituency: user.constituency || 'Westlands',
      entityName: user.entityName || `${user.constituency || 'Westlands'} Constituency HQ`
    };
  }

  if (role === ROLES.WARD_COORDINATOR || role === ROLES.MCA) {
    return {
      level: SCOPE_LEVELS.WARD,
      name: `${user.ward || 'Assigned'} Ward`,
      county: user.county || 'Nairobi',
      constituency: user.constituency || 'Westlands',
      ward: user.ward || 'Parklands/Highridge',
      entityName: user.entityName || `${user.ward || 'Parklands/Highridge'} Ward HQ`
    };
  }

  if (role === ROLES.POLLING_COORDINATOR || role === ROLES.ASPIRANT) {
    return {
      level: SCOPE_LEVELS.POLLING_CENTRE,
      name: user.entityName || `${user.ward || 'Ward'} Polling Centre`,
      county: user.county,
      constituency: user.constituency,
      ward: user.ward,
      entityName: user.entityName || 'Polling Centre Desk'
    };
  }

  // Field Agent / Agent / Candidate Campaign Desk
  return {
    level: SCOPE_LEVELS.STATION,
    name: user.assignedEntity || user.entityName || 'Assigned Polling Station',
    county: user.county,
    constituency: user.constituency,
    ward: user.ward,
    assignedEntity: user.assignedEntity,
    entityName: user.entityName || 'Station Agent'
  };
};

/**
 * Checks if a geographic location (County, Constituency, Ward, Station) is within the user's scope
 */
export const canAccessLocation = (user, location = {}) => {
  if (!user) return false;
  const scope = getUserScope(user);

  if (scope.level === SCOPE_LEVELS.NATIONAL) return true;

  const targetCounty = (location.county || location.countyName || location.countyId || '').toString().toLowerCase().trim();
  const targetConst = (location.constituency || location.constituencyName || location.constituencyId || '').toString().toLowerCase().trim();
  const targetWard = (location.ward || location.wardName || location.wardId || '').toString().toLowerCase().trim();
  const targetStation = (location.pollingStation || location.stationName || location.pollingStationCode || location.id || '').toString().toLowerCase().trim();

  const userCounty = (scope.county || user.county || '').toString().toLowerCase().trim();
  const userConst = (scope.constituency || user.constituency || '').toString().toLowerCase().trim();
  const userWard = (scope.ward || user.ward || '').toString().toLowerCase().trim();
  const userStation = (scope.assignedEntity || user.assignedEntity || '').toString().toLowerCase().trim();

  if (scope.level === SCOPE_LEVELS.COUNTY) {
    if (!userCounty) return true;
    return targetCounty.includes(userCounty) || userCounty.includes(targetCounty) || !targetCounty;
  }

  if (scope.level === SCOPE_LEVELS.CONSTITUENCY) {
    const countyMatch = !userCounty || targetCounty.includes(userCounty) || userCounty.includes(targetCounty) || !targetCounty;
    const constMatch = !userConst || targetConst.includes(userConst) || userConst.includes(targetConst) || !targetConst;
    return countyMatch && constMatch;
  }

  if (scope.level === SCOPE_LEVELS.WARD) {
    const constMatch = !userConst || targetConst.includes(userConst) || userConst.includes(targetConst) || !targetConst;
    const wardMatch = !userWard || targetWard.includes(userWard) || userWard.includes(targetWard) || !targetWard;
    return constMatch && wardMatch;
  }

  if (scope.level === SCOPE_LEVELS.POLLING_CENTRE || scope.level === SCOPE_LEVELS.STATION) {
    if (!userStation) return true;
    const stationMatch = userStation && targetStation && (targetStation.includes(userStation) || userStation.includes(targetStation));
    const wardMatch = userWard && targetWard && targetWard.includes(userWard);
    return Boolean(stationMatch || wardMatch);
  }

  return true;
};

/**
 * Filter dataset items based on user jurisdiction
 */
export const filterByScope = (user, items = [], itemType = 'generic') => {
  if (!user || !Array.isArray(items)) return items;
  const scope = getUserScope(user);

  if (scope.level === SCOPE_LEVELS.NATIONAL) return items;

  return items.filter(item => {
    // If agent item, check agent ID / supervisor ID or jurisdiction
    if (itemType === 'agents') {
      if (item.userId === user.id || item.supervisorId === user.id || item.creatorId === user.id) return true;
      if (item.id === user.id) return true;
    }

    // If report item, check agent ID or location
    if (itemType === 'reports') {
      if (item.agentId === user.id) return true;
    }

    return canAccessLocation(user, {
      county: item.county || item.countyName,
      constituency: item.constituency || item.constituencyName,
      ward: item.ward || item.wardName,
      pollingStation: item.pollingStation || item.pollingStationName || item.pollingStationCode || item.assignedEntity
    });
  });
};

/**
 * Action permissions matrix
 */
export const canPerformAction = (user, action) => {
  if (!user) return false;
  const role = user.role;

  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) return true;

  switch (action) {
    case 'SYSTEM_HARDEN':
    case 'MANAGE_USERS':
    case 'GLOBAL_AUDIT_PURGE':
      return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

    case 'VERIFY_TALLY':
    case 'APPROVE_TALLY':
      return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CANDIDATE_ADMIN, ROLES.COUNTY_COORDINATOR, ROLES.CONSTITUENCY_COORDINATOR, ROLES.GOVERNOR, ROLES.SENATOR, ROLES.MP].includes(role);

    case 'SUBMIT_TALLY_FORM':
    case 'SUBMIT_FIELD_REPORT':
    case 'SUBMIT_SURVEY_RESPONSE':
      return true; // All authenticated roles can submit field entries for their scope

    case 'CREATE_SURVEY':
    case 'MANAGE_AGENTS':
      return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CANDIDATE_ADMIN, ROLES.COUNTY_COORDINATOR, ROLES.CONSTITUENCY_COORDINATOR, ROLES.WARD_COORDINATOR, ROLES.GOVERNOR, ROLES.SENATOR, ROLES.MP, ROLES.MCA].includes(role);

    case 'VIEW_AI_ASSISTANT':
      return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CANDIDATE_ADMIN, ROLES.STRATEGY_TEAM, ROLES.COUNTY_COORDINATOR, ROLES.CONSTITUENCY_COORDINATOR, ROLES.GOVERNOR, ROLES.SENATOR, ROLES.MP, ROLES.ASPIRANT].includes(role);

    default:
      return true;
  }
};
