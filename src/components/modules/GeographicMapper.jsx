import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MapPin, ChevronRight, X, Search, Layers, Building, Map } from 'lucide-react';

export const GeographicMapper = ({ onClose }) => {
  const { geography } = useData();
  const [selectedCounty, setSelectedCounty] = useState(geography.counties[0].id);
  const [selectedConstituency, setSelectedConstituency] = useState(geography.constituencies[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  const constituencies = geography.constituencies.filter(c => c.countyId === selectedCounty);
  const wards = geography.wards.filter(w => w.constituencyId === selectedConstituency);

  const filteredPollingStations = geography.pollingStations.filter(ps => {
    const matchesSearch = ps.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ps.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = wards.some(w => w.id === ps.wardId);
    return matchesSearch && matchesWard;
  });

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
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hierarchy: County ➔ Constituency ➔ Ward ➔ Polling Station</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Drilldown Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">County Selection</label>
            <select className="form-select" value={selectedCounty} onChange={e => setSelectedCounty(e.target.value)}>
              {geography.counties.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Code: {c.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Constituency Selection</label>
            <select className="form-select" value={selectedConstituency} onChange={e => setSelectedConstituency(e.target.value)}>
              {constituencies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Polling Station Search & List */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search polling station by name or IEBC stream code (e.g. 047/01/01/001)..."
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
              {filteredPollingStations.map(ps => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
