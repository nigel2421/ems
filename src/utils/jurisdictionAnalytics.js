/**
 * Resolve a user's electoral jurisdiction and build real voter analytics
 * from IEBC geography (counties → constituencies → wards → stations).
 */

const norm = (value) => String(value || '').trim().toLowerCase();

const matchByCodeOrId = (entity, codeOrId) => {
  if (!entity || codeOrId == null || codeOrId === '') return false;
  const raw = String(codeOrId).trim();
  const id = String(entity.id || '').trim();
  const code = String(entity.code || '').trim();

  if (id === raw || code === raw) return true;
  if (id.toLowerCase() === raw.toLowerCase()) return true;

  // Normalized digits comparison
  const rawDigits = raw.replace(/\D/g, '');
  const entityDigits = (entity.code || entity.id || '').replace(/\D/g, '');
  if (rawDigits && entityDigits && Number(rawDigits) === Number(entityDigits)) {
    // If entity is county, only match if raw was county-like or short
    if (id.startsWith('C-') && (raw.startsWith('C-') || rawDigits.length <= 2)) return true;
    if (id.startsWith('CONST-') && (raw.startsWith('CONST-') || rawDigits.length === 3)) return true;
    if (id.startsWith('WARD-') && (raw.startsWith('WARD-') || rawDigits.length >= 4)) return true;
  }

  return (
    id.endsWith(`-${raw}`) ||
    id === `C-${raw.padStart(3, '0')}` ||
    id === `CONST-${raw}` ||
    id === `WARD-${raw}`
  );
};

export const resolveJurisdiction = (user, geography) => {
  const counties = geography?.counties || [];
  const constituencies = geography?.constituencies || [];
  const wards = geography?.wards || [];
  const role = user?.role || '';
  const contest = String(user?.contestType || user?.contest || '').toLowerCase();

  // Try matching directly assigned constituency or ward if assignedEntity is provided
  const directConst = constituencies.find((c) => matchByCodeOrId(c, user?.assignedEntity));
  const directWard = wards.find((w) => matchByCodeOrId(w, user?.assignedEntity));

  // 1. Resolve County (Strict matching, no default fallback to nairobi or counties[0])
  let county =
    counties.find((c) => matchByCodeOrId(c, user?.assignedEntity)) ||
    (user?.county
      ? counties.find((c) => norm(c.name) === norm(user?.county) || norm(c.name).includes(norm(user?.county)) || norm(user?.county).includes(norm(c.name)))
      : null);

  if (!county && directConst) {
    county = counties.find((c) => c.id === directConst.countyId) || null;
  } else if (!county && directWard) {
    county = counties.find((c) => c.id === directWard.countyId) || null;
  }

  // 2. Resolve Constituency
  let constituency =
    directConst ||
    (user?.constituency
      ? constituencies.find(
          (c) =>
            (!county || c.countyId === county.id) &&
            (norm(c.name) === norm(user?.constituency) || norm(c.name).includes(norm(user?.constituency)) || norm(user?.constituency).includes(norm(c.name)))
        )
      : null);

  if (!constituency && directWard) {
    constituency = constituencies.find((c) => c.id === directWard.constituencyId) || null;
  }

  // 3. Resolve Ward
  let ward =
    directWard ||
    (user?.ward
      ? wards.find(
          (w) =>
            (!constituency || w.constituencyId === constituency.id) &&
            (norm(w.name) === norm(user?.ward) || norm(w.name).includes(norm(user?.ward)) || norm(user?.ward).includes(norm(w.name)))
        )
      : null);

  // Scope by role hierarchy & dynamic contest
  if (role === 'MCA' || role === 'Ward Coordinator' || contest.includes('mca') || contest.includes('ward') || (ward && user?.ward && !['Governor', 'Senator', 'MP'].includes(role))) {
    const scopedWard =
      ward ||
      (constituency ? wards.find((w) => w.constituencyId === constituency.id) : null) ||
      null;
    const scopedConstituency =
      (scopedWard ? constituencies.find((c) => c.id === scopedWard.constituencyId) : null) || constituency;
    const scopedCounty =
      (scopedWard ? counties.find((c) => c.id === scopedWard.countyId) : null) || county;

    return {
      level: 'ward',
      label: 'Ward',
      title: scopedWard?.name || user?.ward || 'Ward operations',
      county: scopedCounty,
      constituency: scopedConstituency,
      ward: scopedWard
    };
  }

  if (
    role === 'MP' ||
    role === 'Constituency Coordinator' ||
    role === 'Regional Coordinator' ||
    contest.includes('mp') ||
    contest.includes('parliament') ||
    (constituency && user?.constituency && !['Governor', 'Senator'].includes(role))
  ) {
    const scopedConstituency =
      constituency ||
      (county ? constituencies.find((c) => c.countyId === county.id) : null) ||
      null;
    const scopedCounty =
      (scopedConstituency ? counties.find((c) => c.id === scopedConstituency.countyId) : null) || county;

    return {
      level: 'constituency',
      label: 'Constituency',
      title: scopedConstituency?.name || user?.constituency || 'Constituency operations',
      county: scopedCounty,
      constituency: scopedConstituency,
      ward: null
    };
  }

  // Field agents → ward of their assigned station when known
  if (role === 'Field Agent' || role === 'Agent') {
    const station =
      (geography?.pollingStations || []).find((ps) => matchByCodeOrId(ps, user?.assignedEntity)) ||
      null;
    const agentWard =
      ward ||
      (station ? wards.find((w) => w.id === station.wardId) : null) ||
      null;
    if (agentWard) {
      return {
        level: 'ward',
        label: 'Ward',
        title: agentWard.name || 'Ward operations',
        county: counties.find((c) => c.id === agentWard.countyId) || county,
        constituency:
          constituencies.find((c) => c.id === agentWard.constituencyId) || constituency,
        ward: agentWard
      };
    }
  }

  // Governor / Senator / County Coordinator / Gubernatorial Campaign
  return {
    level: 'county',
    label: 'County',
    title: county?.name || user?.county || 'County operations',
    county: county || (counties.length > 0 ? counties.find(c => norm(c.name).includes(norm(user?.county))) || null : null),
    constituency: null,
    ward: null
  };
};

