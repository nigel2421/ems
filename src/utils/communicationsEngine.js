// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Scope-Targeted Communications & Emergency Broadcast Maker-Checker Engine
// ====================================================================

import { getUserScope, SCOPE_LEVELS, ROLES } from './rbac.js';

export const MESSAGE_CATEGORIES = {
  STANDARD_MESSAGE: 'STANDARD_MESSAGE',
  PRIORITY_ALERT: 'PRIORITY_ALERT',
  EMERGENCY_OPERATIONAL_ALERT: 'EMERGENCY_OPERATIONAL_ALERT'
};

export const DELIVERY_STATES = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  ACKNOWLEDGED: 'ACKNOWLEDGED'
};

/**
  Filters agent audience by jurisdiction scope, role, and mission status
 */
export const filterAudienceByScope = (senderUser, allAgents = [], filter = {}) => {
  if (!senderUser || !Array.isArray(allAgents)) return [];

  const senderScope = getUserScope(senderUser);

  return allAgents.filter(agent => {
    // 1. Role filter
    if (filter.role && filter.role !== 'All' && agent.role !== filter.role) {
      return false;
    }

    // 2. Mission status filter
    if (filter.missionStatus && filter.missionStatus !== 'All' && agent.missionStatus !== filter.missionStatus) {
      return false;
    }

    // 3. Geographic scope check
    if (senderScope.level === SCOPE_LEVELS.NATIONAL) {
      if (filter.county && filter.county !== 'All' && agent.county !== filter.county) return false;
      if (filter.constituency && filter.constituency !== 'All' && agent.constituency !== filter.constituency) return false;
      if (filter.ward && filter.ward !== 'All' && agent.ward !== filter.ward) return false;
      return true;
    }

    if (senderScope.level === SCOPE_LEVELS.COUNTY) {
      if (agent.county !== senderScope.county) return false;
      if (filter.constituency && filter.constituency !== 'All' && agent.constituency !== filter.constituency) return false;
      if (filter.ward && filter.ward !== 'All' && agent.ward !== filter.ward) return false;
      return true;
    }

    if (senderScope.level === SCOPE_LEVELS.CONSTITUENCY) {
      if (agent.constituency !== senderScope.constituency) return false;
      if (filter.ward && filter.ward !== 'All' && agent.ward !== filter.ward) return false;
      return true;
    }

    if (senderScope.level === SCOPE_LEVELS.WARD) {
      return agent.ward === senderScope.ward;
    }

    return agent.id === senderUser.id || agent.assignedEntity === senderUser.assignedEntity;
  });
};

/**
  Creates a communication dispatch payload with Emergency Broadcast Maker-Checker validation
 */
