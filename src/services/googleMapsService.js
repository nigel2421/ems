// ====================================================================
// KuraTech GOOGLE MAPS SERVICE
// Singleton loader and geospatial helper for Google Maps JavaScript API
// Supports runtime API key management, real Kenya coordinates,
// role-based framing, and custom station pin rendering.
// ====================================================================

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { safeStorage } from '../utils/safeStorage.js';

export const STORAGE_KEY_GOOGLE_MAPS_KEY = 'ems_google_maps_api_key';

let inMemoryApiKey = '';

/**
 * Retrieve Google Maps API Key from environment or local storage
 */
export const getGoogleMapsApiKey = () => {
  if (inMemoryApiKey) return inMemoryApiKey;

  const envKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env?.VITE_GOOGLE_MAPS_PLATFORM_KEY)) || '';
  if (envKey && envKey.trim()) return envKey.trim();

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY_GOOGLE_MAPS_KEY);
      if (stored) {
        const decoded = decodeURIComponent(escape(atob(stored)));
        if (decoded && decoded.trim()) return decoded.trim();
      }
    } catch {
      // ignore
    }
  }
  return '';
};

/**
 * Save Google Maps API Key in memory and encoded session storage (no cleartext localStorage)
 */
export const setGoogleMapsApiKey = (apiKey) => {
  inMemoryApiKey = (apiKey && apiKey.trim()) || '';
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY_GOOGLE_MAPS_KEY);
      if (window.sessionStorage) {
        if (apiKey && apiKey.trim()) {
          const encoded = btoa(unescape(encodeURIComponent(apiKey.trim())));
          window.sessionStorage.setItem(STORAGE_KEY_GOOGLE_MAPS_KEY, encoded);
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY_GOOGLE_MAPS_KEY);
        }
      }
    } catch {
      // ignore
    }
  }
};

/**
 * Check if a Google Maps API Key is currently available
 */
export const isGoogleMapsConfigured = () => {
  return Boolean(getGoogleMapsApiKey());
};

/**
 * Asynchronously fetch Google Maps API key from the server runtime configuration
 */
export const fetchGoogleMapsApiKeyFromServer = async () => {
  const existing = getGoogleMapsApiKey();
  if (existing) return existing;

  try {
    const res = await fetch('/api/config/maps', { credentials: 'include' });
    if (!res.ok) return '';
    const data = await res.json().catch(() => ({}));
    if (data && data.apiKey && data.apiKey.trim()) {
      const key = data.apiKey.trim();
      inMemoryApiKey = key;
      if (typeof window !== 'undefined') {
        safeStorage.setItem(STORAGE_KEY_GOOGLE_MAPS_KEY, key);
      }
      return key;
    }
  } catch (err) {
    console.warn('[GoogleMapsService] Could not fetch maps config from server:', err);
  }
  return '';
};

/**
 * Save Google Maps API Key to the server (persists globally for all users)
 */
export const saveGoogleMapsApiKeyToServer = async (apiKey) => {
  try {
    const res = await fetch('/api/config/maps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EMS-Realm': 'admin'
      },
      credentials: 'include',
      body: JSON.stringify({ apiKey: (apiKey || '').trim() })
    });
    return await res.json().catch(() => ({ success: false }));
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Listeners for Google Maps Authentication Failure (gm_authFailure)
const authFailureListeners = new Set();

if (typeof window !== 'undefined') {
  const prevGmAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    if (typeof prevGmAuthFailure === 'function') {
      try { prevGmAuthFailure(); } catch (e) { /* ignore */ }
    }
    authFailureListeners.forEach(cb => {
      try { cb(); } catch (e) { /* ignore */ }
    });
  };
}

export const onGoogleMapsAuthFailure = (callback) => {
  authFailureListeners.add(callback);
  return () => authFailureListeners.delete(callback);
};

// Singleton loader tracking
let optionsSet = false;
let googleMapsPromise = null;

/**
 * Load Google Maps JavaScript API
 */
export const loadGoogleMaps = async (customKey = '') => {
  const key = customKey || getGoogleMapsApiKey();
  if (!key) {
    throw new Error('Google Maps API Key not configured. Please supply an API key.');
  }

  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return window.google.maps;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = (async () => {
      if (!optionsSet) {
        setOptions({
          key: key.trim(),
          v: 'weekly'
        });
        optionsSet = true;
      }
      await importLibrary('maps');
      await importLibrary('marker');
      return window.google?.maps;
    })();
  }

  return googleMapsPromise;
};

// Singleton Leaflet fallback loader tracking
let leafletPromise = null;

