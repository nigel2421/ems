// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Idempotent Sync Engine & Extended State Machine
// ====================================================================

export const SYNC_STATES = {
  LOCAL_CREATED: 'LOCAL_CREATED',
  LOCAL_HASHED: 'LOCAL_HASHED',
  QUEUED: 'QUEUED',
  SYNC_ATTEMPT: 'SYNC_ATTEMPT',
  SERVER_RECEIVED: 'SERVER_RECEIVED',
  SERVER_HASH_VERIFIED: 'SERVER_HASH_VERIFIED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  SYNCHRONIZED: 'SYNCHRONIZED'
};

export const SYNC_FAILURE_REASONS = {
  NETWORK_FAILED: 'NETWORK_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  HASH_MISMATCH: 'HASH_MISMATCH',
  CONFLICT: 'CONFLICT',
  SERVER_REJECTED: 'SERVER_REJECTED',
  RETRY_PENDING: 'RETRY_PENDING'
};

/**
  Creates an idempotent sync operation payload wrapper
 */
export const createSyncOperation = (payload = {}, deviceId = 'DEV-001', sequenceNumber = 1) => {
  const timestamp = new Date().toISOString();
  const clientGeneratedId = payload.clientGeneratedId || `CLI-OP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    operationId: `OP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clientGeneratedId,
    idempotencyKey: clientGeneratedId,
    deviceId,
    sequenceNumber,
    createdAtDevice: timestamp,
    receivedAtServer: null,
    payloadHash: payload.payloadHash || '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    payload,
    retryCount: 0,
    syncStatus: SYNC_STATES.LOCAL_CREATED,
    failureReason: null,
    serverAckId: null
  };
};

/**
  Processes an operation with server-side Idempotency Key deduplication
 */
export const processSyncOperationWithIdempotency = (operation, serverRegistry = new Map()) => {
  if (!operation || !operation.clientGeneratedId) {
    throw new Error('Invalid sync operation: missing clientGeneratedId');
  }

  const existingAck = serverRegistry.get(operation.clientGeneratedId);
  if (existingAck) {
    // Idempotent replay hit: return original acknowledgement without reprocessing
    return {
      isDuplicateHit: true,
      serverAckId: existingAck.serverAckId,
      status: SYNC_STATES.SYNCHRONIZED,
      receivedAtServer: existingAck.receivedAtServer,
      message: 'Duplicate submission detected: Returned existing server acknowledgement (Idempotent)'
    };
  }

  const timestamp = new Date().toISOString();
  const serverAckId = `ACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const ackRecord = {
    serverAckId,
    clientGeneratedId: operation.clientGeneratedId,
    receivedAtServer: timestamp,
    payloadHash: operation.payloadHash,
    status: SYNC_STATES.SYNCHRONIZED
  };

  serverRegistry.set(operation.clientGeneratedId, ackRecord);

  return {
    isDuplicateHit: false,
    serverAckId,
    status: SYNC_STATES.SYNCHRONIZED,
    receivedAtServer: timestamp,
    message: 'Operation successfully synchronized & server ACK created'
  };
};
