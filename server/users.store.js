// ====================================================================
// KuraTech Server Users Store
// Stores users with scrypt password hashes outside web root
// Non-destructive: preserves existing VPS user accounts and merges baseline personas
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';
import { BASELINE_PERSONAS } from './baseline-personas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_USERS_FILE = path.join(__dirname, '..', '.data', 'users.json');

export const getUsersFilePath = () => {
  if (process.env.USERS_FILE) return process.env.USERS_FILE;
  if (process.env.EMS_DATA_DIR) return path.join(process.env.EMS_DATA_DIR, 'users.json');
  return DEFAULT_USERS_FILE;
};

export const loadUsers = () => {
  const filePath = getUsersFilePath();
  let users = [];
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      users = JSON.parse(content) || [];
    }
  } catch (err) {
    console.error('[UsersStore] Error loading users file:', err);
  }

  // Cross-location preservation: If /var/lib/ems/users.json exists on Linux
  // and has accounts not present in primary users file, include them seamlessly
  if (process.platform === 'linux' && filePath !== '/var/lib/ems/users.json') {
    try {
      if (fs.existsSync('/var/lib/ems/users.json')) {
        const vlibContent = fs.readFileSync('/var/lib/ems/users.json', 'utf8');
        const vlibUsers = JSON.parse(vlibContent) || [];
        const existingEmails = new Set(users.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean));
        for (const vUser of vlibUsers) {
          if (vUser && vUser.email && !existingEmails.has(vUser.email.toLowerCase().trim())) {
            users.push(vUser);
            existingEmails.add(vUser.email.toLowerCase().trim());
          }
        }
      }
    } catch {
      // Non-fatal fallback
    }
  }

  return users;
};

export const saveUsers = (users = []) => {
  const filePath = getUsersFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const backup = `${filePath}.bak`;
  if (fs.existsSync(filePath)) {
    try { fs.copyFileSync(filePath, backup); } catch { /* ignore */ }
  }
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
};

/**
 * Non-destructive baseline user ensure & merge.
 * Reads existing user store on VPS/local.
 * Preserves ALL custom accounts created on VPS untouched.
 * Only appends missing baseline personas (Super Admin, etc.) if not already present.
 */
export const ensureBaselineUsers = () => {
  const existingUsers = loadUsers();
  const existingEmails = new Set(
    existingUsers.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean)
  );
  const existingPhones = new Set(
    existingUsers.map(u => (u.phone || '').replace(/\s+/g, '').toLowerCase()).filter(Boolean)
  );

  const missingPersonas = BASELINE_PERSONAS.filter(p => {
    const pEmail = (p.email || '').toLowerCase().trim();
    const pPhone = (p.phone || '').replace(/\s+/g, '').toLowerCase();
    return !existingEmails.has(pEmail) && !existingPhones.has(pPhone);
  });

  if (missingPersonas.length === 0) {
    return existingUsers;
  }

  console.log(`[UsersStore] Merging ${missingPersonas.length} baseline accounts into store (preserving ${existingUsers.length} existing accounts)...`);

  const newRecords = missingPersonas.map(({ password, ...persona }) => ({
    ...persona,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  }));

  const merged = [...existingUsers, ...newRecords];
  saveUsers(merged);
  return merged;
};

export const findUserByEmail = (email) => {
  if (!email) return null;
  const norm = String(email).trim().toLowerCase();
  let users = loadUsers();
  if (users.length === 0) {
    users = ensureBaselineUsers();
  }
  return users.find(u => (u.email || '').toLowerCase() === norm) || null;
};

export const findUserById = (id) => {
  if (!id) return null;
  let users = loadUsers();
  if (users.length === 0) {
    users = ensureBaselineUsers();
  }
  return users.find(u => u.id === id) || null;
};

export const findUserByPhone = (phone) => {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\s+/g, '').toLowerCase();
  let users = loadUsers();
  if (users.length === 0) {
    users = ensureBaselineUsers();
  }
  return users.find(u => (u.phone || '').replace(/\s+/g, '').toLowerCase() === cleanPhone) || null;
};

export const updateUserInStore = (userId, updates = {}) => {
  const users = loadUsers();
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  saveUsers(updated);
  return updated.find(u => u.id === userId) || null;
};
