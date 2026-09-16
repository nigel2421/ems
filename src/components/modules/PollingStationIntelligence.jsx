import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { parsePollingStationsCSV } from '../../services/api';
import {
  Building2,
  Search,
  MapPin,
  Upload,
  Sliders,
  Map,
  BarChart3,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  MoreHorizontal
} from 'lucide-react';
import '../dashboards/DashboardShared.css';
import './PollingStationIntelligence.css';

const PAGE_SIZE = 5;

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const PollingStationIntelligence = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { geography, stationIntelligence, updateStationIntelligence, bulkImportPollingStations } = useData();

  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');
  const [page, setPage] = useState(1);
  const [showTools, setShowTools] = useState(false);

  const [editingStation, setEditingStation] = useState(null);
  const [intelForm, setIntelForm] = useState({
    partyAdvantageScore: 50,
    incumbencyScore: 50,
    oppositionStrength: 50,
    publicPerceptionRating: 3.5,
    competitorActivityLevel: 'Medium',
    strategicImportance: 'Medium',
    riskLevel: 'Low'
  });

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

  const locationByStationId = useMemo(() => {
    const counties = new Map((geography.counties || []).map((c) => [c.id, c.name]));
    const constituencies = new Map((geography.constituencies || []).map((c) => [c.id, c.name]));
    const wards = new Map((geography.wards || []).map((w) => [w.id, w.name]));

    const map = {};
    (geography.pollingStations || []).forEach((ps) => {
      const county = ps.county || counties.get(ps.countyId) || '';
      const constituency = ps.constituency || constituencies.get(ps.constituencyId) || '';
      const ward = ps.ward || wards.get(ps.wardId) || '';
      const village = ps.village || '';
      map[ps.id] = {
        county,
        constituency,
        ward,
        village,
        line: [county, constituency, ward].filter(Boolean).join(' · ') || 'Location unavailable',
        detail: village || null
      };
    });
    return map;
  }, [geography]);

  const filteredStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (geography.pollingStations || []).filter((ps) => {
      const intel = stationIntelligence[ps.id] || {};
      const location = locationByStationId[ps.id] || {};
      const matchesSearch =
        !term ||
        ps.name?.toLowerCase().includes(term) ||
        ps.code?.toLowerCase().includes(term) ||
        location.ward?.toLowerCase().includes(term) ||
        location.county?.toLowerCase().includes(term) ||
        location.constituency?.toLowerCase().includes(term) ||
        location.village?.toLowerCase().includes(term);
      const matchesCounty = !selectedCounty || ps.county === selectedCounty || ps.countyId === selectedCounty;
      const matchesRisk = !selectedRisk || intel.riskLevel === selectedRisk;
      const matchesImportance = !selectedImportance || intel.strategicImportance === selectedImportance;
      return matchesSearch && matchesCounty && matchesRisk && matchesImportance;
    });
  }, [
    geography.pollingStations,
    stationIntelligence,
    searchTerm,
    selectedCounty,
    selectedRisk,
    selectedImportance,
    locationByStationId
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCounty, selectedRisk, selectedImportance, activeTab]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStations.slice(start, start + PAGE_SIZE);
  }, [filteredStations, page]);

  const rangeStart = filteredStations.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredStations.length);

  const handleEditClick = (ps) => {
    const existing = stationIntelligence[ps.id] || {
      partyAdvantageScore: 60,
      incumbencyScore: 50,
      oppositionStrength: 40,
      publicPerceptionRating: 3.8,
      competitorActivityLevel: 'Medium',
      strategicImportance: 'Medium',
      riskLevel: 'Low'
    };
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
    filteredStations.forEach((ps) => {
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

  return (
    <div className="role-dash psi-shell">
      <header className="psi-top">
        <div>
          <h1>Polling intelligence</h1>
          <p>
            {formatCount(filteredStations.length)} matching · {formatCount(geography.pollingStations?.length || 0)} national
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
              <Map strokeWidth={1.75} />
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
        <select className="form-select" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
          <option value="">All counties</option>
          {(geography.counties || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
                  <th>Advantage</th>
                  <th>Risk</th>
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
                    const intel = stationIntelligence[ps.id] || {
                      partyAdvantageScore: 65,
                      riskLevel: 'Low'
                    };
                    const score = intel.partyAdvantageScore || 50;
                    const location = locationByStationId[ps.id] || {
                      line: 'Location unavailable',
                      detail: null,
                      county: '',
                      constituency: '',
                      ward: ''
                    };
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
                          <div className="psi-bar" title={`${score}%`}>
                            <div className="psi-bar-track">
                              <div
                                className="psi-bar-fill"
                                style={{
                                  width: `${score}%`,
                                  background: score >= 50 ? '#006B3F' : '#BB0A21'
                                }}
                              />
                            </div>
                            <span>{score}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={riskClass(intel.riskLevel || 'Low')}>{intel.riskLevel || 'Low'}</span>
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
              <span><i className="psi-dot low" /> Stronghold</span>
              <span><i className="psi-dot mid" /> Swing</span>
              <span><i className="psi-dot high" /> Severe</span>
            </div>
          </div>
          <div className="psi-map-grid">
            {pageStations.slice(0, 8).map((ps, idx) => {
              const intel = stationIntelligence[ps.id] || { riskLevel: 'Low', partyAdvantageScore: 65 };
              const risk = intel.riskLevel || 'Low';
              return (
                <button
                  key={ps.id}
                  type="button"
                  className={`psi-map-card risk-${risk.toLowerCase()}`}
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
            <h2>Advantage mix</h2>
            <div className="psi-stat-row">
              <div>
                <ShieldAlert strokeWidth={1.75} />
                <span>Stronghold</span>
              </div>
              <strong>65%</strong>
            </div>
            <div className="psi-stat-row">
              <div>
                <BarChart3 strokeWidth={1.75} />
                <span>Swing</span>
              </div>
              <strong>25%</strong>
            </div>
            <div className="psi-stat-row">
              <div>
                <Users strokeWidth={1.75} />
                <span>Opponent</span>
              </div>
              <strong>10%</strong>
            </div>
          </article>

          <article className="psi-panel">
            <h2>Risk bands</h2>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-low">Low</span>
              <strong>1,840</strong>
            </div>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-medium">Medium</span>
              <strong>420</strong>
            </div>
            <div className="psi-stat-row">
              <span className="psi-risk psi-risk-severe">Severe</span>
              <strong>18 wards</strong>
            </div>
          </article>
        </section>
      )}

      {editingStation && (
        <div className="admin-modal-overlay psi-modal-overlay" onClick={() => setEditingStation(null)}>
          <div className="admin-modal psi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Edit intelligence</h3>
                <p>
                  {editingStation.code} · {editingStation.name}
                </p>
              </div>
              <button
                type="button"
                className="psi-icon-action"
                onClick={() => setEditingStation(null)}
                aria-label="Close"
              >
                <X strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleSaveIntelligence} className="psi-form">
              <div className="form-group">
                <label className="form-label">Party advantage ({intelForm.partyAdvantageScore}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intelForm.partyAdvantageScore}
                  onChange={(e) => setIntelForm({ ...intelForm, partyAdvantageScore: Number(e.target.value) })}
                />
              </div>
              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Incumbency</label>
                  <input
                    type="number"
                    className="form-input"
                    value={intelForm.incumbencyScore}
                    onChange={(e) => setIntelForm({ ...intelForm, incumbencyScore: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Opposition</label>
                  <input
                    type="number"
                    className="form-input"
                    value={intelForm.oppositionStrength}
                    onChange={(e) => setIntelForm({ ...intelForm, oppositionStrength: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="psi-form-grid">
                <div className="form-group">
                  <label className="form-label">Competitor</label>
                  <select
                    className="form-select"
                    value={intelForm.competitorActivityLevel}
                    onChange={(e) => setIntelForm({ ...intelForm, competitorActivityLevel: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Risk</label>
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
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 44 }}>
                Save
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
                <p>{formatCount(filteredStations.length)} matching stations</p>
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
