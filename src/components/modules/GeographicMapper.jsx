import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { resolveJurisdiction, hasNationalGeographyAccess } from '../../utils/jurisdictionAnalytics';
import { MapPin, ChevronRight, X, Search, Layers, Building, Map, Lock, ShieldAlert } from 'lucide-react';

export const GeographicMapper = ({ onClose }) => {
  const { geography } = useData();
  const { currentUser } = useAuth();

  const isNational = hasNationalGeographyAccess(currentUser);
  const assignment = useMemo(() => resolveJurisdiction(currentUser, geography), [currentUser, geography]);

  // Initial geographic selections
  const defaultCountyId = !isNational && assignment.county?.id
    ? assignment.county.id
    : (geography.counties[0]?.id || '');

  const [selectedCounty, setSelectedCounty] = useState(defaultCountyId);

  // Available constituencies for selected county
  const countyConstituencies = useMemo(() => {
    const targetCounty = isNational ? selectedCounty : (assignment.county?.id || selectedCounty);
    return (geography.constituencies || []).filter(c => c.countyId === targetCounty);
  }, [geography, isNational, selectedCounty, assignment]);

  const isConstituencyLocked = !isNational && (assignment.level === 'constituency' || assignment.level === 'ward');
  const defaultConstId = isConstituencyLocked && assignment.constituency?.id
    ? assignment.constituency.id
    : (countyConstituencies[0]?.id || '');

  const [selectedConstituency, setSelectedConstituency] = useState(defaultConstId);
  const [selectedWard, setSelectedWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Available wards for selected constituency
  const availableWards = useMemo(() => {
    const targetConst = isConstituencyLocked ? (assignment.constituency?.id || selectedConstituency) : selectedConstituency;
    return (geography.wards || []).filter(w => w.constituencyId === targetConst);
  }, [geography, isConstituencyLocked, assignment, selectedConstituency]);

  // Stations scoped to current selection
  const scopedStations = useMemo(() => {
    return (geography.pollingStations || []).filter(ps => {
      // 1. County check if non-national
      if (!isNational && assignment.county?.id && ps.countyId && ps.countyId !== assignment.county.id) {
        return false;
      }
      // 2. Constituency check if constituency locked
      if (isConstituencyLocked && assignment.constituency?.id && ps.constituencyId && ps.constituencyId !== assignment.constituency.id) {
        return false;
      }
      // 3. Selection filters
      if (selectedWard) {
        return ps.wardId === selectedWard;
      }
      if (selectedConstituency) {
        return ps.constituencyId === selectedConstituency;
      }
      if (selectedCounty) {
        return ps.countyId === selectedCounty;
      }
      return true;
    });
  }, [geography, isNational, isConstituencyLocked, assignment, selectedCounty, selectedConstituency, selectedWard]);

  // Check if search matches out-of-scope stations
  const outOfScopeMatch = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 3 || isNational) return false;
    const term = searchTerm.toLowerCase().trim();
    const globalMatch = (geography.pollingStations || []).some(ps =>
      (ps.name && ps.name.toLowerCase().includes(term)) ||
      (ps.code && ps.code.toLowerCase().includes(term))
    );
    const localMatch = scopedStations.some(ps =>
      (ps.name && ps.name.toLowerCase().includes(term)) ||
      (ps.code && ps.code.toLowerCase().includes(term))
    );
    return globalMatch && !localMatch;
  }, [searchTerm, isNational, geography, scopedStations]);

  // Filtered stations for display
  const filteredPollingStations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return scopedStations;
    return scopedStations.filter(ps =>
      (ps.name && ps.name.toLowerCase().includes(term)) ||
      (ps.code && ps.code.toLowerCase().includes(term))
    );
  }, [scopedStations, searchTerm]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '900px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Map style={{ width: '22px', height: '22px', color: '#06b6d4' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>IEBC Administrative Geography Mapper</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isNational 
                  ? 'National Geography Browser · All 47 Counties'
                  : `Jurisdiction Gated: ${assignment.title || assignment.county?.name} (${assignment.label})`}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Drilldown Selectors */}
        <div className="responsive-form-grid" style={{ marginBottom: '1.25rem' }}>
          {/* County Selector / Locked Badge */}
          <div className="form-group">
            <label className="form-label">County Boundary</label>
            {isNational ? (
              <select className="form-select" value={selectedCounty} onChange={e => { setSelectedCounty(e.target.value); setSelectedConstituency(''); setSelectedWard(''); }}>
                {geography.counties.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Code: {c.code})</option>
                ))}
              </select>
            ) : (
              <div 
                className="locked-jurisdiction-badge"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#06b6d4',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Lock style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span>{assignment.county?.name || currentUser?.county} County 🔒 [Locked]</span>
              </div>
            )}
          </div>

          {/* Constituency Selector / Locked Badge */}
          <div className="form-group">
            <label className="form-label">Constituency</label>
            {isConstituencyLocked ? (
              <div 
                className="locked-jurisdiction-badge"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#06b6d4',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Lock style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span>{assignment.constituency?.name || currentUser?.constituency} Constituency 🔒 [Locked]</span>
              </div>
            ) : (
              <select 
                className="form-select" 
                value={selectedConstituency} 
                onChange={e => { setSelectedConstituency(e.target.value); setSelectedWard(''); }}
              >
                <option value="">All Constituencies ({countyConstituencies.length})</option>
                {countyConstituencies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Ward Selector */}
          <div className="form-group">
            <label className="form-label">Ward</label>
            <select className="form-select" value={selectedWard} onChange={e => setSelectedWard(e.target.value)}>
              <option value="">All Wards ({availableWards.length})</option>
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Access Denied Out-of-Scope Warning */}
        {outOfScopeMatch && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.825rem'
          }}>
            <ShieldAlert style={{ width: '18px', height: '18px', flexShrink: 0, color: '#ef4444' }} />
            <div>
              <strong>Access Denied:</strong> Polling stations matching &quot;{searchTerm}&quot; exist outside your assigned jurisdiction ({assignment.title || assignment.county?.name}). Data access is strictly restricted.
            </div>
          </div>
        )}

        {/* Polling Station Search & List */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder={`Search stations in ${assignment.title || 'selected area'} by name or stream code...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
        </div>

        <div className="custom-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>IEBC Stream Code</th>
                <th>Polling Station Name</th>
                <th>Registered Voters</th>
                <th>Assigned Agent</th>
              </tr>
            </thead>
            <tbody>
              {filteredPollingStations.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No polling stations found in this jurisdiction scope.
                  </td>
                </tr>
              ) : (
                filteredPollingStations.map(ps => (
                  <tr key={ps.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#06b6d4', fontWeight: '600' }}>{ps.code}</td>
                    <td style={{ fontWeight: '600' }}>{ps.name}</td>
                    <td>{ps.registeredVoters} voters</td>
                    <td>
                      {ps.agentAssigned ? (
                        <span className="status-pill approved">{ps.agentAssigned}</span>
                      ) : (
                        <span className="status-pill pending">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
