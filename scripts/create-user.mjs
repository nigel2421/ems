// ====================================================================
// CI-EMS CLI: Create User with scrypt Hash
// Usage: node scripts/create-user.mjs --email admin@example.com --role "Super Admin" --name "Jane Doe" --password "Secret123!"
// ====================================================================

import { hashPassword } from '../server/auth.js';
import { loadUsers, saveUsers, findUserByEmail } from '../server/users.store.js';

const parseArgs = (argv) => {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
};

const args = parseArgs(process.argv);
const { email, password, role = 'Agent', name = 'Campaign User', county, constituency, ward } = args;

if (!email || !password) {
  console.error('Usage: node scripts/create-user.mjs --email <email> --password <password> --role <role> --name <name>');
  process.exit(1);
}

const existing = findUserByEmail(email);
if (existing) {
  console.error(`Error: User with email "${email}" already exists.`);
  process.exit(1);
}

const users = loadUsers();
const newUser = {
  id: `USR-${Date.now().toString().slice(-6)}`,
  name,
  role,
  email: String(email).trim().toLowerCase(),
  passwordHash: hashPassword(password),
  county: county || null,
  constituency: constituency || null,
  ward: ward || null,
  createdAt: new Date().toISOString()
};

users.unshift(newUser);
saveUsers(users);

console.log(`[Success] User "${email}" created with role "${role}" (ID: ${newUser.id}).`);
