import React, { Component, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { parsePollingStationsCSV } from '../../services/api';
import {
  Building2,
  Search,
  MapPin,
  Upload,
  Sliders,
  Map as MapIcon,
  BarChart3,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  MoreHorizontal,
  Newspaper
} from 'lucide-react';
import {
  resolveJurisdiction,
  hasNationalGeographyAccess,
  filterStationsByJurisdiction
} from '../../utils/jurisdictionAnalytics';
import {
  KENYA_PARTIES,
  KENYA_COALITIONS,
  STREAM_TERRAIN,
  MOBILISATION_CHANNELS,
  ELECTION_RISK_HINTS,
  defaultKenyaIntel,
  terrainFromScore,
  formationBadgeClass
} from '../../data/kenyaPoliticalFormations';
import { KenyaPoliticalNewsPanel } from './KenyaPoliticalNewsPanel';
import '../dashboards/DashboardShared.css';
import './PollingStationIntelligence.css';

const PAGE_SIZE = 5;

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

class PsiErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="role-dash psi-shell">
          <div className="psi-panel">
            <h2>Polling intelligence unavailable</h2>
            <p className="psi-error-copy">{this.state.message}</p>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => this.setState({ hasError: false, message: '' })}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const resolveLocation = (ps, lookups) => {
  if (!ps) {
    return { county: '', constituency: '', ward: '', village: '', line: 'Location unavailable', detail: null };
  }

  const county = ps.county || lookups.counties.get(ps.countyId) || '';
  const constituency = ps.constituency || lookups.constituencies.get(ps.constituencyId) || '';
  const ward = ps.ward || lookups.wards.get(ps.wardId) || '';
  const village = ps.village || '';

  return {
    county,
    constituency,
    ward,
    village,
    line: [county, constituency, ward].filter(Boolean).join(' · ') || 'Location unavailable',
    detail: village || null
  };
};

