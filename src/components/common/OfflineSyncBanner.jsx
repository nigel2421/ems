import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getPendingOfflineItems, processOfflineSyncQueue } from '../../utils/offlineQueue';

export const OfflineSyncBanner = ({ onSyncItem }) => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);

  const checkQueue = async () => {
    try {
      const items = await getPendingOfflineItems();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (typeof onSyncItem === 'function') {
        await processOfflineSyncQueue(onSyncItem);
      }
      await checkQueue();
      setLastSyncedTime(new Date().toLocaleTimeString());
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Clean UI when fully online and synced
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: '600',
        backgroundColor: !isOnline ? '#991b1b' : '#065f46',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!isOnline ? (
          <>
            <WifiOff size={16} />
            <span>Offline Mode Active — Submissions are securely queued on this device</span>
          </>
        ) : (
          <>
            <Wifi size={16} />
            <span>Connection Restored — {pendingCount} offline records pending upload</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={triggerSync}
            disabled={!isOnline || isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              cursor: isOnline && !isSyncing ? 'pointer' : 'default',
              opacity: !isOnline ? 0.6 : 1
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
            <span>{isSyncing ? 'Syncing...' : `Sync Queue (${pendingCount})`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
