// ====================================================================
// KuraTech GPS & Spatial Formatter (QA DEF-06)
// Safe numeric formatting avoiding raw floating-point precision leaks
// ====================================================================

export const formatCoord = (val, decimals = 4) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(decimals);
};

export const formatLatLng = (lat, lng, decimals = 4) => {
  const fLat = formatCoord(lat, decimals);
  const fLng = formatCoord(lng, decimals);
  if (fLat === null || fLng === null) return 'GPS fix pending';
  return `${fLat}, ${fLng}`;
};
