// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Contest-Aware Geographic Scope Gating & Smart Location Sieve Component
// ====================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { resolveEffectiveGeographicScope } from '../../utils/scopeResolver.js';

export const ScopedLocationSieve = ({
  user = null,
  campaign = null,
  contest = null,
  geography = { counties: [], constituencies: [], wards: [], pollingStations: [] },
  onSelectionChange = null,
  purpose = 'Location Selection',
  className = ''
}) => {
  // 1. Resolve Effective Scope
  const effectiveScope = useMemo(() => {
    return resolveEffectiveGeographicScope({
      authenticatedUser: user,
      campaign,
      contest
    });
  }, [user, campaign, contest]);

  // 2. Active Selection State
  const [selectedCountyId, setSelectedCountyId] = useState('');
  const [selectedConstituencyId, setSelectedConstituencyId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedCentreName, setSelectedCentreName] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');

  // 3. Sync initial locked levels into selection state when effective scope resolves
  useEffect(() => {
    if (!effectiveScope.isConfigured || effectiveScope.failClosed) return;

    const locked = effectiveScope.locked || {};

    if (locked.county && Array.isArray(geography.counties)) {
      const matchCounty = geography.counties.find(
        c => c.name.toLowerCase().includes(locked.county.toLowerCase()) ||
             locked.county.toLowerCase().includes(c.name.toLowerCase()) ||
             c.id === locked.county
      );
      if (matchCounty) {
        setSelectedCountyId(matchCounty.id);
      }
    }

    if (locked.constituency && Array.isArray(geography.constituencies)) {
      const matchConst = geography.constituencies.find(
        c => c.name.toLowerCase().includes(locked.constituency.toLowerCase()) ||
             locked.constituency.toLowerCase().includes(c.name.toLowerCase()) ||
             c.id === locked.constituency
      );
      if (matchConst) {
        setSelectedConstituencyId(matchConst.id);
      }
    }

    if (locked.ward && Array.isArray(geography.wards)) {
      const matchWard = geography.wards.find(
        w => w.name.toLowerCase().includes(locked.ward.toLowerCase()) ||
             locked.ward.toLowerCase().includes(w.name.toLowerCase()) ||
             w.id === locked.ward
      );
      if (matchWard) {
        setSelectedWardId(matchWard.id);
      }
    }
  }, [effectiveScope, geography]);

  // Strictly filter constituencies belonging ONLY to selected or locked county
  const availableConstituencies = useMemo(() => {
    const lockedCounty = effectiveScope.locked?.county;
    if (!selectedCountyId && !lockedCounty) return geography.constituencies || [];

    const activeCountyObj = (geography.counties || []).find(
      c => c.id === selectedCountyId || (lockedCounty && (c.name.toLowerCase().includes(lockedCounty.toLowerCase()) || lockedCounty.toLowerCase().includes(c.name.toLowerCase())))
    );

    const targetCountyId = activeCountyObj?.id || selectedCountyId || lockedCounty;

    return (geography.constituencies || []).filter(c => {
      if (activeCountyObj && c.countyId === activeCountyObj.id) return true;
      if (c.countyId === targetCountyId) return true;
      if (lockedCounty && c.countyName && (c.countyName.toLowerCase().includes(lockedCounty.toLowerCase()) || lockedCounty.toLowerCase().includes(c.countyName.toLowerCase()))) return true;
      return false;
    });
  }, [geography, selectedCountyId, effectiveScope]);

  // Strictly filter wards belonging ONLY to selected or locked constituency
  const availableWards = useMemo(() => {
    const lockedConst = effectiveScope.locked?.constituency;
    if (!selectedConstituencyId && !lockedConst) return [];

    const activeConstObj = (geography.constituencies || []).find(
      c => c.id === selectedConstituencyId || (lockedConst && (c.name.toLowerCase().includes(lockedConst.toLowerCase()) || lockedConst.toLowerCase().includes(c.name.toLowerCase())))
    );

    const targetConstId = activeConstObj?.id || selectedConstituencyId || lockedConst;

    return (geography.wards || []).filter(w => {
      if (activeConstObj && w.constituencyId === activeConstObj.id) return true;
      if (w.constituencyId === targetConstId) return true;
      if (lockedConst && w.constituencyName && (w.constituencyName.toLowerCase().includes(lockedConst.toLowerCase()) || lockedConst.toLowerCase().includes(w.constituencyName.toLowerCase()))) return true;
      return false;
    });
  }, [geography, selectedConstituencyId, effectiveScope]);

  // Strictly filter polling stations belonging ONLY to selected or locked ward
  const availableStations = useMemo(() => {
    const lockedWard = effectiveScope.locked?.ward;
    if (!selectedWardId && !lockedWard) return [];

    const activeWardObj = (geography.wards || []).find(
      w => w.id === selectedWardId || (lockedWard && (w.name.toLowerCase().includes(lockedWard.toLowerCase()) || lockedWard.toLowerCase().includes(w.name.toLowerCase())))
    );

    const targetWardId = activeWardObj?.id || selectedWardId || lockedWard;

    return (geography.pollingStations || []).filter(ps => {
      if (activeWardObj && ps.wardId === activeWardObj.id) return true;
      if (ps.wardId === targetWardId) return true;
      if (lockedWard && ps.wardName && (ps.wardName.toLowerCase().includes(lockedWard.toLowerCase()) || lockedWard.toLowerCase().includes(ps.wardName.toLowerCase()))) return true;
      return false;
    });
  }, [geography, selectedWardId, effectiveScope]);

  // Group polling stations into distinct Polling Centres if present
  const availableCentres = useMemo(() => {
    const centreMap = new Map();
    availableStations.forEach(st => {
      const centreName = st.centreName || st.pollingCentre || st.name?.replace(/\s*(Stream|Strm|Rm)\s*\d+$/i, '') || st.name;
      if (!centreMap.has(centreName)) {
        centreMap.set(centreName, []);
      }
      centreMap.get(centreName).push(st);
    });
    return Array.from(centreMap.entries()).map(([name, stations]) => ({ name, stations }));
  }, [availableStations]);

  // Stations for currently selected Polling Centre
  const centreFilteredStations = useMemo(() => {
    if (!selectedCentreName) return availableStations;
    const matchGroup = availableCentres.find(c => c.name === selectedCentreName);
    return matchGroup ? matchGroup.stations : availableStations;
  }, [availableStations, availableCentres, selectedCentreName]);

  // 4. Cascading Change Handlers with Automatic Child Resets
  const handleCountyChange = (countyId) => {
    setSelectedCountyId(countyId);
    setSelectedConstituencyId('');
    setSelectedWardId('');
    setSelectedCentreName('');
    setSelectedStationId('');
  };

  const handleConstituencyChange = (constId) => {
    setSelectedConstituencyId(constId);
    setSelectedWardId('');
    setSelectedCentreName('');
    setSelectedStationId('');
  };

  const handleWardChange = (wardId) => {
    setSelectedWardId(wardId);
    setSelectedCentreName('');
    setSelectedStationId('');
  };

  const handleCentreChange = (centreName) => {
    setSelectedCentreName(centreName);
    setSelectedStationId('');
  };

  const handleStationChange = (stationId) => {
    setSelectedStationId(stationId);
  };

  // 5. Notify Parent Component on Selection Change
  useEffect(() => {
    if (!onSelectionChange || !effectiveScope.isConfigured) return;

    const currentCounty = (geography.counties || []).find(c => c.id === selectedCountyId) || { name: effectiveScope.locked?.county || '' };
    const currentConst = (geography.constituencies || []).find(c => c.id === selectedConstituencyId) || { name: effectiveScope.locked?.constituency || '' };
    const currentWard = (geography.wards || []).find(w => w.id === selectedWardId) || { name: effectiveScope.locked?.ward || '' };
    const currentStation = (geography.pollingStations || []).find(ps => ps.id === selectedStationId);

    const isComplete = Boolean(
      (effectiveScope.locked?.county || selectedCountyId) &&
      (effectiveScope.locked?.constituency || selectedConstituencyId) &&
      (effectiveScope.locked?.ward || selectedWardId)
    );

    onSelectionChange({
      countyId: selectedCountyId || effectiveScope.locked?.county,
      countyName: currentCounty.name,
      constituencyId: selectedConstituencyId || effectiveScope.locked?.constituency,
      constituencyName: currentConst.name,
      wardId: selectedWardId || effectiveScope.locked?.ward,
      wardName: currentWard.name,
      pollingCentreName: selectedCentreName,
      pollingStationId: selectedStationId,
      pollingStationCode: currentStation?.code || currentStation?.id,
      pollingStationName: currentStation?.name,
      complete: isComplete,
      effectiveScope
    });
  }, [selectedCountyId, selectedConstituencyId, selectedWardId, selectedCentreName, selectedStationId, effectiveScope, geography, onSelectionChange]);

  // 6. Fail-Closed UI State
  if (!effectiveScope.isConfigured || effectiveScope.failClosed) {
    return (
      <div className={`scoped-sieve-failclosed alert alert-danger p-3 rounded-lg border border-red-500/30 bg-red-950/20 text-red-200 ${className}`}>
        <div className="d-flex align-items-center gap-2 font-bold mb-1">
          <span className="material-symbols-outlined text-red-400">warning</span>
          <span>⚠️ Electoral Scope Not Configured</span>
        </div>
        <p className="text-xs mb-0 text-red-300">
          {effectiveScope.error || 'This campaign does not have a valid electoral jurisdiction. Contact an administrator before continuing.'}
        </p>
      </div>
    );
  }

  const { locked, selectableLevels } = effectiveScope;

  return (
    <div className={`scoped-location-sieve p-3 rounded-xl border border-border-subtle bg-surface-card ${className}`}>
      {/* Locked Scope Badge Header */}
      <div className="locked-scope-header p-2.5 rounded-lg bg-surface-elevated border border-border-subtle mb-3">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <div className="d-flex align-items-center gap-2">
            <span className="text-xs font-semibold text-primary">📍 Electoral Scope</span>
            <span className="badge bg-primary/20 text-primary border border-primary/30 text-[11px] font-mono">
              {effectiveScope.contestType}
            </span>
          </div>
          <span className="text-[11px] text-muted d-flex align-items-center gap-1">
            🔒 Scope Locked
          </span>
        </div>
        <div className="d-flex flex-wrap gap-1.5 mt-1.5">
          {locked.county && (
            <span className="badge bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 text-xs">
              County: <strong className="text-cyan-400">{locked.county}</strong> 🔒
            </span>
          )}
          {locked.constituency && (
            <span className="badge bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 text-xs">
              Constituency: <strong className="text-cyan-400">{locked.constituency}</strong> 🔒
            </span>
          )}
          {locked.ward && (
            <span className="badge bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 text-xs">
              Ward: <strong className="text-cyan-400">{locked.ward}</strong> 🔒
            </span>
          )}
        </div>
      </div>

      {/* Interactive Progressive Cascading Selectors */}
      <div className="row g-2">
        {/* 1. County Selector (Only if NOT locked) */}
        {selectableLevels.includes('COUNTY') && (
          <div className="col-12 col-md-6 mb-2">
            <label className="form-label text-xs font-semibold text-text-muted">1. County</label>
            <select
              className="form-select form-select-sm text-xs bg-surface-elevated text-text-primary border-border-subtle"
              value={selectedCountyId}
              onChange={e => handleCountyChange(e.target.value)}
            >
              <option value="">-- Select County --</option>
              {(geography.counties || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Constituency Selector (Only if NOT locked) */}
        {selectableLevels.includes('CONSTITUENCY') && (
          <div className="col-12 col-md-6 mb-2">
            <label className="form-label text-xs font-semibold text-text-muted">
              {selectableLevels.includes('COUNTY') ? '2. Constituency' : '1. Constituency'}
            </label>
            <select
              className="form-select form-select-sm text-xs bg-surface-elevated text-text-primary border-border-subtle"
              value={selectedConstituencyId}
              onChange={e => handleConstituencyChange(e.target.value)}
              disabled={selectableLevels.includes('COUNTY') && !selectedCountyId}
            >
              <option value="">-- Select Constituency --</option>
              {availableConstituencies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Ward Selector (Only if NOT locked) */}
        {selectableLevels.includes('WARD') && (
          <div className="col-12 col-md-6 mb-2">
            <label className="form-label text-xs font-semibold text-text-muted">
              {selectableLevels.includes('CONSTITUENCY') ? (selectableLevels.includes('COUNTY') ? '3. Ward' : '2. Ward') : '1. Ward'}
            </label>
            <select
              className="form-select form-select-sm text-xs bg-surface-elevated text-text-primary border-border-subtle"
              value={selectedWardId}
              onChange={e => handleWardChange(e.target.value)}
              disabled={(selectableLevels.includes('CONSTITUENCY') && !selectedConstituencyId && !locked.constituency) || availableWards.length === 0}
            >
              <option value="">-- Select Ward --</option>
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Polling Centre Selector */}
        {availableCentres.length > 0 && (
          <div className="col-12 col-md-6 mb-2">
            <label className="form-label text-xs font-semibold text-text-muted">
              Polling Centre
            </label>
            <select
              className="form-select form-select-sm text-xs bg-surface-elevated text-text-primary border-border-subtle"
              value={selectedCentreName}
              onChange={e => handleCentreChange(e.target.value)}
              disabled={(selectableLevels.includes('WARD') && !selectedWardId && !locked.ward) || availableCentres.length === 0}
            >
              <option value="">-- Select Polling Centre (All) --</option>
              {availableCentres.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.stations.length} streams)</option>
              ))}
            </select>
          </div>
        )}

        {/* 5. Polling Station / Stream Selector */}
        <div className="col-12 mb-2">
          <label className="form-label text-xs font-semibold text-text-muted">
            Polling Station / Stream
          </label>
          <select
            className="form-select form-select-sm text-xs bg-surface-elevated text-text-primary border-border-subtle"
            value={selectedStationId}
            onChange={e => handleStationChange(e.target.value)}
            disabled={(selectableLevels.includes('WARD') && !selectedWardId && !locked.ward) || centreFilteredStations.length === 0}
          >
            <option value="">-- Select Polling Stream --</option>
            {centreFilteredStations.map(ps => (
              <option key={ps.id} value={ps.id}>
                {ps.code ? `[${ps.code}] ` : ''}{ps.name} ({ps.registeredVoters || 0} Voters)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Breadcrumb Navigation */}
      <div className="breadcrumb-nav mt-2 pt-2 border-t border-border-subtle d-flex flex-wrap align-items-center gap-1.5 text-xs text-text-muted">
        <span className="font-semibold text-primary">Location Path:</span>
        <span className="badge bg-slate-800 text-slate-300">{locked.county || (selectedCountyId && geography.counties.find(c=>c.id===selectedCountyId)?.name) || 'Kenya'} {locked.county ? '🔒' : ''}</span>
        {(locked.constituency || selectedConstituencyId) && (
          <>
            <span>→</span>
            <span className="badge bg-slate-800 text-slate-300">{locked.constituency || geography.constituencies.find(c=>c.id===selectedConstituencyId)?.name} {locked.constituency ? '🔒' : ''}</span>
          </>
        )}
        {(locked.ward || selectedWardId) && (
          <>
            <span>→</span>
            <span className="badge bg-slate-800 text-slate-300">{locked.ward || geography.wards.find(w=>w.id===selectedWardId)?.name} {locked.ward ? '🔒' : ''}</span>
          </>
        )}
        {selectedCentreName && (
          <>
            <span>→</span>
            <span className="badge bg-cyan-950 text-cyan-300 border border-cyan-800">{selectedCentreName}</span>
          </>
        )}
        {selectedStationId && (
          <>
            <span>→</span>
            <span className="badge bg-emerald-950 text-emerald-300 border border-emerald-800">
              {geography.pollingStations.find(s=>s.id===selectedStationId)?.name}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ScopedLocationSieve;
