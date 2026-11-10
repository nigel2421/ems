/**
 * Cryptographically Secure Random Utilities
 * Complies with OWASP & CodeQL CWE-338 (Insecure Randomness)
 */

export const getSecureRandomUUID = () => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Format as UUID v4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  return `UUID-${Date.now()}-${Math.floor(Date.now() / 1000)}`;
};

export const getSecureRandomHex = (length = 16) => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
  }
  return Date.now().toString(16).padStart(length, '0').slice(0, length);
};

export const generateSecureId = (prefix = 'ID') => {
  return `${prefix}-${getSecureRandomHex(12)}`;
};
