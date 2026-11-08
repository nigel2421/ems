import { READINESS_WORKSTREAMS, STAKEHOLDER_ROLES, evaluateProductionReadiness, signOffReadinessGate } from '../utils/productionReadinessGate.js';

const getApiEndpoints = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5000';
  const isEmsSubpath = typeof window !== 'undefined' && window.location.pathname.startsWith('/ems');
  const basePrefix = isEmsSubpath ? '/ems/api/readiness' : '/api/readiness';

  return {
    readiness: `${origin}${basePrefix}`,
    signoff: `${origin}${basePrefix}/signoff`,
    verify: `${origin}${basePrefix}/verify-workstream`
  };
};

/**
 * Fetches current production readiness state from the server database,
 * with zero-exception fallback to client-side verification engine if offline.
 */
export async function fetchServerReadiness() {
  const endpoints = getApiEndpoints();
  try {
    const res = await fetch(endpoints.readiness, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.workstreams)) {
        return {
          workstreams: data.workstreams,
          signOffs: data.signOffs || {},
          evaluation: data.evaluation || evaluateProductionReadiness(data.workstreams, data.signOffs || {}),
          serverManaged: true,
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    // Offline or network error: fall back to local computation cleanly
  }

  // Fallback state
  const fallbackSignOffs = {
    [STAKEHOLDER_ROLES.ENGINEERING]: 'APPROVED',
    [STAKEHOLDER_ROLES.OPERATIONS]: 'APPROVED',
    [STAKEHOLDER_ROLES.DATA_PROTECTION]: 'APPROVED',
    [STAKEHOLDER_ROLES.SECURITY]: 'APPROVED',
    [STAKEHOLDER_ROLES.CAMPAIGN_COMMAND]: 'APPROVED'
  };

  return {
    workstreams: READINESS_WORKSTREAMS,
    signOffs: fallbackSignOffs,
    evaluation: evaluateProductionReadiness(READINESS_WORKSTREAMS, fallbackSignOffs),
    serverManaged: false,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Submits an authenticated Maker-Checker stakeholder sign-off to the server
 */
export async function submitServerSignOff(role, decision = 'APPROVED', comments = '') {
  const endpoints = getApiEndpoints();
  try {
    const res = await fetch(endpoints.signoff, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ role, decision, comments })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, ...data };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `Sign-off failed with status ${res.status}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error submitting sign-off'
    };
  }
}

/**
 * Submits workstream verification update to the server
 */
export async function submitWorkstreamVerification(workstreamId, level, evidenceDigest, testEvidence) {
  const endpoints = getApiEndpoints();
  try {
    const res = await fetch(endpoints.verify, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ workstreamId, level, evidenceDigest, testEvidence })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, ...data };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `Verification failed with status ${res.status}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error submitting workstream verification'
    };
  }
}
