/**
 * Utility for exporting Polling Station Intelligence data to RFC-4180 compliant CSV format.
 */

export const escapeCSVField = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportPollingStationsToCSVString = (stations = [], lookups = {}, stationIntelligence = {}) => {
  const headers = [
    'Code',
    'Name',
    'County',
    'Constituency',
    'Ward',
    'RegisteredVoters',
    'TurnoutPct',
    'Latitude',
    'Longitude',
    'StreamsCount',
    'RiskLevel',
    'DominantCoalition'
  ];

  const countyMap = lookups.counties instanceof Map ? lookups.counties : new Map(Object.entries(lookups.counties || {}));
  const constituencyMap = lookups.constituencies instanceof Map ? lookups.constituencies : new Map(Object.entries(lookups.constituencies || {}));
  const wardMap = lookups.wards instanceof Map ? lookups.wards : new Map(Object.entries(lookups.wards || {}));

  const rows = stations.map((ps) => {
    const county = ps.county || countyMap.get(ps.countyId) || '';
    const constituency = ps.constituency || constituencyMap.get(ps.constituencyId) || '';
    const ward = ps.ward || wardMap.get(ps.wardId) || '';
    const intel = stationIntelligence[ps.id] || {};
    const dominantCoalition = intel.dominantCoalition || intel.coalitionLean || intel.partyAdvantage || 'Competitive / Tossup';
    const riskLevel = intel.riskLevel || ps.riskLevel || 'Low';

    return [
      escapeCSVField(ps.code || ps.id),
      escapeCSVField(ps.name),
      escapeCSVField(county),
      escapeCSVField(constituency),
      escapeCSVField(ward),
      ps.registeredVoters || 0,
      ps.turnoutPct || intel.historicalTurnout || 0,
      ps.latitude ?? ps.lat ?? '',
      ps.longitude ?? ps.lng ?? ps.lon ?? '',
      ps.streamsCount || ps.registeredStreams || 1,
      escapeCSVField(riskLevel),
      escapeCSVField(dominantCoalition)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
};

export const downloadPollingStationsCSV = (stations, lookups, stationIntelligence, filename = 'polling_stations.csv') => {
  const csvContent = exportPollingStationsToCSVString(stations, lookups, stationIntelligence);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return csvContent;
};
