// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.5)
// Hierarchical Command War Room Component
// ====================================================================

import React, { useState } from 'react';
import './HierarchicalWarRoom.css';
import { getSystemMode, SYSTEM_MODES } from '../../utils/simulationEngine.js';

export const HierarchicalWarRoom = ({ user, onSelectModule }) => {
  const [currentLevel, setCurrentLevel] = useState('NATIONAL'); // NATIONAL -> COUNTY -> CONSTITUENCY -> WARD -> POLLING_CENTRE
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const systemMode = getSystemMode();

  const mockHierarchy = {
    counties: [
      { name: 'Nairobi County', coverage: 94.2, missingAgents: 12, incidents: 4, unstaffedStations: 8 },
      { name: 'Mombasa County', coverage: 91.8, missingAgents: 8, incidents: 2, unstaffedStations: 14 },
      { name: 'Kisumu County', coverage: 88.5, missingAgents: 15, incidents: 5, unstaffedStations: 21 },
      { name: 'Nakuru County', coverage: 96.8, missingAgents: 5, incidents: 1, unstaffedStations: 4 }
    ],
    constituencies: [
      { name: 'Westlands Constituency', coverage: 96.5, missingAgents: 3, incidents: 1, unstaffedStations: 2 },
      { name: 'Dagoretti North', coverage: 92.1, missingAgents: 4, incidents: 2, unstaffedStations: 3 },
      { name: 'Langata', coverage: 95.0, missingAgents: 2, incidents: 1, unstaffedStations: 1 }
    ],
    wards: [
      { name: 'Parklands/Highridge Ward', coverage: 98.0, missingAgents: 1, incidents: 1, unstaffedStations: 0 },
      { name: 'Kitisuru Ward', coverage: 94.5, missingAgents: 1, incidents: 0, unstaffedStations: 1 },
      { name: 'Karura Ward', coverage: 97.0, missingAgents: 1, incidents: 0, unstaffedStations: 1 }
    ]
  };

  const handleSelectCounty = (countyName) => {
    setSelectedCounty(countyName);
    setCurrentLevel('COUNTY');
  };

  const handleSelectConstituency = (constName) => {
    setSelectedConstituency(constName);
    setCurrentLevel('CONSTITUENCY');
  };

  const handleSelectWard = (wardName) => {
    setSelectedWard(wardName);
    setCurrentLevel('WARD');
  };

  const resetToNational = () => {
    setCurrentLevel('NATIONAL');
    setSelectedCounty(null);
    setSelectedConstituency(null);
    setSelectedWard(null);
  };

  return (
    <div className="hierarchical-warroom-container">
      {/* Header Bar */}
      <header className="hierarchical-header">
        <div>
          <div className="hierarchical-title">🏛️ HIERARCHICAL COMMAND WAR ROOM</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Multi-Tier Jurisdiction Drilldown & Operational Control</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onSelectModule && onSelectModule('ops_queue')}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            📋 Open Operations Inbox →
          </button>
        </div>
      </header>

      {/* Simulation Watermark Banner */}
      {systemMode !== SYSTEM_MODES.LIVE && (
        <div className="simulation-watermark-banner">
          🟣 SIMULATION MODE ACTIVE — REHEARSAL & TRAINING ENVIRONMENT (ISOLATED DATA)
        </div>
      )}

      {/* Drilldown Breadcrumb Selector */}
      <div className="drilldown-breadcrumbs">
        <span className="breadcrumb-crumb" onClick={resetToNational}>NATIONAL COMMAND</span>
        {selectedCounty && (
          <>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-crumb" onClick={() => setCurrentLevel('COUNTY')}>{selectedCounty}</span>
          </>
        )}
        {selectedConstituency && (
          <>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-crumb" onClick={() => setCurrentLevel('CONSTITUENCY')}>{selectedConstituency}</span>
          </>
        )}
        {selectedWard && (
          <>
            <span className="breadcrumb-separator">›</span>
            <span style={{ color: '#f8fafc' }}>{selectedWard}</span>
          </>
        )}
      </div>

      {/* Level View: NATIONAL */}
      {currentLevel === 'NATIONAL' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>SELECT COUNTY FOR DRILLDOWN</h3>
          <div className="hierarchical-tree-grid">
            {mockHierarchy.counties.map((c, i) => (
              <div key={i} className="tree-card" onClick={() => handleSelectCounty(c.name)}>
                <div className="tree-card-name">{c.name}</div>
                <div className="tree-card-stats">
                  <div className="tree-stat-item">Coverage: <strong style={{ color: '#10b981' }}>{c.coverage}%</strong></div>
                  <div className="tree-stat-item">Unstaffed: <strong style={{ color: '#ef4444' }}>{c.unstaffedStations}</strong></div>
                  <div className="tree-stat-item">Missing: <strong style={{ color: '#f59e0b' }}>{c.missingAgents}</strong></div>
                  <div className="tree-stat-item">Incidents: <strong style={{ color: '#ef4444' }}>{c.incidents}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level View: COUNTY */}
      {currentLevel === 'COUNTY' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>{selectedCounty} — CONSTITUENCY DRILLDOWN</h3>
          <div className="hierarchical-tree-grid">
            {mockHierarchy.constituencies.map((c, i) => (
              <div key={i} className="tree-card" onClick={() => handleSelectConstituency(c.name)}>
                <div className="tree-card-name">{c.name}</div>
                <div className="tree-card-stats">
                  <div className="tree-stat-item">Coverage: <strong style={{ color: '#10b981' }}>{c.coverage}%</strong></div>
                  <div className="tree-stat-item">Unstaffed: <strong style={{ color: '#ef4444' }}>{c.unstaffedStations}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level View: CONSTITUENCY */}
      {currentLevel === 'CONSTITUENCY' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>{selectedConstituency} — WARD DRILLDOWN</h3>
          <div className="hierarchical-tree-grid">
            {mockHierarchy.wards.map((w, i) => (
              <div key={i} className="tree-card" onClick={() => handleSelectWard(w.name)}>
                <div className="tree-card-name">{w.name}</div>
                <div className="tree-card-stats">
                  <div className="tree-stat-item">Coverage: <strong style={{ color: '#10b981' }}>{w.coverage}%</strong></div>
                  <div className="tree-stat-item">Unstaffed: <strong style={{ color: '#10b981' }}>{w.unstaffedStations}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level View: WARD */}
      {currentLevel === 'WARD' && (
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#10b981' }}>WARD OPERATIONAL STATIONS: {selectedWard}</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            All polling station streams in this ward are operational with active agents checked in.
          </p>
          <button
            onClick={() => onSelectModule && onSelectModule('exception_cmd')}
            style={{ padding: '10px 16px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            Inspect Ward Exception Desk →
          </button>
        </div>
      )}
    </div>
  );
};
