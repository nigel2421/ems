// ====================================================================
// KuraTech MAP ANALYTICS & CHOROPLETH COMPUTATION ENGINE
// Real-time calculation of voter turnout, candidate leads, reporting,
// and risk heatmaps across administrative hierarchies.
// ====================================================================

import { KENYA_COUNTIES_GEOMETRY } from '../data/geo/kenyaMapGeometries.js';

export const MAP_LAYERS = {
  LEAD: 'lead',
  TURNOUT: 'turnout',
  REPORTING: 'reporting',
  RISK: 'risk'
};

export const FORMATION_COLORS = {
  CAND_A: '#EAB308', // Kenya Kwanza Gold
  CAND_B: '#06B6D4', // Azimio Cyan
  CAND_C: '#10B981', // Progressive Emerald
  MUTED: '#334155',  // Slate Neutral
  LOCKED: '#1E293B'  // Out of Scope Dark Slate
};

/**
 * High-Performance Single-Pass Regional Metrics Index Builder
 * Processes 46,051+ stations and all tallies in O(N + M) single pass
 * allowing instant O(1) lookups during mousemove and renders without lag.
 */
export const buildRegionMetricsIndex = (geography, tallyResults = [], stationIntelligence = {}) => {
  const stations = geography?.pollingStations || [];
  const counties = geography?.counties || [];
  const constituencies = geography?.constituencies || [];

  // Lookup maps for registered voters
  const countyVoters = {};
  const countyCodeToId = {};
  counties.forEach(c => {
    countyVoters[c.id] = Number(c.registeredVoters) || 0;
    countyCodeToId[c.code] = c.id;
    countyCodeToId[c.id] = c.id;
  });

  const constVoters = {};
  const constCodeToId = {};
  constituencies.forEach(c => {
    constVoters[c.id] = Number(c.registeredVoters) || 0;
    constCodeToId[c.code] = c.id;
    constCodeToId[c.id] = c.id;
  });

  // Fast station mapping: stationId -> { countyId, constituencyId }
  const stationLookup = new Map();
  const index = {};

  const initBucket = (id, registeredVoters) => ({
    id,
    registeredVoters,
    stationsCount: 0,
    talliesCount: 0,
    reportingPct: 0,
    turnoutPct: 0,
    totalVotesCast: 0,
    candAVotes: 0,
    candBVotes: 0,
    candCVotes: 0,
    rejectedVotes: 0,
    leader: 'No Data',
    leadColor: FORMATION_COLORS.MUTED,
    margin: 0,
    riskLevel: 'Low',
    severeRiskCount: 0,
    highRiskCount: 0
  });

  // Init buckets for all counties and constituencies
  counties.forEach(c => {
    index[`county:${c.id}`] = initBucket(c.id, Number(c.registeredVoters) || 0);
    index[`county:${c.code}`] = index[`county:${c.id}`];
  });
  constituencies.forEach(c => {
    index[`constituency:${c.id}`] = initBucket(c.id, Number(c.registeredVoters) || 0);
    index[`constituency:${c.code}`] = index[`constituency:${c.id}`];
  });

  // Pass 1: Bucket stations and risk in O(N)
  for (let i = 0; i < stations.length; i++) {
    const ps = stations[i];
    stationLookup.set(ps.id, ps);

    const cId = ps.countyId || countyCodeToId[ps.countyCode];
    const constId = ps.constituencyId || constCodeToId[ps.constituencyCode];
    const intel = stationIntelligence[ps.id];

    if (cId) {
      let b = index[`county:${cId}`];
      if (!b) {
        b = initBucket(cId, countyVoters[cId] || 0);
        index[`county:${cId}`] = b;
      }
      b.stationsCount++;
      if (intel?.riskLevel === 'Severe') b.severeRiskCount++;
      else if (intel?.riskLevel === 'High') b.highRiskCount++;
    }

    if (constId) {
      let b = index[`constituency:${constId}`];
      if (!b) {
        b = initBucket(constId, constVoters[constId] || 0);
        index[`constituency:${constId}`] = b;
      }
      b.stationsCount++;
      if (intel?.riskLevel === 'Severe') b.severeRiskCount++;
      else if (intel?.riskLevel === 'High') b.highRiskCount++;
    }
  }

  // Pass 2: Aggregate tallies in O(M)
  for (let i = 0; i < tallyResults.length; i++) {
    const t = tallyResults[i];
    if (!t || !t.pollingStationId) continue;
    const ps = stationLookup.get(t.pollingStationId);
    if (!ps) continue;

    const cId = ps.countyId || countyCodeToId[ps.countyCode];
    const constId = ps.constituencyId || constCodeToId[ps.constituencyCode];

    const ca = Number(t.candAVotes || 0);
    const cb = Number(t.candBVotes || 0);
    const cc = Number(t.candCVotes || 0);
    const cr = Number(t.rejectedVotes || 0);

    const accumulate = (b) => {
      if (!b) return;
      b.talliesCount++;
      b.candAVotes += ca;
      b.candBVotes += cb;
      b.candCVotes += cc;
      b.rejectedVotes += cr;
    };

    if (cId) accumulate(index[`county:${cId}`]);
    if (constId) accumulate(index[`constituency:${constId}`]);
  }

  // Pass 3: Finalize percentages, leaders and colors
  const finalize = (b) => {
    if (!b) return;
    const totalValid = b.candAVotes + b.candBVotes + b.candCVotes;
    b.totalVotesCast = totalValid + b.rejectedVotes;

    b.turnoutPct = b.registeredVoters > 0
      ? Math.min(100, Math.round((b.totalVotesCast / b.registeredVoters) * 100))
      : 0;

    b.reportingPct = b.stationsCount > 0
      ? Math.min(100, Math.round((b.talliesCount / b.stationsCount) * 100))
      : (b.talliesCount > 0 ? 100 : 0);

    if (totalValid > 0) {
      if (b.candAVotes >= b.candBVotes && b.candAVotes >= b.candCVotes) {
        b.leader = 'Candidate A';
        b.leadColor = FORMATION_COLORS.CAND_A;
        b.margin = b.candAVotes - Math.max(b.candBVotes, b.candCVotes);
      } else if (b.candBVotes >= b.candAVotes && b.candBVotes >= b.candCVotes) {
        b.leader = 'Candidate B';
        b.leadColor = FORMATION_COLORS.CAND_B;
        b.margin = b.candBVotes - Math.max(b.candAVotes, b.candCVotes);
      } else {
        b.leader = 'Candidate C';
        b.leadColor = FORMATION_COLORS.CAND_C;
        b.margin = b.candCVotes - Math.max(b.candAVotes, b.candBVotes);
      }
    }

    if (b.severeRiskCount > 0) b.riskLevel = 'Severe';
    else if (b.highRiskCount > 0) b.riskLevel = 'High';
    else if (b.turnoutPct > 85) b.riskLevel = 'Medium';
  };

  Object.values(index).forEach(finalize);

  return index;
};

