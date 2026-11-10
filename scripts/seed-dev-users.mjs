// ====================================================================
// KuraTech Seed Dev Users Script
// Safely merges baseline personas into server user store (.data/users.json)
// Non-destructive: preserves any existing VPS accounts
// ====================================================================

import { fileURLToPath } from 'node:url';
import { ensureBaselineUsers } from '../server/users.store.js';

export const seedDevUsers = () => {
  const users = ensureBaselineUsers();
  console.log(`[Seed] User store now contains ${users.length} total active users.`);
  return users;
};

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDevUsers();
}