/**
 * Dynamically load Leaflet 1.9.4 CSS & JS for automatic fallback when Google Maps key is unavailable or restricted
 */
export const loadLeaflet = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Leaflet requires a browser window environment.');
  }
  if (window.L && typeof window.L.map === 'function') {
    return window.L;
  }

  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      // Ensure Leaflet stylesheet is injected
      if (!document.getElementById('ems-leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'ems-leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      if (window.L && typeof window.L.map === 'function') {
        resolve(window.L);
        return;
      }

      const loadScript = (src, onFallback) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.crossOrigin = '';
        script.onload = () => {
          if (window.L && typeof window.L.map === 'function') {
            resolve(window.L);
          } else if (onFallback) {
            onFallback();
          } else {
            leafletPromise = null;
            reject(new Error('Leaflet SDK loaded but window.L was not initialized.'));
          }
        };
        script.onerror = () => {
          if (onFallback) {
            onFallback();
          } else {
            leafletPromise = null;
            reject(new Error('Failed to load fallback map engine from CDN.'));
          }
        };
        document.head.appendChild(script);
      };

      loadScript(
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js')
      );
    });
  }

  return leafletPromise;
};

/**
 * Create a Leaflet marker with the exact same SVG pin and stream count badge as Google Maps,
 * plus an optional permanent Polling Centre name label underneath.
 */
export const createLeafletPin = ({ L, map, position, title, labelText = '', pinColor = '#EAB308', streamsCount = 1, popupHtml = '', onClick }) => {
  if (!L || !map) return null;
  const badgeHtml = streamsCount > 1
    ? `<span style="position: absolute; top: -6px; right: -8px; background: #0f172a; color: #ffffff; border: 1.5px solid ${pinColor}; border-radius: 10px; font-size: 10px; font-weight: 800; padding: 1px 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.45); line-height: 1.2;">${streamsCount}</span>`
    : '';

  const cleanLabel = String(labelText || '').trim();
  const captionHtml = cleanLabel
    ? `<div class="ems-pin-caption" style="position: absolute; top: 44px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(15, 23, 42, 0.88); color: #f8fafc; border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 5px; padding: 1px 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 2px 6px rgba(0,0,0,0.45); pointer-events: none; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${cleanLabel}</div>`
    : '';

  const html = `
    <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 36 46">
        <defs>
          <filter id="ems-pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
          </filter>
        </defs>
        <path d="M18 0 C8.06 0 0 8.06 0 18 C0 31.5 18 46 18 46 C18 46 36 31.5 36 18 C36 8.06 27.94 0 18 0 Z"
              fill="${pinColor}" stroke="#0F172A" stroke-width="2" filter="url(#ems-pin-shadow)"/>
        <circle cx="18" cy="18" r="7" fill="#ffffff" />
      </svg>
      ${badgeHtml}
      ${captionHtml}
    </div>
  `.trim();

  const icon = L.divIcon({
    className: 'ems-leaflet-pin-icon',
    html,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40]
  });

  const marker = L.marker([Number(position.lat), Number(position.lng)], {
    icon,
    title: streamsCount > 1 ? `${title} [${streamsCount} Streams]` : title
  }).addTo(map);

  if (popupHtml && typeof marker.bindPopup === 'function') {
    marker.bindPopup(popupHtml, { maxWidth: 340, className: 'ems-leaflet-popup' });
  }

  if (onClick && typeof marker.on === 'function') {
    marker.on('click', () => {
      onClick();
    });
  }

  return marker;
};

/**
 * Computes a 2D Monotone Chain convex hull from an array of { lat, lng } points
 * and expands it slightly so the administrative boundary wraps cleanly around stations.
 */
export const computeConvexHull = (points = [], bufferDeg = 0.004) => {
  const valid = points
    .map(p => ({ lat: Number(p.lat ?? p.latitude), lng: Number(p.lng ?? p.longitude) }))
    .filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

  if (valid.length === 0) return [];

  const cLat = valid.reduce((acc, p) => acc + p.lat, 0) / valid.length;
  const cLng = valid.reduce((acc, p) => acc + p.lng, 0) / valid.length;

  if (valid.length < 3) {
    const r = Math.max(bufferDeg, 0.006);
    const ring = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      ring.push([cLat + Math.sin(angle) * r, cLng + Math.cos(angle) * r]);
    }
    return ring;
  }

  const sorted = [...valid].sort((a, b) => (a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng));
  const cross = (o, a, b) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  const hull = lower.concat(upper);

  return hull.map(pt => {
    const dLat = pt.lat - cLat;
    const dLng = pt.lng - cLng;
    const dist = Math.hypot(dLat, dLng) || 1;
    return [
      pt.lat + (dLat / dist) * bufferDeg,
      pt.lng + (dLng / dist) * bufferDeg
    ];
  });
};