/**
 * Aggregates statistics for a specific region (County or Constituency)
 */
export const getRegionMetrics = (regionId, regionType, { geography, tallyResults = [], stationIntelligence = {} }) => {
  const isCounty = regionType === 'county';
  const stations = geography?.pollingStations || [];
  const counties = geography?.counties || [];
  const constituencies = geography?.constituencies || [];

  // 1. Locate scoped stations
  let regionStations = [];
  let registeredVoters = 0;

  if (isCounty) {
    const cObj = counties.find(c => c.id === regionId || c.code === regionId);
    registeredVoters = Number(cObj?.registeredVoters) || 0;
    regionStations = stations.filter(ps => ps.countyId === regionId || (cObj && ps.countyId === cObj.id));
  } else {
    const constObj = constituencies.find(c => c.id === regionId || c.code === regionId);
    registeredVoters = Number(constObj?.registeredVoters) || 0;
    regionStations = stations.filter(ps => ps.constituencyId === regionId || (constObj && ps.constituencyId === constObj.id));
  }

  const stationIds = new Set(regionStations.map(ps => ps.id));

  // 2. Aggregate Tallies for this region
  let candAVotes = 0;
  let candBVotes = 0;
  let candCVotes = 0;
  let rejectedVotes = 0;
  let talliesCount = 0;

  for (let i = 0; i < tallyResults.length; i++) {
    const t = tallyResults[i];
    if (t && t.pollingStationId && stationIds.has(t.pollingStationId)) {
      candAVotes += Number(t.candAVotes || 0);
      candBVotes += Number(t.candBVotes || 0);
      candCVotes += Number(t.candCVotes || 0);
      rejectedVotes += Number(t.rejectedVotes || 0);
      talliesCount++;
    }
  }

  const totalValidVotes = candAVotes + candBVotes + candCVotes;
  const totalVotesCast = totalValidVotes + rejectedVotes;

  // Turnout %
  const turnoutPct = registeredVoters > 0
    ? Math.min(100, Math.round((totalVotesCast / registeredVoters) * 100))
    : 0;

  // Reporting %
  const reportingPct = regionStations.length > 0
    ? Math.min(100, Math.round((talliesCount / regionStations.length) * 100))
    : (talliesCount > 0 ? 100 : 0);

  // Leader determination
  let leader = 'No Data';
  let leadColor = FORMATION_COLORS.MUTED;
  let margin = 0;

  if (totalValidVotes > 0) {
    if (candAVotes >= candBVotes && candAVotes >= candCVotes) {
      leader = 'Candidate A';
      leadColor = FORMATION_COLORS.CAND_A;
      margin = candAVotes - Math.max(candBVotes, candCVotes);
    } else if (candBVotes >= candAVotes && candBVotes >= candCVotes) {
      leader = 'Candidate B';
      leadColor = FORMATION_COLORS.CAND_B;
      margin = candBVotes - Math.max(candAVotes, candCVotes);
    } else {
      leader = 'Candidate C';
      leadColor = FORMATION_COLORS.CAND_C;
      margin = candCVotes - Math.max(candAVotes, candBVotes);
    }
  }

  // Risk Level computation
  let riskLevel = 'Low';
  let severeRiskCount = 0;
  let highRiskCount = 0;

  regionStations.forEach(ps => {
    const intel = stationIntelligence[ps.id];
    if (intel?.riskLevel === 'Severe') severeRiskCount++;
    else if (intel?.riskLevel === 'High') highRiskCount++;
  });

  if (severeRiskCount > 0) riskLevel = 'Severe';
  else if (highRiskCount > 0) riskLevel = 'High';
  else if (turnoutPct > 85) riskLevel = 'Medium'; // turnout alert

  return {
    registeredVoters,
    stationsCount: regionStations.length,
    talliesCount,
    reportingPct,
    turnoutPct,
    totalVotesCast,
    candAVotes,
    candBVotes,
    candCVotes,
    rejectedVotes,
    leader,
    leadColor,
    margin,
    riskLevel
  };
};

