import { checkPasswordComplexity, passwordsMatch } from './passwordPolicy.js';

export const validateCoordinatorStep = (step, values) => {
  if (step === 0) {
    if (!values.name?.trim()) return 'Enter the coordinator’s full name.';
    const phone = String(values.phone || '').replace(/[\s()-]/g, '');
    if (!/^(?:\+?254|0)[17]\d{8}$/.test(phone)) return 'Enter a valid Kenyan phone number, such as 0712345678 or +254712345678.';
    if (values.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Enter a valid email address or leave it empty.';
  }
  if (step === 1) {
    const location = values.locationMeta || {};
    if (!location.complete || location.effectiveScope?.failClosed || !location.pollingStationId) return 'Select a polling station within your assigned electoral scope.';
  }
  if (step === 2) {
    const complexity = checkPasswordComplexity(values.password);
    if (!complexity.isValid) return complexity.errors.join(' · ');
    if (!passwordsMatch(values.password, values.passwordConfirm)) return 'Passwords do not match. Please confirm the account password.';
  }
  return '';
};
