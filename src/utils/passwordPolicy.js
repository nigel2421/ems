// ====================================================================
// KuraTech Password Policy & Complexity Engine
// Enforces password standards for newly provisioned candidate & agent accounts
// Ensures existing demo personas remain backward-compatible
// ====================================================================

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

/**
 * Validates password complexity against Kura Tech security requirements.
 * Requires: >=8 chars, uppercase, lowercase, digit, and special char.
 */
export const checkPasswordComplexity = (password = '') => {
  const str = String(password || '');
  const errors = [];

  if (str.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(str)) {
    errors.push('Must include at least one uppercase letter (A-Z)');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(str)) {
    errors.push('Must include at least one lowercase letter (a-z)');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(str)) {
    errors.push('Must include at least one number (0-9)');
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(str)) {
    errors.push('Must include at least one special character (!@#$%^&*...)');
  }

  // Calculate strength score 0-4
  let score = 0;
  if (str.length >= 8) score++;
  if (/[A-Z]/.test(str) && /[a-z]/.test(str)) score++;
  if (/[0-9]/.test(str)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(str)) score++;

  return {
    isValid: errors.length === 0,
    score,
    errors,
    strengthLabel: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score] || 'Very Weak'
  };
};

/**
 * Validates if password and confirmation match.
 * Requires both to be non-empty strings.
 */
export const passwordsMatch = (password, confirmation) => {
  if (!password || !confirmation) return false;
  return String(password) === String(confirmation);
};

/**
 * Normalizes a Kenyan phone number into last 9 digits for duplicate detection.
 * Examples: '+254 712 345 678', '0712345678', '254712345678' -> '712345678'
 */
export const cleanKenyanPhoneNumber = (phone = '') => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
};

/**
 * Checks whether a phone number already exists in either users or agents directory.
 */
export const isDuplicatePhoneNumber = (phone = '', users = [], agents = []) => {
  const normalized = cleanKenyanPhoneNumber(phone);
  if (!normalized || normalized.length < 7) return false;

  const inUsers = (users || []).some(u => {
    if (!u.phone) return false;
    return cleanKenyanPhoneNumber(u.phone) === normalized;
  });
  if (inUsers) return true;

  const inAgents = (agents || []).some(a => {
    if (!a.phone) return false;
    return cleanKenyanPhoneNumber(a.phone) === normalized;
  });
  return inAgents;
};

