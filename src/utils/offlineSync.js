// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.2)
// Offline Sync Queue & Conflict Resolution Engine
// ====================================================================

import { calculateEvidenceHash } from './evidenceVault.js';

const QUEUE_STORAGE_KEY = 'ems_offline_sync_queue';

/**
 * Enqueues an offline submission or incident report locally with UUID & base version tracking
 */
export const enqueueOfflineItem = async (payload, type = 'SUBMISSION') => {
  try {
    const queue = getOfflineQueue();
    const payloadHash = await calculateEvidenceHash(payload);
    const clientUuid = payload.clientUuid || `UUID-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const queueItem = {
      clientSubmissionUuid: clientUuid,
      serverSubmissionId: null,
      logicalRecordId: payload.stationId || payload.pollingUnitId || 'STATION-GENERIC',
      version: (payload.version || 1),
      baseVersion: payload.baseVersion || 1,
      type,
      payload: { ...payload, clientUuid },
      payloadHash,
      createdAtDevice: new Date().toISOString(),
      retryCount: 0,
      status: 'QUEUED'
    };

    queue.push(queueItem);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return queueItem;
  } catch (e) {
    return null;
  }
};

export const getOfflineQueue = () => {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Sync Engine with Conflict Group Detection
 */
export const processOfflineSyncQueue = async (apiSyncCallback) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, remainingCount: 0, conflictGroups: [] };

  const remaining = [];
  const conflictGroups = [];
  const processedStations = new Map();
  let syncedCount = 0;

  for (const item of queue) {
    try {
      // Check for competing offline submissions for the same station
      if (processedStations.has(item.logicalRecordId)) {
        const existingItem = processedStations.get(item.logicalRecordId);
        conflictGroups.push({
          conflictId: `CONFLICT-${Date.now()}`,
          logicalRecordId: item.logicalRecordId,
          submissions: [existingItem, item],
          status: 'FLAGGED_FOR_REVIEW'
        });
        item.status = 'CONFLICT_GROUP';
        remaining.push(item);
        continue;
      }

      processedStations.set(item.logicalRecordId, item);

      if (apiSyncCallback) {
        await apiSyncCallback(item);
      }
      syncedCount++;
    } catch (e) {
      item.retryCount += 1;
      item.status = 'RETRY_FAILED';
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
  return {
    syncedCount,
    remainingCount: remaining.length,
    conflictGroups
  };
};
