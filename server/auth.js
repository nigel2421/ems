// ====================================================================
// CI-EMS Server Authentication & Host-Bound Realm Guard
// Zero external dependencies - pure Node.js crypto & timing-safe checks
// ====================================================================

import crypto from 'node:crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'ci-ems-default-dev-secret-replace-in-production-2026';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const ADMIN_ROLES = new Set(['Super Admin', 'Admin']);

export const isAdminRole = (role) => ADMIN_ROLES.has(role);

/**
 * Derives realm from Host / X-Forwarded-Host header.
 * Returns 'admin' if host matches any configured admin domain, else 'user'.
 */
export const resolveRealm = (hostHeader = '', adminHosts = process.env.ADMIN_HOSTS) => {
  const host = (hostHeader || '').split(':')[0].toLowerCase().trim();
  const configured = (adminHosts || 'ops-konsole.kuratech.site,ops-konsole.localhost')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);

  if (configured.includes(host)) return 'admin';
  return 'user';
};

/**
 * scrypt password hashing: returns salt:derivedKey
 */
export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

/**
 * Timing-safe scrypt password verification
 */
export const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    if (derived.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derived, keyBuffer);
  } catch {
    return false;
  }
};

/**
 * Signs an HMAC-SHA256 session token
 */
export const signToken = (payload, secret = SESSION_SECRET) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + TOKEN_TTL_MS;
  const fullPayload = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
};

/**
 * Verifies and decodes an HMAC-SHA256 session token
 */
export const verifyToken = (token, secret = SESSION_SECRET) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [b64Header, b64Payload, sig] = parts;
  const data = `${b64Header}.${b64Payload}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');

  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null; // expired
    return payload;
  } catch {
    return null;
  }
};

// ====================================================================
// Server-Side Lockout Tracker (keyed by email, survives client storage clearing)
// ====================================================================
const MAX_ATTEMPTS = 5;
const LOCK_STEPS_MS = [30_000, 120_000, 300_000, 900_000];
const lockoutStore = new Map();

export const getLockoutState = (email, now = Date.now()) => {
  const norm = String(email || '').trim().toLowerCase();
  const rec = lockoutStore.get(norm);
  if (!rec) return { locked: false, failures: 0 };
  if (rec.blocked) return { locked: true, permanent: true, blockedAt: rec.blockedAt };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { locked: true, permanent: false, retryInMs: rec.lockedUntil - now };
  }
  return { locked: false, failures: rec.failures || 0 };
};

export const recordFailedAttempt = (email, now = Date.now()) => {
  const norm = String(email || '').trim().toLowerCase();
  const rec = lockoutStore.get(norm) || { failures: 0, lockLevel: 0, lockedUntil: null, blocked: false };

  if (rec.blocked) return rec;
  rec.failures += 1;

  if (rec.failures >= MAX_ATTEMPTS) {
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
  lockoutStore.set(norm, rec);
  return rec;
};

export const resetFailedAttempts = (email) => {
  const norm = String(email || '').trim().toLowerCase();
  lockoutStore.delete(norm);
};

export const adminUnlockUser = (email) => resetFailedAttempts(email);
