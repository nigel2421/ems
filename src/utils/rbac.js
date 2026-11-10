// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (KuraTech)
// Role-Based Access Control (RBAC) & Geographic Data Scoping Engine
// ====================================================================

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  CANDIDATE_ADMIN: 'Candidate/Campaign Admin',
  STRATEGY_TEAM: 'Strategy Team',
  COUNTY_COORDINATOR: 'County Coordinator',
  PRESIDENTIAL: 'Presidential',
  PRESIDENT: 'President',
  GOVERNOR: 'Governor',
  SENATOR: 'Senator',
  WOMAN_REP: 'Woman Rep',
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
  COUNTY: 'COUNTY',           // County Coordinator, Governor, Senator, Woman Rep
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
  [ROLES.PRESIDENTIAL]: 9,
  [ROLES.PRESIDENT]: 9,
  [ROLES.CANDIDATE_ADMIN]: 9,
  [ROLES.GOVERNOR]: 8,
  [ROLES.SENATOR]: 8,
  [ROLES.WOMAN_REP]: 8,
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
  const contest = String(user.contestType || user.contest || '').toLowerCase();

  if (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.ADMIN ||
    role === ROLES.PRESIDENTIAL ||
    role === ROLES.PRESIDENT ||
    String(role).includes('President') ||
    (role === ROLES.STRATEGY_TEAM && user.assignedEntity === 'GLOBAL')
  ) {
    return {
      level: SCOPE_LEVELS.NATIONAL,
      name: 'National Scope (All 47 Counties)',
      county: user.county || 'All',
      entityName: user.entityName || (role === ROLES.PRESIDENTIAL || role === ROLES.PRESIDENT ? 'Presidential Campaign HQ' : 'National HQ')
    };
  }

  // Candidate Admin dynamic scoping
  if (role === ROLES.CANDIDATE_ADMIN) {
    if (contest.includes('presid') || user.assignedEntity === 'GLOBAL') {
      return {
        level: SCOPE_LEVELS.NATIONAL,
        name: 'National Campaign HQ',
        county: user.county || 'All',
        entityName: user.entityName || 'National Campaign HQ'
      };
    }
    if (contest.includes('mp') || contest.includes('parliament') || user.constituency) {
      return {
        level: SCOPE_LEVELS.CONSTITUENCY,
        name: `${user.constituency || 'Assigned'} Constituency`,
        county: user.county || '',
        constituency: user.constituency || '',
        entityName: user.entityName || `${user.constituency} Campaign HQ`
      };
    }
    if (contest.includes('mca') || contest.includes('ward') || user.ward) {
      return {
        level: SCOPE_LEVELS.WARD,
        name: `${user.ward || 'Assigned'} Ward`,
        county: user.county || '',
        constituency: user.constituency || '',
        ward: user.ward || '',
        entityName: user.entityName || `${user.ward} Campaign HQ`
      };
    }
    // Default candidate to county (Gubernatorial / Senatorial / Woman Rep)
    return {
      level: SCOPE_LEVELS.COUNTY,
      name: `${user.county || 'Assigned'} County`,
      county: user.county || '',
      entityName: user.entityName || `${user.county} Campaign HQ`
    };
  }

  if (
    role === ROLES.COUNTY_COORDINATOR ||
    role === ROLES.GOVERNOR ||
    role === ROLES.SENATOR ||
    role === ROLES.WOMAN_REP ||
    String(role).includes('Governor') ||
    String(role).includes('Senator') ||
    String(role).includes('Woman Rep') ||
    (String(role).includes('County') && !String(role).includes('Constituency'))
  ) {
    return {
      level: SCOPE_LEVELS.COUNTY,
      name: `${user.county || 'Assigned'} County`,
      county: user.county || '',
      entityName: user.entityName || `${user.county || 'Assigned'} County HQ`
    };
  }

  if (
    role === ROLES.CONSTITUENCY_COORDINATOR ||
    role === ROLES.MP ||
    String(role).includes('MP') ||
    String(role).includes('Constituency')
  ) {
    return {
      level: SCOPE_LEVELS.CONSTITUENCY,
      name: `${user.constituency || 'Assigned'} Constituency`,
      county: user.county || '',
      constituency: user.constituency || '',
      entityName: user.entityName || `${user.constituency || 'Assigned'} Constituency HQ`
    };
  }

  if (
    role === ROLES.WARD_COORDINATOR ||
    role === ROLES.MCA ||
    String(role).includes('MCA') ||
    String(role).includes('Ward')
  ) {
    return {
      level: SCOPE_LEVELS.WARD,
      name: `${user.ward || 'Assigned'} Ward`,
      county: user.county || '',
      constituency: user.constituency || '',
      ward: user.ward || '',
      entityName: user.entityName || `${user.ward || 'Assigned'} Ward HQ`
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

// Comprehensive 47-County ID -> Official Name Lookup
export const COUNTY_ID_TO_NAME = {
  '1': 'MOMBASA', 'C-001': 'MOMBASA', 'C-1': 'MOMBASA',
  '2': 'KWALE', 'C-002': 'KWALE', 'C-2': 'KWALE',
  '3': 'KILIFI', 'C-003': 'KILIFI', 'C-3': 'KILIFI',
  '4': 'TANA RIVER', 'C-004': 'TANA RIVER', 'C-4': 'TANA RIVER',
  '5': 'LAMU', 'C-005': 'LAMU', 'C-5': 'LAMU',
  '6': 'TAITA TAVETA', 'C-006': 'TAITA TAVETA', 'C-6': 'TAITA TAVETA',
  '7': 'GARISSA', 'C-007': 'GARISSA', 'C-7': 'GARISSA',
  '8': 'WAJIR', 'C-008': 'WAJIR', 'C-8': 'WAJIR',
  '9': 'MANDERA', 'C-009': 'MANDERA', 'C-9': 'MANDERA',
  '10': 'MARSABIT', 'C-010': 'MARSABIT',
  '11': 'ISIOLO', 'C-011': 'ISIOLO',
  '12': 'MERU', 'C-012': 'MERU',
  '13': 'THARAKA-NITHI', 'C-013': 'THARAKA-NITHI', 'C-013': 'THARAKA - NITHI',
  '14': 'EMBU', 'C-014': 'EMBU',
  '15': 'KITUI', 'C-015': 'KITUI',
  '16': 'MACHAKOS', 'C-016': 'MACHAKOS',
  '17': 'MAKUENI', 'C-017': 'MAKUENI',
  '18': 'NYANDARUA', 'C-018': 'NYANDARUA',
  '19': 'NYERI', 'C-019': 'NYERI',
  '20': 'KIRINYAGA', 'C-020': 'KIRINYAGA',
  '21': 'MURANG\'A', 'C-021': 'MURANG\'A',
  '22': 'KIAMBU', 'C-022': 'KIAMBU',
  '23': 'TURKANA', 'C-023': 'TURKANA',
  '24': 'WEST POKOT', 'C-024': 'WEST POKOT',
  '25': 'SAMBURU', 'C-025': 'SAMBURU',
  '26': 'TRANS NZOIA', 'C-026': 'TRANS NZOIA',
  '27': 'UASIN GISHU', 'C-027': 'UASIN GISHU',
  '28': 'ELGEYO-MARAKWET', 'C-028': 'ELGEYO-MARAKWET',
  '29': 'NANDI', 'C-029': 'NANDI',
  '30': 'BARINGO', 'C-030': 'BARINGO',
  '31': 'LAIKIPIA', 'C-031': 'LAIKIPIA',
  '32': 'NAKURU', 'C-032': 'NAKURU',
  '33': 'NAROK', 'C-033': 'NAROK',
  '34': 'KAJIADO', 'C-034': 'KAJIADO',
  '35': 'KERICHO', 'C-035': 'KERICHO',
  '36': 'BOMET', 'C-036': 'BOMET',
  '37': 'KAKAMEGA', 'C-037': 'KAKAMEGA',
  '38': 'VIHIGA', 'C-038': 'VIHIGA',
  '39': 'BUNGOMA', 'C-039': 'BUNGOMA',
  '40': 'BUSIA', 'C-040': 'BUSIA',
  '41': 'SIAYA', 'C-041': 'SIAYA',
  '42': 'KISUMU', 'C-042': 'KISUMU',
  '43': 'HOMA BAY', 'C-043': 'HOMA BAY',
  '44': 'MIGORI', 'C-044': 'MIGORI',
  '45': 'KISII', 'C-045': 'KISII',
  '46': 'NYAMIRA', 'C-046': 'NYAMIRA',
  '47': 'NAIROBI', 'C-047': 'NAIROBI', 'C-47': 'NAIROBI'
};

// Constituency ID -> Official Name Lookup
export const CONSTITUENCY_ID_TO_NAME = {
  'CONST-001': 'CHANGAMWE',
  'CONST-002': 'JOMVU',
  'CONST-003': 'KISAUNI',
  'CONST-004': 'NYALI',
  'CONST-005': 'LIKONI',
  'CONST-006': 'MVITA',
  'CONST-274': 'WESTLANDS',
  'CONST-275': 'PARKLANDS/HIGHRIDGE',
  'CONST-276': 'DAGORETTI NORTH',
  'CONST-277': 'DAGORETTI SOUTH',
  'CONST-278': 'LANGATA',
  'CONST-279': 'KIBRA',
  'CONST-280': 'ROYSAMBU',
  'CONST-281': 'KASARANI',
  'CONST-282': 'RUARAKA',
  'CONST-283': 'EMBAKASI SOUTH',
  'CONST-284': 'EMBAKASI NORTH',
  'CONST-285': 'EMBAKASI CENTRAL',
  'CONST-286': 'EMBAKASI EAST',
  'CONST-287': 'EMBAKASI WEST',
  'CONST-288': 'MAKADARA',
  'CONST-289': 'KAMUKUNJI',
  'CONST-290': 'STAREHE'
};

export const resolveCanonicalCounty = (input) => {
  if (!input) return '';
  const s = String(input).trim().toUpperCase();
  const cCode = s.replace(/^C-0*/, '');
  return COUNTY_ID_TO_NAME[s] || COUNTY_ID_TO_NAME[cCode] || s;
};

export const resolveCanonicalConstituency = (input) => {
  if (!input) return '';
  const s = String(input).trim().toUpperCase();
  return CONSTITUENCY_ID_TO_NAME[s] || s;
};

const normStr = (str) => String(str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const geoMatches = (target, userVal) => {
  if (!userVal) return false;
  if (!target) return false;
  const nTarget = normStr(target);
  const nUser = normStr(userVal);
  if (!nTarget || !nUser) return false;
  if (nTarget === nUser || nTarget.includes(nUser) || nUser.includes(nTarget)) return true;

  // Check canonical cross-mapping
  const canonTarget = normStr(resolveCanonicalCounty(target) || resolveCanonicalConstituency(target));
  const canonUser = normStr(resolveCanonicalCounty(userVal) || resolveCanonicalConstituency(userVal));
  return Boolean(canonTarget && canonUser && (canonTarget === canonUser || canonTarget.includes(canonUser) || canonUser.includes(canonTarget)));
};

/**
 * Checks if a geographic location (County, Constituency, Ward, Station) is within the user's scope
 * Works uniformly across all roles: Governor, Senator, MP, MCA, Coordinators, Agents & Admins.
 */
export const canAccessLocation = (user, location = {}) => {
  if (!user) return false;
  const scope = getUserScope(user);

  if (scope.level === SCOPE_LEVELS.NATIONAL) return true;

  const targetCounty = resolveCanonicalCounty(location.county || location.countyName || location.countyId);
  const targetConst = resolveCanonicalConstituency(location.constituency || location.constituencyName || location.constituencyId);
  const targetWard = location.ward || location.wardName || location.wardId || '';
  const targetStation = location.pollingStation || location.stationName || location.pollingStationCode || location.id || '';

  const userCounty = resolveCanonicalCounty(scope.county || user.county);
  const userConst = resolveCanonicalConstituency(scope.constituency || user.constituency);
  const userWard = scope.ward || user.ward || '';
  const userStation = scope.assignedEntity || user.assignedEntity || '';

  if (scope.level === SCOPE_LEVELS.COUNTY) {
    if (!userCounty && !userStation) return false;
    if (targetCounty) {
      return Boolean(
        (userCounty && geoMatches(targetCounty, userCounty)) ||
        (userStation && geoMatches(targetCounty, userStation))
      );
    }
    return false;
  }

  if (scope.level === SCOPE_LEVELS.CONSTITUENCY) {
    if (!userConst && !userStation) return false;
    // County must match if present in target
    if (targetCounty && userCounty && !geoMatches(targetCounty, userCounty) && !(userStation && geoMatches(targetCounty, userStation))) {
      return false;
    }
    // Target constituency must match name or assignedEntity code
    if (targetConst) {
      return Boolean(
        (userConst && geoMatches(targetConst, userConst)) ||
        (userStation && geoMatches(targetConst, userStation)) ||
        (location.constituencyId && userStation && geoMatches(location.constituencyId, userStation))
      );
    }
    return false;
  }

  if (scope.level === SCOPE_LEVELS.WARD) {
    if (!userWard) return false;
    if (targetCounty && userCounty && !geoMatches(targetCounty, userCounty)) return false;
    if (targetConst && userConst && !geoMatches(targetConst, userConst)) return false;
    if (targetWard) {
      return Boolean(geoMatches(targetWard, userWard));
    }
    return false;
  }

  if (scope.level === SCOPE_LEVELS.POLLING_CENTRE || scope.level === SCOPE_LEVELS.STATION) {
    if (!userStation) return false;
    const stationMatch = targetStation && (geoMatches(targetStation, userStation) || location.id === userStation);
    const wardMatch = userWard && targetWard && geoMatches(targetWard, userWard);
    return Boolean(stationMatch || wardMatch);
  }

  return false;
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
      return [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN,
        ROLES.CANDIDATE_ADMIN,
        ROLES.COUNTY_COORDINATOR,
        ROLES.CONSTITUENCY_COORDINATOR,
        ROLES.WARD_COORDINATOR,
        ROLES.PRESIDENTIAL,
        ROLES.PRESIDENT,
        ROLES.GOVERNOR,
        ROLES.SENATOR,
        ROLES.WOMAN_REP,
        ROLES.MP,
        ROLES.MCA,
        ROLES.ASPIRANT
      ].includes(role);

    case 'VIEW_AI_ASSISTANT':
      return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CANDIDATE_ADMIN, ROLES.STRATEGY_TEAM, ROLES.COUNTY_COORDINATOR, ROLES.CONSTITUENCY_COORDINATOR, ROLES.GOVERNOR, ROLES.SENATOR, ROLES.MP, ROLES.ASPIRANT].includes(role);

    default:
      return true;
  }
};
