// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Break-Glass Emergency Administrative Access & Elevation Engine
// ====================================================================

import { ROLES } from './rbac.js';

export const DEFAULT_BREAK_GLASS_DURATION_MINUTES = 15;

/**
  Creates a Break-Glass emergency access request
 */
export const createBreakGlassRequest = (user, reason = '', targetScope = 'Nairobi Campaign', durationMinutes = DEFAULT_BREAK_GLASS_DURATION_MINUTES) => {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Break-Glass Request Rejected: Detailed operational reason required (min 10 chars)');
  }

  const timestamp = new Date();
  const expiresAt = new Date(timestamp.getTime() + durationMinutes * 60 * 1000);

  return {
    requestId: `BG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requestedBy: user?.name || user?.email || 'User',
    requesterId: user?.id || 'USR-01',
    requesterRole: user?.role || 'Admin',
    reason,
    targetScope,
    durationMinutes,
    status: 'PENDING_APPROVAL',
    approvedBy: null,
    approvedAt: null,
    createdAt: timestamp.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isElevated: false
  };
};

/**
  Approves a Break-Glass request (Approver !== Requester constraint)
 */
export const approveBreakGlassRequest = (request, approverUser) => {
  if (!request || request.status !== 'PENDING_APPROVAL') {
    throw new Error('Invalid Break-Glass request or request already processed');
  }

  if (request.requesterId === approverUser.id) {
    throw new Error('Maker-Checker Violation: Break-glass requester cannot approve their own administrative elevation');
  }

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(approverUser.role)) {
    throw new Error('Unauthorized: Insufficient privileges to approve Break-Glass elevation');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + request.durationMinutes * 60 * 1000);

  return {
    ...request,
    status: 'APPROVED',
    approvedBy: approverUser.name || approverUser.email,
    approvedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isElevated: true
  };
};

/**
  Evaluates whether a Break-Glass elevation is currently active or expired
 */
export const isBreakGlassActive = (request, now = new Date()) => {
  if (!request || !request.isElevated || request.status !== 'APPROVED') {
    return false;
  }

  const expiryTime = new Date(request.expiresAt).getTime();
  const currentTime = new Date(now).getTime();

  return currentTime < expiryTime;
};
