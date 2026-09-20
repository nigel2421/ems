// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.5)
// Tiered Service Criticality & Graceful Degradation Engine
// ====================================================================

export const SERVICE_TIERS = {
  TIER_0: { tier: 0, label: 'TIER 0: MUST SURVIVE', critical: true },
  TIER_1: { tier: 1, label: 'TIER 1: ELECTION CRITICAL', critical: true },
  TIER_2: { tier: 2, label: 'TIER 2: OPERATIONAL SUPPORT', critical: false },
  TIER_3: { tier: 3, label: 'TIER 3: NON-CRITICAL / ADVANCED', critical: false }
};

export const SERVICE_CATALOG = {
  AUTHENTICATION: { name: 'Authentication', tier: SERVICE_TIERS.TIER_0 },
  AUTHORIZATION: { name: 'Authorization & RBAC', tier: SERVICE_TIERS.TIER_0 },
  ASSIGNMENT_LOOKUP: { name: 'Agent Assignment Lookup', tier: SERVICE_TIERS.TIER_0 },
  EVIDENCE_CAPTURE: { name: 'Local Evidence Capture', tier: SERVICE_TIERS.TIER_0 },
  LOCAL_QUEUE: { name: 'Local Sync Queue', tier: SERVICE_TIERS.TIER_0 },
  AUDIT_LEDGER: { name: 'Audit Ledger', tier: SERVICE_TIERS.TIER_0 },

  SYNC_API: { name: 'Idempotent Sync API', tier: SERVICE_TIERS.TIER_1 },
  EVIDENCE_UPLOAD: { name: 'Evidence Upload Pipeline', tier: SERVICE_TIERS.TIER_1 },
  RESULT_SUBMISSION: { name: 'Result Submission API', tier: SERVICE_TIERS.TIER_1 },
  INCIDENT_REPORTING: { name: 'Incident Reporting Desk', tier: SERVICE_TIERS.TIER_1 },
  RECONCILIATION_DESK: { name: 'Reconciliation Engine', tier: SERVICE_TIERS.TIER_1 },

  SMS_GATEWAY: { name: 'SMS Messaging Gateway', tier: SERVICE_TIERS.TIER_2 },
  COMMAND_DASHBOARDS: { name: 'Command Dashboards', tier: SERVICE_TIERS.TIER_2 },
  REPORTS_GENERATOR: { name: 'PDF Reports Generator', tier: SERVICE_TIERS.TIER_2 },

  AI_PROVIDER: { name: 'Gemini AI Provider', tier: SERVICE_TIERS.TIER_3 },
  MEDIA_MONITORING: { name: 'Media Intelligence', tier: SERVICE_TIERS.TIER_3 },
  HISTORICAL_ANALYTICS: { name: 'Historical Campaign Analytics', tier: SERVICE_TIERS.TIER_3 }
};

/**
  Evaluates overall system health and identifies degraded service tiers
 */
export const evaluateSystemTierHealth = (serviceStatuses = {}) => {
  const catalogKeys = Object.keys(SERVICE_CATALOG);
  const degradationList = [];
  let isTier0Healthy = true;
  let isTier1Healthy = true;

  catalogKeys.forEach(key => {
    const service = SERVICE_CATALOG[key];
    const isHealthy = serviceStatuses[key] !== false; // Default healthy unless explicitly false

    if (!isHealthy) {
      degradationList.push(service.name);
      if (service.tier.tier === 0) isTier0Healthy = false;
      if (service.tier.tier === 1) isTier1Healthy = false;
    }
  });

  const isOperational = isTier0Healthy && isTier1Healthy;

  return {
    isOperational,
    isTier0Healthy,
    isTier1Healthy,
    degradedServices: degradationList,
    systemStatus: isOperational
      ? (degradationList.length === 0 ? 'HEALTHY' : 'DEGRADED_NON_CRITICAL')
      : 'CRITICAL_OUTAGE'
  };
};

/**
  Determines if an action can be safely executed under current service degradation
 */
export const canExecuteActionUnderDegradation = (actionKey, serviceStatuses = {}) => {
  const service = SERVICE_CATALOG[actionKey];
  if (!service) return true;

  const isServiceHealthy = serviceStatuses[actionKey] !== false;
  if (isServiceHealthy) return true;

  // Fallback policies
  if (actionKey === 'SMS_GATEWAY') {
    return { canExecute: true, fallback: 'IN_APP_NOTIFICATION', message: 'SMS Gateway degraded: Fallback to In-App notification' };
  }
  if (actionKey === 'AI_PROVIDER') {
    return { canExecute: false, fallback: 'STATIC_RULES_ONLY', message: 'AI Provider degraded: AI features disabled' };
  }
  if (actionKey === 'EVIDENCE_UPLOAD') {
    return { canExecute: true, fallback: 'LOCAL_QUEUE_ENQUEUE', message: 'Upload API degraded: Evidence queued locally for automatic retry' };
  }

  return { canExecute: service.tier.critical === false, fallback: null, message: `Service ${service.name} degraded` };
};
