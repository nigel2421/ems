// ====================================================================
// CI-EMS Offline IndexedDB Queue & Synchronization Engine
// Resilient vote tally and field report caching for remote polling stations
// ====================================================================

import { generateSecureId } from './cryptoRandom.js';

const DB_NAME = 'ems_offline_vault';
const DB_VERSION = 1;
const STORE_SUBMISSIONS = 'pending_submissions';
const STORE_CACHE = 'cached_offline_data';

let dbInstance = null;

const loadStorageItems = (key) => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(decodeURIComponent(escape(atob(raw))));
    } catch {
      return JSON.parse(raw);
    }
  } catch {
    return [];
  }
};

const saveStorageItems = (key, items) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const json = JSON.stringify(items || []);
    localStorage.setItem(key, btoa(unescape(encodeURIComponent(json))));
  } catch {
    // ignore
  }
};

const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    if (dbInstance) return resolve(dbInstance);

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        db.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Enqueue an item when offline (IndexedDB with LocalStorage fallback)
 */
export const enqueueOfflineItem = async (storeName = STORE_SUBMISSIONS, item) => {
  const queuedItem = {
    ...item,
    id: item.id || generateSecureId('OFF'),
    queuedAt: new Date().toISOString(),
    syncAttempts: 0
  };

  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(queuedItem);
      req.onsuccess = () => resolve(queuedItem);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      const storageKey = `ems_off_${storeName}`;
      const existing = loadStorageItems(storageKey);
      existing.push(queuedItem);
      saveStorageItems(storageKey, existing);
      return queuedItem;
    } catch (e) {
      console.warn('[OfflineQueue] LocalStorage fallback failed:', e);
      return queuedItem;
    }
  }
};

/**
 * Retrieve all pending items waiting to sync
 */
export const getPendingOfflineItems = async (storeName = STORE_SUBMISSIONS) => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      return loadStorageItems(`ems_off_${storeName}`);
    } catch {
      return [];
    }
  }
};

/**
 * Remove an item after successful sync
 */
export const removeOfflineItem = async (storeName = STORE_SUBMISSIONS, id) => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const storageKey = `ems_off_${storeName}`;
      const existing = loadStorageItems(storageKey);
      const filtered = existing.filter(item => item.id !== id);
      saveStorageItems(storageKey, filtered);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Automatically process all queued submissions when connection restores
 */
export const processOfflineSyncQueue = async (syncHandler) => {
  const pending = await getPendingOfflineItems(STORE_SUBMISSIONS);
  if (!pending.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await syncHandler(item);
      await removeOfflineItem(STORE_SUBMISSIONS, item.id);
      processed += 1;
    } catch (err) {
      console.warn(`[OfflineQueue] Sync failed for ${item.id}:`, err);
      failed += 1;
    }
  }

  return { processed, failed, remaining: pending.length - processed };
};

export const checkNetworkOnline = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
};
