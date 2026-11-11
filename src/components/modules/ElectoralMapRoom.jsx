// ====================================================================
// KuraTech ELECTORAL MAP ROOM COMPONENT
// Authoritative Geospatial Command Interface:
// - Google Maps Engine (Satellite / Hybrid / Roadmap)
// - Polling Centre Stream Hubs (Super-imposed stream pins with count badges)
// - Land-bound precision across all 47 Counties
// - Universal RBAC Auto-Framing (Constituency / County / National)
// ====================================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  resolveGoogleMapFraming,
  createMapPin,
  createLeafletPin,
  formatInfoWindowHtml,
  getGoogleMapsApiKey,
  setGoogleMapsApiKey,
  fetchGoogleMapsApiKeyFromServer,
  saveGoogleMapsApiKeyToServer,
  loadGoogleMaps,
  loadLeaflet,
  onGoogleMapsAuthFailure
} from '../../services/googleMapsService';
import { FORMATION_COLORS, MAP_LAYERS, buildRegionMetricsIndex } from '../../utils/mapAnalytics';
import { canAccessLocation, resolveCanonicalCounty, resolveCanonicalConstituency } from '../../utils/rbac';
import {
  resolveJurisdiction,
  hasNationalGeographyAccess,
  filterStationsByJurisdiction
} from '../../utils/jurisdictionAnalytics';
import {
  Map as MapIcon,
  ChevronRight,
  X,
  Lock,
  Vote,
  Percent,
  FileCheck2,
  AlertTriangle,
  Globe,
  Satellite,
  Key,
  CheckCircle,
  Building2,
  Layers,
  Users
} from 'lucide-react';
import './ElectoralMapRoom.css';

