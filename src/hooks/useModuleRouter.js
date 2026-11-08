// ====================================================================
// CI-EMS DEEP ROUTING & URL SYNCHRONIZATION HOOK
// Enables search engine crawlability, deep bookmarks, and browser
// back/forward navigation for all application pages and modules.
// ====================================================================

import { useEffect, useCallback } from 'react';

export const ROUTE_TO_MODULE_MAP = {
  '': 'dashboard',
  '/': 'dashboard',
  '#/': 'dashboard',
  '#/dashboard': 'dashboard',
  '#map': 'interactive_map',
  '#/map': 'interactive_map',
  '#/polling-stations': 'polling_stations',
  '#/tally-center': 'tally_center',
  '#/strategy': 'strategy',
  '#/strategy-team': 'strategy_team',
  '#/agents': 'agents',
  '#/field-reports': 'field_reports',
  '#/surveys': 'surveys',
  '#/mobilization': 'mobilization',
  '#/executive-briefing': 'executive_briefing',
  '#/production-readiness': 'production_readiness',
  '#/ops-queue': 'ops_queue',
  '#/war-room': 'war_room',
  '#/security-ops': 'security_ops',
  '#/evidence-review': 'evidence_review'
};

export const MODULE_TO_ROUTE_MAP = {
  dashboard: '',
  interactive_map: '#/map',
  polling_stations: '#/polling-stations',
  tally_center: '#/tally-center',
  strategy: '#/strategy',
  strategy_team: '#/strategy-team',
  agents: '#/agents',
  field_reports: '#/field-reports',
  surveys: '#/surveys',
  mobilization: '#/mobilization',
  executive_briefing: '#/executive-briefing',
  production_readiness: '#/production-readiness',
  ops_queue: '#/ops-queue',
  war_room: '#/war-room',
  security_ops: '#/security-ops',
  evidence_review: '#/evidence-review'
};

/**
 * Resolves current module ID from the URL hash
 */
export const resolveModuleFromHash = (hash = '') => {
  const clean = hash.trim().toLowerCase();
  return ROUTE_TO_MODULE_MAP[clean] || 'dashboard';
};

/**
 * Hook to keep window.location.hash and currentModule in lockstep
 */
export const useModuleRouter = (currentModule, onModuleChange) => {
  // Sync URL hash when module state changes
  const navigateToModule = useCallback((mod) => {
    const targetHash = MODULE_TO_ROUTE_MAP[mod] || '';
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash || '';
      // Only pushState or change hash if it differs to preserve history stack
      if (currentHash !== targetHash && !(currentHash === '' && targetHash === '')) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  // Listen to external hash changes (e.g. Browser Back/Forward buttons, link clicks)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const detectedModule = resolveModuleFromHash(window.location.hash);
      if (detectedModule && detectedModule !== currentModule) {
        onModuleChange(detectedModule);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Initial check on page load / mount
    const initialModule = resolveModuleFromHash(window.location.hash);
    if (initialModule && initialModule !== currentModule) {
      onModuleChange(initialModule);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentModule, onModuleChange]);

  return { navigateToModule };
};
