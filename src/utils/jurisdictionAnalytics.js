/**
 * Resolve a user's electoral jurisdiction and build real voter analytics
 * from IEBC geography (counties → constituencies → wards → stations).
 */

const norm = (value) => String(value || '').trim().toLowerCase();

const matchByCodeOrId = (entity, codeOrId) => {
  if (!entity || codeOrId == null || codeOrId === '') return false;
  const raw = String(codeOrId).trim();
  const id = String(entity.id || '');
  const code = String(entity.code || '');
  return (
    id === raw ||
    code === raw ||
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

  const county =
    counties.find((c) => matchByCodeOrId(c, user?.assignedEntity)) ||
    counties.find((c) => norm(c.name).includes(norm(user?.county))) ||
    counties.find((c) => norm(c.name).includes('nairobi')) ||
    counties[0] ||
    null;

  const constituency =
    constituencies.find((c) => matchByCodeOrId(c, user?.assignedEntity)) ||
    constituencies.find(
      (c) =>
        (!county || c.countyId === county.id) &&
        norm(c.name).includes(norm(user?.constituency))
    ) ||
    null;

  const ward =
    wards.find((w) => matchByCodeOrId(w, user?.assignedEntity)) ||
    wards.find(
      (w) =>
        (!constituency || w.constituencyId === constituency.id) &&
        norm(w.name).includes(norm(user?.ward))
    ) ||
    null;

  // Scope by role hierarchy
  if (role === 'MCA' || (ward && user?.ward)) {
    const scopedWard =
      ward ||
      wards.find((w) => w.constituencyId === constituency?.id) ||
      wards[0] ||
      null;
    const scopedConstituency =
      constituencies.find((c) => c.id === scopedWard?.constituencyId) || constituency;
    const scopedCounty = counties.find((c) => c.id === scopedWard?.countyId) || county;
    return {
      level: 'ward',
      label: 'Ward',
      title: scopedWard?.name || 'Ward operations',
      county: scopedCounty,
      constituency: scopedConstituency,
      ward: scopedWard
    };
  }

  if (
    role === 'MP' ||
    role === 'Regional Coordinator' ||
    (constituency && user?.constituency)
  ) {
    const scopedConstituency =
      constituency ||
      constituencies.find((c) => c.countyId === county?.id) ||
      constituencies[0] ||
      null;
    const scopedCounty = counties.find((c) => c.id === scopedConstituency?.countyId) || county;
    return {
      level: 'constituency',
      label: 'Constituency',
      title: scopedConstituency?.name || 'Constituency operations',
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
      wards.find((w) => w.id === station?.wardId) ||
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

  // Governor / Senator / Strategy Team → county
  return {
    level: 'county',
    label: 'County',
    title: county?.name || 'County operations',
    county,
    constituency: null,
    ward: null
  };
};

/** National admins may browse the full IEBC register; candidates stay in assignment. */
export const hasNationalGeographyAccess = (user) => {
  const role = user?.role || '';
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
