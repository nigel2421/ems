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
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  Users,
  Layers
} from 'lucide-react';
import '../dashboards/DashboardShared.css';
import './PollingStationIntelligence.css';

const PAGE_SIZE = 25;

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

  const filteredStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (geography.pollingStations || []).filter((ps) => {
      const intel = stationIntelligence[ps.id] || {};
      const matchesSearch =
        !term ||
        ps.name?.toLowerCase().includes(term) ||
        ps.code?.toLowerCase().includes(term) ||
        (ps.ward && String(ps.ward).toLowerCase().includes(term));
      const matchesCounty = !selectedCounty || ps.county === selectedCounty || ps.countyId === selectedCounty;
      const matchesRisk = !selectedRisk || intel.riskLevel === selectedRisk;
      const matchesImportance = !selectedImportance || intel.strategicImportance === selectedImportance;
      return matchesSearch && matchesCounty && matchesRisk && matchesImportance;
    });
  }, [geography.pollingStations, stationIntelligence, searchTerm, selectedCounty, selectedRisk, selectedImportance]);

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
      <header className="admin-page-head">
        <div>
          <h1>Polling intelligence</h1>
          <p>
            Station register, risk scores, and bulk operations across {formatCount(geography.pollingStations?.length || 0)} gazetted streams.
          </p>
        </div>
        <div className="admin-head-actions">
          <button
            type="button"
            className={`admin-btn ${activeTab === 'list' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setActiveTab('list')}
          >
            <Building2 strokeWidth={1.75} />
            Stations
          </button>
          <button
            type="button"
            className={`admin-btn ${activeTab === 'gis' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setActiveTab('gis')}
          >
            <Map strokeWidth={1.75} />
            Map
          </button>
          <button
            type="button"
            className={`admin-btn ${activeTab === 'analytics' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 strokeWidth={1.75} />
            Analytics
          </button>
          {canManage && (
            <>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowBulkImport(true)}>
                <Upload strokeWidth={1.75} />
                Import CSV
              </button>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowBulkUpdate(true)}>
                <Sliders strokeWidth={1.75} />
                Bulk update
              </button>
            </>
          )}
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Matching stations</span>
            <div className="admin-metric-icon"><Building2 strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(filteredStations.length)}</strong>
          <small>After search and filters</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>National register</span>
            <div className="admin-metric-icon"><Layers strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(geography.pollingStations?.length || 0)}</strong>
          <small>Total gazetted streams</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Counties</span>
            <div className="admin-metric-icon"><MapPin strokeWidth={1.75} /></div>
          </div>
          <strong>{formatCount(geography.counties?.length || 0)}</strong>
          <small>Coverage units</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Page size</span>
            <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
          </div>
          <strong>{PAGE_SIZE}</strong>
          <small>Stations per page</small>
        </article>
      </section>

      <article className="admin-card psi-filters">
        <div className="psi-search">
          <Search strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search by station name, code, or ward…"
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
          <option value="">All risk levels</option>
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
      </article>

      {activeTab === 'list' && (
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Gazetted polling stations</h2>
              <p>
                Showing {formatCount(rangeStart)}–{formatCount(rangeEnd)} of {formatCount(filteredStations.length)}
              </p>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Location</th>
                  <th>Voters</th>
                  <th>Party advantage</th>
                  <th>Competitor</th>
                  <th>Priority</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageStations.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="admin-empty">No stations match the current filters.</div>
                    </td>
                  </tr>
                ) : (
                  pageStations.map((ps) => {
                    const intel = stationIntelligence[ps.id] || {
                      partyAdvantageScore: 65,
                      competitorActivityLevel: 'Medium',
                      strategicImportance: 'Medium',
                      riskLevel: 'Low'
                    };
                    const score = intel.partyAdvantageScore || 50;
                    return (
                      <tr key={ps.id}>
                        <td>
                          <strong style={{ display: 'block' }}>{ps.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#6B756F' }}>Code {ps.code}</span>
                        </td>
                        <td>
                          <div>{ps.ward || '—'}</div>
                          <span style={{ fontSize: '0.75rem', color: '#6B756F' }}>{ps.village || '—'}</span>
                        </td>
                        <td>
                          <strong>{formatCount(ps.registeredVoters || 0)}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#006B3F' }}>
                            Turnout {ps.historicalTurnoutPct || 75}%
                          </div>
                        </td>
                        <td>
                          <div className="psi-bar">
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
                        <td>{intel.competitorActivityLevel || 'Medium'}</td>
                        <td>{intel.strategicImportance || 'Medium'}</td>
                        <td>
                          <span className={riskClass(intel.riskLevel || 'Low')}>{intel.riskLevel || 'Low'}</span>
                        </td>
                        <td>
                          <button type="button" className="admin-btn admin-btn-ghost" style={{ height: 34, padding: '0 0.7rem' }} onClick={() => handleEditClick(ps)}>
                            <Pencil strokeWidth={1.75} />
                            Edit
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
              Page {page} of {totalPages}
            </span>
            <div className="psi-pagination-controls">
              <button type="button" className="psi-page-btn" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
                <ChevronsLeft strokeWidth={1.75} />
              </button>
              <button type="button" className="psi-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                <ChevronLeft strokeWidth={1.75} />
              </button>
              <button type="button" className="psi-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">
                <ChevronRight strokeWidth={1.75} />
              </button>
              <button type="button" className="psi-page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">
                <ChevronsRight strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </article>
      )}

      {activeTab === 'gis' && (
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Spatial station view</h2>
              <p>Risk-coded stations from the current filter set (page sample)</p>
            </div>
            <div className="psi-legend">
              <span><i className="psi-dot low" /> Stronghold</span>
              <span><i className="psi-dot mid" /> Swing</span>
              <span><i className="psi-dot high" /> Severe</span>
            </div>
          </div>
          <div className="psi-map-grid">
            {pageStations.slice(0, 12).map((ps, idx) => {
              const intel = stationIntelligence[ps.id] || { riskLevel: 'Low', partyAdvantageScore: 65 };
              const risk = intel.riskLevel || 'Low';
              return (
                <div key={ps.id} className={`psi-map-card risk-${risk.toLowerCase()}`}>
                  <div className="psi-map-card-top">
                    <MapPin strokeWidth={1.75} />
                    <span>{ps.code}</span>
                  </div>
                  <strong>{ps.name}</strong>
                  <span>
                    GPS {-1.2676 - idx * 0.015}, {36.8111 + idx * 0.012}
                  </span>
                  <div className="psi-map-card-foot">
                    <span>Reg {formatCount(ps.registeredVoters || 0)}</span>
                    <span className={riskClass(risk)}>{risk}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      )}

      {activeTab === 'analytics' && (
        <section className="admin-grid-2">
          <article className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Party advantage mix</h2>
                <p>Strategic distribution snapshot</p>
              </div>
            </div>
            <div className="admin-list">
              <div className="admin-list-item">
                <div className="admin-metric-icon"><ShieldAlert strokeWidth={1.75} /></div>
                <div style={{ flex: 1 }}>
                  <strong>Stronghold stations (&gt;70%)</strong>
                  <div className="admin-progress">
                    <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: '65%' }} /></div>
                    <strong>65%</strong>
                  </div>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><BarChart3 strokeWidth={1.75} /></div>
                <div style={{ flex: 1 }}>
                  <strong>Swing stations (40–70%)</strong>
                  <div className="admin-progress">
                    <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: '25%', background: '#0E7A45' }} /></div>
                    <strong>25%</strong>
                  </div>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon"><Users strokeWidth={1.75} /></div>
                <div style={{ flex: 1 }}>
                  <strong>Opponent priority (&lt;40%)</strong>
                  <div className="admin-progress">
                    <div className="admin-progress-track"><div className="admin-progress-fill" style={{ width: '10%', background: '#BB0A21' }} /></div>
                    <strong>10%</strong>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Risk breakdown</h2>
                <p>Operational risk bands</p>
              </div>
            </div>
            <div className="admin-list">
              <div className="admin-list-item">
                <span className="psi-risk psi-risk-low">Low</span>
                <div><strong>1,840 stations</strong><span>Stable coverage</span></div>
              </div>
              <div className="admin-list-item">
                <span className="psi-risk psi-risk-medium">Medium</span>
                <div><strong>420 stations</strong><span>Watch list</span></div>
              </div>
              <div className="admin-list-item">
                <span className="psi-risk psi-risk-severe">Severe</span>
                <div><strong>18 wards</strong><span>Priority response</span></div>
              </div>
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
                <p>{editingStation.code} · {editingStation.name}</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost" style={{ height: 34, width: 34, padding: 0 }} onClick={() => setEditingStation(null)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleSaveIntelligence} className="psi-form">
              <div className="form-group">
                <label className="form-label">Party advantage ({intelForm.partyAdvantageScore}%)</label>
                <input type="range" min="0" max="100" value={intelForm.partyAdvantageScore} onChange={(e) => setIntelForm({ ...intelForm, partyAdvantageScore: Number(e.target.value) })} />
              </div>
              <div className="responsive-form-grid">
                <div className="form-group">
                  <label className="form-label">Incumbency score</label>
                  <input type="number" className="form-input" value={intelForm.incumbencyScore} onChange={(e) => setIntelForm({ ...intelForm, incumbencyScore: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opposition strength</label>
                  <input type="number" className="form-input" value={intelForm.oppositionStrength} onChange={(e) => setIntelForm({ ...intelForm, oppositionStrength: Number(e.target.value) })} />
                </div>
              </div>
              <div className="responsive-form-grid">
                <div className="form-group">
                  <label className="form-label">Competitor activity</label>
                  <select className="form-select" value={intelForm.competitorActivityLevel} onChange={(e) => setIntelForm({ ...intelForm, competitorActivityLevel: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Risk level</label>
                  <select className="form-select" value={intelForm.riskLevel} onChange={(e) => setIntelForm({ ...intelForm, riskLevel: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 46 }}>
                Save intelligence
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
                <h3>Bulk CSV import</h3>
                <p>Paste station rows to import</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost" style={{ height: 34, width: 34, padding: 0 }} onClick={() => setShowBulkImport(false)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>
            {importStatus && <div className="psi-notice">{importStatus}</div>}
            <form onSubmit={handleCSVImport} className="psi-form">
              <div className="form-group">
                <label className="form-label">CSV content</label>
                <textarea
                  rows={8}
                  className="form-input"
                  placeholder="Code,Name,County,Constituency,Ward,Village,RegisteredVoters,ActiveVoters,TurnoutPct"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 46 }}>
                <Upload strokeWidth={1.75} />
                Import stations
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
                <h3>Mass update</h3>
                <p>Apply to {formatCount(filteredStations.length)} matching stations</p>
              </div>
              <button type="button" className="admin-btn admin-btn-ghost" style={{ height: 34, width: 34, padding: 0 }} onClick={() => setShowBulkUpdate(false)} aria-label="Close">
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
                <label className="form-label">Strategic importance</label>
                <select className="form-select" value={bulkImportance} onChange={(e) => setBulkImportance(e.target.value)}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 46 }}>
                Apply update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