export const createCommunicationDispatch = (senderUser, payload = {}) => {
  const category = payload.category || MESSAGE_CATEGORIES.STANDARD_MESSAGE;
  const isEmergency = category === MESSAGE_CATEGORIES.EMERGENCY_OPERATIONAL_ALERT;

  // Emergency operational broadcasts require explicit Maker-Checker authorization
  const requiresMakerChecker = isEmergency;

  return {
    dispatchId: `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category,
    senderId: senderUser?.id || 'USR-SENDER',
    senderName: senderUser?.name || senderUser?.email || 'System Sender',
    senderRole: senderUser?.role || 'Admin',
    audienceFilter: payload.audienceFilter || {},
    recipientCount: payload.recipientCount || 0,
    channel: payload.channel || 'IN_APP', // IN_APP, SMS, EMAIL, PUSH
    subject: payload.subject || (isEmergency ? 'EMERGENCY OPERATIONAL ALERT' : 'Campaign Dispatch'),
    body: payload.body || '',
    requiresMakerChecker,
    makerCheckerStatus: requiresMakerChecker ? 'PENDING_APPROVAL' : 'APPROVED',
    approvedBy: requiresMakerChecker ? null : senderUser?.name,
    approvedAt: requiresMakerChecker ? null : new Date().toISOString(),
    status: requiresMakerChecker ? DELIVERY_STATES.QUEUED : DELIVERY_STATES.SENT,
    deliveryStats: {
      queued: payload.recipientCount || 0,
      sent: requiresMakerChecker ? 0 : payload.recipientCount || 0,
      delivered: 0,
      failed: 0,
      acknowledged: 0
    },
    createdAt: new Date().toISOString()
  };
};

/**
  Approves an emergency broadcast dispatch (Maker-Checker constraint: Approver !== Sender)
 */
export const approveEmergencyDispatch = (dispatch, approverUser) => {
  if (!dispatch || !dispatch.requiresMakerChecker) {
    throw new Error('Dispatch does not require maker-checker approval');
  }

  if (dispatch.senderId === approverUser.id) {
    throw new Error('Maker-Checker Violation: Emergency broadcast requester cannot approve their own dispatch request');
  }

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CANDIDATE_ADMIN].includes(approverUser.role)) {
    throw new Error('Unauthorized: Insufficient privileges to approve emergency broadcast dispatch');
  }

  return {
    ...dispatch,
    makerCheckerStatus: 'APPROVED',
    approvedBy: approverUser.name || approverUser.email,
    approvedAt: new Date().toISOString(),
    status: DELIVERY_STATES.SENT,
    deliveryStats: {
      ...dispatch.deliveryStats,
      sent: dispatch.recipientCount
    }
  };
};

/**
  10 Standardized Operational Message Templates for CI-EMS 2.6
 */
export const OPERATIONAL_TEMPLATES = {
  AGENT_CHECKIN_REMINDER: {
    key: 'AGENT_CHECKIN_REMINDER',
    subject: 'Action Required: Polling Station Check-in',
    body: 'Hello {{agentName}}, please complete your hourly check-in for {{stationName}} ({{stationId}}).'
  },
  AGENT_ASSIGNMENT_CONFIRMATION: {
    key: 'AGENT_ASSIGNMENT_CONFIRMATION',
    subject: 'Deployment Confirmation',
    body: 'Hello {{agentName}}, your assignment to {{stationName}} is confirmed. Supervisor: {{supervisorName}}.'
  },
  TRAINING_REMINDER: {
    key: 'TRAINING_REMINDER',
    subject: 'Training Certification Reminder',
    body: 'Hello {{agentName}}, please complete mandatory module: {{moduleTitle}} before election day.'
  },
  LOGISTICS_CONFIRMATION: {
    key: 'LOGISTICS_CONFIRMATION',
    subject: 'Logistics Kit Verification',
    body: 'Kit {{kitId}} delivered to {{stationName}}. Please verify contents and report status.'
  },
  INCIDENT_ACKNOWLEDGED: {
    key: 'INCIDENT_ACKNOWLEDGED',
    subject: 'Incident Received: {{incidentId}}',
    body: 'Incident {{incidentId}} reported at {{stationName}} has been acknowledged by {{coordinatorName}}.'
  },
  INCIDENT_ESCALATED: {
    key: 'INCIDENT_ESCALATED',
    subject: 'URGENT: Incident {{incidentId}} Escalated',
    body: 'High priority incident {{incidentId}} at {{stationName}} escalated to {{commandLevel}} command.'
  },
  SUPERVISOR_ALERT: {
    key: 'SUPERVISOR_ALERT',
    subject: 'Supervisor Action Needed',
    body: 'Station {{stationName}} requires immediate supervisor intervention regarding {{issueType}}.'
  },
  SHIFT_HANDOVER: {
    key: 'SHIFT_HANDOVER',
    subject: 'Shift Handover Initiated',
    body: 'Shift handover initiated from {{outgoingOperator}} to {{incomingOperator}}. {{openItemsCount}} open items.'
  },
  SYSTEM_DEGRADED: {
    key: 'SYSTEM_DEGRADED',
    subject: 'NOTICE: Operational Degradation',
    body: 'CI-EMS system running in {{mode}} mode due to {{reason}}. Synchronizations queued locally.'
  },
  CUSTOM_BROADCAST: {
    key: 'CUSTOM_BROADCAST',
    subject: '{{customSubject}}',
    body: '{{customBody}}'
  }
};

/**
  Safely renders an operational template with variable substitution
 */
export const renderOperationalTemplate = (templateKey, variables = {}) => {
  const template = OPERATIONAL_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Unknown operational template key: ${templateKey}`);
  }

  let renderedSubject = template.subject;
  let renderedBody = template.body;

  Object.entries(variables).forEach(([key, val]) => {
    const safeVal = String(val !== undefined && val !== null ? val : '');
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    renderedSubject = renderedSubject.replace(regex, safeVal);
    renderedBody = renderedBody.replace(regex, safeVal);
  });

  return {
    templateKey,
    subject: renderedSubject,
    body: renderedBody
  };
};

