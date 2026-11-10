import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  resolveRealm,
  verifyPassword,
  hashPassword,
  signToken,
  verifyToken,
  isAdminRole,
  isAspirantRole,
  getLockoutState,
  recordFailedAttempt,
  resetFailedAttempts,
  adminUnlockUser
} from './server/auth.js';
import { loadUsers, saveUsers, findUserByEmail, findUserById, findUserByPhone, updateUserInStore, ensureBaselineUsers } from './server/users.store.js';
import { BASELINE_PERSONAS } from './server/baseline-personas.js';
import { computeCountyIntelligence, runPoliticalIntelligenceSweep } from './server/agents/political-intelligence-agent.mjs';
import { recordAuditLogEntry, queryAuditLogs, getAuditStorageTelemetry } from './server/audit-db.mjs';
import { READINESS_WORKSTREAMS, STAKEHOLDER_ROLES, evaluateProductionReadiness, signOffReadinessGate } from './src/utils/productionReadinessGate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure baseline accounts are safely merged on startup (preserving any existing VPS accounts)
try {
  ensureBaselineUsers();
} catch (err) {
  console.error('[Server] Failed to ensure baseline users:', err);
}

const DB_FILE = path.join(__dirname, 'ems_server_db.json');
const DB_BACKUP_FILE = path.join(__dirname, 'ems_server_db.json.bak');
const PORT = process.env.PORT || 5000;

// Active Server-Sent Event (SSE) clients for real-time live sync
const sseClients = new Set();

function broadcastEvent(type, payload) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

function loadDb() {
  let db = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading DB_FILE, attempting backup restore:', err);
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        db = JSON.parse(fs.readFileSync(DB_BACKUP_FILE, 'utf8'));
      }
    } catch (bErr) {
      console.error('Failed to load backup DB:', bErr);
    }
  }
  if (!db) {
    db = {
      strategyMembers: [],
      strategyTasks: [],
      campaignRoadmap: [],
      strategyMeetings: [],
      agents: [],
      tallyResults: [],
      fieldReports: [],
      surveys: [],
      stakeholders: [],
      submissions: [],
      auditLogs: [],
      readinessWorkstreams: READINESS_WORKSTREAMS,
      readinessSignOffs: {},
      updatedAt: new Date().toISOString()
    };
  }
  if (!db.readinessWorkstreams || !db.readinessWorkstreams.length) {
    db.readinessWorkstreams = READINESS_WORKSTREAMS;
  }
  if (!db.readinessSignOffs) {
    db.readinessSignOffs = {};
  }
  return db;
}

