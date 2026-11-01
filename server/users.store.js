// ====================================================================
// CI-EMS Server Users Store
// Stores users with scrypt password hashes outside web root
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_USERS_FILE = path.join(__dirname, '..', '.data', 'users.json');

export const getUsersFilePath = () => process.env.USERS_FILE || DEFAULT_USERS_FILE;

export const loadUsers = () => {
  const filePath = getUsersFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[UsersStore] Error loading users file:', err);
  }
  return [];
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

export const findUserByEmail = (email) => {
  if (!email) return null;
  const norm = String(email).trim().toLowerCase();
  const users = loadUsers();
  return users.find(u => (u.email || '').toLowerCase() === norm) || null;
};

export const findUserById = (id) => {
  if (!id) return null;
  const users = loadUsers();
  return users.find(u => u.id === id) || null;
};
