// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Executable Election Operations Runbooks & SLA Escalation Procedures
// ====================================================================

import { ROLES } from './rbac.js';

export const INCIDENT_SLA_MINUTES = {
  ACKNOWLEDGE: 5,   // Alert Ward Coordinator if unacknowledged after 5 mins
  ESCALATE: 15,     // Alert Constituency Command if unresolved after 15 mins
  LEGAL_CASE: 30    // Auto-create Legal Desk Case if high severity after 30 mins
};

export const CHECKIN_SLA_MINUTES = {
  REMINDER_1: -30,  // T-30 mins: In-app reminder
  REMINDER_2: -15,  // T-15 mins: SMS reminder
  DEADLINE: 0,      // T-0 mins: Notify Polling Coordinator
  WARN: 15,         // T+15 mins: Mark deployment AT RISK
  REPLACE: 30       // T+30 mins: Trigger replacement workflow
};

/**
  Evaluates incident SLA status and determines required escalation action
 */
export const evaluateIncidentSLA = (incident = {}, now = new Date()) => {
  if (!incident.createdAt) return { status: 'NORMAL', actionRequired: null };

  const createdTime = new Date(incident.createdAt).getTime();
  const currentTime = new Date(now).getTime();
  const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));

  if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
    return { status: 'COMPLIED', elapsedMinutes, actionRequired: null };
  }

  if (!incident.acknowledgedAt && elapsedMinutes >= INCIDENT_SLA_MINUTES.ACKNOWLEDGE) {
    return {
      status: 'SLA_BREACH_ACKNOWLEDGE',
      elapsedMinutes,
      actionRequired: 'ALERT_WARD_COORDINATOR',
      targetRole: ROLES.WARD_COORDINATOR,
      message: `Incident unacknowledged for ${elapsedMinutes} mins (SLA: ${INCIDENT_SLA_MINUTES.ACKNOWLEDGE}m). Escalating to Ward Coordinator.`
    };
  }

  if (incident.status !== 'CLOSED' && elapsedMinutes >= INCIDENT_SLA_MINUTES.ESCALATE) {
    return {
      status: 'SLA_BREACH_ESCALATE',
      elapsedMinutes,
      actionRequired: 'ALERT_CONSTITUENCY_COMMAND',
      targetRole: ROLES.CONSTITUENCY_COORDINATOR,
      message: `Incident unresolved for ${elapsedMinutes} mins (SLA: ${INCIDENT_SLA_MINUTES.ESCALATE}m). Escalating to Constituency Command.`
    };
  }

  return { status: 'IN_SLA', elapsedMinutes, actionRequired: null };
};

/**
  Evaluates missing agent check-in SLA status against election start time
 */
export const evaluateCheckInSLA = (mission = {}, openingTimeStr = '06:00:00', now = new Date()) => {
  if (mission.checkInAt || mission.status === 'CHECKED_IN' || mission.status === 'ON_DUTY') {
    return { status: 'CHECKED_IN', actionRequired: null };
  }

  const [hours, minutes, seconds] = openingTimeStr.split(':').map(Number);
  const targetDate = new Date(now);
  targetDate.setHours(hours || 6, minutes || 0, seconds || 0, 0);

  const diffMs = new Date(now).getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < CHECKIN_SLA_MINUTES.REMINDER_1) {
    return { status: 'SCHEDULED', diffMins, actionRequired: null };
  }
  if (diffMins < CHECKIN_SLA_MINUTES.REMINDER_2) {
    return { status: 'REMINDER_T30', diffMins, actionRequired: 'SEND_IN_APP_REMINDER' };
  }
  if (diffMins < CHECKIN_SLA_MINUTES.DEADLINE) {
    return { status: 'REMINDER_T15', diffMins, actionRequired: 'SEND_SMS_REMINDER' };
  }
  if (diffMins < CHECKIN_SLA_MINUTES.WARN) {
    return { status: 'MISSING_T0', diffMins, actionRequired: 'NOTIFY_POLLING_COORDINATOR' };
  }
  if (diffMins < CHECKIN_SLA_MINUTES.REPLACE) {
    return { status: 'AT_RISK_T15', diffMins, actionRequired: 'MARK_DEPLOYMENT_AT_RISK' };
  }

  return {
    status: 'CRITICAL_T30',
    diffMins,
    actionRequired: 'TRIGGER_REPLACEMENT_WORKFLOW',
    targetRole: ROLES.POLLING_COORDINATOR,
    message: `Agent missed check-in deadline by ${diffMins} mins. Replacement agent required immediately.`
  };
};

/**
  Executes escalation handover without wiping previous ownership audit history
 */
export const triggerRunbookEscalation = (record = {}, newOwnerRole, reason = 'SLA Escalation', actor = 'System') => {
  const timestamp = new Date().toISOString();
  const escalationHistory = record.escalationHistory || [];

  const handoverEvent = {
    previousOwner: record.currentOwner || record.assignedTo || 'Unassigned',
    newOwnerRole,
    reason,
    timestamp,
    actor: typeof actor === 'object' ? (actor.name || actor.email || 'System') : actor
  };

  return {
    ...record,
    currentOwnerRole: newOwnerRole,
    status: 'ESCALATED',
    escalationHistory: [...escalationHistory, handoverEvent],
    updatedAt: timestamp
  };
};
