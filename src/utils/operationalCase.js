// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.0)
// Central OperationalCase Workflow Engine & SLA Tracker
// ====================================================================

import { generateCorrelationId } from './correlationContext.js';

export const CASE_TYPES = {
  INCIDENT: 'INCIDENT',
  RECONCILIATION: 'RECONCILIATION',
  DEVICE_RECOVERY: 'DEVICE_RECOVERY',
  REPLACEMENT_REQUEST: 'REPLACEMENT_REQUEST',
  EVIDENCE_REVIEW: 'EVIDENCE_REVIEW',
  LOGISTICS_GAP: 'LOGISTICS_GAP',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
};

export const CASE_PRIORITIES = {
  P1_CRITICAL: 'P1_CRITICAL',
  P2_HIGH: 'P2_HIGH',
  P3_MEDIUM: 'P3_MEDIUM',
  P4_LOW: 'P4_LOW'
};

export const CASE_SEVERITIES = {
  SEV_1_EMERGENCY: 'SEV_1_EMERGENCY',
  SEV_2_MAJOR: 'SEV_2_MAJOR',
  SEV_3_MODERATE: 'SEV_3_MODERATE',
  SEV_4_MINOR: 'SEV_4_MINOR'
};

export const CASE_STATUSES = {
  // Standard Lifecycle States
  NEW: 'NEW',
  TRIAGED: 'TRIAGED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_EXTERNAL: 'PENDING_EXTERNAL',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',

  // Exceptional States
  ESCALATED: 'ESCALATED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
  REOPENED: 'REOPENED'
};

// Default SLA thresholds by priority (in minutes)
export const SLA_THRESHOLDS_MINUTES = {
  P1_CRITICAL: 15,
  P2_HIGH: 60,
  P3_MEDIUM: 240,
  P4_LOW: 1440
};

/**
  Creates a standardized OperationalCase record
 */
export const createOperationalCase = ({
  caseId,
  caseType = CASE_TYPES.INCIDENT,
  title,
  priority = CASE_PRIORITIES.P3_MEDIUM,
  severity = CASE_SEVERITIES.SEV_3_MODERATE,
  tenantId = 'TENANT-KENYA-2027',
  campaignId = 'CAMP-NATIONAL-01',
  electionId = 'ELECTION-2027-GENERAL',
  contestId = 'CONTEST-PRESIDENTIAL',
  jurisdictionId = '047', // Default County Nairobi
  sourceType = 'SYSTEM',
  sourceId = null,
  createdBy = 'SYSTEM',
  assignedTo = null,
  assignedTeam = 'OPERATIONS_TRIAGE',
  sourceObject = null,
  correlationId = null
}) => {
  if (!Object.values(CASE_TYPES).includes(caseType)) {
    throw new Error(`Invalid caseType: ${caseType}`);
  }

  const generatedId = caseId || `CASE-${caseType.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();
  const slaMinutes = SLA_THRESHOLDS_MINUTES[priority] || 60;
  const slaDueAt = new Date(now.getTime() + slaMinutes * 60 * 1000).toISOString();

  return {
    case_id: generatedId,
    caseId: generatedId, // Alias for backward compatibility
    case_type: caseType,
    caseType,
    title: title || `${caseType} Operational Case (${generatedId})`,
    tenant_id: tenantId,
    campaign_id: campaignId,
    election_id: electionId,
    contest_id: contestId,
    jurisdiction_id: jurisdictionId,
    priority,
    severity,
    status: CASE_STATUSES.NEW,
    source_type: sourceType,
    source_id: sourceId || sourceObject?.id || 'SRC-UNKNOWN',
    created_by: createdBy,
    assigned_to: assignedTo,
    assigned_team: assignedTeam,
    sla_policy_id: `SLA-${priority}`,
    sla_started_at: now.toISOString(),
    sla_due_at: slaDueAt,
    sla_breached_at: null,
    correlation_id: correlationId || sourceObject?.correlation_id || generateCorrelationId(),
    sourceObject,
    auditTrail: [
      {
        action: 'CASE_CREATED',
        status: CASE_STATUSES.NEW,
        performedBy: createdBy,
        timestamp: now.toISOString(),
        details: `Case initialized with priority ${priority}`
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    resolvedAt: null,
    closedAt: null
  };
};

/**
  Updates case status with SLA tracking & audit entry
 */
export const updateCaseStatus = (opCase, newStatus, performedBy = 'USER', notes = '') => {
  if (!Object.values(CASE_STATUSES).includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const now = new Date().toISOString();
  let resolvedAt = opCase.resolvedAt || opCase.resolved_at;
  let closedAt = opCase.closedAt || opCase.closed_at;

  if (newStatus === CASE_STATUSES.RESOLVED && !resolvedAt) {
    resolvedAt = now;
  }
  if (newStatus === CASE_STATUSES.CLOSED && !closedAt) {
    closedAt = now;
  }

  const updatedAuditTrail = [
    ...(opCase.auditTrail || []),
    {
      action: 'STATUS_CHANGED',
      from: opCase.status,
      to: newStatus,
      performedBy,
      notes,
      timestamp: now
    }
  ];

  return {
    ...opCase,
    status: newStatus,
    auditTrail: updatedAuditTrail,
    updatedAt: now,
    resolvedAt,
    closedAt,
    resolved_at: resolvedAt,
    closed_at: closedAt
  };
};

/**
  Evaluates SLA compliance for a case
 */
export const evaluateCaseSLA = (opCase, currentTimeISO = new Date().toISOString()) => {
  if (!opCase || !opCase.sla_due_at) return { isBreached: false, remainingMinutes: 0 };

  const currentMs = new Date(currentTimeISO).getTime();
  const dueMs = new Date(opCase.sla_due_at).getTime();
  const remainingMs = dueMs - currentMs;
  const isBreached = remainingMs < 0 && ![CASE_STATUSES.RESOLVED, CASE_STATUSES.CLOSED, CASE_STATUSES.CANCELLED].includes(opCase.status);

  return {
    isBreached,
    remainingMinutes: Math.round(remainingMs / (60 * 1000)),
    slaDueAt: opCase.sla_due_at,
    slaBreachedAt: isBreached ? (opCase.sla_breached_at || currentTimeISO) : null
  };
};

/**
  Filters operational cases for the Unified Operations Queue
 */
export const filterCasesByQueue = (casesList = [], criteria = {}) => {
  if (!Array.isArray(casesList)) return [];

  return casesList.filter(item => {
    if (criteria.status && criteria.status !== 'ALL' && item.status !== criteria.status) return false;
    if (criteria.priority && criteria.priority !== 'ALL' && item.priority !== criteria.priority) return false;
    if (criteria.assignedTo && item.assigned_to !== criteria.assignedTo) return false;
    if (criteria.isBreachedOnly) {
      const sla = evaluateCaseSLA(item);
      if (!sla.isBreached) return false;
    }
    return true;
  });
};