/**
 * Computes dynamic fill color based on layerMode
 */
export const getRegionFillColor = (metrics, layerMode = MAP_LAYERS.LEAD, isOutOfScope = false) => {
  if (isOutOfScope) return '#0f172a'; // Dimmed out-of-scope background

  switch (layerMode) {
    case MAP_LAYERS.LEAD: {
      if (!metrics || metrics.talliesCount === 0) return '#334155';
      return metrics.leadColor || FORMATION_COLORS.MUTED;
    }

    case MAP_LAYERS.TURNOUT: {
      const t = metrics?.turnoutPct || 0;
      if (t === 0) return '#1e293b';
      if (t < 40) return '#475569';
      if (t < 55) return '#0284c7';
      if (t < 70) return '#059669';
      return '#10b981';
    }

    case MAP_LAYERS.REPORTING: {
      const r = metrics?.reportingPct || 0;
      if (r === 0) return '#1e293b';
      if (r < 30) return '#d97706';
      if (r < 65) return '#0891b2';
      if (r < 99) return '#2563eb';
      return '#10b981';
    }

    case MAP_LAYERS.RISK: {
      const risk = metrics?.riskLevel || 'Low';
      if (risk === 'Severe') return '#ef4444';
      if (risk === 'High') return '#f97316';
      if (risk === 'Medium') return '#eab308';
      return '#10b981';
    }

    default:
      return '#334155';
  }
};

/**
 * Resolves map auto-framing bounding box according to user scope
 */
export const resolveMapFraming = (user, geography) => {
  if (!user || user.role === 'Super Admin' || user.role === 'Admin' || user.assignedEntity === 'GLOBAL') {
    return {
      viewBox: '0 0 850 1000',
      isScoped: false,
      title: 'Republic of Kenya (All 47 Counties)'
    };
  }

  const assignedEntity = String(user.assignedEntity || '');
  const userCounty = String(user.county || '').toLowerCase();

  // Find matching county in geometry with exact ID/code matching
  const assignedNormalized = assignedEntity.toUpperCase().replace(/^C-?0*/, '');
  const countyGeo = KENYA_COUNTIES_GEOMETRY.find(c => {
    const cCode = String(c.code);
    const cNormalized = cCode.replace(/^0*/, '');
    return (
      c.id === assignedEntity ||
      cCode === assignedEntity ||
      (assignedNormalized && cNormalized === assignedNormalized) ||
      (userCounty && (c.name.toLowerCase() === userCounty || c.name.toLowerCase().includes(userCounty)))
    );
  });

  if (countyGeo && countyGeo.bounds) {
    const pad = 40;
    const b = countyGeo.bounds;
    const vx = Math.max(0, b.x - pad);
    const vy = Math.max(0, b.y - pad);
    const vw = b.w + pad * 2;
    const vh = b.h + pad * 2;

    return {
      viewBox: `${vx} ${vy} ${vw} ${vh}`,
      isScoped: true,
      countyId: countyGeo.id,
      countyName: countyGeo.name,
      title: `${countyGeo.name} County Operations`
    };
  }

  return {
    viewBox: '0 0 850 1000',
    isScoped: false,
    title: 'Republic of Kenya'
  };
};
