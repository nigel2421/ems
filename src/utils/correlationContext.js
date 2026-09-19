// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Universal Transaction Correlation Context Engine
// ====================================================================

import { CURRENT_RELEASE_MANIFEST } from './releaseProvenance.js';

/**
  Generates a high-entropy universal correlation ID for transaction lifecycle tracing
 */
export const generateCorrelationId = (prefix = 'COR') => {
  const timeHex = Date.now().toString(36).toUpperCase();
  const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
  return `${prefix}-${timeHex}-${randomHex}`;
};

/**
  Binds a correlation ID to any event, evidence, sync, or API record payload
 */
export const bindCorrelationContext = (payload = {}, existingCorrelationId = null) => {
  const correlationId = existingCorrelationId || payload.correlation_id || generateCorrelationId();

  return {
    ...payload,
    correlation_id: correlationId,
    correlation_timestamp: payload.correlation_timestamp || new Date().toISOString()
  };
};

/**
  Traces and reconstructs the complete transaction lifecycle across heterogeneous records
 */
export const traceCorrelationLifecycle = (recordsList = [], targetCorrelationId) => {
  if (!targetCorrelationId) return [];

  return recordsList
    .filter(record => record && record.correlation_id === targetCorrelationId)
    .sort((a, b) => new Date(a.correlation_timestamp || a.createdAt || a.timestamp || 0) - new Date(b.correlation_timestamp || b.createdAt || b.timestamp || 0));
};

/**
  Creates a complete end-to-end transaction header bundle for API, DB, Queue & Audit propagation
 */
export const createTransactionHeaderBundle = (userContext = {}, deviceId = 'DEV-01', options = {}) => {
  const correlationId = generateCorrelationId('COR');
  const requestId = generateCorrelationId('REQ');
  const traceId = generateCorrelationId('TRC');
  const serverTimestamp = new Date().toISOString();

  return {
    correlation_id: correlationId,
    request_id: requestId,
    trace_id: traceId,
    user_id: userContext.id || userContext.userId || 'USR-ANON',
    session_id: userContext.sessionId || 'SESS-101',
    device_id: deviceId,
    tenant_id: userContext.tenantId || 'TENANT-KENYA-2027',
    campaign_id: userContext.campaignId || 'CAMP-NATIONAL-01',
    election_id: options.electionId || 'ELEC-KE-2027',
    contest_id: options.contestId || 'CONTEST-PRES-2027',
    jurisdiction_id: options.jurisdictionId || 'JUR-NATIONAL-KE',
    environment: options.environment || 'STAGING',
    operational_mode: options.operationalMode || 'LIVE',
    source_service: options.sourceService || 'API_GATEWAY',
    operation: options.operation || 'SUBMIT_FORM_EVIDENCE',
    device_timestamp: options.deviceTimestamp || serverTimestamp,
    server_timestamp: serverTimestamp,
    release_id: CURRENT_RELEASE_MANIFEST.releaseId
  };
};