function saveDb(db) {
  try {
    const serialized = JSON.stringify(db, null, 2);
    if (fs.existsSync(DB_FILE)) {
      fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
    }
    fs.writeFileSync(DB_FILE, serialized, 'utf8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

let currentDb = loadDb();

// Genuine SHA-256 Chained Logger
function appendServerAuditLog({ userId, userName, role, action, details, scope, ipAddress }) {
  const prev = currentDb.auditLogs || [];
  const prevHash = prev[0]?.hash || '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const rawPayload = `${prevHash}|${timestamp}|${userId || 'SYSTEM'}|${role || 'System'}|${action}|${details || ''}|${scope || 'National'}`;
  const AUDIT_CHAIN_INTEGRITY_KEY = process.env.AUDIT_INTEGRITY_KEY || 'ci-ems-audit-chain-tamper-evident-seal-2026';
  const hash = crypto.createHmac('sha256', AUDIT_CHAIN_INTEGRITY_KEY).update(rawPayload).digest('hex');

  const newLog = {
    id: `LOG-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    timestamp,
    userId: userId || 'SYSTEM',
    userName: userName || 'System',
    role: role || 'System',
    ipAddress: ipAddress || '127.0.0.1',
    action,
    details: details || '',
    scope: scope || 'National',
    previousHash: prevHash,
    hash
  };

  currentDb.auditLogs = [newLog, ...prev];
  currentDb.updatedAt = new Date().toISOString();
  saveDb(currentDb);
  broadcastEvent('audit_logged', newLog);
  recordAuditLogEntry(newLog).catch(e => console.error('[AuditDB] Log write error:', e));
  return newLog;
}

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

const extractTokenFromReq = (req, realm = 'user') => {
  const cookies = parseCookies(req);
  if (realm === 'admin') {
    if (cookies.ems_admin_sid) return cookies.ems_admin_sid;
    if (cookies.ems_sid) return cookies.ems_sid;
  } else {
    if (cookies.ems_sid) return cookies.ems_sid;
    if (cookies.ems_admin_sid) return cookies.ems_admin_sid;
  }
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

const isAllowedOrigin = (origin, hostHeader) => {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname === 'kuratech.site' || hostname.endsWith('.kuratech.site')) return true;
    if (hostHeader && hostname === hostHeader.split(':')[0].toLowerCase()) return true;
  } catch {
    return false;
  }
  return false;
};

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || '';

  const TRUSTED_ORIGINS = [
    'https://kuratech.site',
    'https://www.kuratech.site',
    'https://ops-konsole.kuratech.site',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ];

  const normalized = (origin || '').trim().toLowerCase();
  const matchedOrigin = TRUSTED_ORIGINS.find(trusted => trusted === normalized);

  if (matchedOrigin && isAllowedOrigin(origin, hostHeader)) {
    res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-EMS-Realm');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const explicitRealm = (req.headers['x-ems-realm'] || '').toLowerCase().trim();
  const referer = req.headers['referer'] || '';
  const isRefererAdmin = referer.includes('/admin.html');
  const hostRealm = resolveRealm(hostHeader);
  const currentRealm = (hostRealm === 'admin' || explicitRealm === 'admin' || isRefererAdmin) ? 'admin' : 'user';
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

  const url = new URL(req.url, `http://${hostHeader || 'localhost'}`);
  const pathname = url.pathname;

  // Real-Time Server-Sent Events (SSE) Stream
  if (req.method === 'GET' && (pathname === '/api/stream' || pathname === '/ems/api/stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });
    res.write(`event: init\ndata: ${JSON.stringify({ status: 'CONNECTED', realm: currentRealm, timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // System Health
  if (pathname === '/api/health' || pathname === '/healthz' || pathname === '/api/healthz' || pathname === '/ems/api/health' || pathname === '/ems/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'HEALTHY',
      realm: currentRealm,
      activeClients: sseClients.size,
      updatedAt: currentDb.updatedAt,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Google Maps Configuration: GET /api/config/maps & POST /api/config/maps
  if (pathname === '/api/config/maps' || pathname === '/ems/api/config/maps') {
    if (req.method === 'GET') {
      const activeKey = process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
        currentDb.googleMapsApiKey ||
        '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ apiKey: activeKey, configured: Boolean(activeKey) }));
      return;
    }

    if (req.method === 'POST') {
      const rawToken = extractTokenFromReq(req, 'admin');
      const decoded = verifyToken(rawToken);

      if (!decoded || !isAdminRole(decoded.role)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied: Super Admin credentials required to configure maps.' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { apiKey } = JSON.parse(body || '{}');
          const cleanKey = String(apiKey || '').trim();
          currentDb.googleMapsApiKey = cleanKey;
          currentDb.updatedAt = new Date().toISOString();
          saveDb(currentDb);

          appendServerAuditLog({
            userId: decoded.uid,
            userName: decoded.name,
            role: decoded.role,
            action: 'ADMIN_UPDATE_MAPS_KEY',
            details: cleanKey ? `Updated Google Maps API key (length: ${cleanKey.length})` : 'Cleared Google Maps API key',
            ipAddress: clientIp
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Google Maps API key saved successfully.' }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // ====================================================================
  // AUTHENTICATION ROUTES (Realm & Domain Enforced)
  // ====================================================================

  // POST /api/auth/login
  if (req.method === 'POST' && (pathname === '/api/auth/login' || pathname === '/ems/api/auth/login')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email, password, realm } = JSON.parse(body || '{}');
        const cleanEmail = String(email || '').trim().toLowerCase();
        const effectiveRealm = (realm === 'admin' || currentRealm === 'admin') ? 'admin' : currentRealm;

        // Check server-side lockout
        const lock = getLockoutState(cleanEmail);
        if (lock.locked) {
          appendServerAuditLog({
            userId: cleanEmail,
            userName: cleanEmail,
            role: 'Unauthenticated',
            action: 'LOGIN_BLOCKED_LOCKED',
            details: `Sign-in attempt on locked account (${cleanEmail})`,
            ipAddress: clientIp
          });
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            locked: true,
            permanent: !!lock.permanent,
            retryInMs: lock.retryInMs || 0,
            error: lock.permanent
              ? 'This account has been locked after repeated failed sign-in attempts. Contact your system administrator to restore access.'
              : 'Too many failed sign-in attempts. Please wait before trying again.'
          }));
          return;
        }

        const user = findUserByEmail(cleanEmail) || findUserByPhone(cleanEmail);
        const passwordMatches = user && verifyPassword(password, user.passwordHash);

        if (!user || !passwordMatches) {
          recordFailedAttempt(cleanEmail);
          appendServerAuditLog({
            userId: cleanEmail,
            userName: cleanEmail,
            role: 'Unauthenticated',
            action: 'LOGIN_FAILED_CREDENTIALS',
            details: `Failed sign-in attempt for ${cleanEmail}`,
            ipAddress: clientIp
          });
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid email address or password credentials.'
          }));
          return;
        }

        // Check if account is suspended
        if (user.isSuspended || user.status === 'Suspended') {
          appendServerAuditLog({
            userId: user.id,
            userName: user.name,
            role: user.role,
            action: 'LOGIN_BLOCKED_SUSPENDED',
            details: `Suspended user (${cleanEmail}) attempted login. Access blocked.`,
            ipAddress: clientIp
          });
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Account has been suspended by administration. Contact campaign operations.'
          }));
          return;
        }

        // ================================================================
        // REALM & DOMAIN ENFORCEMENT
        // ================================================================
        const userIsAdmin = isAdminRole(user.role);

        // Non-Admin user attempting login on admin console realm (ops-konsole.kuratech.site or admin.html) -> DENY
        if (!userIsAdmin && effectiveRealm === 'admin') {
          recordFailedAttempt(cleanEmail);
          appendServerAuditLog({
            userId: user.id,
            userName: user.name,
            role: user.role,
            action: 'USER_LOGIN_WRONG_DOMAIN',
            details: `Non-admin user (${cleanEmail}) attempted login on admin console (${hostHeader}). Entry denied.`,
            ipAddress: clientIp
          });
          // Deliberately return generic error
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid email address or password credentials.'
          }));
          return;
        }

        // Authentication & Domain Match Succeeded!
        resetFailedAttempts(cleanEmail);

        const token = signToken({
          uid: user.id,
          role: user.role,
          realm: userIsAdmin ? 'admin' : 'user',
          name: user.name,
          email: user.email
        });

        // Set Host-Only HttpOnly cookies (NO Domain attribute ensures isolation)
        const isSecure = !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1');
        const cookieFlagsList = [];

        if (userIsAdmin) {
          cookieFlagsList.push([
            `ems_admin_sid=${token}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Strict',
            'Max-Age=28800',
            isSecure ? 'Secure' : ''
          ].filter(Boolean).join('; '));
          cookieFlagsList.push([
            `ems_sid=${token}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Strict',
            'Max-Age=28800',
            isSecure ? 'Secure' : ''
          ].filter(Boolean).join('; '));
        } else {
          cookieFlagsList.push([
            `ems_sid=${token}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Strict',
            'Max-Age=28800',
            isSecure ? 'Secure' : ''
          ].filter(Boolean).join('; '));
        }

        res.setHeader('Set-Cookie', cookieFlagsList);

        appendServerAuditLog({
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'LOGIN_SUCCESS',
          details: `Authenticated on ${userIsAdmin ? 'admin' : effectiveRealm} realm (${hostHeader})`,
          ipAddress: clientIp
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token,
          realm: userIsAdmin ? 'admin' : effectiveRealm,
          redirectTo: userIsAdmin ? '/admin.html' : null,
          user: sanitizeUser(user)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/auth/logout
  if (req.method === 'POST' && (pathname === '/api/auth/logout' || pathname === '/ems/api/auth/logout')) {
    const isSecure = !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1');
    const cookieName = currentRealm === 'admin' ? 'ems_admin_sid' : 'ems_sid';
    const clearCookie = [
      `${cookieName}=`,
      'HttpOnly',
      'Path=/',
      'SameSite=Strict',
      'Max-Age=0',
      isSecure ? 'Secure' : ''
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', clearCookie);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // GET /api/auth/me
  if (req.method === 'GET' && (pathname === '/api/auth/me' || pathname === '/ems/api/auth/me')) {
    const rawToken = extractTokenFromReq(req, currentRealm);
    const decoded = verifyToken(rawToken);

    if (!decoded) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: false }));
      return;
    }

    // Verify token realm matches current host realm, allowing admin tokens across views
    if (decoded.realm && decoded.realm !== currentRealm && !(isAdminRole(decoded.role) && decoded.realm === 'admin')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: false, reason: 'REALM_MISMATCH' }));
      return;
    }

    const user = findUserById(decoded.uid) || findUserByEmail(decoded.email);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authenticated: true,
      realm: currentRealm,
      user: sanitizeUser(user) || decoded
    }));
    return;
  }

  // ====================================================================
  // ADMIN CONSOLE ONLY ROUTES (/api/admin/*)
  // ====================================================================
  // ====================================================================
  // ADMIN CONSOLE ROUTES (/api/admin/*) & AGENTS PROVISIONING (/api/agents)
  // ====================================================================
  const isAgentEndpoint = pathname === '/api/agents' || pathname === '/ems/api/agents';
  const isAdminUserEndpoint = pathname === '/api/admin/users' || pathname === '/ems/api/admin/users';

  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/ems/api/admin/') || isAgentEndpoint) {
    const rawToken = extractTokenFromReq(req, 'admin') || extractTokenFromReq(req, 'user');
    const decoded = verifyToken(rawToken);

    const isAdm = Boolean(decoded && decoded.realm === 'admin' && isAdminRole(decoded.role));
    const isAsp = Boolean(decoded && isAspirantRole(decoded.role));

    // Aspirants are permitted to create agents and read agents scoped to their ticket
    const isAgentCreation = req.method === 'POST' && (isAdminUserEndpoint || isAgentEndpoint);
    const isAgentRead = req.method === 'GET' && isAgentEndpoint;

    if (!decoded || (!isAdm && !(isAsp && (isAgentCreation || isAgentRead)))) {
      appendServerAuditLog({
        userId: decoded?.uid || 'UNKNOWN',
        userName: decoded?.name || 'Unauthorized Actor',
        role: decoded?.role || 'Guest',
        action: 'ACCESS_DENIED_ADMIN_ENDPOINT',
        details: `Unauthorized attempt to access ${pathname} from host ${hostHeader}`,
        ipAddress: clientIp
      });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Access denied: Admin realm credentials or authorized Aspirant session required.' }));
      return;
    }

    // Users & Agents Management: GET & POST
    if (isAdminUserEndpoint || isAgentEndpoint) {
      if (req.method === 'GET') {
        const allUsers = loadUsers().map(sanitizeUser);
        if (isAdm && isAdminUserEndpoint) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(allUsers));
          return;
        }
        // Aspirant or agent endpoint: filter to agents scoped to candidate
        const scopedAgents = allUsers.filter(u => {
          if (u.role !== 'Agent' && u.role !== 'Field Agent') return false;
          if (isAdm) return true;
          if (u.candidateId && u.candidateId === decoded.uid) return true;
          if (u.creatorId && u.creatorId === decoded.uid) return true;
          if (decoded.ward && u.ward && decoded.ward.toLowerCase() === u.ward.toLowerCase()) return true;
          if (decoded.constituency && u.constituency && decoded.constituency.toLowerCase() === u.constituency.toLowerCase()) return true;
          if (decoded.county && u.county && decoded.county.toLowerCase() === u.county.toLowerCase()) return true;
          return false;
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(scopedAgents));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { name, email, phone, role, password, county, constituency, ward, party, assignedEntity, entityName } = JSON.parse(body || '{}');

            const cleanEmail = String(email || '').trim().toLowerCase();
            const cleanPhone = String(phone || '').replace(/\s+/g, '').toLowerCase();

            // When an Aspirant is creating an agent:
            if (isAsp && !isAdm) {
              const targetRole = String(role || 'Agent').trim();
              if (targetRole !== 'Agent' && targetRole !== 'Field Agent') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Aspirants are only authorized to provision Agent accounts.' }));
                return;
              }
            }

            if (!cleanEmail || !password) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Email and password are required.' }));
              return;
            }

            if (String(password).length < 8) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Password must be at least 8 characters in length.' }));
              return;
            }

            const existingByEmail = findUserByEmail(cleanEmail);
            if (existingByEmail) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: `Account with email "${cleanEmail}" already exists.` }));
              return;
            }

            if (cleanPhone) {
              const existingByPhone = findUserByPhone(cleanPhone);
              if (existingByPhone) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: `Account with phone "${phone}" already exists.` }));
                return;
              }
            }

            // Geographic scoping: lock to Aspirant's jurisdiction if caller is Aspirant
            const effectiveRole = isAsp && !isAdm ? 'Agent' : String(role || 'Agent').trim();
            const effectiveCounty = (isAsp && !isAdm && decoded.county) ? decoded.county : (county || null);
            const effectiveConst = (isAsp && !isAdm && decoded.constituency) ? decoded.constituency : (constituency || null);
            const effectiveWard = (isAsp && !isAdm && decoded.ward) ? decoded.ward : (ward || null);
            const effectiveParty = (isAsp && !isAdm && decoded.party) ? decoded.party : (party || 'Independent');

            const newUser = {
              id: `USR-${effectiveRole.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)}-${Date.now().toString().slice(-5)}`,
              name: String(name || 'Campaign User').trim(),
              role: effectiveRole,
              email: cleanEmail,
              phone: phone ? String(phone).trim() : null,
              passwordHash: hashPassword(password),
              county: effectiveCounty,
              constituency: effectiveConst,
              ward: effectiveWard,
              party: effectiveParty,
              assignedEntity: assignedEntity || effectiveWard || 'PS-1',
              entityName: entityName || 'Assigned Polling Station',
              candidateId: isAsp ? decoded.uid : null,
              candidateName: isAsp ? decoded.name : null,
              creatorId: decoded.uid,
              status: 'Active',
              isSuspended: false,
              twoFactorEnabled: false,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              createdAt: new Date().toISOString()
            };

            const currentUsers = loadUsers();
            currentUsers.unshift(newUser);
            saveUsers(currentUsers);

            appendServerAuditLog({
              userId: decoded.uid,
              userName: decoded.name,
              role: decoded.role,
              action: isAdm ? 'ADMIN_CREATE_USER' : 'ASPIRANT_CREATE_AGENT',
              details: isAdm
                ? `Admin created user account "${cleanEmail}" with role "${newUser.role}"`
                : `${decoded.role} "${decoded.name}" registered Agent account "${cleanEmail}" for ${newUser.assignedEntity || newUser.ward || newUser.constituency || newUser.county}`,
              ipAddress: clientIp
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, user: sanitizeUser(newUser) }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }
    }

    // Admin Delete User: DELETE /api/admin/users/:id or POST /api/admin/users/delete
    const deleteMatch = pathname.match(/^\/(?:ems\/)?api\/admin\/users\/([^/]+)$/);
    if ((req.method === 'DELETE' && deleteMatch) || ((pathname === '/api/admin/users/delete' || pathname === '/ems/api/admin/users/delete') && req.method === 'POST')) {
      const handleUserDelete = (targetId) => {
        const idToDelete = String(targetId || '').trim();
        if (!idToDelete) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User ID is required for deletion.' }));
          return;
        }

        const currentUsers = loadUsers();
        const userIndex = currentUsers.findIndex(u => u.id === idToDelete || (u.email && u.email.toLowerCase() === idToDelete.toLowerCase()));

        if (userIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `User with ID "${idToDelete}" not found.` }));
          return;
        }

        const targetUser = currentUsers[userIndex];

        // Safeguard 1: Cannot delete self
        if (targetUser.id === decoded.uid || (targetUser.email && decoded.email && targetUser.email.toLowerCase() === decoded.email.toLowerCase())) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Administrators cannot delete their own active account.' }));
          return;
        }

        // Safeguard 2: Cannot delete baseline personas
        const isBaseline = BASELINE_PERSONAS.some(bp => bp.id === targetUser.id || (bp.email && targetUser.email && bp.email.toLowerCase() === targetUser.email.toLowerCase()));
        if (isBaseline) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Baseline system accounts are protected and cannot be deleted.' }));
          return;
        }

        currentUsers.splice(userIndex, 1);
        saveUsers(currentUsers);

        appendServerAuditLog({
          userId: decoded.uid,
          userName: decoded.name,
          role: decoded.role,
          action: 'ADMIN_DELETE_USER',
          details: `Admin deleted user account "${targetUser.email || targetUser.id}" (Role: ${targetUser.role})`,
          ipAddress: clientIp
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, deletedId: targetUser.id, email: targetUser.email }));
      };

      if (req.method === 'DELETE') {
        handleUserDelete(decodeURIComponent(deleteMatch[1]));
        return;
      } else {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { id } = JSON.parse(body || '{}');
            handleUserDelete(id);
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }
    }

    // Admin Unlock User: POST /api/admin/unlock
    if (pathname === '/api/admin/unlock' || pathname === '/ems/api/admin/unlock') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { email } = JSON.parse(body || '{}');
          adminUnlockUser(email);
          appendServerAuditLog({
            userId: decoded.uid,
            userName: decoded.name,
            role: decoded.role,
            action: 'ADMIN_UNLOCKED_USER',
            details: `Admin unlocked account ${email}`,
            ipAddress: clientIp
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, email }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Admin SQLite Audit Logs Query & Telemetry: GET /api/admin/audit-logs
    if (pathname === '/api/admin/audit-logs' || pathname === '/ems/api/admin/audit-logs') {
      if (req.method === 'GET') {
        const limit = url.searchParams.get('limit') || 50;
        const offset = url.searchParams.get('offset') || 0;
        const action = url.searchParams.get('action') || null;

        Promise.all([
          queryAuditLogs({ limit, offset, action }),
          getAuditStorageTelemetry()
        ]).then(([logs, telemetry]) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            logs,
            telemetry
          }));
        }).catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
        return;
      }
    }
  }

  // ====================================================================
  // DATA OPERATIONS ROUTES (/api/tallies, /api/audit-logs, /api/db)
  // ====================================================================

  // Specific Endpoint: Tallies
  if (pathname === '/api/tallies' || pathname === '/ems/api/tallies') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentDb.tallyResults || []));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const tally = JSON.parse(body);
          const existingIdx = (currentDb.tallyResults || []).findIndex(t => t.id === tally.id || t.pollingStationId === tally.pollingStationId);
          if (existingIdx >= 0) {
            currentDb.tallyResults[existingIdx] = { ...currentDb.tallyResults[existingIdx], ...tally };
          } else {
            currentDb.tallyResults = [tally, ...(currentDb.tallyResults || [])];
          }
          currentDb.updatedAt = new Date().toISOString();
          saveDb(currentDb);
          broadcastEvent('tally_submitted', tally);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, tally }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Specific Endpoint: Audit Logs
  if (pathname === '/api/audit-logs' || pathname === '/ems/api/audit-logs') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentDb.auditLogs || []));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const raw = JSON.parse(body || '{}');
          const entry = appendServerAuditLog({
            userId: raw.userId,
            userName: raw.userName,
            role: raw.role,
            action: raw.action,
            details: raw.details,
            scope: raw.scope,
            ipAddress: clientIp
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, logEntry: entry }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Common DB Full Sync endpoint
  if (req.method === 'GET' && (pathname === '/api/db' || pathname === '/ems/api/db')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentDb));
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/db' || pathname === '/ems/api/db')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        currentDb = {
          ...currentDb,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        saveDb(currentDb);
        broadcastEvent('db_update', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db: currentDb }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Political Intelligence Endpoint: GET /api/intelligence
  if (req.method === 'GET' && (pathname === '/api/intelligence' || pathname === '/ems/api/intelligence')) {
    const county = url.searchParams.get('county') || 'Mombasa';
    const cached = currentDb.politicalIntelligence?.counties?.[county];
    if (cached) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, intelligence: cached }));
      return;
    }
    const computed = computeCountyIntelligence(county, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, intelligence: computed }));
    return;
  }

  // Political Intelligence Refresh: POST /api/intelligence/refresh
  if (req.method === 'POST' && (pathname === '/api/intelligence/refresh' || pathname === '/ems/api/intelligence/refresh')) {
    runPoliticalIntelligenceSweep().then((updated) => {
      broadcastEvent('intelligence_updated', updated);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: Object.keys(updated).length }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Production Readiness Gate: GET /api/readiness
  if (req.method === 'GET' && (pathname === '/api/readiness' || pathname === '/ems/api/readiness')) {
    const workstreams = currentDb.readinessWorkstreams?.length ? currentDb.readinessWorkstreams : READINESS_WORKSTREAMS;
    const signOffs = currentDb.readinessSignOffs || {};
    const evaluation = evaluateProductionReadiness(workstreams, signOffs);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      workstreams,
      signOffs,
      evaluation,
      serverManaged: true,
      updatedAt: currentDb.updatedAt
    }));
    return;
  }

  // Production Readiness Gate: Stakeholder Sign-Off POST /api/readiness/signoff
  if (req.method === 'POST' && (pathname === '/api/readiness/signoff' || pathname === '/ems/api/readiness/signoff')) {
    const token = extractTokenFromReq(req, 'admin');
    const session = token ? verifyToken(token) : null;

    if (!session || !isAdminRole(session.role)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Forbidden: Production Readiness sign-off requires authenticated Super Admin or Admin credentials'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { role, decision = 'APPROVED', comments = '' } = JSON.parse(body || '{}');
        if (!role || !Object.values(STAKEHOLDER_ROLES).includes(role)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Invalid stakeholder role: ${role}` }));
          return;
        }

        const currentSignOffs = currentDb.readinessSignOffs || {};
        const signerNote = comments || `Sign-off recorded by ${session.email} (${session.role})`;
        const updatedSignOffs = signOffReadinessGate(currentSignOffs, role, decision, signerNote);
        currentDb.readinessSignOffs = updatedSignOffs;

        appendServerAuditLog({
          userId: session.userId || session.email,
          userName: session.name || session.email,
          role: session.role,
          action: 'READINESS_GATE_SIGNOFF',
          details: `Role [${role}] set to ${decision}: ${signerNote}`,
          scope: 'National',
          ipAddress: clientIp
        });

        saveDb(currentDb);
        broadcastEvent('readiness_updated', { type: 'SIGNOFF', role, decision });

        const workstreams = currentDb.readinessWorkstreams?.length ? currentDb.readinessWorkstreams : READINESS_WORKSTREAMS;
        const evaluation = evaluateProductionReadiness(workstreams, updatedSignOffs);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          signOffs: updatedSignOffs,
          evaluation,
          updatedAt: currentDb.updatedAt
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Production Readiness Gate: Workstream Verification POST /api/readiness/verify-workstream
  if (req.method === 'POST' && (pathname === '/api/readiness/verify-workstream' || pathname === '/ems/api/readiness/verify-workstream')) {
    const token = extractTokenFromReq(req, 'admin');
    const session = token ? verifyToken(token) : null;

    if (!session || !isAdminRole(session.role)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Forbidden: Workstream verification requires authenticated Super Admin or Admin credentials'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { workstreamId, level, evidenceDigest, testEvidence } = JSON.parse(body || '{}');
        let workstreams = [...(currentDb.readinessWorkstreams?.length ? currentDb.readinessWorkstreams : READINESS_WORKSTREAMS)];
        const idx = workstreams.findIndex(w => w.id === workstreamId);
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Workstream ${workstreamId} not found` }));
          return;
        }

        workstreams[idx] = {
          ...workstreams[idx],
          level: level || workstreams[idx].level,
          evidenceDigest: evidenceDigest || workstreams[idx].evidenceDigest,
          testEvidence: testEvidence || workstreams[idx].testEvidence
        };

        currentDb.readinessWorkstreams = workstreams;

        appendServerAuditLog({
          userId: session.userId || session.email,
          userName: session.name || session.email,
          role: session.role,
          action: 'READINESS_WORKSTREAM_VERIFIED',
          details: `Workstream ${workstreamId} verified at level ${level || workstreams[idx].level}`,
          scope: 'National',
          ipAddress: clientIp
        });

        saveDb(currentDb);
        broadcastEvent('readiness_updated', { type: 'WORKSTREAM_VERIFIED', workstreamId, level });

        const evaluation = evaluateProductionReadiness(workstreams, currentDb.readinessSignOffs || {});

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          workstreams,
          evaluation,
          updatedAt: currentDb.updatedAt
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`EMS Common Database & Real-Time Sync Server running on 127.0.0.1:${PORT}`);
});