/**
 * Renders County, Constituency, and Ward boundary polygons and bold name labels onto a Leaflet map.
 * Returns an array of created Leaflet layers so the caller can clean them up on re-render.
 */
export const renderLeafletJurisdictionBoundaries = ({
  L,
  map,
  scopedStations = [],
  currentZoom = 12
}) => {
  if (!L || !map) return [];
  const createdLayers = [];

  const addBoundaryLabel = (lat, lng, text, subtitle, borderColor, bgColor = 'rgba(15, 23, 42, 0.86)') => {
    if (typeof L.marker !== 'function' || typeof L.divIcon !== 'function') return;
    const labelIcon = L.divIcon({
      className: 'ems-map-boundary-label-wrapper',
      html: `
        <div class="ems-map-boundary-label" style="display: inline-flex; flex-direction: column; align-items: center; background: ${bgColor}; color: #ffffff; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 3px 9px; box-shadow: 0 4px 12px rgba(0,0,0,0.45); pointer-events: none; white-space: nowrap; transform: translate(-50%, -50%);">
          <span style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: ${borderColor};">${text}</span>
          ${subtitle ? `<span style="font-size: 9px; font-weight: 600; color: #cbd5e1;">${subtitle}</span>` : ''}
        </div>
      `.trim(),
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
    const m = L.marker([Number(lat), Number(lng)], { icon: labelIcon, interactive: false }).addTo(map);
    createdLayers.push(m);
  };

  // Group scoped stations by County, Constituency, and Ward
  const countyGroups = new Map();
  const constGroups = new Map();
  const wardGroups = new Map();

  scopedStations.forEach(st => {
    const lat = Number(st.latitude ?? st.lat);
    const lng = Number(st.longitude ?? st.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const cName = st.countyName || st.county || '';
    const csName = st.constituencyName || st.constituency || '';
    const wName = st.wardName || st.ward || '';

    if (cName) {
      if (!countyGroups.has(cName)) countyGroups.set(cName, []);
      countyGroups.get(cName).push({ lat, lng });
    }
    if (csName) {
      if (!constGroups.has(csName)) constGroups.set(csName, []);
      constGroups.get(csName).push({ lat, lng });
    }
    if (wName) {
      if (!wardGroups.has(wName)) wardGroups.set(wName, []);
      wardGroups.get(wName).push({ lat, lng });
    }
  });

  // 1. National / Multi-County Overview (Zoom <= 9): Show County labels & boundaries
  if (currentZoom <= 9) {
    Object.values(COUNTY_COORDINATES).forEach(c => {
      if (typeof map.getBounds === 'function') {
        const b = map.getBounds();
        if (b && typeof b.contains === 'function' && !b.contains([c.lat, c.lng])) return;
      }
      addBoundaryLabel(c.lat, c.lng, `${c.name} COUNTY`, '', '#38bdf8');
    });
  }

  // 2. County Boundary Polygons (Zoom <= 12 or up to 3 counties in scope)
  if (countyGroups.size > 0 && countyGroups.size <= 5) {
    countyGroups.forEach((pts, cName) => {
      const hull = computeConvexHull(pts, 0.012);
      if (hull.length >= 3 && typeof L.polygon === 'function') {
        const poly = L.polygon(hull, {
          color: '#38bdf8',
          weight: 2.5,
          dashArray: '8, 6',
          fillColor: '#0284c7',
          fillOpacity: 0.04,
          interactive: false
        }).addTo(map);
        createdLayers.push(poly);

        const topPt = hull.reduce((best, cur) => (cur[0] > best[0] ? cur : best), hull[0]);
        const cleanCounty = String(cName).replace(/\bcounty\b/gi, '').trim().toUpperCase();
        addBoundaryLabel(topPt[0], topPt[1], `${cleanCounty} COUNTY`, 'County Boundary', '#38bdf8');
      }
    });
  }

  // 3. Constituency Boundary Polygons & Labels (Zoom >= 10)
  if (currentZoom >= 10 && constGroups.size > 0 && constGroups.size <= 20) {
    constGroups.forEach((pts, csName) => {
      const hull = computeConvexHull(pts, 0.006);
      if (hull.length >= 3 && typeof L.polygon === 'function') {
        const poly = L.polygon(hull, {
          color: '#10b981',
          weight: 2,
          dashArray: '5, 5',
          fillColor: '#10b981',
          fillOpacity: 0.05,
          interactive: false
        }).addTo(map);
        createdLayers.push(poly);

        const cLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
        const cLng = pts.reduce((a, p) => a + p.lng, 0) / pts.length;
        const topLat = hull.reduce((maxL, cur) => Math.max(maxL, cur[0]), cLat);
        const labelLat = currentZoom >= 13 ? topLat : cLat;
        const cleanConst = String(csName).replace(/\bconstituency\b/gi, '').trim().toUpperCase();
        addBoundaryLabel(labelLat, cLng, `${cleanConst} CONSTITUENCY`, `${pts.length} Streams`, '#10b981');
      }
    });
  }

  // 4. Ward Boundary Polygons & Labels (Zoom >= 12 or single ward scope)
  if ((currentZoom >= 12 || wardGroups.size === 1) && wardGroups.size > 0 && wardGroups.size <= 15) {
    wardGroups.forEach((pts, wName) => {
      const hull = computeConvexHull(pts, 0.0035);
      if (hull.length >= 3 && typeof L.polygon === 'function') {
        const poly = L.polygon(hull, {
          color: '#f59e0b',
          weight: 2.2,
          fillColor: '#f59e0b',
          fillOpacity: 0.07,
          interactive: false
        }).addTo(map);
        createdLayers.push(poly);

        const cLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
        const cLng = pts.reduce((a, p) => a + p.lng, 0) / pts.length;
        const southLat = hull.reduce((minL, cur) => Math.min(minL, cur[0]), cLat);
        const cleanWard = String(wName).replace(/\bward\b/gi, '').trim().toUpperCase();
        addBoundaryLabel(southLat, cLng, `${cleanWard} WARD`, `${pts.length} Polling Streams`, '#f59e0b');
      }
    });
  }

  return createdLayers;
};

// ====================================================================
// REAL KENYAN GEOGRAPHIC COORDINATES & ADMINISTRATIVE CENTROIDS
// ====================================================================

export const KENYA_NATIONAL_CENTER = {
  lat: 0.0236,
  lng: 37.9062,
  zoom: 6,
  bounds: {
    north: 5.5,
    south: -4.8,
    west: 33.9,
    east: 41.9
  }
};

export const COUNTY_COORDINATES = {
  'C-001': { name: 'MOMBASA', lat: -4.0435, lng: 39.6682, zoom: 12 },
  'C-002': { name: 'KWALE', lat: -4.1816, lng: 39.4606, zoom: 10 },
  'C-003': { name: 'KILIFI', lat: -3.5107, lng: 39.8499, zoom: 10 },
  'C-004': { name: 'TANA RIVER', lat: -1.5000, lng: 39.8000, zoom: 9 },
  'C-005': { name: 'LAMU', lat: -2.2717, lng: 40.9020, zoom: 10 },
  'C-006': { name: 'TAITA TAVETA', lat: -3.3969, lng: 38.5566, zoom: 10 },
  'C-007': { name: 'GARISSA', lat: -0.4532, lng: 39.6460, zoom: 9 },
  'C-008': { name: 'WAJIR', lat: 1.7471, lng: 40.0573, zoom: 9 },
  'C-009': { name: 'MANDERA', lat: 3.9373, lng: 41.8569, zoom: 9 },
  'C-010': { name: 'MARSABIT', lat: 2.3347, lng: 37.9904, zoom: 8 },
  'C-011': { name: 'ISIOLO', lat: 0.3546, lng: 37.5822, zoom: 9 },
  'C-012': { name: 'MERU', lat: 0.0463, lng: 37.6559, zoom: 11 },
  'C-013': { name: 'THARAKA-NITHI', lat: -0.2965, lng: 37.8687, zoom: 11 },
  'C-014': { name: 'EMBU', lat: -0.5344, lng: 37.4586, zoom: 11 },
  'C-015': { name: 'KITUI', lat: -1.3683, lng: 38.0106, zoom: 9 },
  'C-016': { name: 'MACHAKOS', lat: -1.5177, lng: 37.2634, zoom: 10 },
  'C-017': { name: 'MAKUENI', lat: -2.2559, lng: 37.8937, zoom: 10 },
  'C-018': { name: 'NYANDARUA', lat: -0.3767, lng: 36.4257, zoom: 10 },
  'C-019': { name: 'NYERI', lat: -0.4201, lng: 36.9476, zoom: 11 },
  'C-020': { name: 'KIRINYAGA', lat: -0.4989, lng: 37.2803, zoom: 11 },
  'C-021': { name: 'MURANG\'A', lat: -0.7211, lng: 37.1526, zoom: 11 },
  'C-022': { name: 'KIAMBU', lat: -1.1714, lng: 36.8356, zoom: 11 },
  'C-023': { name: 'TURKANA', lat: 3.1167, lng: 35.5997, zoom: 8 },
  'C-024': { name: 'WEST POKOT', lat: 1.4886, lng: 35.1269, zoom: 10 },
  'C-025': { name: 'SAMBURU', lat: 1.2500, lng: 36.9500, zoom: 9 },
  'C-026': { name: 'TRANS NZOIA', lat: 1.0558, lng: 34.9510, zoom: 11 },
  'C-027': { name: 'UASIN GISHU', lat: 0.5143, lng: 35.2698, zoom: 11 },
  'C-028': { name: 'ELGEYO-MARAKWET', lat: 0.8000, lng: 35.5000, zoom: 10 },
  'C-029': { name: 'NANDI', lat: 0.1835, lng: 35.1056, zoom: 11 },
  'C-030': { name: 'BARINGO', lat: 0.5932, lng: 35.9442, zoom: 10 },
  'C-031': { name: 'LAIKIPIA', lat: 0.3606, lng: 36.7820, zoom: 10 },
  'C-032': { name: 'NAKURU', lat: -0.3031, lng: 36.0800, zoom: 10 },
  'C-033': { name: 'NAROK', lat: -1.0833, lng: 35.8667, zoom: 9 },
  'C-034': { name: 'KAJIADO', lat: -2.0981, lng: 36.7820, zoom: 9 },
  'C-035': { name: 'KERICHO', lat: -0.3677, lng: 35.2831, zoom: 11 },
  'C-036': { name: 'BOMET', lat: -0.7813, lng: 35.3416, zoom: 11 },
  'C-037': { name: 'KAKAMEGA', lat: 0.2827, lng: 34.7519, zoom: 11 },
  'C-038': { name: 'VIHIGA', lat: 0.0800, lng: 34.7200, zoom: 12 },
  'C-039': { name: 'BUNGOMA', lat: 0.5635, lng: 34.5606, zoom: 11 },
  'C-040': { name: 'BUSIA', lat: 0.4608, lng: 34.1115, zoom: 11 },
  'C-041': { name: 'SIAYA', lat: 0.0607, lng: 34.2878, zoom: 11 },
  'C-042': { name: 'KISUMU', lat: -0.0917, lng: 34.7680, zoom: 11 },
  'C-043': { name: 'HOMA BAY', lat: -0.5273, lng: 34.4571, zoom: 10 },
  'C-044': { name: 'MIGORI', lat: -1.0634, lng: 34.4731, zoom: 10 },
  'C-045': { name: 'KISII', lat: -0.6817, lng: 34.7667, zoom: 11 },
  'C-046': { name: 'NYAMIRA', lat: -0.5633, lng: 34.9358, zoom: 11 },
  'C-047': { name: 'NAIROBI CITY', lat: -1.286389, lng: 36.817223, zoom: 11 }
};

export const CONSTITUENCY_COORDINATES = {
  // Nairobi Constituencies
  'CONST-274': { name: 'WESTLANDS', lat: -1.2683, lng: 36.8111, zoom: 13 },
  'CONST-275': { name: 'PARKLANDS/HIGHRIDGE', lat: -1.2612, lng: 36.8245, zoom: 14 },
  'CONST-276': { name: 'DAGORETTI NORTH', lat: -1.2890, lng: 36.7600, zoom: 13 },
  'CONST-277': { name: 'DAGORETTI SOUTH', lat: -1.3120, lng: 36.7380, zoom: 13 },
  'CONST-278': { name: 'LANGATA', lat: -1.3328, lng: 36.7584, zoom: 13 },
  'CONST-279': { name: 'KIBRA', lat: -1.3142, lng: 36.7869, zoom: 14 },
  'CONST-280': { name: 'ROYSAMBU', lat: -1.2186, lng: 36.8856, zoom: 13 },
  'CONST-281': { name: 'KASARANI', lat: -1.2222, lng: 36.9056, zoom: 13 },
  'CONST-282': { name: 'RUARAKA', lat: -1.2464, lng: 36.8778, zoom: 13 },
  'CONST-283': { name: 'EMBAKASI SOUTH', lat: -1.3400, lng: 36.8900, zoom: 13 },
  'CONST-284': { name: 'EMBAKASI NORTH', lat: -1.2550, lng: 36.9050, zoom: 13 },
  'CONST-285': { name: 'EMBAKASI CENTRAL', lat: -1.2800, lng: 36.9100, zoom: 13 },
  'CONST-286': { name: 'EMBAKASI EAST', lat: -1.3100, lng: 36.9400, zoom: 13 },
  'CONST-287': { name: 'EMBAKASI WEST', lat: -1.2850, lng: 36.8800, zoom: 13 },
  'CONST-288': { name: 'MAKADARA', lat: -1.3050, lng: 36.8500, zoom: 14 },
  'CONST-289': { name: 'KAMUKUNJI', lat: -1.2880, lng: 36.8450, zoom: 14 },
  'CONST-290': { name: 'STAREHE', lat: -1.2833, lng: 36.8333, zoom: 14 },

  // Mombasa Constituencies
  'CONST-001': { name: 'CHANGAMWE', lat: -4.0200, lng: 39.6300, zoom: 13 },
  'CONST-002': { name: 'JOMVU', lat: -4.0000, lng: 39.6100, zoom: 13 },
  'CONST-003': { name: 'KISAUNI', lat: -4.0000, lng: 39.7000, zoom: 13 },
  'CONST-004': { name: 'NYALI', lat: -4.0322, lng: 39.7042, zoom: 13 },
  'CONST-005': { name: 'LIKONI', lat: -4.0900, lng: 39.6600, zoom: 13 },
  'CONST-006': { name: 'MVITA', lat: -4.0600, lng: 39.6700, zoom: 14 }
};

/**
 * Resolves camera framing for Google Maps according to active selection or user role & jurisdiction
 */
export const resolveGoogleMapFraming = (user, geography, selectedCounty = null, selectedConstituency = null) => {
  // 1. Explicit Active Constituency Selection
  if (selectedConstituency) {
    const constNorm = String(selectedConstituency.name || selectedConstituency.id || '').toLowerCase();
    const constEntry = Object.entries(CONSTITUENCY_COORDINATES).find(([k, v]) =>
      k === selectedConstituency.id ||
      v.name.toLowerCase() === constNorm ||
      constNorm.includes(v.name.toLowerCase())
    );
    if (constEntry) {
      return {
        center: { lat: constEntry[1].lat, lng: constEntry[1].lng },
        zoom: constEntry[1].zoom || 14,
        isScoped: true,
        constituencyId: constEntry[0],
        constituencyName: constEntry[1].name,
        title: `${constEntry[1].name} Constituency`
      };
    }
  }

  // 2. Explicit Active County Selection
  if (selectedCounty) {
    const countyNorm = String(selectedCounty.name || '').toLowerCase();
    const countyIdNorm = String(selectedCounty.id || '').toUpperCase().replace(/^C-?0*/, '');
    const countyEntry = Object.entries(COUNTY_COORDINATES).find(([k, v]) => {
      const cCode = k.replace(/^C-0*/, '');
      return (
        k === selectedCounty.id ||
        cCode === countyIdNorm ||
        v.name.toLowerCase() === countyNorm ||
        countyNorm.includes(v.name.toLowerCase())
      );
    });
    if (countyEntry) {
      return {
        center: { lat: countyEntry[1].lat, lng: countyEntry[1].lng },
        zoom: countyEntry[1].zoom || 11,
        isScoped: true,
        countyId: countyEntry[0],
        countyName: countyEntry[1].name,
        title: `${countyEntry[1].name} County`
      };
    }
  }

  // 3. Authenticated Role Scope
  if (!user || user.role === 'Super Admin' || user.role === 'Admin' || user.assignedEntity === 'GLOBAL') {
    return {
      center: { lat: KENYA_NATIONAL_CENTER.lat, lng: KENYA_NATIONAL_CENTER.lng },
      zoom: KENYA_NATIONAL_CENTER.zoom,
      isScoped: false,
      title: 'Republic of Kenya (All 47 Counties)'
    };
  }

  const assignedEntity = String(user.assignedEntity || '');
  const userCounty = String(user.county || '').toLowerCase();
  const userConst = String(user.constituency || '').toLowerCase();
  const userWard = String(user.ward || '').toLowerCase();

  // Check Ward Scope (MCA, Ward Coordinator)
  if (user.role === 'MCA' || user.role === 'Ward Coordinator' || userWard) {
    const wardStations = (geography?.pollingStations || []).filter(ps => {
      const psWard = String(ps.wardName || ps.ward || '').toLowerCase().trim();
      return psWard === userWard || (userWard && (psWard.includes(userWard) || userWard.includes(psWard)));
    }).filter(ps => typeof ps.latitude === 'number' && typeof ps.longitude === 'number');

    if (wardStations.length > 0) {
      const avgLat = wardStations.reduce((acc, s) => acc + s.latitude, 0) / wardStations.length;
      const avgLng = wardStations.reduce((acc, s) => acc + s.longitude, 0) / wardStations.length;
      return {
        center: { lat: avgLat, lng: avgLng },
        zoom: 14,
        isScoped: true,
        wardName: user.ward,
        title: `${user.ward || 'Ward'} Command`
      };
    }
  }

  // Check Constituency Scope
  if (user.role === 'MP' || user.constituency || assignedEntity.startsWith('CONST-')) {
    const constEntry = Object.entries(CONSTITUENCY_COORDINATES).find(([k, v]) =>
      k === assignedEntity ||
      v.name.toLowerCase() === userConst ||
      userConst.includes(v.name.toLowerCase())
    );
    if (constEntry) {
      return {
        center: { lat: constEntry[1].lat, lng: constEntry[1].lng },
        zoom: constEntry[1].zoom,
        isScoped: true,
        constituencyId: constEntry[0],
        constituencyName: constEntry[1].name,
        title: `${constEntry[1].name} Constituency Command`
      };
    }
  }

  // Check County Scope (Governor, Senator, County Coordinator)
  const assignedNormalized = assignedEntity.toUpperCase().replace(/^C-?0*/, '');
  const countyEntry = Object.entries(COUNTY_COORDINATES).find(([k, v]) => {
    const cCode = k.replace(/^C-0*/, '');
    return (
      k === assignedEntity ||
      cCode === assignedNormalized ||
      v.name.toLowerCase() === userCounty ||
      userCounty.includes(v.name.toLowerCase())
    );
  });

  if (countyEntry) {
    return {
      center: { lat: countyEntry[1].lat, lng: countyEntry[1].lng },
      zoom: countyEntry[1].zoom,
      isScoped: true,
      countyId: countyEntry[0],
      countyName: countyEntry[1].name,
      title: `${countyEntry[1].name} County Operations`
    };
  }

  // Default fallback
  return {
    center: { lat: KENYA_NATIONAL_CENTER.lat, lng: KENYA_NATIONAL_CENTER.lng },
    zoom: KENYA_NATIONAL_CENTER.zoom,
    isScoped: false,
    title: 'Republic of Kenya'
  };
};

/**
 * Modern Map Marker factory with AdvancedMarkerElement & PinElement support
 */
/**
 * Modern Map Marker factory with AdvancedMarkerElement & PinElement support
 * Supports Polling Centre Hub super-imposition with stream count badge
 */
export const createMapPin = ({ gMaps, map, position, title, pinColor = '#EAB308', streamsCount = 1, onClick }) => {
  // Use AdvancedMarkerElement if supported
  if (gMaps?.marker?.AdvancedMarkerElement) {
    try {
      let contentElement = null;
      if (streamsCount > 1) {
        // Custom DOM badge element for multi-stream hubs
        const hubDiv = document.createElement('div');
        hubDiv.style.position = 'relative';
        hubDiv.style.cursor = 'pointer';
        hubDiv.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 36 46">
              <defs>
                <filter id="hub-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
                </filter>
              </defs>
              <path d="M18 0 C8.06 0 0 8.06 0 18 C0 31.5 18 46 18 46 C18 46 36 31.5 36 18 C36 8.06 27.94 0 18 0 Z"
                    fill="${pinColor}" stroke="#0F172A" stroke-width="2" filter="url(#hub-shadow)"/>
              <circle cx="18" cy="18" r="7" fill="#ffffff" />
            </svg>
            <span style="position: absolute; top: -6px; right: -8px; background: #0f172a; color: #ffffff; border: 1.5px solid ${pinColor}; border-radius: 10px; font-size: 10px; font-weight: 800; padding: 1px 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); line-height: 1.2;">
              ${streamsCount}
            </span>
          </div>
        `;
        contentElement = hubDiv;
      } else if (gMaps.marker.PinElement) {
        const pin = new gMaps.marker.PinElement({
          background: pinColor,
          borderColor: '#0F172A',
          glyphColor: '#FFFFFF',
          scale: 0.95
        });
        contentElement = pin;
      }

      const marker = new gMaps.marker.AdvancedMarkerElement({
        map,
        position,
        title: streamsCount > 1 ? `${title} [${streamsCount} Streams]` : title,
        ...(contentElement ? { content: contentElement } : {})
      });

      if (onClick) {
        if (typeof marker.addEventListener === 'function') {
          marker.addEventListener('gmp-click', onClick);
        } else if (typeof marker.addListener === 'function') {
          marker.addListener('click', onClick);
        }
      }
      return marker;
    } catch {
      // fallback to legacy below
    }
  }

  // Fallback to legacy gMaps.Marker with SVG icon
  const iconUrl = createMarkerPinSvg({ color: pinColor, streamsCount });
  const marker = new gMaps.Marker({
    position,
    map,
    title: streamsCount > 1 ? `${title} [${streamsCount} Streams]` : title,
    icon: {
      url: iconUrl,
      scaledSize: gMaps.Size ? (streamsCount > 1 ? new gMaps.Size(36, 44) : new gMaps.Size(28, 36)) : undefined
    }
  });

  if (onClick) {
    marker.addListener('click', onClick);
  }
  return marker;
};

/**
 * Returns color-coded SVG pin marker data URL for Google Maps with optional stream counter badge
 */
export const createMarkerPinSvg = ({ color = '#EAB308', strokeColor = '#0F172A', label = '', streamsCount = 1 }) => {
  const badgeSvg = streamsCount > 1 ? `
    <rect x="20" y="0" width="22" height="16" rx="8" fill="#0f172a" stroke="${color}" stroke-width="1.5" />
    <text x="31" y="12" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="-apple-system, sans-serif">${streamsCount}</text>
  ` : '';

  const viewBox = streamsCount > 1 ? '0 0 44 46' : '0 0 36 46';
  const width = streamsCount > 1 ? '44' : '36';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="46" viewBox="${viewBox}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
        </filter>
      </defs>
      <path d="M18 0 C8.06 0 0 8.06 0 18 C0 31.5 18 46 18 46 C18 46 36 31.5 36 18 C36 8.06 27.94 0 18 0 Z"
            fill="${color}" stroke="${strokeColor}" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="7" fill="#ffffff" />
      ${badgeSvg}
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Format Google Maps InfoWindow HTML string for a polling station or multi-stream hub
 */
export const formatInfoWindowHtml = (stationOrHub, metrics = {}, intel = {}, agent = null) => {
  const name = stationOrHub.name || 'Polling Station';
  const code = stationOrHub.code || 'N/A';
  const streamsCount = stationOrHub.streamsCount || metrics.streamsCount || 1;
  const voters = Number(stationOrHub.totalRegisteredVoters || stationOrHub.registeredVoters || 0).toLocaleString('en-KE');
  const risk = stationOrHub.riskLevel || intel.riskLevel || 'Low';
  const riskColor = risk === 'Severe' ? '#ef4444' : risk === 'High' ? '#f97316' : risk === 'Medium' ? '#eab308' : '#10b981';

  const addr = stationOrHub.formattedAddress || '';
  const streams = stationOrHub.streams || metrics.streams || [];

  const displayStreamsCount = streamsCount > streams.length ? streamsCount : streams.length;
  const streamsBreakdownHtml = displayStreamsCount > 1 ? `
    <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 700; color: #006B3F;">STREAM ROOMS (${displayStreamsCount})</span>
        <span style="font-size: 10px; color: #64748b;">All Rooms Mapped</span>
      </div>
      <div style="max-height: 110px; overflow-y: auto; padding-right: 4px;">
        ${streams.map((s, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding: 3px 0; border-bottom: 1px dashed #f1f5f9;">
            <span style="color: #334155;">Stream ${idx + 1} (${s.code.split('/').pop()})</span>
            <span style="font-weight: 600; color: #0f172a;">${Number(s.registeredVoters || 0).toLocaleString()} voters</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 260px; max-width: 320px; padding: 4px; color: #0f172a;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">${code}</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          ${streamsCount > 1 ? `<span style="font-size: 10px; font-weight: 800; background: #006B3F; color: #ffffff; padding: 2px 6px; border-radius: 4px;">${streamsCount} STREAMS</span>` : ''}
          <span style="font-size: 10px; font-weight: 700; background: ${riskColor}; color: #ffffff; padding: 2px 6px; border-radius: 4px;">${risk} Risk</span>
        </div>
      </div>
      <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${name}</h3>
      ${addr ? `<div style="font-size: 11px; color: #0284c7; margin-bottom: 6px; font-weight: 500;">📍 ${addr}</div>` : ''}
      <div style="font-size: 12px; color: #334155; margin-bottom: 6px; line-height: 1.4;">
        <div><strong>Total Registered Voters:</strong> ${voters}</div>
        <div><strong>Form 34A Progress:</strong> ${metrics.reportingPct === 100 ? '<span style="color: #059669; font-weight: 600;">Verified (100%)</span>' : `<span style="color: #d97706; font-weight: 600;">${metrics.reportingPct || 0}% Reporting</span>`}</div>
        <div><strong>Field Desk:</strong> ${agent ? agent.name : '<span style="color: #64748b;">Assigned On-Duty</span>'}</div>
      </div>
      ${streamsBreakdownHtml}
      <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; text-align: center;">
        Click to inspect tally and Form 34A verification
      </div>
    </div>
  `;
};
