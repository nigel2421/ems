// ====================================================================
// KuraTech EMBEDDED ELECTORAL MAP WIDGET
// Compact dashboard mini-map card with live choropleth preview and
// 1-click expansion to the Electoral Map Room.
// ====================================================================

import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  KENYA_COUNTIES_GEOMETRY,
  KENYA_MAP_VIEWBOX
} from '../../data/geo/kenyaMapGeometries';
import {
  MAP_LAYERS,
  getRegionMetrics,
  getRegionFillColor,
  resolveMapFraming
} from '../../utils/mapAnalytics';
import { Map, Maximize2, Vote, Users, CheckCircle } from 'lucide-react';
import '../modules/ElectoralMapRoom.css';

export const ElectoralMapWidget = ({ onOpenMapRoom }) => {
  const { currentUser } = useAuth();
  const { geography, tallyResults, stationIntelligence } = useData();

  const framing = useMemo(() => resolveMapFraming(currentUser, geography), [currentUser, geography]);

  // Aggregate high-level metrics for the scoped territory
  const scopedMetrics = useMemo(() => {
    return getRegionMetrics(framing.countyId || 'C-047', 'county', {
      geography,
      tallyResults,
      stationIntelligence
    });
  }, [framing, geography, tallyResults, stationIntelligence]);

  return (
    <div className="mini-map-card">
      <div className="mini-map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Map size={18} style={{ color: '#06b6d4' }} />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              {framing.title || 'Territory Map'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Satellite, Roadmap & Live Station Pins
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenMapRoom}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            padding: '0.3rem 0.6rem'
          }}
          title="Open Full Electoral Map Room"
        >
          <Maximize2 size={13} />
          <span>Expand Map</span>
        </button>
      </div>

      {/* Mini SVG Preview */}
      <div className="mini-map-preview" onClick={onOpenMapRoom} style={{ cursor: 'pointer' }}>
        <svg
          viewBox={framing.viewBox || KENYA_MAP_VIEWBOX}
          style={{ width: '100%', height: '100%', maxHeight: '200px' }}
        >
          <g>
            {KENYA_COUNTIES_GEOMETRY.map((region) => {
              const metrics = getRegionMetrics(region.id, 'county', {
                geography,
                tallyResults,
                stationIntelligence
              });
              const isMatch = framing.countyId === region.id;
              const isOutOfScope = framing.isScoped && !isMatch;
              const fillColor = getRegionFillColor(metrics, MAP_LAYERS.LEAD, isOutOfScope);

              return (
                <path
                  key={region.id}
                  d={region.d}
                  fill={fillColor}
                  stroke={isMatch ? '#06b6d4' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isMatch ? 2.5 : 1}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Quick Summary Pill Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Turnout</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{scopedMetrics.turnoutPct}%</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Form 34A</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06b6d4' }}>{scopedMetrics.reportingPct}%</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Leader</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: scopedMetrics.leadColor }}>
            {scopedMetrics.leader.split(' ')[1] || scopedMetrics.leader}
          </div>
        </div>
      </div>
    </div>
  );
};
