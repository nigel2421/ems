// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Device Registration, Revocation & Multi-Device Security Model
// ====================================================================

export const DEVICE_STATUSES = {
  ACTIVE: 'ACTIVE',
  UNREGISTERED: 'UNREGISTERED',
  MULTIPLE_ACTIVE: 'MULTIPLE_ACTIVE',
  REVOKED: 'REVOKED'
};

const deviceDb = new Map();

/**
  Registers an agent device binding (USER + DEVICE + TENANT + CAMPAIGN + ASSIGNMENT)
 */
export const registerDevice = (user = {}, deviceMeta = {}) => {
  const deviceId = deviceMeta.deviceId || `DEV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const record = {
    deviceId,
    userId: user.id || 'USR-AGENT-01',
    userName: user.name || 'Field Agent',
    tenantId: user.tenantId || 'TNT-DEFAULT',
    campaignId: user.campaignId || 'CMP-2027',
    assignmentId: user.assignedEntity || user.ward || 'Station-01',
    deviceType: deviceMeta.deviceType || 'Mobile PWA Handset',
    status: DEVICE_STATUSES.ACTIVE,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  deviceDb.set(deviceId, record);
  return record;
};

/**
  Validates if a device is authorized to submit data for a user
 */
export const validateDeviceStatus = (deviceId, user = {}) => {
  const record = deviceDb.get(deviceId);
  if (!record) {
    return {
      isValid: false,
      status: DEVICE_STATUSES.UNREGISTERED,
      reason: 'Unregistered Device: Verification required before submitting data'
    };
  }

  if (record.status === DEVICE_STATUSES.REVOKED) {
    return {
      isValid: false,
      status: DEVICE_STATUSES.REVOKED,
      reason: 'REVOKED DEVICE: Authorization revoked by campaign security desk'
    };
  }

  if (record.userId !== user.id) {
    return {
      isValid: false,
      status: DEVICE_STATUSES.UNREGISTERED,
      reason: 'Device binding mismatch: Registered to another user account'
    };
  }

  return {
    isValid: true,
    status: DEVICE_STATUSES.ACTIVE,
    record
  };
};

/**
  Revokes a device binding (Administrative security control)
 */
export const revokeDevice = (deviceId, adminUser = {}) => {
  const record = deviceDb.get(deviceId);
  if (!record) {
    throw new Error(`Device ${deviceId} not found`);
  }

  const updated = {
    ...record,
    status: DEVICE_STATUSES.REVOKED,
    revokedAt: new Date().toISOString(),
    revokedBy: adminUser.name || adminUser.email || 'Security Administrator'
  };

  deviceDb.set(deviceId, updated);
  return updated;
};
