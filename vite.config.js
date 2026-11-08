import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import {
  resolveRealm,
  verifyPassword,
  signToken,
  verifyToken,
  isAdminRole,
  getLockoutState,
  recordFailedAttempt,
  resetFailedAttempts,
  adminUnlockUser
} from './server/auth.js'
import { loadUsers, findUserByEmail, findUserById, findUserByPhone } from './server/users.store.js'
import { computeCountyIntelligence, runPoliticalIntelligenceSweep } from './server/agents/political-intelligence-agent.mjs'

const parseCookies = (req) => {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

const extractTokenFromReq = (req) => {
  const cookies = parseCookies(req);
  if (cookies.ems_sid) return cookies.ems_sid;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
};

// Vite dev middleware for Common DB API & Manifest routing
function emsDevServerPlugin() {
  const dbFile = path.resolve(__dirname, 'ems_server_db.json');
  const manifestFile = path.resolve(__dirname, 'public', 'manifest.json');

  const loadDb = () => {
    try {
      if (fs.existsSync(dbFile)) {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      }
    } catch {
      // fallback
    }
    return {
      strategyMembers: [],
      strategyTasks: [],
      campaignRoadmap: [],
      strategyMeetings: [],
      agents: [],
      tallyResults: [],
      fieldReports: [],
      surveys: [],
      stakeholders: [],
      submissions: []
    };
  };

  const saveDb = (data) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[EMS Dev Server] Could not write DB file:', e);
    }
  };

  return {
    name: 'ems-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const host = (req.headers.host || '').split(':')[0].toLowerCase();
        const url = req.url ? req.url.split('?')[0] : '';

        // Route ops-konsole.* to admin.html in Vite dev
        if (host.startsWith('ops-konsole.') && (url === '/' || url === '/index.html')) {
          req.url = '/admin.html';
        }

        // Serve manifest.json at root and with correct MIME type
        if (url === '/manifest.json' || url === '/ems/manifest.json') {
          if (fs.existsSync(manifestFile)) {
            res.setHeader('Content-Type', 'application/manifest+json');
            res.writeHead(200);
            return res.end(fs.readFileSync(manifestFile, 'utf8'));
          }
        }

        // Handle Authentication: POST /api/auth/login
        if (req.method === 'POST' && (url === '/api/auth/login' || url === '/ems/api/auth/login')) {
          res.setHeader('Content-Type', 'application/json');
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body || '{}');
              const cleanEmail = String(email || '').trim().toLowerCase();
              const currentRealm = host.startsWith('ops-konsole.') ? 'admin' : 'user';

              const lock = getLockoutState(cleanEmail);
              if (lock.locked) {
                res.writeHead(401);
                return res.end(JSON.stringify({
                  success: false,
                  locked: true,
                  permanent: !!lock.permanent,
                  retryInMs: lock.retryInMs || 0,
                  error: lock.permanent
                    ? 'This account has been locked after repeated failed sign-in attempts. Contact your system administrator to restore access.'
                    : 'Too many failed sign-in attempts. Please wait before trying again.'
                }));
              }

              const user = findUserByEmail(cleanEmail) || findUserByPhone(cleanEmail);
              const passwordMatches = user && verifyPassword(password, user.passwordHash);

              if (!user || !passwordMatches) {
                recordFailedAttempt(cleanEmail);
                res.writeHead(401);
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Invalid email address or password credentials.'
                }));
              }

              if (user.isSuspended || user.status === 'Suspended') {
                res.writeHead(403);
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Account has been suspended by administration. Contact campaign operations.'
                }));
              }

              const userIsAdmin = isAdminRole(user.role);
              if (userIsAdmin && currentRealm !== 'admin') {
                recordFailedAttempt(cleanEmail);
                res.writeHead(401);
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Invalid email address or password credentials.'
                }));
              }

              if (!userIsAdmin && currentRealm === 'admin') {
                recordFailedAttempt(cleanEmail);
                res.writeHead(401);
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Invalid email address or password credentials.'
                }));
              }

              resetFailedAttempts(cleanEmail);
              const token = signToken({
                uid: user.id,
                role: user.role,
                realm: currentRealm,
                name: user.name,
                email: user.email
              });

              res.setHeader('Set-Cookie', `ems_sid=${token}; Path=/; HttpOnly; SameSite=Strict`);
              res.writeHead(200);
              return res.end(JSON.stringify({
                success: true,
                token,
                realm: currentRealm,
                user: sanitizeUser(user)
              }));
            } catch (err) {
              res.writeHead(400);
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Authentication: POST /api/auth/logout
        if (req.method === 'POST' && (url === '/api/auth/logout' || url === '/ems/api/auth/logout')) {
          res.setHeader('Set-Cookie', 'ems_sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        }

        // Handle Authentication: GET /api/auth/me
        if (req.method === 'GET' && (url === '/api/auth/me' || url === '/ems/api/auth/me')) {
          res.setHeader('Content-Type', 'application/json');
          const currentRealm = host.startsWith('ops-konsole.') ? 'admin' : 'user';
          const rawToken = extractTokenFromReq(req);
          const decoded = verifyToken(rawToken);

          if (!decoded || (decoded.realm && decoded.realm !== currentRealm)) {
            res.writeHead(401);
            return res.end(JSON.stringify({ authenticated: false }));
          }

          const user = findUserById(decoded.uid) || findUserByEmail(decoded.email);
          res.writeHead(200);
          return res.end(JSON.stringify({
            authenticated: true,
            realm: currentRealm,
            user: sanitizeUser(user) || decoded
          }));
        }

        // Handle Admin Users: GET /api/admin/users
        if (req.method === 'GET' && (url === '/api/admin/users' || url === '/ems/api/admin/users')) {
          res.setHeader('Content-Type', 'application/json');
          const rawToken = extractTokenFromReq(req);
          const decoded = verifyToken(rawToken);

          if (!decoded || decoded.realm !== 'admin' || !isAdminRole(decoded.role)) {
            res.writeHead(403);
            return res.end(JSON.stringify({ error: 'Access denied: Admin realm credentials required.' }));
          }

          const users = loadUsers().map(sanitizeUser);
          res.writeHead(200);
          return res.end(JSON.stringify(users));
        }

        // Handle Admin Unlock: POST /api/admin/unlock
        if (req.method === 'POST' && (url === '/api/admin/unlock' || url === '/ems/api/admin/unlock')) {
          res.setHeader('Content-Type', 'application/json');
          const rawToken = extractTokenFromReq(req);
          const decoded = verifyToken(rawToken);

          if (!decoded || decoded.realm !== 'admin' || !isAdminRole(decoded.role)) {
            res.writeHead(403);
            return res.end(JSON.stringify({ error: 'Access denied: Admin realm credentials required.' }));
          }

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { email } = JSON.parse(body || '{}');
              adminUnlockUser(email);
              res.writeHead(200);
              return res.end(JSON.stringify({ success: true, unlocked: email }));
            } catch (err) {
              res.writeHead(400);
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Handle Database Sync endpoint
        if (url === '/api/db' || url === '/ems/api/db') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
          }

          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const updated = {
                  ...currentDb,
                  ...payload,
                  updatedAt: new Date().toISOString()
                };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, db: updated }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Handle Real-Time Tallies endpoint
        if (url === '/api/tallies' || url === '/ems/api/tallies') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb.tallyResults || []));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const tally = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const existingIdx = (currentDb.tallyResults || []).findIndex(t => t.id === tally.id || t.pollingStationId === tally.pollingStationId);
                const updatedTallies = [...(currentDb.tallyResults || [])];
                if (existingIdx >= 0) {
                  updatedTallies[existingIdx] = { ...updatedTallies[existingIdx], ...tally };
                } else {
                  updatedTallies.unshift(tally);
                }
                const updated = { ...currentDb, tallyResults: updatedTallies, updatedAt: new Date().toISOString() };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, tally }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Handle Real-Time Audit Logs endpoint
        if (url === '/api/audit-logs' || url === '/ems/api/audit-logs') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb.auditLogs || []));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const logEntry = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const updatedLogs = [logEntry, ...(currentDb.auditLogs || [])];
                const updated = { ...currentDb, auditLogs: updatedLogs, updatedAt: new Date().toISOString() };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, logEntry }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Handle Political Intelligence endpoint: GET /api/intelligence
        if (req.method === 'GET' && (url === '/api/intelligence' || url === '/ems/api/intelligence')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const countyParam = (req.url.includes('county=') ? req.url.split('county=')[1].split('&')[0] : '') || 'Mombasa';
          const county = decodeURIComponent(countyParam);
          const currentDb = loadDb();
          const cached = currentDb.politicalIntelligence?.counties?.[county];
          if (cached) {
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true, intelligence: cached }));
          }
          const computed = computeCountyIntelligence(county, []);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, intelligence: computed }));
        }

        // Handle Political Intelligence Refresh: POST /api/intelligence/refresh
        if (req.method === 'POST' && (url === '/api/intelligence/refresh' || url === '/ems/api/intelligence/refresh')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          runPoliticalIntelligenceSweep().then((updated) => {
            const currentDb = loadDb();
            currentDb.politicalIntelligence = {
              lastSweep: new Date().toISOString(),
              counties: updated
            };
            saveDb(currentDb);
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true, count: Object.keys(updated).length }));
          }).catch(err => {
            res.writeHead(500);
            return res.end(JSON.stringify({ error: err.message }));
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  // This app is served from its own domain root (for example kuratech.site).
  base: '/',
  plugins: [react(), emsDevServerPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
    hmr: {
      clientPort: 5173
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
        xfwd: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-libs';
          }
          if (id.includes('iebcGeographyData.json')) {
            return 'iebc-geography-data';
          }
        }
      }
    }
  }
})

