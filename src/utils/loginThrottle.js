// ====================================================================
// CI-EMS Login Throttle (QA DEF-01 / AUTH-09)
// --------------------------------------------------------------------
// Escalating lockout after repeated failed sign-ins:
//   5 failures -> 30 s, next 5 -> 2 min, next 5 -> 5 min, next 5 -> 15 min,
//   next 5 -> PERMANENT block until an administrator restores access.
//
// Records are keyed by normalised email whether or not the account exists,
// so locked responses never reveal which emails are registered (AUTH-04).
//
// NOTE: This runs client-side (static hosting). It protects normal users
// and satisfies the QA case, but must be enforced server-side once a
// backend exists.
// ====================================================================

export const THROTTLE_STORAGE_KEY = 'ems_login_throttle';
export const MAX_ATTEMPTS_PER_STEP = 5;
export const LOCK_STEPS_MS = [30_000, 120_000, 300_000, 900_000];

export const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

const emptyRecord = () => ({ failures: 0, lockLevel: 0, lockedUntil: null, blocked: false, blockedAt: null });

/**
 * Returns the current lock state for an email.
 * { locked: false } | { locked: true, permanent: boolean, retryInMs?: number }
 */
export const getLockState = (store, email, now = Date.now()) => {
  const rec = store?.[normaliseEmail(email)];
  if (!rec) return { locked: false, failures: 0 };
  if (rec.blocked) return { locked: true, permanent: true, blockedAt: rec.blockedAt };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { locked: true, permanent: false, retryInMs: rec.lockedUntil - now };
  }
  return { locked: false, failures: rec.failures || 0 };
};

/**
 * Records a failed attempt and returns the new store (immutable).
 */
export const recordFailure = (store, email, now = Date.now()) => {
  const key = normaliseEmail(email) || 'unknown@user';
  const rec = { ...emptyRecord(), ...(store?.[key] || {}) };
  if (rec.blocked) return { ...store, [key]: rec };

  rec.failures += 1;
  if (rec.failures >= MAX_ATTEMPTS_PER_STEP) {
    rec.failures = 0;
    if (rec.lockLevel >= LOCK_STEPS_MS.length) {
      rec.blocked = true;
      rec.blockedAt = new Date(now).toISOString();
      rec.lockedUntil = null;
    } else {
      rec.lockedUntil = now + LOCK_STEPS_MS[rec.lockLevel];
      rec.lockLevel += 1;
    }
  }
  return { ...store, [key]: rec };
};

/** Clears the record after a successful sign-in. */
export const recordSuccess = (store, email) => {
  const key = normaliseEmail(email);
  if (!store?.[key]) return store || {};
  const { [key]: _removed, ...rest } = store;
  return rest;
};

/** Administrator action: fully restores access for an email. */
export const adminUnlock = (store, email) => recordSuccess(store, email);

/** Human readable "m:ss" countdown. */
export const formatRetry = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export const loadThrottleStore = (storage = globalThis.localStorage) => {
  try {
    const raw = storage?.getItem(THROTTLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveThrottleStore = (store, storage = globalThis.localStorage) => {
  try {
    storage?.setItem(THROTTLE_STORAGE_KEY, JSON.stringify(store || {}));
  } catch {
    /* storage full or unavailable */
  }
};
