// Stored role values remain compatible with existing accounts and permission checks.
export const getRoleDisplayName = (role) => ['Agent', 'Field Agent'].includes(role) ? 'Polling Station Coordinator' : role;