const PollingStationIntelligenceInner = () => {
  const { currentUser } = useAuth();
  const { geography, stationIntelligence, updateStationIntelligence, bulkImportPollingStations } = useData();

  const counties = geography?.counties || [];
  const isNational = hasNationalGeographyAccess(currentUser);
  const assignment = useMemo(
    () => resolveJurisdiction(currentUser, geography),
    [currentUser, geography]
  );
  const defaultCountyId = isNational
    ? counties[0]?.id || ''
    : assignment.county?.id || counties[0]?.id || '';

  const [activeTab, setActiveTab] = useState('list');
  const [showNewsDrawer, setShowNewsDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState(defaultCountyId);
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');
  const [page, setPage] = useState(1);
  const [showTools, setShowTools] = useState(false);

  const [editingStation, setEditingStation] = useState(null);
  const [intelForm, setIntelForm] = useState(defaultKenyaIntel());

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkRisk, setBulkRisk] = useState('Medium');
  const [bulkImportance, setBulkImportance] = useState('High');

  const canManage =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Strategy Team';

  useEffect(() => {
    if (!isNational && assignment.county?.id) {
      setSelectedCounty(assignment.county.id);
      return;
    }
    if (isNational && !selectedCounty && defaultCountyId) {
      setSelectedCounty(defaultCountyId);
    }
  }, [isNational, assignment.county?.id, defaultCountyId, selectedCounty]);

  const geoLookups = useMemo(() => {
    const countyMap = new Map();
    const constituencyMap = new Map();
    const wardMap = new Map();

    counties.forEach((c) => {
      if (c?.id != null) countyMap.set(c.id, c.name || '');
    });
    (geography?.constituencies || []).forEach((c) => {
      if (c?.id != null) constituencyMap.set(c.id, c.name || '');
    });
    (geography?.wards || []).forEach((w) => {
      if (w?.id != null) wardMap.set(w.id, w.name || '');
    });

    return { counties: countyMap, constituencies: constituencyMap, wards: wardMap };
  }, [counties, geography?.constituencies, geography?.wards]);

  // Candidates only see stations inside their assignment; admins browse by county.
  const scopedStations = useMemo(() => {
    const list = geography?.pollingStations || [];
    if (!isNational) {
      return filterStationsByJurisdiction(list, assignment);
    }
    if (!selectedCounty) return [];
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const ps = list[i];
      if (ps && ps.countyId === selectedCounty) out.push(ps);
    }
    return out;
  }, [geography?.pollingStations, isNational, assignment, selectedCounty]);

  const filteredStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const intelMap = stationIntelligence || {};

    return scopedStations.filter((ps) => {
      const intel = intelMap[ps.id] || {};
      if (selectedRisk && intel.riskLevel !== selectedRisk) return false;
      if (selectedImportance && intel.strategicImportance !== selectedImportance) return false;

      if (!term) return true;

      if (ps.name?.toLowerCase().includes(term) || ps.code?.toLowerCase().includes(term)) {
        return true;
      }

      const location = resolveLocation(ps, geoLookups);
      return (
        location.ward.toLowerCase().includes(term) ||
        location.constituency.toLowerCase().includes(term) ||
        location.village.toLowerCase().includes(term)
      );
    });
  }, [scopedStations, stationIntelligence, searchTerm, selectedRisk, selectedImportance, geoLookups]);

  const analyticsSummary = useMemo(() => {
    const intelMap = stationIntelligence || {};
    let stronghold = 0;
    let swing = 0;
    let opponent = 0;
    const risks = { Low: 0, Medium: 0, High: 0, Severe: 0 };
    const formations = {};

    filteredStations.forEach((ps) => {
      const intel = { ...defaultKenyaIntel(), ...(intelMap[ps.id] || {}) };
      const score = Number(intel.partyAdvantageScore ?? 50);
      const terrain = intel.streamTerrain || terrainFromScore(score);
      if (terrain === 'Stronghold' || terrain === 'Lean') stronghold += 1;
      else if (terrain === 'Swing' || terrain === 'Contested') swing += 1;
      else opponent += 1;
      const risk = intel.riskLevel || 'Low';
      if (risks[risk] != null) risks[risk] += 1;
      else risks.Low += 1;
      const formation = intel.leadingFormation || 'Unmapped';
      formations[formation] = (formations[formation] || 0) + 1;
    });

    const total = filteredStations.length || 1;
    const topFormation = Object.entries(formations).sort((a, b) => b[1] - a[1])[0];
    return {
      strongholdPct: Math.round((stronghold / total) * 100),
      swingPct: Math.round((swing / total) * 100),
      opponentPct: Math.round((opponent / total) * 100),
      risks,
      topFormation: topFormation ? topFormation[0] : '—',
      topFormationCount: topFormation ? topFormation[1] : 0
    };
  }, [filteredStations, stationIntelligence]);

  const totalPages = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCounty, selectedRisk, selectedImportance, activeTab, assignment.level, assignment.title]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStations.slice(start, start + PAGE_SIZE);
  }, [filteredStations, page]);

  const rangeStart = filteredStations.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredStations.length);
  const selectedCountyName = geoLookups.counties.get(selectedCounty) || 'Selected county';
  const scopeLabel = isNational
    ? selectedCountyName
    : assignment.title || selectedCountyName;
  const scopeSubtitle = isNational
    ? `${formatCount(filteredStations.length)} matching · ${formatCount(geography.pollingStations.length)} national`
    : `${formatCount(filteredStations.length)} stations in your ${String(assignment.label || 'area').toLowerCase()} · ${assignment.county?.name || ''}${
        assignment.constituency ? ` · ${assignment.constituency.name}` : ''
      }${assignment.ward ? ` · ${assignment.ward.name}` : ''}`;
  const countyOptions = isNational
    ? counties
    : counties.filter((c) => c.id === assignment.county?.id);

  const handleEditClick = (ps) => {
    const existing = {
      ...defaultKenyaIntel(),
      ...(stationIntelligence?.[ps.id] || {})
    };
    if (!existing.streamTerrain) {
      existing.streamTerrain = terrainFromScore(existing.partyAdvantageScore);
    }
    setEditingStation(ps);
    setIntelForm(existing);
  };

  const handleSaveIntelligence = (e) => {
    e.preventDefault();
    if (!editingStation) return;
    updateStationIntelligence(editingStation.id, intelForm, currentUser);
    setEditingStation(null);
  };

  const handleCSVImport = (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    const parsed = parsePollingStationsCSV(csvText);
    if (parsed.length > 0) {
      bulkImportPollingStations(parsed, currentUser);
      setImportStatus(`Successfully imported ${parsed.length} polling stations.`);
      setTimeout(() => {
        setImportStatus('');
        setShowBulkImport(false);
        setCsvText('');
      }, 2000);
    } else {
      setImportStatus('Failed to parse CSV. Check the format.');
    }
  };

  const handleBulkUpdate = (e) => {
    e.preventDefault();
    // Cap updates to keep the UI responsive.
    filteredStations.slice(0, 250).forEach((ps) => {
      updateStationIntelligence(
        ps.id,
        { riskLevel: bulkRisk, strategicImportance: bulkImportance },
        currentUser
      );
    });
    setShowBulkUpdate(false);
  };

  const riskClass = (risk) => {
    switch (risk) {
      case 'Severe':
        return 'psi-risk psi-risk-severe';
      case 'High':
        return 'psi-risk psi-risk-high';
      case 'Medium':
        return 'psi-risk psi-risk-medium';
      default:
        return 'psi-risk psi-risk-low';
    }
  };

  if (!geography || !Array.isArray(geography.pollingStations)) {
    return (
      <div className="role-dash psi-shell">
        <div className="psi-panel">
          <h2>Loading polling register…</h2>
          <p className="psi-error-copy">Geography data is not ready yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dash psi-shell">
      <header className="psi-top">
        <div>
          <h1>Polling intelligence</h1>
          <p>
            {scopeLabel}: {scopeSubtitle}. Kenyan party and coalition lean, Form 34A risk, and GOTV priority by
            gazetted stream.
          </p>
        </div>

        <div className="psi-top-right">
          <div className="psi-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              className={activeTab === 'list' ? 'is-active' : ''}
              onClick={() => setActiveTab('list')}
            >
              <Building2 strokeWidth={1.75} />
              Stations
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'gis'}
              className={activeTab === 'gis' ? 'is-active' : ''}
              onClick={() => setActiveTab('gis')}
            >
              <MapIcon strokeWidth={1.75} />
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'analytics'}
              className={activeTab === 'analytics' ? 'is-active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 strokeWidth={1.75} />
              Analytics
            </button>
          </div>

          {canManage && (
            <div className="psi-tools">
              <button
                type="button"
                className="psi-tools-toggle"
                aria-expanded={showTools}
                onClick={() => setShowTools((v) => !v)}
              >
                <MoreHorizontal strokeWidth={1.75} />
                Tools
              </button>
              {showTools && (
                <div className="psi-tools-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTools(false);
                      setShowBulkImport(true);
                    }}
                  >
                    <Upload strokeWidth={1.75} />
                    Import CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTools(false);
                      setShowBulkUpdate(true);
                    }}
                  >
                    <Sliders strokeWidth={1.75} />
                    Bulk update
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="psi-toolbar">
        <div className="psi-search">
          <Search strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search station, code, or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={selectedCounty}
          onChange={(e) => {
            if (!isNational) return;
            setSelectedCounty(e.target.value);
          }}
          disabled={!isNational}
          title={isNational ? 'Select county' : `Locked to your ${String(assignment.label || 'assignment').toLowerCase()}`}
          required
        >
          {countyOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {isNational ? c.name : scopeLabel}
            </option>
          ))}
        </select>
        <select className="form-select" value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)}>
          <option value="">All risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Severe">Severe</option>
        </select>
        <select className="form-select" value={selectedImportance} onChange={(e) => setSelectedImportance(e.target.value)}>
          <option value="">All priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {activeTab === 'list' && (
        <article className="psi-panel">
          <div className="custom-table-container psi-table-wrap">
            <table className="custom-table psi-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Location</th>
                  <th>Voters</th>
                  <th>Formation lean</th>
                  <th>Election risk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageStations.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-empty">No stations match the current filters.</div>
                    </td>
                  </tr>
                ) : (
                  pageStations.map((ps) => {
                    const intel = {
                      ...defaultKenyaIntel(),
                      ...(stationIntelligence?.[ps.id] || {})
                    };
                    const score = Number(intel.partyAdvantageScore ?? 50);
                    const terrain = intel.streamTerrain || terrainFromScore(score);
                    const location = resolveLocation(ps, geoLookups);
                    return (
                      <tr key={ps.id}>
                        <td>
                          <strong className="psi-station-name">{ps.name}</strong>
                          <span className="psi-meta">{ps.code}</span>
                        </td>
                        <td>
                          <span className="psi-loc">{location.line}</span>
                          {location.detail ? <span className="psi-meta">{location.detail}</span> : null}
                        </td>
                        <td>
                          <strong>{formatCount(ps.registeredVoters || 0)}</strong>
                        </td>
                        <td>
                          <div className="psi-formation-cell">
                            <span className={formationBadgeClass(intel.leadingFormation)}>
                              {intel.leadingFormation || '—'}
                            </span>
                            <span className="psi-meta">
                              vs {intel.rivalFormation || 'rival'} · {terrain}
                            </span>
                            <div className="psi-bar" title={`${score}% formation lean`}>
                              <div className="psi-bar-track">
                                <div
                                  className="psi-bar-fill"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, score))}%`,
                                    background: score >= 50 ? '#006B3F' : '#BB0A21'
                                  }}
                                />
                              </div>
                              <span>{score}%</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={riskClass(intel.riskLevel || 'Low')}>{intel.riskLevel || 'Low'}</span>
                          <span className="psi-meta">{ELECTION_RISK_HINTS[intel.riskLevel || 'Low']}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="psi-icon-action"
                            onClick={() => handleEditClick(ps)}
                            aria-label={`Edit ${ps.name}`}
                          >
                            <Pencil strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="psi-pagination">
            <span>
              {formatCount(rangeStart)}–{formatCount(rangeEnd)} of {formatCount(filteredStations.length)}
            </span>
            <div className="psi-pagination-controls">
              <button
                type="button"
                className="psi-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft strokeWidth={1.75} />
              </button>
              <span className="psi-page-label">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                className="psi-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </article>
      )}

      {activeTab === 'gis' && (
        <article className="psi-panel">
          <div className="psi-panel-head">
            <h2>Spatial sample</h2>
            <div className="psi-legend">
              <span><i className="psi-dot low" /> Stronghold / lean</span>
              <span><i className="psi-dot mid" /> Swing ward</span>
              <span><i className="psi-dot high" /> Hostile / severe risk</span>
            </div>
          </div>
          <div className="psi-map-grid">
            {pageStations.slice(0, 8).map((ps, idx) => {
              const intel = stationIntelligence?.[ps.id] || { riskLevel: 'Low' };
              const risk = intel.riskLevel || 'Low';
              return (
                <button
                  key={ps.id}
                  type="button"
                  className={`psi-map-card risk-${String(risk).toLowerCase()}`}
                  onClick={() => handleEditClick(ps)}
                >
                  <div className="psi-map-card-top">
                    <MapPin strokeWidth={1.75} />
                    <span>{ps.code}</span>
                  </div>
                  <strong>{ps.name}</strong>
                  <span>
                    {-1.2676 - idx * 0.015}, {36.8111 + idx * 0.012}
                  </span>
                  <div className="psi-map-card-foot">
                    <span>{formatCount(ps.registeredVoters || 0)} voters</span>
                    <span className={riskClass(risk)}>{risk}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </article>
      )}

      {activeTab === 'analytics' && (
        <section className="psi-analytics">
          <article className="psi-panel">
            <h2>Stream terrain mix</h2>
            <p className="psi-error-copy" style={{ marginTop: 0 }}>
              Based on {formatCount(filteredStations.length)} gazetted streams in {scopeLabel}
            </p>
            <div className="psi-stat-row">
              <div>
                <ShieldAlert strokeWidth={1.75} />
                <span>Stronghold / lean</span>
              </div>
              <strong>{analyticsSummary.strongholdPct}%</strong>
            </div>
            <div className="psi-stat-row">
              <div>
                <BarChart3 strokeWidth={1.75} />
                <span>Swing / contested</span>
              </div>
              <strong>{analyticsSummary.swingPct}%</strong>
            </div>
            <div className="psi-stat-row">
              <div>
                <Users strokeWidth={1.75} />
                <span>Hostile / opposition</span>
              </div>
              <strong>{analyticsSummary.opponentPct}%</strong>
            </div>
            <div className="psi-stat-row">
              <div>
                <Building2 strokeWidth={1.75} />
                <span>Leading formation</span>
              </div>
              <strong>
                {analyticsSummary.topFormation}{' '}
                <span className="psi-meta">({formatCount(analyticsSummary.topFormationCount)})</span>
              </strong>
            </div>
          </article>

          <article className="psi-panel">
            <h2>Election-day risk bands</h2>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-low">Low</span>
              <strong>{formatCount(analyticsSummary.risks.Low)}</strong>
            </div>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-medium">Medium</span>
              <strong>{formatCount(analyticsSummary.risks.Medium)}</strong>
            </div>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-high">High</span>
              <strong>{formatCount(analyticsSummary.risks.High)}</strong>
            </div>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-severe">Severe</span>
              <strong>{formatCount(analyticsSummary.risks.Severe)}</strong>
            </div>
          </article>
        </section>
      )}

      <button
        type="button"
        className={`psi-news-fab${showNewsDrawer ? ' is-open' : ''}`}
        onClick={() => setShowNewsDrawer(true)}
        aria-label="Open Kenya political news"
      >
        <Newspaper strokeWidth={1.75} />
        <span>News</span>
        <em>24h</em>
      </button>

      {showNewsDrawer && (
        <div className="psi-news-drawer-overlay" onClick={() => setShowNewsDrawer(false)}>
          <aside
            className="psi-news-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Kenya political news last 24 hours"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="psi-news-drawer-bar">
              <div>
                <strong>Political news</strong>
                <span>Mainstream Kenya · last 24 hours</span>
              </div>
              <button
                type="button"
                className="psi-icon-action"
                onClick={() => setShowNewsDrawer(false)}
                aria-label="Close news"
              >
                <X strokeWidth={1.75} />
              </button>
            </div>
            <div className="psi-news-drawer-body">
              <KenyaPoliticalNewsPanel />
            </div>
          </aside>
        </div>
      )}

      {editingStation && (
        <div className="admin-modal-overlay psi-modal-overlay" onClick={() => setEditingStation(null)}>
          <div className="admin-modal psi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Kenya stream intelligence</h3>
                <p>
                  {editingStation.code} · {editingStation.name}
                </p>
              </div>
              <button type="button" className="psi-icon-action" onClick={() => setEditingStation(null)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleSaveIntelligence} className="psi-form">
              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Leading party / formation</label>
                  <select
                    className="form-select"
                    value={intelForm.leadingFormation}
                    onChange={(e) => setIntelForm({ ...intelForm, leadingFormation: e.target.value })}
                  >
                    {KENYA_PARTIES.map((party) => (
                      <option key={party} value={party}>
                        {party}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Main rival formation</label>
                  <select
                    className="form-select"
                    value={intelForm.rivalFormation}
                    onChange={(e) => setIntelForm({ ...intelForm, rivalFormation: e.target.value })}
                  >
                    {KENYA_PARTIES.map((party) => (
                      <option key={party} value={party}>
                        {party}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Coalition lean</label>
                  <select
                    className="form-select"
                    value={intelForm.coalitionLean}
                    onChange={(e) => setIntelForm({ ...intelForm, coalitionLean: e.target.value })}
                  >
                    {KENYA_COALITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Stream terrain</label>
                  <select
                    className="form-select"
                    value={intelForm.streamTerrain}
                    onChange={(e) => setIntelForm({ ...intelForm, streamTerrain: e.target.value })}
                  >
                    {STREAM_TERRAIN.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Our formation lean ({intelForm.partyAdvantageScore}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intelForm.partyAdvantageScore}
                  onChange={(e) => {
                    const partyAdvantageScore = Number(e.target.value);
                    setIntelForm({
                      ...intelForm,
                      partyAdvantageScore,
                      streamTerrain: terrainFromScore(partyAdvantageScore)
                    });
                  }}
                />
              </div>

              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Incumbency hold</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={intelForm.incumbencyScore}
                    onChange={(e) => setIntelForm({ ...intelForm, incumbencyScore: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rival strength</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={intelForm.oppositionStrength}
                    onChange={(e) => setIntelForm({ ...intelForm, oppositionStrength: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Rival activity on ground</label>
                  <select
                    className="form-select"
                    value={intelForm.competitorActivityLevel}
                    onChange={(e) => setIntelForm({ ...intelForm, competitorActivityLevel: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Azimio/KK surge)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Election-day risk</label>
                  <select
                    className="form-select"
                    value={intelForm.riskLevel}
                    onChange={(e) => setIntelForm({ ...intelForm, riskLevel: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">GOTV / nomination priority</label>
                  <select
                    className="form-select"
                    value={intelForm.strategicImportance}
                    onChange={(e) => setIntelForm({ ...intelForm, strategicImportance: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Primary mobilisation channel</label>
                  <select
                    className="form-select"
                    value={intelForm.mobilisationChannel}
                    onChange={(e) => setIntelForm({ ...intelForm, mobilisationChannel: e.target.value })}
                  >
                    {MOBILISATION_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="psi-error-copy">{ELECTION_RISK_HINTS[intelForm.riskLevel] || ''}</p>

              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 44 }}>
                Save stream intelligence
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="admin-modal-overlay psi-modal-overlay" onClick={() => setShowBulkImport(false)}>
          <div className="admin-modal psi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Import CSV</h3>
                <p>Paste station rows</p>
              </div>
              <button type="button" className="psi-icon-action" onClick={() => setShowBulkImport(false)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>
            {importStatus && <div className="psi-notice">{importStatus}</div>}
            <form onSubmit={handleCSVImport} className="psi-form">
              <div className="form-group">
                <label className="form-label">CSV content</label>
                <textarea
                  rows={6}
                  className="form-input"
                  placeholder="Code,Name,County,Constituency,Ward,Village,RegisteredVoters,ActiveVoters,TurnoutPct"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 44 }}>
                <Upload strokeWidth={1.75} />
                Import
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkUpdate && (
        <div className="admin-modal-overlay psi-modal-overlay" onClick={() => setShowBulkUpdate(false)}>
          <div className="admin-modal psi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Bulk update</h3>
                <p>
                  Applies to up to 250 of {formatCount(filteredStations.length)} matching stations in {scopeLabel}
                </p>
              </div>
              <button type="button" className="psi-icon-action" onClick={() => setShowBulkUpdate(false)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleBulkUpdate} className="psi-form">
              <div className="form-group">
                <label className="form-label">Risk level</label>
                <select className="form-select" value={bulkRisk} onChange={(e) => setBulkRisk(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={bulkImportance} onChange={(e) => setBulkImportance(e.target.value)}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 44 }}>
                Apply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const PollingStationIntelligence = () => (
  <PsiErrorBoundary>
    <PollingStationIntelligenceInner />
  </PsiErrorBoundary>
);
