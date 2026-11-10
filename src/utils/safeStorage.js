// Unified storage security: Base64 URL-safe obfuscation for sensitive data
// Supports both new encoded data and legacy plaintext strings (backward compatible)

export const safeStorage = {
  setItem: (key, value) => {
    try {
      const jsonStr = JSON.stringify(value);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      localStorage.setItem(key, encoded);
    } catch (e) {
      console.warn(`[EMS] Storage failure for ${key}:`, e);
    }
  },
  getItem: (key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      // If looks like Base64, decode it
      const decoded = decodeURIComponent(escape(atob(raw)));
      return JSON.parse(decoded);
    } catch (e) {
      // Legacy support: return as raw if not Base64
      try { return JSON.parse(raw); } catch { return raw; }
    }
  }
};

export const sanitizeUrl = (url = '', origin = 'https://kuratech.site') => {
  if (!url) return '#';
  try {
    const parsed = new URL(url, origin);
    const allowed = ['http:', 'https:', 'blob:', 'data:'];
    if (allowed.includes(parsed.protocol)) {
      return parsed.href;
    }
    return '#';
  } catch {
    return '#';
  }
};
