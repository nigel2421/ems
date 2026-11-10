// ====================================================================
// KuraTech Idle Session Policy (QA DEF-02 / AUTH-12)
// Pure helpers so the timing rules can be unit-tested in Node.
// ====================================================================

export const IDLE_LIMIT_MS = 15 * 60 * 1000; // sign out after 15 min idle
export const IDLE_WARNING_MS = 13 * 60 * 1000; // warn at 13 min
export const LAST_ACTIVITY_KEY = 'ems_last_activity_at';
export const LOGOUT_REASON_KEY = 'ems_logout_reason';

/**
 * Returns 'active' | 'warning' | 'expired' and seconds left before sign-out.
 */
export const computeIdlePhase = (
  lastActivityAt,
  now = Date.now(),
  limitMs = IDLE_LIMIT_MS,
  warningMs = IDLE_WARNING_MS
) => {
  const last = Number(lastActivityAt);
  if (!Number.isFinite(last) || last <= 0) {
    return { phase: 'active', secondsLeft: Math.ceil(limitMs / 1000) };
  }
  const idle = Math.max(0, now - last);
  const secondsLeft = Math.max(0, Math.ceil((limitMs - idle) / 1000));
  if (idle >= limitMs) return { phase: 'expired', secondsLeft: 0 };
  if (idle >= warningMs) return { phase: 'warning', secondsLeft };
  return { phase: 'active', secondsLeft };
};

export const isSessionExpired = (lastActivityAt, now = Date.now(), limitMs = IDLE_LIMIT_MS) =>
  computeIdlePhase(lastActivityAt, now, limitMs, limitMs).phase === 'expired';
