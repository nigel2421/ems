// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.0)
// Election-Day System Mode State Machine & Graceful Degradation Engine
// ====================================================================

export const SYSTEM_MODES = {
  NORMAL: 'NORMAL',
  DEGRADED: 'DEGRADED',
  CRITICAL: 'CRITICAL',
  RECOVERY: 'RECOVERY'
};

export const MODE_CAPABILITIES = {
  [SYSTEM_MODES.NORMAL]: {
    agentCheckIn: 'AVAILABLE',
    incidentReporting: 'AVAILABLE',
    evidenceCapture: 'AVAILABLE',
    evidenceStorage: 'AVAILABLE',
    ocrEngine: 'AVAILABLE',
    reconciliationDesk: 'FULL_AUTOMATED'
  },
  [SYSTEM_MODES.DEGRADED]: {
    agentCheckIn: 'AVAILABLE',
    incidentReporting: 'AVAILABLE',
    evidenceCapture: 'AVAILABLE',
    evidenceStorage: 'AVAILABLE',
    ocrEngine: 'UNAVAILABLE_QUEUED',
    reconciliationDesk: 'LIMITED_MANUAL'
  },
  [SYSTEM_MODES.CRITICAL]: {
    agentCheckIn: 'LOCAL_QUEUE_ONLY',
    incidentReporting: 'LOCAL_QUEUE_ONLY',
    evidenceCapture: 'LOCAL_QUEUE_ONLY',
    evidenceStorage: 'LOCAL_ENCRYPTED_ONLY',
    ocrEngine: 'DISABLED',
    reconciliationDesk: 'PAUSED'
  },
  [SYSTEM_MODES.RECOVERY]: {
    agentCheckIn: 'DRAINING_QUEUE',
    incidentReporting: 'DRAINING_QUEUE',
    evidenceCapture: 'DRAINING_QUEUE',
    evidenceStorage: 'SYNCING_PRIMARY',
    ocrEngine: 'BACKLOG_PROCESSING',
    reconciliationDesk: 'RECONCILING_BATCHES'
  }
};

/**
  Transitions the system operational mode with audit state logging
 */
export const transitionSystemMode = (currentMode, targetMode, reason = 'Operator triggered') => {
  if (!Object.values(SYSTEM_MODES).includes(targetMode)) {
    throw new Error(`Invalid system mode: ${targetMode}`);
  }

  const timestamp = new Date().toISOString();
  const capabilities = MODE_CAPABILITIES[targetMode];

  return {
    previousMode: currentMode,
    currentMode: targetMode,
    reason,
    capabilities,
    transitionedAt: timestamp,
    statusMessage: `System operating mode transitioned to ${targetMode}: ${reason}`
  };
};

/**
  Normalizes local offline queues after reconnect during RECOVERY mode
 */
export const normalizeRecoveredQueue = (queuedItems = []) => {
  if (!Array.isArray(queuedItems)) return { processedCount: 0, duplicatesSkipped: 0, normalizedItems: [] };

  const seenIds = new Set();
  const normalizedItems = [];
  let duplicatesSkipped = 0;

  queuedItems.forEach(item => {
    const key = item.clientGeneratedId || item.id || item.correlation_id;
    if (seenIds.has(key)) {
      duplicatesSkipped++;
    } else {
      seenIds.add(key);
      normalizedItems.push({
        ...item,
        recoveryStatus: 'NORMALIZED_RECONCILED',
        syncedAt: new Date().toISOString()
      });
    }
  });

  return {
    processedCount: normalizedItems.length,
    duplicatesSkipped,
    normalizedItems
  };
};
