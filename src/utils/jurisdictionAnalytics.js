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
