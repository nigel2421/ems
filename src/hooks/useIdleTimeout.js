import { useEffect, useState, useCallback, useRef } from 'react';
import {
  computeIdlePhase,
  IDLE_LIMIT_MS,
  IDLE_WARNING_MS,
  LAST_ACTIVITY_KEY
} from '../utils/sessionPolicy';

const THROTTLE_INTERVAL_MS = 10_000; // Throttle activity timestamps to reduce storage writes

export const useIdleTimeout = ({
  isAuthenticated,
  onTimeout,
  limitMs = IDLE_LIMIT_MS,
  warningMs = IDLE_WARNING_MS
}) => {
  const [phase, setPhase] = useState('active');
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(limitMs / 1000));
  const lastWriteRef = useRef(Date.now());

  const touchActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current > THROTTLE_INTERVAL_MS) {
      try {
        sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      } catch {
        // Ignore storage errors
      }
      lastWriteRef.current = now;
    }
  }, []);

  const stayActive = useCallback(() => {
    const now = Date.now();
    try {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch {
      // Ignore
    }
    lastWriteRef.current = now;
    setPhase('active');
    setSecondsLeft(Math.ceil(limitMs / 1000));
  }, [limitMs]);

  // Activity listeners across user interaction events
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial write
    const currentStored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    if (!currentStored) {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'visibilitychange'];
    const handleActivity = (e) => {
      if (e.type === 'visibilitychange' && document.visibilityState !== 'visible') return;
      touchActivity();
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [isAuthenticated, touchActivity]);

  // Interval check timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      let storedTime = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      const parsedTime = storedTime ? Number(storedTime) : Date.now();
      const current = computeIdlePhase(parsedTime, Date.now(), limitMs, warningMs);

      setPhase(current.phase);
      setSecondsLeft(current.secondsLeft);

      if (current.phase === 'expired') {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, onTimeout, limitMs, warningMs]);

  return {
    phase,
    secondsLeft,
    stayActive
  };
};