/** National admins may browse the full IEBC register; scoped leaders stay in assignment. */
export const hasNationalGeographyAccess = (user) => {
  const role = user?.role || '';
  if (
    role === 'Governor' ||
    role === 'Senator' ||
    role === 'MP' ||
    role === 'MCA' ||
    role === 'County Coordinator' ||
    role === 'Constituency Coordinator' ||
    role === 'Ward Coordinator' ||
    role === 'Field Agent' ||
    role === 'Agent' ||
    role === 'Observer'
  ) {
    return false;
  }

  if (role === 'Candidate/Campaign Admin' && user?.assignedEntity !== 'GLOBAL') {
    return false;
  }

  return (
    role === 'Super Admin' ||
    role === 'Admin' ||
    user?.assignedEntity === 'GLOBAL'
  );
};

/** Restrict polling stations to the resolved jurisdiction (county / constituency / ward). */
export const filterStationsByJurisdiction = (stations, scope) => {
  const list = Array.isArray(stations) ? stations : [];
  if (!scope) return [];

  if (scope.level === 'ward' && scope.ward?.id) {
    return list.filter((ps) => ps && ps.wardId === scope.ward.id);
  }
  if (scope.level === 'constituency' && scope.constituency?.id) {
    return list.filter((ps) => ps && ps.constituencyId === scope.constituency.id);
  }
  if (scope.level === 'county' && scope.county?.id) {
    return list.filter((ps) => ps && ps.countyId === scope.county.id);
  }
  return [];
};

const stationNameKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+stream\s*\d+$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Restrict Form 34A tallies to stations inside the user's assignment.
 * Matches by station id/code first, then by station name within the scoped register.
 */
