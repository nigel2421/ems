/**
 * URL and Media Sanitizer
 * Mitigates DOM text reinterpreted as HTML / XSS vulnerabilities
 * by validating that dynamic image and media URLs conform strictly to safe protocols.
 */

const SAFE_URL_PATTERN = /^(https?:\/\/|\/|blob:|data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,)/i;

/**
 * Validates and sanitizes media URLs before passing to img.src or media elements.
 * Rejects javascript:, data:text/html, vbscript:, and malformed strings.
 */
export const sanitizeMediaUrl = (url, fallback = '') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Block any dangerous scheme
  if (/^(javascript|vbscript|data:(?!image\/))/i.test(trimmed)) {
    return fallback;
  }

  // Check against safe protocol pattern
  if (SAFE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Allow relative paths starting with ./ or alphanumeric asset paths
  if (/^(\.\/|[a-zA-Z0-9_\-./]+\.(png|jpg|jpeg|webp|svg|gif))$/i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
};
