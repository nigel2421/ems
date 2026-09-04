import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { parsePollingStationsCSV } from '../../services/api';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Upload,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Layers,
  Map,
  BarChart3,
  Edit3
} from 'lucide-react';

export const PollingStationIntelligence = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { geography, stationIntelligence, updateStationIntelligence, bulkImportPollingStations } = useData();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'gis' | 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');

  // Editing single station intelligence modal
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

  // Bulk Import CSV State
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Bulk Update State
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkRisk, setBulkRisk] = useState('Medium');
  const [bulkImportance, setBulkImportance] = useState('High');

  // Filter polling stations
  const filteredStations = (geography.pollingStations || []).filter(ps => {
    const intel = stationIntelligence[ps.id] || {};
    const matchesSearch = ps.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ps.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ps.ward && ps.ward.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCounty = !selectedCounty || ps.county === selectedCounty || ps.countyId === selectedCounty;
    const matchesRisk = !selectedRisk || intel.riskLevel === selectedRisk;
    const matchesImportance = !selectedImportance || intel.strategicImportance === selectedImportance;
    return matchesSearch && matchesCounty && matchesRisk && matchesImportance;
  });

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
      setImportStatus(`Successfully imported ${parsed.length} polling stations!`);
      setTimeout(() => {
        setImportStatus('');
        setShowBulkImport(false);
        setCsvText('');
      }, 2000);
    } else {
      setImportStatus('Failed to parse CSV lines. Check format.');
    }
  };

  const handleBulkUpdate = (e) => {
    e.preventDefault();
    filteredStations.forEach(ps => {
      updateStationIntelligence(ps.id, {
        riskLevel: bulkRisk,
        strategicImportance: bulkImportance
      }, currentUser);
    });
    setShowBulkUpdate(false);
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case 'Severe': return 'status-pill rejected';
      case 'High': return 'status-pill mismatch';
      case 'Medium': return 'status-pill pending';
      case 'Low': return 'status-pill approved';
      default: return 'status-pill';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 style={{ width: '28px', height: '28px', color: '#6366f1' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Polling Station Intelligence Module</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Intelligence fields, Party Advantage, GIS Mapping, and CSV Bulk Operations across {geography.pollingStations?.length || 0} stations.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>
            <Building2 style={{ width: '15px', height: '15px' }} />
            <span>List & Intelligence</span>
          </button>
          <button className={`btn ${activeTab === 'gis' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('gis')}>
            <Map style={{ width: '15px', height: '15px' }} />
            <span>GIS Map View</span>
          </button>
          <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 style={{ width: '15px', height: '15px' }} />
            <span>Analytics Summary</span>
          </button>

          {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Strategy Team') && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowBulkImport(true)} title="Import Polling Stations CSV">
                <Upload style={{ width: '15px', height: '15px', color: '#06b6d4' }} />
                <span>Bulk CSV Import</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setShowBulkUpdate(true)} title="Mass update risk & strategic tags">
                <Sliders style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                <span>Bulk Update</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search by polling station name, code, ward, or village..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <select className="form-select" style={{ width: '160px', padding: '0.45rem' }} value={selectedRisk} onChange={e => setSelectedRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
          <option value="Severe">Severe Risk</option>
        </select>

        <select className="form-select" style={{ width: '180px', padding: '0.45rem' }} value={selectedImportance} onChange={e => setSelectedImportance(e.target.value)}>
          <option value="">All Strategic Priority</option>
          <option value="High">High Importance</option>
          <option value="Medium">Medium Importance</option>
          <option value="Low">Low Importance</option>
        </select>
      </div>

      {/* TAB 1: Polling Station Intelligence List */}
      {activeTab === 'list' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              Gazetted Polling Stations ({filteredStations.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredStations.length} matching stations
            </span>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Code & Station Name</th>
                  <th>Ward & Location</th>
                  <th>Voters (Turnout %)</th>
                  <th>Party Advantage</th>
                  <th>Competitor Activity</th>
                  <th>Strategic Importance</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.slice(0, 50).map(ps => {
                  const intel = stationIntelligence[ps.id] || {
                    partyAdvantageScore: 65,
                    competitorActivityLevel: 'Medium',
                    strategicImportance: 'Medium',
                    riskLevel: 'Low'
                  };
                  return (
                    <tr key={ps.id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{ps.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {ps.code}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{ps.ward || 'Westlands Ward'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ps.village || 'Village Central'}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <strong>{(ps.registeredVoters || 750).toLocaleString()}</strong> voters
                        <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Turnout: {ps.historicalTurnoutPct || 75}%</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${intel.partyAdvantageScore || 50}%`, height: '100%', background: intel.partyAdvantageScore > 50 ? '#10b981' : '#ef4444' }}></div>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>{intel.partyAdvantageScore || 50}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{intel.competitorActivityLevel || 'Medium'}</td>
                      <td style={{ fontSize: '0.82rem', fontWeight: '600' }}>{intel.strategicImportance || 'Medium'}</td>
                      <td>
                        <span className={getRiskBadgeClass(intel.riskLevel || 'Low')}>
                          {intel.riskLevel || 'Low'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(ps)}>
                          <Edit3 style={{ width: '13px', height: '13px' }} />
                          <span>Intel</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GIS Mapping View */}
      {activeTab === 'gis' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Interactive GIS Mapping Canvas</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Spatial intelligence representation of polling stations, risk heatmaps, and voter turnout metrics.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Stronghold</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Swing Ward</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f87171' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Severe Risk</span>
            </div>
          </div>

          {/* Interactive Simulated Map Grid */}
          <div 
            style={{
              height: '420px',
              borderRadius: '14px',
              background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              padding: '1.5rem'
            }}
          >
            {filteredStations.slice(0, 12).map((ps, idx) => {
              const intel = stationIntelligence[ps.id] || { riskLevel: 'Low', partyAdvantageScore: 65 };
              const color = intel.riskLevel === 'Severe' ? '#ef4444' : (intel.riskLevel === 'High' ? '#f97316' : '#10b981');

              return (
                <div
                  key={ps.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${color}`,
                    borderRadius: '12px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: `0 0 15px ${color}20`
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '800', color: color }}>
                      <MapPin style={{ width: '14px', height: '14px' }} />
                      <span>{ps.code}</span>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {ps.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      GPS: {-1.2676 - idx * 0.015}, {36.8111 + idx * 0.012}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span>Reg: {ps.registeredVoters || 750}</span>
                    <span style={{ fontWeight: '700', color: color }}>Risk: {intel.riskLevel || 'Low'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Analytics Summary */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>Party Advantage Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span>Stronghold Stations (&gt; 70% Advantage)</span>
                  <span style={{ fontWeight: '700', color: '#34d399' }}>65%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span>Competitive Swing Stations (40% - 70%)</span>
                  <span style={{ fontWeight: '700', color: '#fbbf24' }}>25%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '25%', height: '100%', background: '#f59e0b' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span>Opponent Priority Areas (&lt; 40%)</span>
                  <span style={{ fontWeight: '700', color: '#f87171' }}>10%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '10%', height: '100%', background: '#ef4444' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>Strategic Risk Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>Low Risk Stations</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399' }}>1,840</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fbbf24' }}>Medium Risk Stations</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24' }}>420</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f87171' }}>Severe Risk Wards</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171' }}>18</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Intelligence Score Modal */}
      {editingStation && (
        <div className="modal-overlay" onClick={() => setEditingStation(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Edit Intelligence Fields: {editingStation.code}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingStation(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <form onSubmit={handleSaveIntelligence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Party Advantage Score ({intelForm.partyAdvantageScore}%)</label>
                <input type="range" min="0" max="100" value={intelForm.partyAdvantageScore} onChange={e => setIntelForm({ ...intelForm, partyAdvantageScore: parseInt(e.target.value) })} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Incumbency Score</label>
                  <input type="number" className="form-input" value={intelForm.incumbencyScore} onChange={e => setIntelForm({ ...intelForm, incumbencyScore: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opposition Strength</label>
                  <input type="number" className="form-input" value={intelForm.oppositionStrength} onChange={e => setIntelForm({ ...intelForm, oppositionStrength: parseInt(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Competitor Activity</label>
                  <select className="form-select" value={intelForm.competitorActivityLevel} onChange={e => setIntelForm({ ...intelForm, competitorActivityLevel: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Risk Level</label>
                  <select className="form-select" value={intelForm.riskLevel} onChange={e => setIntelForm({ ...intelForm, riskLevel: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', marginTop: '0.5rem' }}>
                Save Intelligence Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkImport && (
        <div className="modal-overlay" onClick={() => setShowBulkImport(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Bulk Polling Station CSV Import</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBulkImport(false)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            {importStatus && (
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {importStatus}
              </div>
            )}

            <form onSubmit={handleCSVImport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Paste CSV Content (Code, Name, County, Constituency, Ward, Village, RegVoters, ActiveVoters, Turnout%)</label>
                <textarea 
                  rows={8}
                  className="form-input" 
                  placeholder={`Code,Name,County,Constituency,Ward,Village,RegisteredVoters,ActiveVoters,TurnoutPct\n001,Westlands Primary,Nairobi,Westlands,Westlands Ward,Kangemi,750,600,80.0\n002,Parklands Primary,Nairobi,Westlands,Parklands Ward,Highridge,820,680,82.9`}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                <Upload style={{ width: '16px', height: '16px' }} />
                <span>Parse & Execute Bulk Station Import</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="modal-overlay" onClick={() => setShowBulkUpdate(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Mass Update ({filteredStations.length} Stations)</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBulkUpdate(false)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <form onSubmit={handleBulkUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Set Risk Level for All Matching Stations</label>
                <select className="form-select" value={bulkRisk} onChange={e => setBulkRisk(e.target.value)}>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Severe">Severe Risk</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Set Strategic Importance</label>
                <select className="form-select" value={bulkImportance} onChange={e => setBulkImportance(e.target.value)}>
                  <option value="High">High Importance</option>
                  <option value="Medium">Medium Importance</option>
                  <option value="Low">Low Importance</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Apply Mass Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