export const filterTalliesByJurisdiction = (tallies, stations, scope, { national = false } = {}) => {
  const list = Array.isArray(tallies) ? tallies : [];
  if (national) return list;

  const scopedStations = filterStationsByJurisdiction(stations, scope);
  if (!scopedStations.length) return [];

  const idSet = new Set(scopedStations.map((ps) => ps.id).filter(Boolean));
  const codeSet = new Set(
    scopedStations.map((ps) => String(ps.code || '').trim().toLowerCase()).filter(Boolean)
  );
  const nameSet = new Set(scopedStations.map((ps) => stationNameKey(ps.name)).filter(Boolean));

  return list.filter((tally) => {
    if (!tally) return false;
    if (tally.pollingStationId && idSet.has(tally.pollingStationId)) return true;

    const code = String(tally.pollingStationCode || '').trim().toLowerCase();
    if (code && codeSet.has(code)) return true;

    const nameKey = stationNameKey(tally.pollingStationName);
    if (!nameKey) return false;
    if (nameSet.has(nameKey)) return true;
    for (const scopedName of nameSet) {
      if (scopedName.includes(nameKey) || nameKey.includes(scopedName)) return true;
    }
    return false;
  });
};

const sumVoters = (rows) =>
  rows.reduce((sum, row) => sum + (Number(row.registeredVoters) || 0), 0);

export const buildJurisdictionAnalytics = (user, geography) => {
  const scope = resolveJurisdiction(user, geography);
  const constituencies = geography?.constituencies || [];
  const wards = geography?.wards || [];
  const stations = geography?.pollingStations || [];

  let breakdown = [];
  let totalVoters = 0;
  let unitCount = 0;
  let stationCount = 0;
  let breakdownLabel = 'Units';

  if (scope.level === 'county' && scope.county) {
    breakdown = constituencies
      .filter((c) => c.countyId === scope.county.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        registeredVoters: Number(c.registeredVoters) || 0,
        childCount: Number(c.wardsCount) || 0
      }))
      .sort((a, b) => b.registeredVoters - a.registeredVoters);
    totalVoters = Number(scope.county.registeredVoters) || sumVoters(breakdown);
    unitCount = breakdown.length;
    stationCount = stations.filter((ps) => ps.countyId === scope.county.id).length;
    breakdownLabel = 'Constituencies';
  } else if (scope.level === 'constituency' && scope.constituency) {
    breakdown = wards
      .filter((w) => w.constituencyId === scope.constituency.id)
      .map((w) => ({
        id: w.id,
        name: w.name,
        registeredVoters: Number(w.registeredVoters) || 0,
        childCount: Number(w.pollingStationsCount) || 0
      }))
      .sort((a, b) => b.registeredVoters - a.registeredVoters);
    totalVoters = Number(scope.constituency.registeredVoters) || sumVoters(breakdown);
    unitCount = breakdown.length;
    stationCount = stations.filter((ps) => ps.constituencyId === scope.constituency.id).length;
    breakdownLabel = 'Wards';
  } else if (scope.level === 'ward' && scope.ward) {
    const wardStations = stations.filter((ps) => ps.wardId === scope.ward.id);
    breakdown = wardStations
      .map((ps) => ({
        id: ps.id,
        name: ps.name,
        registeredVoters: Number(ps.registeredVoters) || 0,
        childCount: 1,
        code: ps.code
      }))
      .sort((a, b) => b.registeredVoters - a.registeredVoters);
    totalVoters = Number(scope.ward.registeredVoters) || sumVoters(breakdown);
    unitCount = breakdown.length;
    stationCount = wardStations.length;
    breakdownLabel = 'Polling stations';
  }

  const topBlocks = breakdown.slice(0, 5);
  const topShare =
    totalVoters > 0
      ? Math.round((sumVoters(topBlocks) / totalVoters) * 1000) / 10
      : 0;

  return {
    scope,
    totalVoters,
    unitCount,
    stationCount,
    breakdownLabel,
    breakdown,
    topBlocks,
    topShare,
    insights: {
      largestBlock: topBlocks[0] || null,
      smallestTracked: breakdown.length ? breakdown[breakdown.length - 1] : null,
      averageBlock:
        breakdown.length > 0 ? Math.round(sumVoters(breakdown) / breakdown.length) : 0
    }
  };
};

export const CHART_COLORS = [
  '#006B3F',
  '#0E7A45',
  '#C9A227',
  '#2A9D8F',
  '#073322',
  '#BB0A21',
  '#3D5A80',
  '#A7C4B5',
  '#E76F51',
  '#8ECAE6'
];