export const ElectoralMapRoom = ({ initialCountyId, initialConstituencyId }) => {
  const { currentUser } = useAuth();
  const { geography, tallyResults = [], stationIntelligence = {}, agents = [] } = useData();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Geographic RBAC resolution
  const isNational = hasNationalGeographyAccess(currentUser);
  const userJurisdiction = useMemo(
    () => resolveJurisdiction(currentUser, geography),
    [currentUser, geography]
  );

  // Engine Mode: 'google_hybrid' (Satellite + Roads) | 'google_roadmap' (Clean Streets)
  const [mapMode, setMapMode] = useState('google_hybrid');
  const [apiKey, setApiKey] = useState(getGoogleMapsApiKey());
  const [serverKeyChecked, setServerKeyChecked] = useState(() => Boolean(getGoogleMapsApiKey()));
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const [leafletMapInstance, setLeafletMapInstance] = useState(null);

  // Active Map Layer
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS.LEAD);

  // Selected administrative filters
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Detail Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);

  // DOM refs
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletLayersRef = useRef([]);
  const leafletMarkersRef = useRef([]);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const tooltipRef = useRef(null);

  // Determine whether to render the automatic OpenStreetMap / Esri Satellite fallback engine
  const useFallbackMap = (serverKeyChecked && !apiKey) || authFailed || Boolean(mapLoadError);

  // High-performance single-pass pre-indexed metrics for all 47 counties & constituencies
  const regionMetricsIndex = useMemo(() => {
    return buildRegionMetricsIndex(geography, tallyResults, stationIntelligence);
  }, [geography, tallyResults, stationIntelligence]);

  const handleMouseMove = (e) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate3d(${e.clientX + 15}px, ${e.clientY + 15}px, 0)`;
    }
  };

  // Subscribe to Google Maps authentication failure events (gm_authFailure)
  useEffect(() => {
    return onGoogleMapsAuthFailure(() => {
      setAuthFailed(true);
    });
  }, []);

  // Auto-resolve Google Maps API key from VPS backend config if not set locally
  useEffect(() => {
    if (!apiKey) {
      let isMounted = true;
      fetchGoogleMapsApiKeyFromServer()
        .then((serverKey) => {
          if (isMounted && serverKey) {
            setApiKey(serverKey);
          }
        })
        .finally(() => {
          if (isMounted) {
            setServerKeyChecked(true);
          }
        });
      return () => { isMounted = false; };
    } else {
      setServerKeyChecked(true);
    }
  }, [apiKey]);

  // Handle explicit initial framing passed from Polling Station Intelligence or deep-links
  useEffect(() => {
    if (!geography) return;
    if (initialCountyId) {
      const found = (geography.counties || []).find(
        c => c.id === initialCountyId || c.name.toLowerCase() === String(initialCountyId).toLowerCase()
      );
      if (found) {
        setSelectedCounty(found);
      }
    }
    if (initialConstituencyId) {
      const foundConst = (geography.constituencies || []).find(
        c => c.id === initialConstituencyId || c.name.toLowerCase() === String(initialConstituencyId).toLowerCase()
      );
      if (foundConst) {
        setSelectedConstituency(foundConst);
      }
    }
  }, [initialCountyId, initialConstituencyId, geography]);

  // --------------------------------------------------------------------
  // UNIVERSAL ROLE-BASED AUTO-FRAMING ON MOUNT OR AUTH CHANGE
  // Automatically selects user's constituency or county so MP Nyali (and all roles)
  // immediately zoom to their operational domain with zero manual clicks.
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !geography) return;
    if (initialCountyId || initialConstituencyId) return;

    // For non-national users, lock initial administrative selection strictly to assigned scope
    if (!isNational && userJurisdiction) {
      if (userJurisdiction.county) setSelectedCounty(userJurisdiction.county);
      if (userJurisdiction.constituency) setSelectedConstituency(userJurisdiction.constituency);
      return;
    }

    // 1. MP or Constituency-level role
    if (currentUser.constituency || (currentUser.role && currentUser.role.includes('MP'))) {
      const canonicalConst = resolveCanonicalConstituency(currentUser.constituency || currentUser.assignedEntity);
      const foundConst = (geography.constituencies || []).find(c => {
        return resolveCanonicalConstituency(c.id) === canonicalConst ||
          resolveCanonicalConstituency(c.name) === canonicalConst;
      });

      if (foundConst) {
        setSelectedConstituency(foundConst);
        const foundCounty = (geography.counties || []).find(c => c.id === foundConst.countyId);
        if (foundCounty) setSelectedCounty(foundCounty);
        return;
      }
    }

    // 2. Governor / County-level role
    if (currentUser.county || (currentUser.role && currentUser.role.includes('Governor'))) {
      const canonicalCounty = resolveCanonicalCounty(currentUser.county || currentUser.assignedEntity);
      const foundCounty = (geography.counties || []).find(c => {
        return resolveCanonicalCounty(c.id) === canonicalCounty ||
          resolveCanonicalCounty(c.name) === canonicalCounty;
      });

      if (foundCounty) {
        setSelectedCounty(foundCounty);
        setSelectedConstituency(null);
      }
    }
  }, [currentUser, geography, isNational, userJurisdiction, initialCountyId, initialConstituencyId]);

  // Google Maps Framing (center & zoom)
  const googleFraming = useMemo(
    () => resolveGoogleMapFraming(currentUser, geography, selectedCounty, selectedConstituency),
    [currentUser, geography, selectedCounty, selectedConstituency]
  );

  // Whenever framing changes and map instance exists, smoothly pan & zoom
  useEffect(() => {
    if (googleMapInstance && googleFraming?.center) {
      googleMapInstance.panTo(googleFraming.center);
      googleMapInstance.setZoom(googleFraming.zoom);
    }
    if (leafletMapInstance && googleFraming?.center) {
      leafletMapInstance.setView(
        [googleFraming.center.lat, googleFraming.center.lng],
        googleFraming.zoom || 12,
        { animate: true }
      );
    }
  }, [googleMapInstance, leafletMapInstance, googleFraming]);

  // --------------------------------------------------------------------
  // SCOPED POLLING STATIONS (Role-Gated & Filter-Aware)
  // --------------------------------------------------------------------
  const scopedStations = useMemo(() => {
    const stations = geography?.pollingStations || [];
    if (!stations.length) return [];

    // Strictly enforce geographic RBAC for scoped (non-national) accounts
    // (e.g. MCA gets ONLY stations in their specific ward, MP in constituency)
    if (!isNational) {
      return filterStationsByJurisdiction(stations, userJurisdiction);
    }

    // 1. If a constituency is selected, filter stations to that constituency
    if (selectedConstituency) {
      const cId = selectedConstituency.id;
      const cCanonical = resolveCanonicalConstituency(selectedConstituency.id || selectedConstituency.name);
      return stations.filter(ps =>
        ps.constituencyId === cId ||
        resolveCanonicalConstituency(ps.constituencyId) === cCanonical ||
        resolveCanonicalConstituency(ps.constituencyName || ps.constituency) === cCanonical
      );
    }

    // 2. If a county is selected, filter stations to that county
    if (selectedCounty) {
      const cId = selectedCounty.id;
      const cCanonical = resolveCanonicalCounty(selectedCounty.id || selectedCounty.name);
      return stations.filter(ps =>
        ps.countyId === cId ||
        resolveCanonicalCounty(ps.countyId) === cCanonical ||
        resolveCanonicalCounty(ps.countyName || ps.county) === cCanonical
      );
    }

    // 3. Fallback check for any other role scope
    if (currentUser && currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin' && currentUser.assignedEntity !== 'GLOBAL') {
      return stations.filter(ps => canAccessLocation(currentUser, {
        county: ps.countyName || ps.county,
        countyId: ps.countyId,
        constituency: ps.constituencyName || ps.constituency,
        constituencyId: ps.constituencyId,
        stationId: ps.id
      }));
    }

    // 4. Default National View
    return stations;
  }, [geography, currentUser, isNational, userJurisdiction, selectedCounty, selectedConstituency]);

  // --------------------------------------------------------------------
  // POLLING CENTRE HUBS (Super-Imposed Stream Aggregation)
  // Super-imposes multi-stream polling stations (e.g. Majengo Primary Streams 1-9)
  // into a single authoritative landmark hub pin with stream count badge [N].
  // Prevents map clutter, boosts performance, and clusters booth tallies together.
  // --------------------------------------------------------------------
  const pollingCentreHubs = useMemo(() => {
    if (!scopedStations.length) return [];
    const groups = new Map();

    scopedStations.forEach(ps => {
      // Group by normalized station landmark name
      const landmarkKey = String(ps.name || '').toUpperCase().trim();
      if (!groups.has(landmarkKey)) {
        groups.set(landmarkKey, {
          id: ps.id,
          name: ps.name,
          code: ps.code,
          ward: ps.ward,
          wardId: ps.wardId,
          constituency: ps.constituency || ps.constituencyName,
          constituencyId: ps.constituencyId,
          county: ps.county || ps.countyName,
          countyId: ps.countyId,
          latitude: ps.latitude,
          longitude: ps.longitude,
          streams: [],
          totalRegisteredVoters: 0,
          riskLevel: 'Low',
          talliesCount: 0,
          candAVotes: 0,
          candBVotes: 0,
          candCVotes: 0
        });
      }

      const hub = groups.get(landmarkKey);
      hub.streams.push(ps);
      hub.totalRegisteredVoters += Number(ps.registeredVoters || 0);

      // Aggregate security intelligence
      const intel = stationIntelligence?.[ps.id];
      if (intel?.riskLevel === 'Severe') {
        hub.riskLevel = 'Severe';
      } else if (intel?.riskLevel === 'High' && hub.riskLevel !== 'Severe') {
        hub.riskLevel = 'High';
      } else if (intel?.riskLevel === 'Medium' && hub.riskLevel === 'Low') {
        hub.riskLevel = 'Medium';
      }

      // Aggregate tally results
      const tally = tallyResults.find(t => t.pollingStationId === ps.id);
      if (tally) {
        hub.talliesCount += 1;
        hub.candAVotes += (tally.candAVotes || 0);
        hub.candBVotes += (tally.candBVotes || 0);
        hub.candCVotes += (tally.candCVotes || 0);
      }
    });

    return Array.from(groups.values()).map(hub => {
      const streamsCount = hub.streams.length;
      const totalVotesCast = hub.candAVotes + hub.candBVotes + hub.candCVotes;
      const reportingPct = streamsCount > 0 ? Math.round((hub.talliesCount / streamsCount) * 100) : 0;
      const turnoutPct = hub.totalRegisteredVoters > 0
        ? Math.min(100, Math.round((totalVotesCast / hub.totalRegisteredVoters) * 100))
        : 0;

      let leader = 'Pending';
      let leadColor = FORMATION_COLORS.MUTED;
      if (totalVotesCast > 0) {
        if (hub.candAVotes >= hub.candBVotes && hub.candAVotes >= hub.candCVotes) {
          leader = 'Candidate A';
          leadColor = FORMATION_COLORS.CAND_A;
        } else if (hub.candBVotes >= hub.candAVotes && hub.candBVotes >= hub.candCVotes) {
          leader = 'Candidate B';
          leadColor = FORMATION_COLORS.CAND_B;
        } else {
          leader = 'Candidate C';
          leadColor = FORMATION_COLORS.CAND_C;
        }
      }

      return {
        ...hub,
        streamsCount,
        registeredVoters: hub.totalRegisteredVoters,
        totalVotesCast,
        reportingPct,
        turnoutPct,
        leader,
        leadColor,
        margin: Math.abs(hub.candAVotes - hub.candBVotes)
      };
    });
  }, [scopedStations, stationIntelligence, tallyResults]);

  // --------------------------------------------------------------------
  // CONSTITUENCY CENTROID HUBS (For clean high-level view at zoom <= 10)
  // --------------------------------------------------------------------
  const constituencyHubs = useMemo(() => {
    const constGroups = new Map();
    (scopedStations || []).forEach(st => {
      const cName = st.constituency || 'County Operations';
      if (!constGroups.has(cName)) {
        constGroups.set(cName, {
          id: `CONST-HUB-${cName}`,
          name: `${cName} Hub`,
          constituency: cName,
          county: st.county,
          latSum: 0,
          lngSum: 0,
          coordCount: 0,
          totalRegisteredVoters: 0,
          talliesCount: 0,
          candAVotes: 0,
          candBVotes: 0,
          candCVotes: 0,
          streams: []
        });
      }
      const g = constGroups.get(cName);
      g.streams.push(st);
      g.totalRegisteredVoters += (st.registeredVoters || 0);
      if (st.latitude != null && st.longitude != null) {
        g.latSum += Number(st.latitude);
        g.lngSum += Number(st.longitude);
        g.coordCount += 1;
      }
      const tally = (tallyResults || []).find(t => t.pollingStationId === st.id);
      if (tally) {
        g.talliesCount += 1;
        g.candAVotes += (tally.candAVotes || 0);
        g.candBVotes += (tally.candBVotes || 0);
        g.candCVotes += (tally.candCVotes || 0);
      }
    });

    return Array.from(constGroups.values()).map(ch => {
      const lat = ch.coordCount > 0 ? (ch.latSum / ch.coordCount) : -1.28;
      const lng = ch.coordCount > 0 ? (ch.lngSum / ch.coordCount) : 36.82;
      const totalVotesCast = ch.candAVotes + ch.candBVotes + ch.candCVotes;
      const reportingPct = ch.streams.length > 0 ? Math.round((ch.talliesCount / ch.streams.length) * 100) : 0;
      const turnoutPct = ch.totalRegisteredVoters > 0
        ? Math.min(100, Math.round((totalVotesCast / ch.totalRegisteredVoters) * 100))
        : 0;

      let leader = 'Pending';
      let leadColor = FORMATION_COLORS.MUTED;
      if (totalVotesCast > 0) {
        if (ch.candAVotes >= ch.candBVotes && ch.candAVotes >= ch.candCVotes) {
          leader = 'Candidate A';
          leadColor = FORMATION_COLORS.CAND_A;
        } else if (ch.candBVotes >= ch.candAVotes && ch.candBVotes >= ch.candCVotes) {
          leader = 'Candidate B';
          leadColor = FORMATION_COLORS.CAND_B;
        } else {
          leader = 'Candidate C';
          leadColor = FORMATION_COLORS.CAND_C;
        }
      }

      return {
        ...ch,
        latitude: lat,
        longitude: lng,
        streamsCount: ch.streams.length,
        registeredVoters: ch.totalRegisteredVoters,
        totalVotesCast,
        reportingPct,
        turnoutPct,
        leader,
        leadColor,
        margin: Math.abs(ch.candAVotes - ch.candBVotes)
      };
    });
  }, [scopedStations, tallyResults]);

  // --------------------------------------------------------------------
  // GOOGLE MAPS PIN SYNCHRONIZATION (Hierarchical Zoom & Viewport Clamping)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!apiKey || !googleMapRef.current) return;

    let isMounted = true;
    let resizeTimer = null;
    let resizeObserver = null;
    let idleListener = null;
    setMapLoadError(null);

    loadGoogleMaps(apiKey)
      .then((googleMaps) => {
        if (!isMounted || !googleMapRef.current) return;

        const gMaps = googleMaps || window.google?.maps;
        if (!gMaps || !gMaps.Map) {
          throw new Error('Google Maps JavaScript API could not be initialized.');
        }

        const mapTypeId = mapMode === 'google_roadmap' ? 'roadmap' : 'hybrid';
        let map = googleMapInstance;

        if (!map) {
          map = new gMaps.Map(googleMapRef.current, {
            center: googleFraming.center,
            zoom: googleFraming.zoom,
            mapTypeId,
            mapId: 'CI_EMS_MAP_ID',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: false
          });

          infoWindowRef.current = new gMaps.InfoWindow();
          setGoogleMapInstance(map);
        } else {
          map.setMapTypeId(mapTypeId);
          map.panTo(googleFraming.center);
          map.setZoom(googleFraming.zoom);
        }

        // Trigger container dimensions refresh
        const triggerResize = () => {
          if (isMounted && map && gMaps.event) {
            gMaps.event.trigger(map, 'resize');
          }
        };

        const debouncedResize = () => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(triggerResize, 150);
        };

        setTimeout(triggerResize, 100);
        setTimeout(triggerResize, 350);

        if (googleMapRef.current && typeof window.ResizeObserver !== 'undefined' && !resizeObserver) {
          resizeObserver = new ResizeObserver(() => debouncedResize());
          resizeObserver.observe(googleMapRef.current);
        }

        // Viewport and Zoom Clamped Marker Renderer
        const updateVisibleMarkers = () => {
          if (!map || !isMounted) return;
          const currentZoom = map.getZoom() || googleFraming.zoom || 8;
          const bounds = map.getBounds();

          // Clear existing markers safely
          markersRef.current.forEach(m => {
            if (m.setMap) m.setMap(null);
            else if ('map' in m) m.map = null;
          });
          markersRef.current = [];

          // 1. High-Level Overview (Zoom <= 10 and no specific constituency chosen):
          // Show clean Constituency Centroid Hubs with zero pin crowding
          if (currentZoom <= 10 && !selectedConstituency && constituencyHubs.length > 1) {
            constituencyHubs.forEach(cHub => {
              let pinColor = FORMATION_COLORS.CAND_A;
              if (activeLayer === MAP_LAYERS.REPORTING) {
                pinColor = cHub.reportingPct === 100 ? '#10b981' : cHub.reportingPct > 0 ? '#0891b2' : '#d97706';
              } else if (activeLayer === MAP_LAYERS.TURNOUT) {
                pinColor = cHub.turnoutPct > 65 ? '#10b981' : cHub.turnoutPct > 40 ? '#0284c7' : '#475569';
              } else {
                pinColor = cHub.leadColor;
              }

              const marker = createMapPin({
                gMaps,
                map,
                position: { lat: Number(cHub.latitude), lng: Number(cHub.longitude) },
                title: `${cHub.name} (${cHub.streamsCount} stations)`,
                pinColor,
                streamsCount: cHub.streamsCount,
                onClick: () => {
                  map.panTo({ lat: Number(cHub.latitude), lng: Number(cHub.longitude) });
                  map.setZoom(12);
                  setSelectedConstituency(cHub.constituency);
                }
              });
              markersRef.current.push(marker);
            });
            return;
          }

          // 2. Local Drill-Down: zoom >= 11 or selectedConstituency chosen
          // Filter candidate hubs inside visible bounds and clamp to MAX 35 pins
          let candidates = pollingCentreHubs;
          if (bounds) {
            const inBounds = candidates.filter(hub => {
              if (hub.latitude == null || hub.longitude == null) return false;
              return bounds.contains(new gMaps.LatLng(hub.latitude, hub.longitude));
            });
            if (inBounds.length > 0) candidates = inBounds;
          }

          const clampedHubs = [...candidates].sort((a, b) => {
            const riskScore = (r) => r === 'Severe' ? 3 : r === 'High' ? 2 : r === 'Medium' ? 1 : 0;
            const rDiff = riskScore(b.riskLevel) - riskScore(a.riskLevel);
            if (rDiff !== 0) return rDiff;
            return (b.registeredVoters || 0) - (a.registeredVoters || 0);
          }).slice(0, 35);

          clampedHubs.forEach(hub => {
            let lat = hub.latitude;
            let lng = hub.longitude;

            if (lat == null || lng == null) {
              lat = googleFraming.center.lat;
              lng = googleFraming.center.lng;
            }

            let pinColor = FORMATION_COLORS.MUTED;
            if (activeLayer === MAP_LAYERS.RISK) {
              pinColor = hub.riskLevel === 'Severe' ? '#ef4444' : hub.riskLevel === 'High' ? '#f97316' : hub.riskLevel === 'Medium' ? '#eab308' : '#10b981';
            } else if (activeLayer === MAP_LAYERS.REPORTING) {
              pinColor = hub.reportingPct === 100 ? '#10b981' : hub.reportingPct > 0 ? '#0891b2' : '#d97706';
            } else if (activeLayer === MAP_LAYERS.TURNOUT) {
              pinColor = hub.turnoutPct > 65 ? '#10b981' : hub.turnoutPct > 40 ? '#0284c7' : '#475569';
            } else {
              pinColor = hub.leadColor;
            }

            const primaryAgent = (agents || []).find(a =>
              hub.streams.some(s => s.id === a.assignedStationId)
            );

            const marker = createMapPin({
              gMaps,
              map,
              position: { lat: Number(lat), lng: Number(lng) },
              title: `${hub.name} (${hub.streamsCount} streams)`,
              pinColor,
              streamsCount: hub.streamsCount,
              onClick: () => {
                const html = formatInfoWindowHtml(
                  hub,
                  { reportingPct: hub.reportingPct, streamsCount: hub.streamsCount, streams: hub.streams },
                  { riskLevel: hub.riskLevel },
                  primaryAgent
                );
                infoWindowRef.current.setContent(html);
                infoWindowRef.current.open({
                  map,
                  anchor: marker
                });

                setDrawerData({
                  region: hub,
                  level: 'Polling Centre Hub',
                  metrics: {
                    registeredVoters: hub.totalRegisteredVoters,
                    stationsCount: hub.streamsCount,
                    talliesCount: hub.talliesCount,
                    reportingPct: hub.reportingPct,
                    turnoutPct: hub.turnoutPct,
                    totalVotesCast: hub.totalVotesCast,
                    candAVotes: hub.candAVotes,
                    candBVotes: hub.candBVotes,
                    candCVotes: hub.candCVotes,
                    leader: hub.leader,
                    leadColor: pinColor,
                    margin: hub.margin
                  },
                  streams: hub.streams
                });
                setDrawerOpen(true);
              }
            });

            markersRef.current.push(marker);
          });
        };

        // Render markers immediately and on pan/zoom idle
        updateVisibleMarkers();
        idleListener = map.addListener('idle', updateVisibleMarkers);
      })
      .catch((err) => {
        if (!isMounted) return;
        setMapLoadError(err.message || 'Failed to load Google Maps SDK');
      });

    return () => {
      isMounted = false;
      if (resizeTimer) clearTimeout(resizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      if (idleListener && idleListener.remove) idleListener.remove();
      markersRef.current.forEach(m => {
        if (m.setMap) m.setMap(null);
        else if ('map' in m) m.map = null;
      });
      markersRef.current = [];
    };
  }, [mapMode, apiKey, activeLayer, pollingCentreHubs, constituencyHubs, selectedConstituency, googleFraming, agents]);

  // --------------------------------------------------------------------
  // AUTOMATIC HYBRID FALLBACK ENGINE (Leaflet: Esri Satellite + OSM Roadmap)
  // Activates seamlessly when Google Maps API Key is unconfigured or restricted
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!useFallbackMap || !leafletMapRef.current) return;

    let isMounted = true;
    let moveEndHandler = null;
    let activeMap = leafletMapInstance;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !leafletMapRef.current) return;

        if (!activeMap) {
          activeMap = L.map(leafletMapRef.current, {
            center: [googleFraming.center.lat, googleFraming.center.lng],
            zoom: googleFraming.zoom || 12,
            zoomControl: true,
            attributionControl: true
          });
          setLeafletMapInstance(activeMap);
        }

        // Remove previous tile layers
        leafletLayersRef.current.forEach((layer) => {
          try { activeMap.removeLayer(layer); } catch { /* ignore */ }
        });
        leafletLayersRef.current = [];

        if (mapMode === 'google_roadmap') {
          const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
          const roadLayer = L.tileLayer(tileUrl, {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }).addTo(activeMap);
          leafletLayersRef.current.push(roadLayer);
        } else {
          // Satellite + Hybrid Labels (Esri World Imagery + Carto Reference Labels)
          const satLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
            }
          ).addTo(activeMap);
          const labelsLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
            {
              maxZoom: 19,
              subdomains: 'abcd',
              pane: 'overlayPane'
            }
          ).addTo(activeMap);
          leafletLayersRef.current.push(satLayer, labelsLayer);
        }

        setTimeout(() => {
          if (isMounted && activeMap) {
            activeMap.invalidateSize();
          }
        }, 120);

        const updateLeafletMarkers = () => {
          if (!activeMap || !isMounted) return;
          const currentZoom = activeMap.getZoom() || googleFraming.zoom || 8;
          const bounds = activeMap.getBounds();

          leafletMarkersRef.current.forEach((m) => {
            try { activeMap.removeLayer(m); } catch { /* ignore */ }
          });
          leafletMarkersRef.current = [];

          // 1. High-Level Overview (Zoom <= 10 and no specific constituency chosen)
          if (currentZoom <= 10 && !selectedConstituency && constituencyHubs.length > 1) {
            constituencyHubs.forEach((cHub) => {
              let pinColor = FORMATION_COLORS.CAND_A;
              if (activeLayer === MAP_LAYERS.REPORTING) {
                pinColor = cHub.reportingPct === 100 ? '#10b981' : cHub.reportingPct > 0 ? '#0891b2' : '#d97706';
              } else if (activeLayer === MAP_LAYERS.TURNOUT) {
                pinColor = cHub.turnoutPct > 65 ? '#10b981' : cHub.turnoutPct > 40 ? '#0284c7' : '#475569';
              } else {
                pinColor = cHub.leadColor;
              }

              const marker = createLeafletPin({
                L,
                map: activeMap,
                position: { lat: Number(cHub.latitude), lng: Number(cHub.longitude) },
                title: `${cHub.name} (${cHub.streamsCount} stations)`,
                pinColor,
                streamsCount: cHub.streamsCount,
                onClick: () => {
                  activeMap.setView([Number(cHub.latitude), Number(cHub.longitude)], 12, { animate: true });
                  setSelectedConstituency(cHub.constituency);
                }
              });
              if (marker) leafletMarkersRef.current.push(marker);
            });
            return;
          }

          // 2. Local Drill-Down: zoom >= 11 or selectedConstituency chosen
          let candidates = pollingCentreHubs;
          if (bounds) {
            const inBounds = candidates.filter((hub) => {
              if (hub.latitude == null || hub.longitude == null) return false;
              return bounds.contains([Number(hub.latitude), Number(hub.longitude)]);
            });
            if (inBounds.length > 0) candidates = inBounds;
          }

          const clampedHubs = [...candidates]
            .sort((a, b) => {
              const riskScore = (r) => (r === 'Severe' ? 3 : r === 'High' ? 2 : r === 'Medium' ? 1 : 0);
              const rDiff = riskScore(b.riskLevel) - riskScore(a.riskLevel);
              if (rDiff !== 0) return rDiff;
              return (b.registeredVoters || 0) - (a.registeredVoters || 0);
            })
            .slice(0, 35);

          clampedHubs.forEach((hub) => {
            const lat = hub.latitude != null ? hub.latitude : googleFraming.center.lat;
            const lng = hub.longitude != null ? hub.longitude : googleFraming.center.lng;

            let pinColor = FORMATION_COLORS.MUTED;
            if (activeLayer === MAP_LAYERS.RISK) {
              pinColor = hub.riskLevel === 'Severe' ? '#ef4444' : hub.riskLevel === 'High' ? '#f97316' : hub.riskLevel === 'Medium' ? '#eab308' : '#10b981';
            } else if (activeLayer === MAP_LAYERS.REPORTING) {
              pinColor = hub.reportingPct === 100 ? '#10b981' : hub.reportingPct > 0 ? '#0891b2' : '#d97706';
            } else if (activeLayer === MAP_LAYERS.TURNOUT) {
              pinColor = hub.turnoutPct > 65 ? '#10b981' : hub.turnoutPct > 40 ? '#0284c7' : '#475569';
            } else {
              pinColor = hub.leadColor;
            }

            const primaryAgent = (agents || []).find((a) =>
              hub.streams.some((s) => s.id === a.assignedStationId)
            );

            const popupHtml = formatInfoWindowHtml(
              hub,
              { reportingPct: hub.reportingPct, streamsCount: hub.streamsCount, streams: hub.streams },
              { riskLevel: hub.riskLevel },
              primaryAgent
            );

            const marker = createLeafletPin({
              L,
              map: activeMap,
              position: { lat: Number(lat), lng: Number(lng) },
              title: `${hub.name} (${hub.streamsCount} streams)`,
              pinColor,
              streamsCount: hub.streamsCount,
              popupHtml,
              onClick: () => {
                setDrawerData({
                  region: hub,
                  level: 'Polling Centre Hub',
                  metrics: {
                    registeredVoters: hub.totalRegisteredVoters,
                    stationsCount: hub.streamsCount,
                    talliesCount: hub.talliesCount,
                    reportingPct: hub.reportingPct,
                    turnoutPct: hub.turnoutPct,
                    totalVotesCast: hub.totalVotesCast,
                    candAVotes: hub.candAVotes,
                    candBVotes: hub.candBVotes,
                    candCVotes: hub.candCVotes,
                    leader: hub.leader,
                    leadColor: pinColor,
                    margin: hub.margin
                  },
                  streams: hub.streams
                });
                setDrawerOpen(true);
              }
            });

            if (marker) leafletMarkersRef.current.push(marker);
          });
        };

        updateLeafletMarkers();
        moveEndHandler = updateLeafletMarkers;
        activeMap.on('moveend', moveEndHandler);
      })
      .catch((err) => {
        console.warn('[ElectoralMapRoom] Fallback map failed to initialize:', err);
      });

    return () => {
      isMounted = false;
      if (activeMap && moveEndHandler) {
        try { activeMap.off('moveend', moveEndHandler); } catch { /* ignore */ }
      }
      leafletMarkersRef.current.forEach((m) => {
        try { if (activeMap) activeMap.removeLayer(m); } catch { /* ignore */ }
      });
      leafletMarkersRef.current = [];
    };
  }, [useFallbackMap, leafletMapInstance, mapMode, isDark, activeLayer, pollingCentreHubs, constituencyHubs, selectedConstituency, googleFraming, agents]);

  // Handle saving API key in localStorage and persisting globally on server for admins
  const handleSaveApiKey = async () => {
    const key = apiKeyInput.trim();
    if (key) {
      setGoogleMapsApiKey(key);
      setApiKey(key);
      setAuthFailed(false);
      setMapLoadError(null);
      setShowKeyModal(false);
      setMapMode('google_hybrid');

      if (currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin') {
        try {
          await saveGoogleMapsApiKeyToServer(key);
        } catch (err) {
          console.warn('[ElectoralMapRoom] Failed to persist key to server:', err);
        }
      }
    }
  };

  const handleResetToNational = () => {
    if (!isNational) {
      // Re-frame strictly to user's assigned jurisdiction bounds
      if (googleMapInstance && googleFraming?.center) {
        googleMapInstance.panTo(googleFraming.center);
        googleMapInstance.setZoom(googleFraming.zoom);
      }
      if (leafletMapInstance && googleFraming?.center) {
        leafletMapInstance.setView(
          [googleFraming.center.lat, googleFraming.center.lng],
          googleFraming.zoom || 12,
          { animate: true }
        );
      }
      setDrawerOpen(false);
      return;
    }
    setSelectedCounty(null);
    setSelectedConstituency(null);
    setDrawerOpen(false);
    if (googleMapInstance) {
      googleMapInstance.setCenter({ lat: 0.0236, lng: 37.9062 });
      googleMapInstance.setZoom(6);
    }
    if (leafletMapInstance) {
      leafletMapInstance.setView([0.0236, 37.9062], 6, { animate: true });
    }
  };

  // Dynamically synchronize Google Maps roadmap styles with application theme
  useEffect(() => {
    if (!googleMapInstance) return;
    if (mapMode === 'google_roadmap') {
      const darkRoadmapStyles = [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
      ];
      googleMapInstance.setOptions({ styles: isDark ? darkRoadmapStyles : [] });
    } else {
      googleMapInstance.setOptions({ styles: [] });
    }
  }, [googleMapInstance, mapMode, isDark]);

  return (
    <div className={`map-room-container ${isDark ? 'dark' : 'light'}`}>
      {/* Top Bar with Map Mode, Layer Selector & Breadcrumbs */}
      <header className="map-room-toolbar">
        <div className="map-room-title">
          <MapIcon size={20} color="#10b981" />
          <div>
            <h2>Electoral Map Room</h2>
            <div className="map-room-breadcrumbs">
              {isNational ? (
                <button type="button" onClick={handleResetToNational}>
                  Kenya National
                </button>
              ) : (
                <span className="map-breadcrumb-locked" title="Strictly Gated Operational Scope">
                  <Lock size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  {userJurisdiction?.title || 'Operational Scope'} (Strictly Gated)
                </span>
              )}
              {selectedCounty && isNational && (
                <>
                  <ChevronRight size={12} />
                  <span>{selectedCounty.name}</span>
                </>
              )}
              {selectedConstituency && isNational && (
                <>
                  <ChevronRight size={12} />
                  <span>{selectedConstituency.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick County / Constituency Filter Dropdowns */}
          <div className="map-quick-filter">
            {isNational ? (
              <>
                <select
                  value={selectedCounty?.id || ''}
                  onChange={(e) => {
                    const cId = e.target.value;
                    if (!cId) {
                      handleResetToNational();
                    } else {
                      const found = (geography?.counties || []).find(c => c.id === cId);
                      if (found) {
                        setSelectedCounty(found);
                        setSelectedConstituency(null);
                      }
                    }
                  }}
                  className="map-filter-select"
                  title="Filter by County"
                >
                  <option value="">All 47 Counties</option>
                  {(geography?.counties || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {selectedCounty && (
                  <select
                    value={selectedConstituency?.id || ''}
                    onChange={(e) => {
                      const constId = e.target.value;
                      if (!constId) {
                        setSelectedConstituency(null);
                      } else {
                        const found = (geography?.constituencies || []).find(c => c.id === constId);
                        if (found) {
                          setSelectedConstituency(found);
                        }
                      }
                    }}
                    className="map-filter-select"
                    title="Filter by Constituency"
                  >
                    <option value="">All Constituencies</option>
                    {(geography?.constituencies || [])
                      .filter(c => c.countyId === selectedCounty.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                )}
              </>
            ) : (
              <>
                <select
                  disabled
                  value={userJurisdiction?.county?.id || ''}
                  className="map-filter-select is-locked"
                  title="Assigned County (Locked)"
                >
                  <option value={userJurisdiction?.county?.id || ''}>
                    {userJurisdiction?.county?.name || currentUser.county || 'Assigned County'} 🔒
                  </option>
                </select>

                {userJurisdiction?.constituency && (
                  <select
                    disabled
                    value={userJurisdiction?.constituency?.id || ''}
                    className="map-filter-select is-locked"
                    title="Assigned Constituency (Locked)"
                  >
                    <option value={userJurisdiction?.constituency?.id || ''}>
                      {userJurisdiction?.constituency?.name || currentUser.constituency || 'Assigned Constituency'} 🔒
                    </option>
                  </select>
                )}

                {userJurisdiction?.ward && (
                  <select
                    disabled
                    value={userJurisdiction?.ward?.id || ''}
                    className="map-filter-select is-locked"
                    title="Assigned Ward (Locked)"
                  >
                    <option value={userJurisdiction?.ward?.id || ''}>
                      {userJurisdiction?.ward?.name || currentUser.ward || 'Assigned Ward'} 🔒
                    </option>
                  </select>
                )}
              </>
            )}
          </div>
        </div>

        {/* Engine Switcher (Satellite vs Roadmap + Key Config) */}
        <div className="map-mode-selector">
          <button
            type="button"
            className={`map-mode-btn ${mapMode === 'google_hybrid' ? 'active' : ''}`}
            onClick={() => setMapMode('google_hybrid')}
            title="Satellite & Roads"
          >
            <Satellite size={14} />
            <span>Satellite / Hybrid</span>
          </button>
          <button
            type="button"
            className={`map-mode-btn ${mapMode === 'google_roadmap' ? 'active' : ''}`}
            onClick={() => setMapMode('google_roadmap')}
            title="Street Roadmap"
          >
            <Globe size={14} />
            <span>Roadmap</span>
          </button>
          <button
            type="button"
            className="map-mode-btn"
            onClick={() => {
              setApiKeyInput(apiKey || '');
              setShowKeyModal(true);
            }}
            title="Configure Google Maps API Key"
            aria-label="Configure Google Maps API Key"
          >
            <Key size={13} />
          </button>
        </div>

        {/* Intelligence Layer Selector */}
        <div className="map-layer-selector">
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === MAP_LAYERS.LEAD ? 'active' : ''}`}
            onClick={() => setActiveLayer(MAP_LAYERS.LEAD)}
          >
            <Vote size={14} />
            <span>Candidate Lead</span>
          </button>
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === MAP_LAYERS.TURNOUT ? 'active' : ''}`}
            onClick={() => setActiveLayer(MAP_LAYERS.TURNOUT)}
          >
            <Percent size={14} />
            <span>Turnout %</span>
          </button>
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === MAP_LAYERS.REPORTING ? 'active' : ''}`}
            onClick={() => setActiveLayer(MAP_LAYERS.REPORTING)}
          >
            <FileCheck2 size={14} />
            <span>Form 34A %</span>
          </button>
          <button
            type="button"
            className={`map-layer-btn ${activeLayer === MAP_LAYERS.RISK ? 'active' : ''}`}
            onClick={() => setActiveLayer(MAP_LAYERS.RISK)}
          >
            <AlertTriangle size={14} />
            <span>Risk Level</span>
          </button>
        </div>
      </header>

      {/* Main Map Canvas Area */}
      <div className="map-canvas-area" onMouseMove={handleMouseMove}>
        {/* Developer Diagnostics Banner on Google Maps Auth Failure */}
        {authFailed && (
          <div className="dev-diagnostic-banner">
            <div className="dev-diagnostic-content">
              <AlertTriangle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
              <div>
                <strong>Google Maps Platform Alert (Developer Diagnostics):</strong>
                <div>
                  Google returned &quot;This page can&apos;t load Google Maps correctly&quot;. Check HTTP Referrer restrictions in Google Cloud Console, ensure Maps JavaScript API is enabled, and verify billing status.
                </div>
              </div>
            </div>
            <div className="dev-diagnostic-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKeyModal(true)}
                style={{ background: 'rgba(255,255,255,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.5)', fontSize: '0.75rem' }}
              >
                Configure Key
              </button>
              <button
                type="button"
                onClick={() => setAuthFailed(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem', background: 'transparent', border: 'none', color: '#ffffff' }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Scoped Role Badge */}
        {(selectedConstituency || selectedCounty || currentUser?.assignedEntity) && (
          <div className="map-scope-badge">
            <Lock size={12} color="#10b981" />
            <span>
              Scope: {selectedConstituency ? selectedConstituency.name : (selectedCounty ? selectedCounty.name : (currentUser?.constituency || currentUser?.county || 'National'))} &bull; {pollingCentreHubs.length} Polling Centres ({scopedStations.length} Streams)
            </span>
          </div>
        )}

        {/* Authoritative Google Map Canvas */}
        <div
          ref={googleMapRef}
          className="google-map-canvas"
          style={{ display: useFallbackMap ? 'none' : 'block' }}
        />

        {/* Automatic Hybrid Satellite / OpenStreetMap Fallback Canvas */}
        <div
          ref={leafletMapRef}
          className="leaflet-map-canvas"
          style={{ display: useFallbackMap ? 'block' : 'none' }}
        />

        {/* Floating Legend */}
        <div className="map-legend">
          <div className="map-legend-title">
            {activeLayer === MAP_LAYERS.LEAD && 'Candidate Formations'}
            {activeLayer === MAP_LAYERS.TURNOUT && 'Voter Turnout %'}
            {activeLayer === MAP_LAYERS.REPORTING && 'Form 34A Submissions'}
            {activeLayer === MAP_LAYERS.RISK && 'Security & Discrepancy Risk'}
          </div>

          <div className="map-legend-scale">
            {activeLayer === MAP_LAYERS.LEAD && (
              <>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: FORMATION_COLORS.CAND_A }} />
                  <span>Candidate A (Gold)</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: FORMATION_COLORS.CAND_B }} />
                  <span>Candidate B (Cyan)</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: FORMATION_COLORS.CAND_C }} />
                  <span>Candidate C (Emerald)</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: FORMATION_COLORS.MUTED }} />
                  <span>Pending / Zero</span>
                </div>
              </>
            )}

            {activeLayer === MAP_LAYERS.TURNOUT && (
              <>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#1e293b' }} />
                  <span>0%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#475569' }} />
                  <span>&lt; 40%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#0284c7' }} />
                  <span>40 - 55%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#059669' }} />
                  <span>55 - 70%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#10b981' }} />
                  <span>70%+</span>
                </div>
              </>
            )}

            {activeLayer === MAP_LAYERS.REPORTING && (
              <>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#334155' }} />
                  <span>0%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#d97706' }} />
                  <span>1 - 35%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#0891b2' }} />
                  <span>35 - 70%</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#10b981' }} />
                  <span>100%</span>
                </div>
              </>
            )}

            {activeLayer === MAP_LAYERS.RISK && (
              <>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#10b981' }} />
                  <span>Low Risk</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#eab308' }} />
                  <span>Medium</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#f97316' }} />
                  <span>High Alert</span>
                </div>
                <div className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: '#ef4444' }} />
                  <span>Severe</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Slide-out Intelligence Drawer with Stream Breakdown */}
        {drawerOpen && drawerData && (
          <aside className="map-drawer">
            <div className="map-drawer-header">
              <div>
                <span className="map-drawer-tag">
                  {drawerData.level} &bull; {drawerData.region.streamsCount || 1} STREAM{(drawerData.region.streamsCount || 1) > 1 ? 'S' : ''}
                </span>
                <h3>{drawerData.region.name}</h3>
                {drawerData.region.code && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code: {drawerData.region.code}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="map-stat-tile">
              <div className="map-stat-label">Total Registered Voters</div>
              <div className="map-stat-value">
                {drawerData.metrics.registeredVoters.toLocaleString()}
              </div>
            </div>

            <div className="map-stat-tile">
              <div className="map-stat-label">Overall Turnout</div>
              <div className="map-stat-value" style={{ color: '#10b981' }}>
                {drawerData.metrics.turnoutPct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                {drawerData.metrics.totalVotesCast.toLocaleString()} votes cast across all streams
              </div>
            </div>

            <div className="map-stat-tile">
              <div className="map-stat-label">Form 34A Progress</div>
              <div className="map-stat-value" style={{ color: '#06b6d4' }}>
                {drawerData.metrics.reportingPct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                {drawerData.metrics.talliesCount} of {drawerData.metrics.stationsCount} streams transmitted
              </div>
            </div>

            <div className="map-stat-tile">
              <div className="map-stat-label">Leading Formation</div>
              <div className="map-stat-value" style={{ color: drawerData.metrics.leadColor }}>
                {drawerData.metrics.leader}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Margin: {drawerData.metrics.margin.toLocaleString()} votes
              </div>
            </div>

            {/* Individual Stream Rooms Breakdown */}
            {drawerData.streams && drawerData.streams.length > 1 && (
              <div className="map-stat-tile">
                <div className="map-stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={13} color="#10b981" />
                  <span>Stream Booths ({drawerData.streams.length})</span>
                </div>
                <div className="map-streams-list">
                  {drawerData.streams.map((s, idx) => (
                    <div key={s.id || idx} className="map-stream-row">
                      <span className="map-stream-badge">Stream {idx + 1}</span>
                      <span className="map-stream-code">{s.code}</span>
                      <span className="map-stream-voters">{Number(s.registeredVoters || 0).toLocaleString()} reg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="map-stat-tile">
              <div className="map-stat-label">Candidate Vote Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Candidate A:</span>
                  <strong>{drawerData.metrics.candAVotes.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Candidate B:</span>
                  <strong>{drawerData.metrics.candBVotes.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Candidate C:</span>
                  <strong>{drawerData.metrics.candCVotes.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="google-maps-setup-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configure Google Maps Key</h3>
              </div>
              <button type="button" onClick={() => setShowKeyModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.4rem' }}>
                <X size={14} />
              </button>
            </div>
            <p>
              Enter a valid Google Maps API Key with the <strong>Maps JavaScript API</strong> enabled to load live satellite imagery and GPS polling station pins:
            </p>
            <input
              type="text"
              className="google-maps-key-input"
              placeholder="Paste Google Maps API Key (AIzaSy...)"
              defaultValue={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <div className="google-maps-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveApiKey}
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setGoogleMapsApiKey('');
                    setApiKey('');
                    setShowKeyModal(false);
                  }}
                  style={{ color: '#ef4444' }}
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
